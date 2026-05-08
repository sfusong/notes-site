# 高盛工银 Onsite 总准备清单

已知形式：

- 一天 3 场 panel
- 总时长约 3 小时
- 有 `30 分钟 Java coding`
- 其余主要看项目、技术基础、behavior、英语沟通

## 1. 准备优先级

不要平均用力。

| 优先级 | 模块 | 合格标准 | 主文件 |
|---|---|---|---|
| 1 | Java coding | 30 分钟内至少能写出 1-2 道基础题，第三题能讲思路 | [01_高盛工银onsite前Java算法题与语法清单.md](notes/面试学习/开发岗/开发课程/06_Java手撕算法冲刺/01_高盛工银onsite前Java算法题与语法清单.md) |
| 2 | 三条主项目 | 每条 1 分钟讲法 + 3 个追问 | [高盛工银Onsite_项目文档总入口.md](notes/面试学习/开发岗/开发课程/03_项目表达/高盛工银Onsite_项目文档总入口.md) |
| 3 | 技术原理 | Docker、Git、Linux、Spring、SQL、CI/CD 不空白 | [高盛工银技术八股与原理清单.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/高盛工银技术八股与原理清单.md) |
| 4 | Behavior | 3 个核心故事能覆盖大多数 BQ | [高盛工银Behavior问题速查.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/高盛工银Behavior问题速查.md) |
| 5 | 英语 | 能用英文讲自我介绍、当前工作、一个项目 | [金融开发岗英语项目表达.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/金融开发岗英语项目表达.md) |
| 6 | 金融/智力题 | 固收、债券、风险、估算题不完全空白 | [金融基础与智力题轻量版.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/金融基础与智力题轻量版.md) |

## 2. Java Coding

最低目标：

- 熟练写 `HashMap`、`HashSet`、`Deque`、`Queue`、数组、字符串、链表节点
- 每题能先讲思路，再写代码，再说复杂度
- 空数组、空字符串、链表空节点、栈空、下标越界要主动处理

必练主干：

1. `Two Sum`
2. `Valid Parentheses`
3. `Merge Sorted Array`
4. `Reverse Linked List`
5. `Binary Search`
6. `Remove Duplicates from Sorted Array`
7. `First Unique Character`
8. `Best Time to Buy and Sell Stock`
9. `Maximum Subarray`
10. `Merge Intervals`
11. `Linked List Cycle`
12. `Binary Tree Level Order Traversal`

现场话术：

`我先确认输入输出和边界。这个题我会用……思路，维护……变量。代码里注意……。时间复杂度是……，空间复杂度是……。`

## 3. 项目

主战顺序：

1. `产品生命周期管理系统`：[项目讲法](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统_项目讲法.md) + [复现项目复习方案](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/产品生命周期管理系统复现项目_复习方案.md)
2. `TA 自动化测试`
3. `TA 静态参数稽核`
4. `Apprentice` 只做备用

每条项目必须讲清：

- 解决什么业务问题
- 技术上怎么工作
- 你实际做了什么
- 难点和价值是什么
- 如果出问题怎么排查

项目要自然带出的技术关键词：

- 产品生命周期：`Spring Boot`、`React`、`数据库设计`、`数据中台联调`、`邮件/OA 接口`
- TA 自动化测试：`Jenkins Pipeline`、`Java 文件解析`、`SQL 对账`、`批处理`、`Linux`
- TA 静态稽核：`规则系统化`、`SQL/规则判断`、`批前风险控制`、`异常结果汇总`

产品生命周期如果被追问技术细节，直接进入：

- [产品生命周期管理系统复现项目_复习方案.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/产品生命周期管理系统复现项目_复习方案.md)
- [产品生命周期管理系统复现项目](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/README.md)

## 4. 技术原理

每个技术点都按 3 句话准备：

1. `它是什么`
2. `为什么项目里会用`
3. `如果出问题怎么排查`

必备技术点：

- Docker / 容器化：[Docker_容器化原理_面试补强.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/Docker_容器化原理_面试补强.md)
- Linux / Windows Server / IaC：[Linux_WindowsServer_IaC认知级补课.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/Linux_WindowsServer_IaC认知级补课.md)
- Git / SDLC：[Git_SDLC_发布协作面试够用版.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/Git_SDLC_发布协作面试够用版.md)
- CI/CD / Jenkins：[CI_CD.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/CI_CD.md)，[Jenkins_Pipeline.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/Jenkins_Pipeline.md)
- Spring Boot / Spring MVC：[SpringBoot_RESTAPI_后端系统怎么讲.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/SpringBoot_RESTAPI_后端系统怎么讲.md)，[SpringMVC_请求流程_参数校验_返回结果怎么讲.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/SpringMVC_请求流程_参数校验_返回结果怎么讲.md)
- MySQL / Redis：[MySQL_Redis基础与常见追问.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/MySQL_Redis基础与常见追问.md)
- Tomcat / Nginx / jar / war / JVM：[Tomcat_Nginx.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/Tomcat_Nginx.md)，[JAR_WAR.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/JAR_WAR.md)，[Tomcat_Maven_JDK_JRE_JVM.md](notes/面试学习/开发岗/开发课程/02_系统与交付基础/Tomcat_Maven_JDK_JRE_JVM.md)
- Java OOP / 设计模式：[Java_OOP_设计模式_高盛工银补强.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/Java_OOP_设计模式_高盛工银补强.md)
- 数据库设计 / UML / 异常恢复：[数据库设计_UML_异常恢复_高盛工银补强.md](notes/面试学习/开发岗/开发课程/04_语言与数据基础/数据库设计_UML_异常恢复_高盛工银补强.md)

## 5. Behavior

优先背 3 个核心故事：

1. `产品生命周期系统`：主动承接紧急业务需求，把规则和提醒做成系统能力
2. `TA 自动化测试`：把人工回归、外部联调依赖转成自动化闭环
3. `产品管理系统 / UAT 上线`：跨业务、供应商、测试推进复杂系统落地

这些故事覆盖：

- 最大挑战
- 主动解决问题
- owner mindset
- 跨部门协作
- 模糊需求推进
- 适应变化
- 为什么适合金融科技开发岗

## 6. 英文

至少准备 3 段：

- `30-45 秒英文自我介绍`
- `英文讲当前工作`
- `英文讲 TA automation testing 或 product lifecycle management system`

英文不要追求复杂句，优先准确、自然、能把项目讲清。

## 7. 最后 24 小时

只看：

1. 算法主干题和 Java 语法速查
2. 三条主项目 1 分钟讲法
3. Docker、Git、Linux、Spring Boot、SQL、MySQL/Redis
4. [高盛工银开发岗_面试前速查清单.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/高盛工银开发岗_面试前速查清单.md)
5. [高盛工银Behavior问题速查.md](notes/面试学习/开发岗/开发课程/05_岗位定制补充/高盛工银Behavior问题速查.md)

不要扩新材料。

## 8. 现场答题框架

Coding：

1. 确认输入输出
2. 讲思路和数据结构
3. 写 Java
4. 跑一个例子
5. 说复杂度

项目：

1. 背景
2. 你做了什么
3. 技术链路
4. 难点和结果
5. 风险和排查

Behavior：

1. 场景
2. 你的动作
3. 协作对象
4. 结果
5. 复盘

一句话收束：

`先顶住 coding，再讲稳三条主项目，然后用技术原理、BQ 和英文收口。`
