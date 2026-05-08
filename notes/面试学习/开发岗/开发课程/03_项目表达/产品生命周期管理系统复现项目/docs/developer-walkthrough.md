# PLM 项目开发全过程教程：从 IDE 写 Java 到数据库、前端、外部接口和跑批

这份文档用来模拟你作为开发者推进产品生命周期管理系统时，一步一步会做什么。

它不是只讲“系统最终长什么样”，而是尽量还原开发过程：

```text
拿到需求
  ↓
拆业务模块
  ↓
设计数据库表
  ↓
建库建表
  ↓
用 IDE 写 Java 后端代码
  ↓
写接口给前端调用
  ↓
对接外部系统数据
  ↓
写每日跑批逻辑
  ↓
生成提醒文件
  ↓
记录日志和报告
  ↓
测试和排查问题
```

这份文档会按“你真的在开发时会怎么做”的顺序讲。

---

## 0. 先看我们现有文档

当前项目里已有三类文档：

```text
README.md
  项目入口，告诉你这个复现项目是什么、怎么跑。

docs/workflow.md
  讲业务流程。重点是定期分红和目标盈要分开讲，公共能力单独讲。

docs/development-diary.md
  记录开发过程和修正过程，比如为什么一开始跑通后又要按业务线重构。

docs/developer-walkthrough.md
  也就是本文，讲从 IDE 写 Java 到数据库、前端、外部接口、跑批的完整开发动作。
```

复习顺序建议是：

```text
先读 workflow.md
  先知道业务是什么。

再读 developer-walkthrough.md
  知道开发时每一步怎么做。

最后读 development-diary.md
  记住开发中遇到的难点和修正点。
```

---

## 1. 第一步：拿到需求后，不先写代码，先拆业务

你拿到的材料有三份：

```text
PLM系统建设说明-20240402.docx
PLM应用-分红功能需求规格说明书20240412.docx
产品生命周期管理系统-目标盈支持功能-需求说明书_1.3.docx
```

第一件事不是打开 IDE 写代码，而是先读需求，确认这个系统到底为了解决什么问题。

读完建设说明后，可以提炼出 PLM 的系统定位：

```text
PLM 是产品生命周期重大事件监控和要素管理系统。
它不是单纯产品 CRUD，也不是 TA 系统。
它的价值是把产品发行后存续期里的分红、目标盈、提前终止等事件系统化跟踪，降低人工遗漏风险。
```

然后继续读两个具体功能需求。

读完后要做一个重要拆分：

```text
定期分红
  是一个业务线。
  核心是分红要素、分红测算日、分红基准日、提醒窗口、TA 分红方案监控。

目标盈
  是另一个业务线。
  核心是目标止盈收益率、业绩观察期、连续达标天数、成立以来年化收益率、止盈提醒。
```

这里不能把它们混在一个“大提醒模块”里。

更好的理解是：

```text
PLM 是平台。
定期分红和目标盈是两个业务场景。
产品基础数据、工作日历、行情、文件输出、日志是公共支撑能力。
```

这一阶段你会产出：

```text
业务流程图
模块拆分图
系统边界说明
```

在本项目里，这些内容记录在：

```text
docs/workflow.md
```

---

## 2. 第二步：确认系统边界，哪些是 PLM 做，哪些是外部系统做

开发时很容易犯的错是：把所有东西都当成自己系统里的功能。

PLM 项目里必须先拆清楚边界。

PLM 做：

```text
录入业务附加要素
计算分红测算日和提醒窗口
判断目标盈是否达标
生成提醒文件
记录提醒日志
提供页面查询和修改
```

TA / 数据中台做：

```text
提供产品基础信息
提供产品工作日历
提供每日行情、净值、成立以来年化收益率
提供 TA 已录入的分红方案信息
```

投管系统做：

```text
接收 PLM 推送的提醒文件
在投管侧展示待办或弹窗提醒
```

邮件系统做：

```text
发送分红方案未设置等邮件提醒
```

这个边界决定了后面的技术设计。

比如：

```text
产品状态、成立日、到期日不是 PLM 自己凭空维护的，应该来自 TA / 数据中台。

目标盈成立以来年化收益率不是 PLM 自己算的，通常来自行情数据或 TA/数据中台推送。

PLM 不直接替代投管系统展示待办，而是生成提醒文件或调用接口。
```

本地复现时没有这些外部系统，所以我们用：

```text
H2 表模拟外部数据表
CSV 文件模拟文件接口
Markdown 报告模拟跑批结果
```

---

## 3. 第三步：设计数据库表

业务和边界清楚后，才开始设计表。

表设计不是随便把页面字段堆进去，而是按数据来源和业务用途拆。

我会先分成三类表。

### 3.1 外部同步数据表

这些表模拟 TA / 数据中台推给 PLM 的数据。

```text
plm_product
  产品基础信息。

plm_workday_calendar
  产品工作日历。

plm_market_daily
  每日行情、净值、成立以来年化收益率。

plm_profit_schema
  TA 中已经录入的分红方案。
```

为什么要这么拆？

因为这些不是 PLM 自己的业务录入，而是外部事实来源。

面试可以说：

```text
PLM 本身不维护 TA 的产品状态，而是通过数据中台同步 TA 产品信息，在此基础上做生命周期监控。
```

### 3.2 PLM 业务录入表

这些表保存 PLM 页面上由业务人员录入的附加要素。

定期分红：

```text
plm_dividend_input
```

里面有：

```text
real_prd_code
profit_status
first_profit_days
first_profit_compute_networth
profit_frequency_months
annualized_dividend_rate_up
one_profit_networth_up
profit_networth_down
investment_reminder_days
email_reminder_days
manager
```

目标盈：

```text
plm_target_yield_input
```

里面有：

```text
real_prd_code
target_yield_rate
observation_start_date
continuous_days
manager
```

这类表的特点是：

```text
字段来自业务录入，不是 TA 同步。
```

### 3.3 跑批衍生和日志表

这些表保存系统计算或跑批生成的结果。

```text
plm_dividend_schedule
  分红日期表，保存分红测算日、分红基准日、提醒窗口。

plm_target_yield_status
  目标盈监控状态，保存今日是否达标、是否需要止盈。

plm_reminder_log
  提醒日志。

plm_batch_log
  跑批节点日志。
```

这类表的意义是：

```text
让跑批过程可追踪。
失败时能查到系统到底算出了什么、提醒了谁、为什么提醒。
```

---

## 4. 第四步：怎么建数据库

真实项目里，通常会使用 Oracle、MySQL 或公司统一数据库。

开发动作一般是：

```text
1. 设计表结构。
2. 写 DDL 建表脚本。
3. 本地或测试环境执行建表。
4. 后端配置数据源。
5. 写 Repository / Mapper 访问数据库。
```

在本地复现项目里，我们用 H2 数据库模拟。

配置文件是：

```text
src/main/resources/application.properties
```

里面配置：

```properties
spring.datasource.url=jdbc:h2:file:./data/plm-lifecycle;MODE=Oracle;DATABASE_TO_UPPER=false
spring.sql.init.mode=always
```

含义是：

```text
使用本地文件型 H2 数据库。
开启 Oracle 兼容模式。
项目启动时自动执行 schema.sql。
```

建表脚本在：

```text
src/main/resources/schema.sql
```

Spring Boot 启动时会自动执行这个脚本：

```text
如果表不存在，就 CREATE TABLE。
```

这就是本地 demo 的建库方式。

真实项目里可能会是：

```text
开发写 schema.sql / migration 脚本
DBA 或发布平台在测试库执行
应用通过配置连接 Oracle
```

---

## 5. 第五步：用 IDE 写 Java 后端代码

有了表之后，打开 IDE，比如 IntelliJ IDEA。

开发动作通常是：

```text
1. 新建 Maven / Spring Boot 项目。
2. 配 pom.xml 依赖。
3. 建包结构。
4. 写 domain。
5. 写 repository。
6. 写 service / workflow。
7. 写 cli 或 controller。
8. 写测试。
```

本项目的包结构是：

```text
com.example.plm
  cli
  domain
  repository
  dividend
  targetyield
  batch
  file
  report
  scenario
```

每层作用：

```text
domain
  领域对象，比如 Product、DividendInput、TargetYieldInput。

repository
  数据库访问，负责读写 H2 表。

dividend
  定期分红业务线。

targetyield
  目标盈业务线。

batch
  每日跑批总控。

file
  CSV 文件输出。

report
  Markdown 报告输出。

cli
  命令行入口。

scenario
  本地样例数据初始化。
```

这里最重要的是：

```text
dividend 和 targetyield 是两个业务包。
不要把它们混进一个 reminder 包里。
```

---

## 6. 第六步：写 Repository，连接 Java 和数据库

Spring Boot 连接数据库后，Java 代码要通过 Repository 读写表。

本项目里是：

```text
PlmRepository
```

它负责：

```text
保存产品基础数据
保存工作日历
保存分红录入要素
保存目标盈录入要素
查询行情
查询分红方案
保存提醒日志
保存跑批日志
```

例如：

```text
saveProduct()
findProducts()
saveDividendInput()
findDividendInputs()
saveMarketDaily()
findMarketDaily()
saveReminder()
appendBatchLog()
```

这一步的开发本质是：

```text
把 SQL 表和 Java 对象连起来。
```

真实项目里可能不是手写 JdbcTemplate，也可能是：

```text
MyBatis Mapper
JPA Repository
公司低代码平台生成 DAO
```

但思想一样：

```text
业务代码不能直接散落 SQL。
用 Repository / Mapper 封装数据访问。
```

---

## 7. 第七步：写定期分红业务线

定期分红不要和目标盈混。

它自己的业务包是：

```text
src/main/java/com/example/plm/dividend
```

里面有：

```text
WorkdayService
DividendScheduleCalculator
DividendReminderService
DividendBatchWorkflow
```

### 7.1 WorkdayService

负责产品工作日相关逻辑。

为什么需要它？

因为分红测算日、分红基准日、提醒开始日都不是简单自然日，而是产品工作日。

它做：

```text
找到某日之后第一个工作日
按工作日向前/向后偏移
判断某天是否工作日
```

### 7.2 DividendScheduleCalculator

负责把业务录入的分红要素变成日期表。

输入：

```text
产品成立日
产品到期日
首次分红间隔天数
分红频率
测算前提醒天数
测算后监控天数
产品工作日历
```

输出：

```text
分红基准日
分红测算日
测算前提醒开始日
测算前提醒结束日
方案监控开始日
方案监控结束日
是否首次分红
```

这对应需求文档里的：

```text
PROFIT_CLOSED_DATE / CLOSED_PROFIT_DATE
```

### 7.3 DividendReminderService

负责每日跑批筛选提醒。

它分两种提醒：

```text
DIVIDEND_COMPUTE_REMINDER
  分红测算前提醒投资经理。

DIVIDEND_SCHEMA_MISSING
  测算日后没有发现 TA 分红方案，提醒关注。
```

这里会查：

```text
plm_profit_schema
```

来模拟 TA 是否已经录入分红方案。

### 7.4 DividendBatchWorkflow

这是定期分红业务线的总控。

它负责：

```text
计算分红日期表
筛选分红提醒
把结果交给公共输出模块
```

注意，它只管分红，不管目标盈。

---

## 8. 第八步：写目标盈业务线

目标盈自己的业务包是：

```text
src/main/java/com/example/plm/targetyield
```

里面有：

```text
TargetYieldMonitor
TargetYieldBatchWorkflow
```

### 8.1 TargetYieldMonitor

它负责目标盈核心判断。

输入：

```text
目标止盈收益率
业绩观察期起始日期
连续达标天数 N
产品状态
产品工作日历
每日成立以来年化收益率
```

规则：

```text
发行失败、产品终止跳过。
非产品工作日跳过。
当日年化收益率 >= 目标止盈收益率，则今日达标。
最近 N 个工作日都达标，且 N 日窗口已经进入观察期，则需要止盈。
是否需要止盈一旦为是，原则上不因后续收益率回落自动改回。
```

输出：

```text
plm_target_yield_status
TARGET_YIELD_TAKE_PROFIT 提醒
```

### 8.2 TargetYieldBatchWorkflow

这是目标盈业务线总控。

它负责：

```text
启动目标盈监控
生成目标盈提醒
把结果交给公共输出模块
```

注意，它只管目标盈，不管分红。

---

## 9. 第九步：写公共批处理总控

虽然分红和目标盈是两个业务线，但真实系统里可能都由每日清晨批处理触发。

所以可以有一个公共总控：

```text
PlmDailyBatchWorkflow
```

它做：

```text
调用 DividendBatchWorkflow
调用 TargetYieldBatchWorkflow
合并提醒结果
生成 CSV 文件
生成 Markdown 报告
记录批处理日志
```

它不应该写具体分红规则，也不应该写目标盈规则。

它只是调度层。

这样代码结构更像：

```text
每日跑批总控
  ├─ 定期分红业务线
  ├─ 目标盈业务线
  └─ 公共输出
```

---

## 10. 第十步：如何和前端做对接

本地复现项目暂时没有前端页面，但真实项目里一定有前端。

前端和后端对接通常通过 HTTP API。

假设前端是 Vue / React，后端是 Spring Boot。

### 10.1 定期分红录入页面

前端页面：

```text
个性化产品 - 定期分红产品 - 产品要素录入
```

前端用户操作：

```text
1. 输入产品代码或产品名称。
2. 前端调用产品搜索接口。
3. 用户从弹框里单选产品。
4. 填写分红附加要素。
5. 点击提交。
```

后端要提供接口：

```http
GET /api/products?keyword=宁欣
```

返回：

```json
[
  {
    "realPrdCode": "PRD_DIV_001",
    "prdName": "宁欣定期分红一号",
    "prdCode": "P_DIV_001",
    "productStatus": "ACTIVE"
  }
]
```

提交分红要素：

```http
POST /api/dividend-products
Content-Type: application/json
```

请求体：

```json
{
  "realPrdCode": "PRD_DIV_001",
  "profitStatus": "YES",
  "firstProfitDays": 30,
  "firstProfitComputeNetworth": 1.01000000,
  "profitFrequencyMonths": 3,
  "annualizedDividendRateUp": 3.50000000,
  "oneProfitNetworthUp": 0.02000000,
  "profitNetworthDown": 1.00500000,
  "investmentReminderDays": 10,
  "emailReminderDays": 3,
  "manager": "产品经理A,投资经理A"
}
```

后端收到后：

```text
校验字段
保存 plm_dividend_input
触发或等待跑批计算 plm_dividend_schedule
返回保存结果
```

### 10.2 定期分红管理页面

前端调用：

```http
GET /api/dividend-products?realPrdCode=PRD_DIV_001
```

展示：

```text
PLM 录入字段：可修改
TA 关联字段：置灰，只展示不可修改
```

这点很重要。

面试可以说：

```text
页面上把 PLM 录入要素和 TA 同步要素合并展示，但权限边界不同。PLM 录入字段可改，TA 同步字段只读，避免 PLM 误改外部事实来源。
```

### 10.3 分红测算日管理页面

前端调用：

```http
GET /api/dividend-schedules?realPrdCode=PRD_DIV_001&startDate=20260501&endDate=20260531
```

展示：

```text
分红测算日
分红基准日
提醒开始日
提醒结束日
操作按钮：修改 / 分红测算 / 删除
```

如果当前日期到了测算日，前端按钮变为可点击。

按钮点击后调用：

```http
POST /api/dividend-schedules/{id}/calculate
```

后端根据产品净值、分红净值上下限等参数返回测算结果。

### 10.4 目标盈录入页面

前端页面：

```text
个性化产品 - 目标盈产品 - 产品要素录入
```

提交接口：

```http
POST /api/target-yield-products
```

请求体：

```json
{
  "realPrdCode": "PRD_TY_001",
  "targetYieldRate": 0.03500000,
  "observationStartDate": "2026-05-01",
  "continuousDays": 3,
  "manager": "产品经理B,投资经理B"
}
```

后端保存：

```text
plm_target_yield_input
```

### 10.5 目标盈管理页面

前端调用：

```http
GET /api/target-yield-products
```

展示：

```text
产品名称
产品代码
产品状态
目标止盈收益率
当日确认累计净值
当日确认年化收益率
业绩观察期起始日期
连续达标止盈天数
今日是否达标
是否需要止盈
产品相关负责人
```

这些字段里有两类来源：

```text
业务录入字段：
目标止盈收益率、观察期起始日期、连续达标天数、负责人。

外部同步/跑批字段：
产品状态、净值、年化收益率、今日是否达标、是否需要止盈。
```

这就是前后端对接时要讲清楚的“字段来源”。

---

## 11. 第十一步：如何和外部系统做接口

PLM 不是孤立系统。

它和外部系统主要有三类接口：

```text
数据中台 / TA -> PLM
PLM -> 投管系统
PLM -> 邮件系统
```

### 11.1 数据中台 / TA 到 PLM

需求文档里提到：

```text
数据中台每日从 TA 抽数后，推最新 TA 数据文件至 PLM。
文件示例：DCP_TATOPLM_20230130.csv
```

真实实现可能是：

```text
文件总线把 CSV 文件推到 PLM 服务器目录
PLM 定时跑批检查文件是否到齐
PLM 解析文件
PLM 落库
```

对应动作：

```text
1. 检查当天数据文件数量。
2. 如果文件缺失，记录跑批失败或允许手动跑批。
3. 解析产品基础信息文件。
4. 解析产品工作日历文件。
5. 解析行情文件。
6. 解析 TA 分红方案文件。
7. 落库到 PLM 同步表。
```

本地复现中，我们没有真实文件总线，所以用 `SampleDataSeeder` 直接初始化数据。

但面试时要说真实链路：

```text
真实项目里外部数据一般通过数据中台文件推送进入 PLM，PLM 跑批负责校验文件、解析文件、落库。
```

### 11.2 PLM 到投管系统

需求文档里说：

```text
PLM 每日推当日投管待办提醒申请文件。
当日无提醒也推空文件。
投管系统定时全量读取 PLM 发送的文件。
```

所以接口不是前端接口，而是文件接口。

文件字段类似：

```text
REMINDER_NOW
REAL_PRD_CODE
PRD_NAME
PROFIT_STATUS
PROFIT_COMPUTE_DAY
COMPUTE_REMAIN_DAYS
REMINDER_START
REMINDER_END
```

本地复现里生成的是：

```text
data/outbound/PLM_REMINDER_20260506.csv
```

真实系统里可能是：

```text
PLM 生成 CSV
调用文件总线
文件推送到投管系统指定目录
投管系统定时读取
投管系统生成待办或弹窗
```

### 11.3 PLM 到邮件系统

分红方案未设置提醒可能还要发邮件。

真实实现大概是：

```text
读取 EMAIL_PARA_CONFIG
  获取邮件服务器、端口、发件人信息。

读取 EMAIL_CONTENT_CONFIG
  获取邮件主题模板和内容模板。

替换模板变量
  产品名称、产品代码、测算日、负责人等。

发送邮件
  发给产品负责人或投资经理。

写 EMAIL_REMINDER_LOG
  记录主题、内容、接收人、发送时间。
```

本地复现没有真的发邮件，只生成报告和提醒文件。

面试要说清楚：

```text
本地 demo 用 CSV 和 Markdown 模拟；真实项目里会通过文件总线和邮件服务完成下游提醒。
```

---

## 12. 第十二步：怎么触发每日跑批

本地复现里通过命令行：

```bash
./scripts/run_daily_batch.sh 20260506
```

脚本内部调用：

```bash
java -jar target/plm-lifecycle-replica-0.1.0.jar run-daily-batch \
  --batchDate=20260506 \
  --batchNo=PLM-20260506
```

真实项目里可能有几种方式：

```text
1. Jenkins 定时触发。
2. Spring Scheduler 定时触发。
3. 公司统一调度平台触发。
4. 页面手动跑批按钮触发。
```

需求文档里也提到：

```text
定时确认中台推的文件数量并校验。
若未推送文件或文件推送个数有误则进行手动跑批处理。
新增跑批页面，点击手动跑批按钮。
```

所以可以讲：

```text
每日跑批一般先检查数据中台文件是否到齐，然后执行落库、规则计算、提醒生成、文件推送、日志入库。如果自动跑批异常，可以通过手动跑批页面补跑。
```

本地代码里：

```text
RunDailyBatchCommand
  是命令行入口。

PlmDailyBatchWorkflow
  是每日批处理总控。

DividendBatchWorkflow
  是分红业务线批处理。

TargetYieldBatchWorkflow
  是目标盈业务线批处理。
```

---

## 13. 第十三步：怎么测试

开发时至少要测三类东西。

### 13.1 日期计算测试

分红最容易错的是日期。

所以写了：

```text
DividendScheduleCalculatorTest
WorkdayServiceTest
```

验证：

```text
工作日偏移是否正确
首次分红测算日是否正确
分红基准日是否正确
```

### 13.2 跑批结果测试

跑本地命令：

```bash
mvn clean package
./scripts/prepare_env.sh
./scripts/seed_demo_data.sh
./scripts/run_daily_batch.sh 20260506
```

查看：

```text
data/outbound/PLM_REMINDER_20260506.csv
reports/PLM-20260506_PLM_DAILY_BATCH.md
```

### 13.3 失败排查

如果没生成提醒，要查：

```text
产品是否存在
工作日历是否存在
批次日是否工作日
分红日期表是否算出来
TA 分红方案是否已存在
目标盈行情是否有最近 N 天
收益率是否达到目标
观察期是否已经开始
```

---

## 14. 第十四步：真实开发里会遇到的难点

### 14.1 业务边界难

定期分红和目标盈都是 PLM 重大事件监控，但不是同一个业务。

如果混成一个提醒模块，后期会很难维护。

### 14.2 日期规则难

定期分红不是简单自然日。

它依赖：

```text
产品成立日
产品到期日
产品工作日历
首次分红间隔
分红频率
测算前提醒天数
测算后监控天数
```

### 14.3 数据来源难

页面上展示的字段可能来自不同地方：

```text
PLM 录入
TA 同步
数据中台文件
跑批计算结果
```

字段来源不讲清楚，前后端和测试都会混乱。

### 14.4 接口稳定性难

文件接口要考虑：

```text
文件名
文件日期
字段顺序
空文件
重复推送
补跑
日志追踪
```

### 14.5 SQL 方言问题

本地复现时曾遇到 H2 Oracle mode 不支持 `LIMIT ?` 的问题。

这提醒我们：

```text
用 H2 模拟 Oracle 时，不能随意混用 MySQL/PostgreSQL 方言。
真实项目要注意数据库方言和分页写法。
```

---

## 15. 第十五步：开发测试完成后，如何部署上线

金融机构里的系统投产，通常不是开发写完代码后直接把程序丢到生产服务器上运行。

更真实的流程是：

```text
开发完成
  ↓
本地自测
  ↓
提交代码
  ↓
持续集成构建
  ↓
测试环境部署
  ↓
SIT / UAT 测试
  ↓
投产材料准备
  ↓
变更评审
  ↓
生产发布窗口投产
  ↓
投产验证
  ↓
观察和回退准备
```

下面按你作为开发人员会经历的动作一步步讲。

### 15.1 开发完成后，先做本地自测

开发写完功能后，第一步不是找运维上线，而是自己确认功能能跑。

在本项目里，本地自测动作是：

```bash
mvn clean test
mvn clean package
./scripts/prepare_env.sh
./scripts/seed_demo_data.sh
./scripts/run_daily_batch.sh 20260506
```

它们分别代表：

```text
mvn clean test
  跑单元测试，确认工作日计算、分红日期计算这些核心逻辑没有被改坏。

mvn clean package
  把 Java 工程打成 jar 包，确认项目可以构建成可部署产物。

prepare_env.sh
  准备本地数据目录、输出目录。

seed_demo_data.sh
  准备样例产品、工作日历、行情、分红和目标盈配置。

run_daily_batch.sh
  模拟执行每日跑批，检查提醒文件和报告是否正常生成。
```

给不懂代码的人解释，可以这样说：

```text
我先在自己电脑上完整走一遍最小业务闭环，确认代码能编译、测试能通过、批处理能启动、结果文件能生成。
```

### 15.2 提交代码和合并分支

本地自测通过后，开发会把代码提交到代码仓库。

一般会走这样的流程：

```text
开发分支
  ↓
提交代码 commit
  ↓
推送到 Git 仓库
  ↓
发起 Merge Request / Pull Request
  ↓
代码评审
  ↓
合并到测试分支或主干分支
```

代码评审会重点看：

```text
业务边界是否清楚。
定期分红和目标盈有没有混在一起。
SQL 是否有风险。
日期计算是否覆盖边界。
日志是否足够排查问题。
是否有单元测试或测试说明。
```

在金融机构里，很多项目还会要求关联需求编号、缺陷编号或变更单号。

也就是说，代码不是孤立提交的，而是要能追溯到：

```text
这个改动是为了哪个需求。
谁开发的。
谁评审的。
什么时候合入的。
影响哪些模块。
```

### 15.3 Jenkins 或流水线自动构建

代码合并后，通常会触发 Jenkins 或其他 CI/CD 平台。

Jenkins 做的事情可以理解为：

```text
自动从 Git 拉代码。
自动执行 Maven 构建。
自动跑测试。
自动生成 jar 包。
自动归档构建产物。
必要时自动部署到测试环境。
```

典型流水线阶段是：

```text
Checkout
  拉取代码。

Build
  执行 mvn clean package。

Unit Test
  执行 mvn test，生成测试报告。

Package
  归档 jar 包、脚本、配置模板。

Deploy to Test
  部署到测试环境。
```

对这个 PLM 项目来说，构建产物通常包括：

```text
plm-lifecycle-replica-0.1.0.jar
scripts/*.sh
application-test.properties
schema 或数据库变更脚本
部署说明
回退说明
```

### 15.4 部署到测试环境

测试环境一般由开发、测试或运维协作部署。

如果是传统 Java 应用，常见动作是：

```text
把 jar 包上传到测试服务器。
把配置文件放到指定目录。
确认 Java 版本。
确认数据库连接。
确认输入输出文件目录。
确认脚本有执行权限。
启动应用或执行批处理脚本。
```

如果是批处理类应用，可能不需要常驻 Web 服务，而是配置成：

```text
每天由调度平台执行某个脚本。
脚本再启动 java -jar。
java -jar 执行业务跑批。
跑批完成后退出。
```

本项目对应关系是：

```text
scripts/run_daily_batch.sh
  测试环境里的调度脚本。

target/plm-lifecycle-replica-0.1.0.jar
  实际被脚本启动的 Java 程序。

data/outbound
  模拟输出给投管系统的提醒文件目录。

reports
  模拟跑批报告目录。
```

### 15.5 测试环境要测什么

测试不是只看程序能不能启动，而是要按业务场景验。

定期分红要测：

```text
首次分红测算日是否正确。
遇到非工作日是否顺延。
分红基准日是否取前一工作日。
测算前 N 个工作日是否能生成提醒。
测算后 TA 未录入方案是否能生成提醒。
TA 已录入方案时是否不再误提醒。
产品到期后是否不再生成计划。
```

目标盈要测：

```text
未进入观察期时不提醒。
今日收益率未达标不提醒。
今日达标但未连续 N 天不提醒。
连续 N 个工作日达标才提醒。
发行失败或已终止产品跳过。
非工作日不处理。
缺行情数据时不误判。
```

接口和文件要测：

```text
输入文件字段是否能解析。
空文件如何处理。
重复文件如何处理。
输出文件名是否符合约定。
输出字段顺序是否符合下游系统要求。
日志是否能查到每次跑批结果。
```

### 15.6 SIT 和 UAT 分别是什么

SIT 通常是系统集成测试。

它更关注：

```text
PLM 和 TA / 数据中台 / 投管 / 邮件系统能不能连起来。
文件目录是否正确。
接口字段是否匹配。
上下游批处理时间是否衔接。
异常数据是否能处理。
```

UAT 通常是用户验收测试。

它更关注：

```text
业务人员在页面上能不能完成操作。
提醒结果是否符合业务预期。
报表和日志是否看得懂。
操作流程是否满足工作需要。
```

可以这样理解：

```text
SIT 验系统之间通不通。
UAT 验业务人员认不认可。
```

### 15.7 准备投产材料

金融机构投产前通常要准备比较完整的材料。

常见材料包括：

```text
投产申请单
需求说明或变更说明
影响范围说明
部署包清单
数据库变更脚本
配置变更清单
批处理调度配置说明
接口文件目录说明
验证案例
回退方案
应急联系人
投产步骤
```

对这个 PLM 项目来说，投产材料可以写成：

```text
一、投产内容
  新增定期分红监控能力。
  新增目标盈达标监控能力。
  新增每日提醒文件输出。

二、影响范围
  PLM 后端服务。
  PLM 数据库。
  每日批处理调度。
  与 TA / 数据中台 / 投管 / 邮件系统的接口文件。

三、部署内容
  jar 包。
  shell 脚本。
  配置文件。
  数据库 DDL / DML。
  调度任务配置。

四、验证内容
  页面能打开。
  配置能保存。
  批处理能执行。
  提醒文件能生成。
  日志能查询。
  下游系统能接收到提醒。
```

### 15.8 数据库脚本如何投产

数据库变更在金融机构里通常很谨慎。

不能随便让应用启动时自动改生产库。

真实投产更常见的是：

```text
开发提供数据库脚本。
DBA 或运维审核。
在测试环境先执行。
确认无误后纳入投产清单。
生产发布窗口由 DBA 或授权人员执行。
执行后开发和测试一起验证表结构。
```

脚本通常分几类：

```text
DDL
  建表、加字段、建索引。

DML
  初始化参数、字典值、邮件模板、调度配置。

Rollback SQL
  回退脚本。
```

对 PLM 项目来说，建表脚本对应：

```text
plm_product
plm_workday_calendar
plm_market_daily
plm_dividend_input
plm_dividend_schedule
plm_profit_schema
plm_target_yield_input
plm_target_yield_status
plm_reminder_log
plm_batch_log
```

生产环境还要考虑索引。

例如：

```text
按产品代码查，real_prd_code 要有索引。
按日期跑批查，work_date、confirm_date、reminder_date 要考虑索引。
日志表按 batch_no 查，也要考虑索引。
```

本地复现项目用 `schema.sql` 自动建 H2 表，是为了方便教学。  
真实生产环境一般会把数据库脚本作为单独投产物，由 DBA 控制执行。

### 15.9 配置文件如何区分环境

开发、测试、生产环境的配置不能混用。

常见区分方式是：

```text
application-dev.properties
application-test.properties
application-prod.properties
```

不同环境会有不同配置：

```text
数据库地址
数据库用户名
文件输入目录
文件输出目录
日志目录
外部系统接口地址
邮件网关地址
调度批次参数
```

例如：

```text
开发环境输出到本地 data/outbound。
测试环境输出到测试服务器共享目录。
生产环境输出到投管系统约定的生产文件目录。
```

面试时可以强调：

```text
代码包可以是同一套，但配置必须按环境隔离。
生产密码、接口地址、文件目录不能写死在代码里。
```

### 15.10 生产批处理调度如何配置

如果这个 PLM 功能生产上线，通常要配置每日调度。

调度平台可能是：

```text
Jenkins
Control-M
公司自研调度平台
Linux crontab
Kubernetes CronJob
```

金融机构里更常见的是统一批量调度平台，而不是每个开发自己随便写 crontab。

调度任务一般会配置：

```text
任务名称
执行服务器
执行用户
执行脚本路径
执行时间
前置依赖
失败重试策略
告警联系人
运行日志路径
```

对 PLM 每日跑批来说，依赖关系可以是：

```text
TA 产品基础数据同步完成
  ↓
工作日历同步完成
  ↓
行情数据同步完成
  ↓
TA 分红方案同步完成
  ↓
PLM 每日监控跑批
  ↓
生成投管提醒文件
  ↓
投管系统接收提醒文件
```

也就是说，PLM 跑批不能太早。

如果行情数据还没到，目标盈就可能误判。  
如果 TA 分红方案还没同步，分红方案监控就可能误报。

### 15.11 生产发布窗口里一步步做什么

一次比较标准的投产步骤可以是：

```text
1. 发布前确认
   确认投产审批已通过。
   确认相关人员在线。
   确认备份完成。

2. 停止相关调度
   暂停可能影响部署的批处理任务。

3. 数据库变更
   执行建表、加字段、参数初始化脚本。
   验证表结构和初始化数据。

4. 上传应用包
   上传 jar、脚本、配置模板。
   设置文件权限。

5. 修改生产配置
   配置数据库连接。
   配置输入输出目录。
   配置外部系统地址。

6. 部署应用
   如果是 Web 服务，重启应用。
   如果是批处理应用，部署脚本并注册调度。

7. 手工执行冒烟验证
   用一小批验证数据执行一次。
   检查日志、数据库、输出文件。

8. 恢复调度
   打开每日跑批任务。

9. 通知业务验证
   业务人员检查页面和提醒结果。

10. 投产观察
   观察首日批处理、接口文件、告警和日志。
```

这个流程的重点是：

```text
先变更数据库和配置，再部署应用和调度，最后做验证和观察。
```

### 15.12 投产验证看什么

投产后不能只说“应用启动了”。

要验证业务链路。

对 PLM 来说可以检查：

```text
数据库表是否存在。
基础参数是否初始化。
页面是否能查询产品。
分红要素是否能保存。
目标盈要素是否能保存。
批处理是否能启动。
批处理日志是否记录成功。
提醒文件是否生成到正确目录。
文件名和字段是否符合下游约定。
投管或邮件系统是否能接收。
错误日志是否为空。
```

如果是首日生产跑批，还要重点观察：

```text
是否有大量异常提醒。
是否有产品被重复提醒。
是否有上游数据未到导致的误报。
是否有下游系统读取失败。
```

### 15.13 回退方案怎么准备

金融机构投产必须考虑失败怎么办。

回退方案通常包括：

```text
应用包回退
  恢复上一版本 jar 包。

配置回退
  恢复上一版本配置文件。

调度回退
  停用新批处理任务，恢复旧任务。

数据库回退
  如果只是新增表，一般可以保留不影响旧系统。
  如果改了旧表结构，需要提前准备回退 SQL。

接口回退
  暂停向下游推送新文件，避免错误数据继续流转。
```

对这个 PLM 项目来说，比较合理的回退策略是：

```text
如果新跑批异常，先停用 PLM 新增调度。
保留已生成文件，避免下游继续消费错误文件。
恢复上一版本 jar 和脚本。
检查 plm_batch_log 和应用日志定位原因。
必要时清理本批次错误提醒记录。
```

面试时可以说：

```text
我设计投产方案时会把回退放进去，因为金融系统最怕投产失败后不知道怎么止损。
```

### 15.14 上线后的运维观察

上线不是结束。

首日、首周还要观察：

```text
每日批处理是否按时启动。
上游数据是否按时到达。
提醒文件是否正常生成。
日志表是否增长正常。
是否出现重复提醒或漏提醒。
业务人员是否反馈提醒内容不准确。
下游系统是否读取成功。
```

如果发现问题，要能从这些地方排查：

```text
调度平台执行日志
应用运行日志
plm_batch_log
plm_reminder_log
输入文件目录
输出文件目录
数据库同步表
下游系统接收日志
```

这也是为什么前面设计时要重视日志和批次号。

### 15.15 面试时怎么讲投产流程

可以这样讲：

```text
开发完成后，我会先在本地跑单元测试和完整批处理自测，确认 jar 能构建、脚本能启动、提醒文件能生成。然后提交代码走代码评审和流水线构建，生成可部署的 jar 包、脚本、配置模板和数据库脚本。

进入测试环境后，先部署数据库表和应用包，再配置测试环境的输入输出目录和外部接口，配合测试做 SIT 和 UAT。SIT 重点验证和 TA、数据中台、投管、邮件系统的接口链路，UAT 重点验证业务页面和提醒结果是否符合预期。

生产投产前，需要准备投产申请、影响范围、部署清单、数据库脚本、调度配置、验证案例和回退方案。投产窗口里一般先停相关调度，执行数据库变更，上传应用包和脚本，修改生产配置，注册或恢复每日跑批任务，然后用验证数据做冒烟测试。上线后重点观察首日批处理、提醒文件、日志和下游接收情况。如果异常，则按回退方案停调度、恢复旧版本、隔离错误文件并排查批次日志。
```

---

## 16. 面试时如何把开发过程讲出来

可以按这个顺序讲：

“我参与的 PLM 项目，本质上不是简单产品信息维护，而是面向产品生命周期重大事件的监控和提醒系统。拿到需求后，我会先把业务拆成不同业务线：定期分红和目标盈。定期分红关注分红测算日、基准日、提醒窗口和 TA 分红方案是否录入；目标盈关注目标止盈收益率、观察期、连续达标天数和是否需要提前终止提醒。

技术实现上，先根据数据来源设计表，把 TA/数据中台同步来的产品基础信息、工作日历、行情和分红方案，与 PLM 自己录入的分红要素、目标盈要素分开存储。然后后端用 Spring Boot + JDBC 写 Repository 访问数据库，业务层按模块拆成分红日期计算、分红提醒、目标盈监控和公共批处理总控。前端通过接口调用后端完成要素录入和管理展示，外部系统通过文件接口交互，比如数据中台推 TA 数据文件给 PLM，PLM 跑批后生成投管提醒文件或邮件提醒。每日跑批会先检查数据、计算规则、筛选提醒对象、生成文件并记录日志。

这个项目比较难的地方是业务边界和日期规则。分红和目标盈不能混成一个模块；页面字段也要区分哪些来自 PLM 录入、哪些来自 TA 同步、哪些来自跑批计算。只有边界拆清楚，后端表设计、接口设计和测试验证才会稳定。”

---

## 17. 你可以如何复习这份文档

第一遍，只看业务拆分：

```text
定期分红
目标盈
公共支撑能力
```

第二遍，看数据库表：

```text
外部同步表
PLM 录入表
跑批衍生表
日志表
```

第三遍，看开发链路：

```text
IDE 写 Java
建表
Repository
Service / Workflow
CLI / API
前端接口
外部系统文件接口
跑批
日志
测试
```

第四遍，练面试表达：

```text
为什么做？
我做了什么？
怎么设计表？
怎么接前端？
怎么接外部系统？
难点是什么？
如果失败怎么排查？
```
