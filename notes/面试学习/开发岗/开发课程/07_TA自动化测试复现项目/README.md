# TA 自动化测试复现项目

这一层专门服务一个目标：

`用本地可运行 demo，重新掌握 TA 自动化测试的架构、代码分层和面试讲法。`

先看：

- [新线程启动Prompt_TA自动化测试复现.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/新线程启动Prompt_TA自动化测试复现.md)

建议用法：

1. 新开一个 Codex 线程
2. 使用上面的 prompt 启动项目
3. 让新线程先做详细设计和环境检查
4. 确认后，再让新线程在下面目录创建项目：
   `/Users/shifusong/Projects/找工作/工作后的开发项目/TA自动化测试复现/ta-automation-replica`
5. 做完后回到现有面试资料里，把项目讲法和真实边界再统一校准

这个复现项目应该重点证明：

- 你理解 TA 和代销商之间的申请/确认文件闭环
- 你理解 Jenkins Pipeline 为什么适合做统一触发入口
- 你理解 SQL、文件、批处理节点、报告之间的关系
- 你能讲清 Java 代码如何实现文件解析和数据库比对
- 你能把项目从业务流程、技术架构、代码分层和面试话术四个角度讲清楚

## 复现项目文档怎么放

复现项目里的 5 份核心文档已经复制到开发知识库内：

- [TA 自动化测试复现文档索引](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/README.md)

原因：

- 高盛工银面试复习应该尽量从 `面试学习/开发` 入口进入
- 工程项目目录仍保留原文档，但复习时以知识库副本为主
- 后续如果工程文档更新，需要同步更新这里的副本

## 高盛面试推荐阅读顺序

1. [workflow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/workflow.md)
2. [implementation-notes.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/implementation-notes.md)
3. [expected-actual-jenkins-flow.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/expected-actual-jenkins-flow.md)
4. [jenkins-integration-guide.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/jenkins-integration-guide.md)
5. [docker-application-guide.md](notes/面试学习/开发岗/开发课程/07_TA自动化测试复现项目/docs/docker-application-guide.md)
