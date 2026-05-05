# TA 自动化测试复现文档索引

这一份是 `面试学习/开发` 知识库内的文档副本索引。

原始工程项目仍在：

- [ta-automation-replica](/Users/shifusong/Projects/找工作/工作后的开发项目/TA自动化测试复现/ta-automation-replica)

但高盛工银 onsite 复习时，以本目录下这份知识库副本为主，避免在复习资料和工程目录之间来回跳。

---

## 一、高盛工银面试阅读顺序

### 1. 先看项目闭环

- [workflow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/workflow.md)

用途：

- 讲清项目边界
- 讲清批前 / 批后流程
- 讲清自动化和人工检查点的关系

### 2. 再看面试复盘

- [implementation-notes.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/implementation-notes.md)

用途：

- 讲清你做了什么
- 讲清最大设计难点
- 讲清哪些话能说、哪些话不能说太满

### 3. 如果问到“怎么判断测试通过”

- [expected-actual-jenkins-flow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/expected-actual-jenkins-flow.md)

用途：

- 讲清 expected vs actual
- 讲清 Java 字段级比对
- 讲清对账结果如何影响 Jenkins stage 成功 / 失败

### 4. 如果问到 Jenkins / Pipeline

- [jenkins-integration-guide.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/jenkins-integration-guide.md)

用途：

- 讲清 Java 类、main 方法、命令行参数、Shell、Jenkinsfile、Jenkins 页面之间的关系
- 讲清 Jenkins 不是业务逻辑，而是编排和入口

### 5. 如果问到 Docker / 容器化

- [docker-application-guide.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/docker-application-guide.md)

用途：

- 讲清 Dockerfile、image、container、volume、registry
- 讲清 Docker 和 Jenkins、Shell、Java 的职责边界
- 回应一面没答好的 Docker 容器化问题

---

## 二、文档归属

| 文档 | 复习用途 | 优先级 |
| --- | --- | --- |
| `workflow.md` | 项目闭环主讲 | 高 |
| `implementation-notes.md` | 面试表达和边界 | 高 |
| `expected-actual-jenkins-flow.md` | 技术深挖：比对机制 | 中高 |
| `jenkins-integration-guide.md` | 技术深挖：流水线编排 | 中 |
| `docker-application-guide.md` | 技术补强：容器化 | 中 |

---

## 三、面试前最短复习路线

如果只剩 30 分钟：

1. 看 [workflow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/workflow.md)
2. 看 [implementation-notes.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/implementation-notes.md)
3. 翻 [expected-actual-jenkins-flow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/expected-actual-jenkins-flow.md) 的第 9 节和第 10 节

如果还有时间，再看 Jenkins 和 Docker。

---

## 四、这套文档在面试里的定位

你应该把这套本地复现项目讲成：

`基于我参与过的 TA 自动化测试链路做的脱敏复现，用来重新梳理申请文件、确认文件、数据库比对、Jenkins 编排和报告输出这条工程化回归流程。`

不要讲成：

- `宁银理财原始源码`
- `我完整实现了 TA 批处理`
- `真实项目全流程无人值守`
- `确认文件由我们的工具生成`

最安全、也最有竞争力的说法是：

`我熟悉这条 TA 回归测试链路，并且通过本地复现重新把文件生成、文件解析、expected vs actual 对账、Jenkins 编排和报告输出这些技术点梳理了一遍。`
