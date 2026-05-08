# PLM 功能实现细讲：每个功能是怎么写出来的

这份文档专门回答一个问题：

```text
我当时到底是怎么把一个个业务功能写成系统功能的？
```

它会尽量不用“程序员黑话”直接跳过去，而是按下面这个顺序讲：

```text
业务上要做什么
  ↓
页面或外部系统会给我什么数据
  ↓
数据库要怎么存
  ↓
Java 代码要分成哪些小动作
  ↓
跑批或接口怎么触发
  ↓
最后产出什么结果
```

你面试时可以把它当成一条主线：我不是只写了几个类，而是把业务需求拆成了数据模型、业务规则、批处理流程、外部接口和日志追踪。

---

## 1. 先用一句话讲清楚系统怎么运转

PLM 系统每天做的事情可以理解成：

```text
先接收外部系统同步来的产品、日历、行情、TA 分红方案数据；
再读取 PLM 页面里维护的分红和目标盈参数；
然后每天跑一次批处理；
批处理根据规则判断哪些产品需要提醒；
最后生成提醒文件，写入提醒日志和批处理日志。
```

如果给不懂代码的人解释，可以这样说：

```text
这个系统像一个每天自动检查产品状态的值班员。
它先拿到产品档案和行情数据，再按照业务人员提前录入的规则逐个检查。
如果发现某个产品快到分红测算日，或者目标盈连续达标，就把提醒写成文件和日志，交给后续系统或人员处理。
```

---

## 2. 功能一：接收外部产品基础数据

### 2.1 业务上为什么需要它

PLM 自己不是 TA，也不是产品主数据系统，所以它不能凭空知道：

```text
产品代码是什么
产品名称是什么
产品是否还有效
产品什么时候成立
产品什么时候到期
投资经理是谁
```

这些信息通常来自 TA、数据中台或产品主数据平台。

### 2.2 数据库怎么设计

本项目用 `plm_product` 表模拟外部同步来的产品基础信息。

表里放：

```text
real_prd_code       真实产品代码，作为主键
prd_name            产品名称
prd_code            内部产品代码
product_status      产品状态
establish_date      成立日
end_date            到期日
investment_manager  投资经理
```

为什么需要这张表？

```text
因为分红和目标盈都依赖产品基础信息。
定期分红要用成立日和到期日计算分红测算日。
目标盈要用产品状态判断是否跳过发行失败或已终止产品。
```

### 2.3 Java 代码怎么写

这类功能的代码一般分两层：

```text
Product
  表示一条产品数据。

PlmRepository.saveProduct(...)
  负责把产品数据写进数据库。
```

`Product` 可以理解成“Java 里的产品资料卡”。  
`saveProduct` 可以理解成“把这张资料卡保存到数据库”。

在复现项目里，样例数据由 `SampleDataSeeder` 写入：

```text
SampleDataSeeder
  准备样例产品数据。

PlmRepository.saveProduct
  插入 plm_product 表。
```

真实系统里，这一步可能不是手工写样例数据，而是：

```text
定时读取数据中台文件
调用外部系统接口
从中间库同步
通过消息队列接收产品变更
```

但是落到 PLM 内部，本质动作仍然是：

```text
接数 → 校验 → 转成内部对象 → 落库。
```

---

## 3. 功能二：接收工作日历

### 3.1 业务上为什么需要它

金融系统里不能简单按自然日计算。

比如今天是周五，往后推 1 个工作日，不是周六，而是下周一。

分红和目标盈都需要工作日历：

```text
定期分红：
  分红测算日要落在产品工作日。
  分红基准日通常要找测算日前一个工作日。
  提醒窗口也要按工作日往前或往后推。

目标盈：
  连续 N 个工作日达标，不能把周末算进去。
```

### 3.2 数据库怎么设计

本项目用 `plm_workday_calendar` 表：

```text
real_prd_code  产品代码
work_date      该产品的工作日
```

为什么按产品存工作日？

```text
因为不同产品可能适用不同市场、不同节假日或不同日历。
在实际金融系统里，产品工作日历经常不能简单等同于普通自然日历。
```

### 3.3 Java 代码怎么写

核心类是：

```text
WorkdayService
```

它做三类事情：

```text
判断某一天是不是工作日。
找某一天之后最近的工作日。
按工作日往前或往后移动 N 天。
```

这就像一个“日期助手”。

业务代码不自己到处写日期判断，而是统一问它：

```text
这个日期是不是工作日？
从测算日往前 10 个工作日是哪天？
成立日加 30 天后，如果刚好是周末，应该顺延到哪一天？
```

这样设计的好处是：

```text
分红和目标盈都可以复用同一套工作日算法。
以后如果工作日规则变复杂，也只需要集中改 WorkdayService。
```

---

## 4. 功能三：定期分红要素录入

### 4.1 业务上要做什么

产品经理或运营人员在 PLM 页面上维护一个产品的分红规则。

例如：

```text
这个产品是否参与分红？
首次分红在成立后多少天？
首次分红测算净值是多少？
每几个月分红一次？
分红测算日前几天提醒投资经理？
测算日后几天内监控 TA 是否录入分红方案？
```

### 4.2 前端页面怎么和后端对接

页面上通常会有一个“定期分红产品维护”页面。

用户在页面填写字段后，点击保存。

前端会调用后端接口，类似：

```text
POST /api/dividend-products
```

请求内容大概是：

```json
{
  "realPrdCode": "PRD_DIV_001",
  "profitStatus": "YES",
  "firstProfitDays": 30,
  "firstProfitComputeNetworth": 1.01000000,
  "profitFrequencyMonths": 3,
  "investmentReminderDays": 10,
  "emailReminderDays": 3,
  "manager": "产品经理A,投资经理A"
}
```

不懂代码的人可以理解为：

```text
前端页面负责收集用户填的信息。
后端接口负责检查这些信息有没有问题，然后保存到数据库。
```

### 4.3 数据库怎么设计

本项目用 `plm_dividend_input` 表保存分红要素。

它不是最终提醒表，而是“规则表”。

```text
plm_dividend_input
  保存业务人员维护的分红规则。

plm_dividend_schedule
  保存系统根据规则算出来的分红计划。

plm_reminder_log
  保存最终生成了哪些提醒。
```

这三个表不要混。

可以这样讲：

```text
input 表是人工录入的规则。
schedule 表是系统计算出来的日程。
reminder_log 表是某次跑批真正触发的提醒结果。
```

### 4.4 Java 代码怎么写

对应代码是：

```text
DividendInput
  表示一条分红规则。

PlmRepository.saveDividendInput(...)
  把规则保存到 plm_dividend_input。

PlmRepository.findDividendInputs()
  跑批时把所有分红规则查出来。
```

真实项目里，还会有 Controller 接口层：

```text
DividendProductController
  接收前端请求。

DividendProductService
  做字段校验和业务校验。

PlmRepository
  保存数据库。
```

当前复现项目重点是批处理，所以没有真正写 Web Controller，而是用样例数据模拟“页面已经录入过分红规则”。

---

## 5. 功能四：定期分红日期计算

### 5.1 业务上要做什么

有了分红规则以后，系统要自动算出：

```text
第一次分红测算日是哪天？
分红基准日是哪天？
下一次分红测算日是哪天？
测算前提醒从哪天开始？
测算后监控 TA 分红方案到哪天结束？
```

举个例子：

```text
产品成立日是 2026-01-02。
首次分红间隔是 30 天。
系统先算出 2026-02-01。
如果 2026-02-01 不是工作日，就顺延到最近工作日。
然后按照每 3 个月一次，继续生成后续分红测算日。
```

### 5.2 数据库怎么落

计算结果保存到 `plm_dividend_schedule`。

这张表保存的是系统算出来的计划：

```text
profit_compute_day       分红测算日
profit_base_day          分红基准日
compute_reminder_start   测算前提醒开始日
compute_reminder_end     测算前提醒结束日
schema_reminder_start    测算后方案监控开始日
schema_reminder_end      测算后方案监控结束日
first_profit_flag        是否首次分红
```

### 5.3 Java 代码怎么写

核心类是：

```text
DividendScheduleCalculator
```

它的工作像一个“分红日历计算器”。

它拿三样东西：

```text
产品基础信息 Product
分红规则 DividendInput
产品工作日历 workdays
```

然后产出：

```text
多条 DividendSchedule
```

它内部的逻辑可以翻译成人话：

```text
先用成立日加上首次分红间隔，得到第一次可能的测算日。
如果这一天不是工作日，就顺延到最近工作日。
把测算日前一个工作日作为分红基准日。
从测算日前 N 个工作日开始提醒投资经理。
从测算日后第 1 个工作日开始监控 TA 是否已录入分红方案。
按分红频率继续往后滚动生成下一期。
一直生成到产品到期日之前。
```

这个功能写出来以后，还要加单元测试。

本项目里有：

```text
DividendScheduleCalculatorTest
WorkdayServiceTest
```

测试的意义是：

```text
日期计算特别容易出错。
如果工作日顺延、前后 N 个工作日计算错了，提醒日期就会错。
所以日期计算必须有自动化测试兜住。
```

---

## 6. 功能五：分红测算前提醒

### 6.1 业务上要做什么

系统每天跑批时，要看今天是不是落在某个产品的“测算前提醒窗口”里。

如果是，就提醒投资经理：

```text
这个产品快到分红测算日了，请提前关注。
```

### 6.2 数据从哪里来

这个判断依赖：

```text
plm_dividend_schedule
  里面已经算好了 compute_reminder_start 和 compute_reminder_end。

batchDate
  今天跑批日期。
```

判断方式很简单：

```text
如果 batchDate >= compute_reminder_start
并且 batchDate <= compute_reminder_end
就生成提醒。
```

### 6.3 Java 代码怎么写

核心类是：

```text
DividendReminderService
```

它遍历所有分红计划，做两个判断：

```text
今天是否在测算前提醒窗口？
今天是否在测算后方案监控窗口？
```

如果今天在测算前提醒窗口，就创建一条：

```text
ReminderRecord
```

`ReminderRecord` 可以理解成“准备发出去的一条提醒消息”。

它里面有：

```text
提醒类型
产品代码
产品名称
提醒日期
提醒内容
```

---

## 7. 功能六：分红方案未设置监控

### 7.1 业务上要做什么

分红测算日过后，TA 里应该有人录入分红方案。

PLM 每天检查：

```text
如果产品已经过了分红测算日，
但 TA 分红方案表里还没有对应方案，
就生成“分红方案未设置提醒”。
```

### 7.2 外部系统数据怎么进来

真实系统里，TA 分红方案可能通过数据中台同步到 PLM。

本项目用 `plm_profit_schema` 表模拟 TA 已录入的分红方案：

```text
real_prd_code
register_date
```

可以理解成：

```text
TA 那边如果录入过分红方案，PLM 能在这张同步表里查到。
```

### 7.3 Java 代码怎么写

仍然在 `DividendReminderService` 里完成。

它先判断：

```text
今天是否在 schema_reminder_start 到 schema_reminder_end 之间？
```

如果是，再查：

```text
PlmRepository.existsProfitSchemaInWindow(...)
```

这句话的意思是：

```text
去数据库查一下，在这个监控窗口里，TA 有没有登记过分红方案。
```

如果没查到，就生成：

```text
DIVIDEND_SCHEMA_MISSING
```

这一类提醒。

面试时可以强调：

```text
这个功能体现了 PLM 和 TA 的边界。
PLM 不负责替 TA 录分红方案，只负责监控 TA 是否已经录入，并在缺失时提醒。
```

---

## 8. 功能七：目标盈要素录入

### 8.1 业务上要做什么

目标盈产品需要业务人员维护几个关键参数：

```text
目标止盈收益率
业绩观察期开始日期
连续达标天数
负责人
```

例如：

```text
目标止盈收益率是 3.5%。
从 2026-05-01 开始进入观察期。
如果连续 3 个工作日成立以来年化收益率都不低于 3.5%，就触发止盈提醒。
```

### 8.2 前端页面怎么和后端对接

前端会有一个“目标盈产品维护”页面。

保存时调用类似：

```text
POST /api/target-yield-products
```

请求内容类似：

```json
{
  "realPrdCode": "PRD_TY_001",
  "targetYieldRate": 0.03500000,
  "observationStartDate": "2026-05-01",
  "continuousDays": 3,
  "manager": "产品经理B,投资经理B"
}
```

后端收到后做校验：

```text
产品是否存在？
目标收益率是否大于 0？
连续达标天数是否合理？
观察期开始日期是否晚于成立日？
```

校验通过后写入 `plm_target_yield_input`。

### 8.3 Java 代码怎么写

对应代码是：

```text
TargetYieldInput
  表示目标盈规则。

PlmRepository.saveTargetYieldInput(...)
  保存目标盈规则。

PlmRepository.findTargetYieldInputs()
  跑批时读取所有目标盈规则。
```

当前复现项目还是用 `SampleDataSeeder` 模拟“页面已经录入过规则”。

---

## 9. 功能八：行情接数和落库

### 9.1 业务上为什么需要它

目标盈判断依赖每日行情。

系统需要知道：

```text
某产品某一天的单位净值是多少？
成立以来年化收益率是多少？
```

这类数据通常不由 PLM 自己计算，而是由 TA、估值系统、行情系统或数据中台提供。

### 9.2 数据库怎么设计

本项目用 `plm_market_daily`：

```text
real_prd_code        产品代码
confirm_date         确认日期
nav                  单位净值
annualized_return    成立以来年化收益率
```

### 9.3 定时接数落库任务怎么写

真实项目里可以这样写：

```text
第一步：调度平台在每天固定时间触发接数任务。
第二步：任务去指定目录读取行情文件，或调用数据中台接口。
第三步：程序解析文件里的每一行。
第四步：校验产品代码、日期、净值、收益率格式。
第五步：把合法数据写入 plm_market_daily。
第六步：记录接数日志，失败的数据记录错误原因。
```

用 Java 写出来，一般会拆成这些类：

```text
MarketDataImportCommand
  命令行入口，接收文件路径和批次日期。

MarketDataFileReader
  读取 CSV、Excel 或定长文件。

MarketDataValidator
  校验字段是否合法。

MarketDataImportService
  组织读取、校验、保存。

PlmRepository.saveMarketDaily(...)
  真正写入数据库。
```

如果用 Spring 定时任务，可以写：

```text
@Scheduled(cron = "0 30 7 * * ?")
public void importMarketData() {
    // 每天 7:30 自动接收行情数据
}
```

如果用 Jenkins 或公司调度平台，可以写成命令：

```bash
java -jar plm-lifecycle-replica.jar import-market-data \
  --batchDate 20260506 \
  --inputFile /data/inbound/MARKET_DAILY_20260506.csv
```

然后 Jenkins 或调度平台每天定时执行这条命令。

当前复现项目没有单独实现 `import-market-data` 命令，而是用 `SampleDataSeeder` 把样例行情直接插入数据库。  
这是为了教学聚焦：让你先看懂目标盈监控逻辑。真实项目中，接数落库可以按上面的结构补成独立模块。

### 9.4 给不懂代码的人怎么解释

可以这样说：

```text
行情接数任务就像每天早上收快递。
外部系统把行情文件送到指定位置，PLM 的接数程序按约定格式拆包，检查里面的数据有没有问题，然后分类放进自己的数据库。
后面的目标盈监控不是直接读外部文件，而是读已经落库的标准化行情表。
```

---

## 10. 功能九：目标盈每日达标监控

### 10.1 业务上要做什么

每天跑批时，系统要逐个检查目标盈产品：

```text
产品是否有效？
今天是不是产品工作日？
今天有没有行情数据？
今天收益率是否达到目标？
最近 N 个工作日是否连续达标？
是否已经进入业绩观察期？
如果满足条件，就生成止盈提醒。
```

### 10.2 Java 代码怎么写

核心类是：

```text
TargetYieldMonitor
```

它像一个“目标盈检查员”。

它逐个读取：

```text
目标盈规则 plm_target_yield_input
产品基础信息 plm_product
工作日历 plm_workday_calendar
行情数据 plm_market_daily
```

然后执行判断。

它会先跳过一些不应该处理的产品：

```text
发行失败的产品跳过。
已经终止的产品跳过。
今天不是产品工作日则跳过。
没有行情数据则跳过。
```

然后判断今天是否达标：

```text
今日成立以来年化收益率 >= 目标止盈收益率
```

再判断连续达标：

```text
取最近 N 个工作日行情。
如果 N 条数据都不低于目标止盈收益率，就认为连续达标。
```

最后还要判断观察期：

```text
连续 N 日窗口的起始日不能早于业绩观察期开始日期。
```

满足条件后：

```text
写入 plm_target_yield_status。
生成 TARGET_YIELD_TAKE_PROFIT 提醒。
```

### 10.3 为什么要写状态表

`plm_target_yield_status` 保存最新监控结果。

页面可以直接展示：

```text
今日是否达标
是否需要止盈
已达标天数
最近检查日期
最近年化收益率
```

这样前端不需要每次打开页面都重新跑复杂计算。

可以理解为：

```text
跑批负责计算。
状态表负责保存计算结果。
页面负责展示结果。
```

---

## 11. 功能十：每日跑批编排

### 11.1 跑批是什么

跑批不是一个神秘东西。

它就是：

```text
到固定时间，自动或手动启动一段程序，让程序批量处理一批数据。
```

比如每天晚上或每天早上：

```text
检查所有分红产品。
检查所有目标盈产品。
生成当天提醒文件。
写日志。
```

### 11.2 本项目跑批入口怎么写

本项目的命令行入口是：

```text
PlmLifecycleApplication
```

它有 `main` 方法。

`main` 方法是 Java 程序的门口。  
命令行执行 jar 时，程序就是从这里进来的。

然后用 picocli 解析命令参数：

```text
run-daily-batch
--batchDate 20260506
--outboundDir data/outbound
--reportsDir reports
```

对应类是：

```text
RunDailyBatchCommand
```

它负责把命令行里的文字参数变成 Java 能理解的数据：

```text
20260506 → LocalDate
data/outbound → Path
reports → Path
```

然后调用真正的跑批工作流：

```text
PlmDailyBatchWorkflow.run(...)
```

### 11.3 跑批内部怎么编排

`PlmDailyBatchWorkflow` 是总调度。

它不把所有业务规则都写在自己里面，而是按业务线调用：

```text
先记录：每日批处理开始。

调用 DividendBatchWorkflow。
  处理定期分红业务线。

调用 TargetYieldBatchWorkflow。
  处理目标盈业务线。

合并两个业务线生成的提醒。

调用 ReminderCsvWriter。
  生成提醒 CSV 文件。

把每条提醒写入 plm_reminder_log。

调用 MarkdownReportGenerator。
  生成本地报告。

写入 plm_batch_log。
```

这里有一个重要设计点：

```text
总 workflow 只负责编排。
具体业务规则放在各自业务线里。
```

所以定期分红和目标盈没有混在一起。

### 11.4 脚本怎么触发跑批

为了不每次都手写很长的 Java 命令，本项目提供：

```text
scripts/run_daily_batch.sh
```

你执行：

```bash
./scripts/run_daily_batch.sh 20260506
```

脚本内部本质上还是执行：

```bash
java -jar target/plm-lifecycle-replica-0.1.0.jar run-daily-batch --batchDate 20260506
```

所以关系是：

```text
人或调度平台
  ↓
.sh 脚本
  ↓
java -jar 命令
  ↓
main 方法
  ↓
RunDailyBatchCommand
  ↓
PlmDailyBatchWorkflow
  ↓
各业务线功能
```

---

## 12. 功能十一：提醒文件输出

### 12.1 业务上为什么需要文件

PLM 生成提醒后，后续可能有多种消费方式：

```text
投管系统读取提醒文件。
邮件系统读取提醒内容。
运营人员下载报表。
其他批处理系统继续加工。
```

在很多金融系统里，系统之间不一定直接实时调用接口，文件接口非常常见。

### 12.2 Java 代码怎么写

核心类是：

```text
ReminderCsvWriter
```

它做的事情很直接：

```text
创建输出目录。
生成文件名，例如 PLM_REMINDER_20260506.csv。
写入表头。
把每条 ReminderRecord 写成一行 CSV。
```

CSV 内容大概是：

```text
REMINDER_TYPE,REMINDER_NOW,REAL_PRD_CODE,PRD_NAME,REMINDER_CONTENT
```

如果提醒内容里有逗号或引号，代码会做转义，避免文件格式坏掉。

### 12.3 面试怎么讲

可以这样说：

```text
提醒不是只在内存里生成，我会把它同时落文件和落日志。
文件用于系统间传输，日志用于追溯和排查。
```

---

## 13. 功能十二：批处理日志和提醒日志

### 13.1 为什么要有日志

批处理系统最怕的问题是：

```text
昨天到底跑没跑？
跑到哪一步失败了？
生成了几条提醒？
提醒文件在哪里？
某个产品为什么被提醒？
```

所以必须有日志表。

### 13.2 数据库怎么设计

本项目有两张日志表：

```text
plm_batch_log
  记录批处理节点。

plm_reminder_log
  记录具体提醒。
```

`plm_batch_log` 记录：

```text
批次号
节点名称
节点状态
说明信息
创建时间
```

`plm_reminder_log` 记录：

```text
批次号
提醒类型
产品代码
产品名称
提醒日期
提醒内容
输出文件路径
```

### 13.3 Java 代码怎么写

统一通过 `PlmRepository` 写日志：

```text
appendBatchLog(...)
  记录批处理节点。

saveReminder(...)
  保存提醒结果。
```

跑批开始、分红处理完成、目标盈处理完成、文件生成完成、报告生成完成，都会写批处理日志。

这样一来，面试时可以说：

```text
我设计跑批时不只是关注成功路径，也考虑了可追溯性。
批处理每个关键节点都会落日志，方便生产排查。
```

---

## 14. 功能十三：前端页面查询和展示

### 14.1 前端并不是直接读数据库

真实系统里，前端页面不会直接连数据库。

它会通过 HTTP API 调后端。

后端再去查数据库、做权限校验、做字段转换，然后返回给前端。

关系是：

```text
浏览器页面
  ↓ HTTP 请求
后端 Controller
  ↓ 调 Service
业务逻辑 Service
  ↓ 调 Repository
数据库
```

### 14.2 定期分红页面可以有哪些接口

```text
GET /api/products?keyword=宁欣
  产品选择框搜索产品。

POST /api/dividend-products
  保存分红要素。

GET /api/dividend-products?realPrdCode=PRD_DIV_001
  查看某个产品的分红配置。

GET /api/dividend-schedules?realPrdCode=PRD_DIV_001
  查看系统计算出的分红计划。

POST /api/dividend-schedules/recalculate
  修改分红要素后，重新计算分红计划。
```

### 14.3 目标盈页面可以有哪些接口

```text
POST /api/target-yield-products
  保存目标盈配置。

GET /api/target-yield-products
  查询目标盈产品列表。

GET /api/target-yield-products/{realPrdCode}/status
  查看最近一次目标盈监控结果。

GET /api/reminders?batchNo=PLM-20260506
  查看某次跑批生成的提醒。
```

### 14.4 页面上哪些字段来自哪里

可以这样拆：

```text
产品名称、成立日、产品状态
  来自外部同步的 plm_product。

分红频率、提醒天数、目标收益率
  来自 PLM 页面录入表。

今日是否达标、是否需要止盈
  来自跑批计算后的状态表。

提醒内容、提醒文件路径
  来自提醒日志表。
```

这个说法很重要，因为它能证明你理解前端展示背后的数据来源。

---

## 15. 功能十四：外部系统接口

### 15.1 接 TA / 数据中台

PLM 从 TA / 数据中台接收：

```text
产品基础信息
产品工作日历
每日行情
TA 分红方案
```

可能的接口方式：

```text
文件接口：CSV、TXT、Excel、定长文件。
数据库中间表：对方写入中间库，PLM 定时读取。
HTTP 接口：PLM 调用对方 API。
消息队列：对方发布变更消息，PLM 消费。
```

本项目用本地数据库表和样例数据模拟。

### 15.2 接投管系统

PLM 给投管系统输出：

```text
分红测算提醒
分红方案未设置提醒
目标盈止盈提醒
```

本项目用：

```text
data/outbound/PLM_REMINDER_yyyyMMdd.csv
```

模拟投管提醒文件。

真实系统里可能是：

```text
把 CSV 放到共享目录或 SFTP。
调用投管系统 HTTP 接口。
写入投管系统可读取的中间表。
```

### 15.3 接邮件系统

邮件系统一般不会直接写在业务判断里。

更好的设计是：

```text
PLM 先生成提醒记录。
邮件模块根据提醒类型套模板。
再调用邮件网关发送。
最后记录发送结果。
```

也就是说：

```text
业务判断
  只负责判断该不该提醒。

邮件发送
  负责把提醒变成邮件并送出去。
```

这样可以避免业务代码和邮件技术细节绑死。

---

## 16. 功能十五：测试是怎么做的

### 16.1 为什么先测日期

这个项目里最容易出错的是日期。

因为分红和目标盈都依赖：

```text
工作日顺延
前 N 个工作日
后 N 个工作日
连续 N 个工作日
观察期边界
产品到期边界
```

所以本项目先写了：

```text
WorkdayServiceTest
DividendScheduleCalculatorTest
```

### 16.2 怎么测跑批

跑批测试可以按这个顺序：

```text
准备数据库。
插入样例产品。
插入工作日历。
插入分红规则。
插入目标盈规则。
插入行情数据。
执行每日跑批。
检查提醒文件是否生成。
检查提醒日志是否正确。
检查目标盈状态表是否正确。
```

本项目用脚本模拟：

```bash
./scripts/prepare_env.sh
./scripts/seed_demo_data.sh
./scripts/run_daily_batch.sh 20260506
```

这三个脚本分别代表：

```text
准备环境。
准备样例数据。
执行每日跑批。
```

---

## 17. 把整个开发过程串起来

如果面试官问：“你这个项目每个功能是怎么开发出来的？”

你可以按这个顺序讲：

```text
第一，我先读建设背景和两个业务需求，确认 PLM 是生命周期监控系统，不是 TA。

第二，我把业务分成定期分红和目标盈两条线，公共能力只放产品、日历、行情、日志和文件输出。

第三，我按数据来源设计表：外部同步表、PLM 业务录入表、系统计算结果表、日志表。

第四，我用 Java 写实体类表示这些业务数据，用 Repository 统一操作数据库。

第五，我先实现工作日服务，因为分红和目标盈都依赖工作日算法。

第六，我实现定期分红：先保存分红规则，再计算分红日程，再根据每日跑批日期筛选提醒。

第七，我实现目标盈：先保存目标盈规则，再读取行情数据，判断今日达标和连续达标，最后生成止盈提醒。

第八，我写每日跑批总流程，把定期分红和目标盈两个业务线串起来，但不把业务规则混在一起。

第九，我把提醒写成 CSV 文件，同时写提醒日志和批处理日志，方便外部系统接收和生产排查。

第十，我用脚本包装 Java 命令，方便本地和调度平台触发。
```

这就是完整的开发闭环。

---

## 18. 这个项目最值得记住的难点

### 18.1 难点一：业务边界

最容易犯错的是把 PLM 写成“大杂烩”。

正确做法是：

```text
TA 负责交易和分红方案事实。
数据中台负责同步基础数据和行情数据。
PLM 负责生命周期要素管理和提醒监控。
投管和邮件系统负责消费提醒结果。
```

### 18.2 难点二：定期分红和目标盈不能混

它们都生成提醒，但业务含义完全不同。

所以代码上分成：

```text
dividend
  定期分红业务线。

targetyield
  目标盈业务线。

batch
  只做编排。
```

### 18.3 难点三：日期计算

日期不是自然日加减。

必须考虑：

```text
产品工作日
节假日
测算日前后窗口
产品到期日
观察期开始日期
连续 N 个工作日
```

### 18.4 难点四：跑批可追溯

跑批不能只要最终文件。

还要能回答：

```text
哪天跑的？
跑到了哪一步？
生成了几条提醒？
文件在哪里？
某条提醒为什么生成？
```

所以要有：

```text
plm_batch_log
plm_reminder_log
报告文件
```

### 18.5 难点五：本地复现和真实系统的差异

本地没有真实 TA、投管、邮件系统。

所以复现时要明确说：

```text
本地用 H2 模拟数据库。
用 SampleDataSeeder 模拟前端录入和外部同步。
用 CSV 文件模拟系统间接口。
用 Markdown 报告模拟跑批结果。
```

这样不会显得在“假装有完整生产环境”，而是很清楚地说明复现项目的边界。

