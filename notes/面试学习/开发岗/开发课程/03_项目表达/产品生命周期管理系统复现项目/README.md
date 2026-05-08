# 产品生命周期管理系统复现项目

这组文档用于补强 `产品生命周期管理系统` 的技术讲法。

它不是替代原来的项目讲法，而是回答更深一层的问题：

`如果面试官继续问“这个系统到底怎么拆模块、怎么写代码、怎么跑批、怎么对接外部系统、怎么排查问题”，从这里看。`

---

## 一、推荐阅读顺序

1. [workflow.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/workflow.md)
2. [developer-walkthrough.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/developer-walkthrough.md)
3. [feature-implementation-guide.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/feature-implementation-guide.md)
4. [development-diary.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/development-diary.md)

---

## 二、每份文档解决什么问题

| 文件 | 用途 | 面试价值 |
|---|---|---|
| [workflow.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/workflow.md) | 讲业务流程、系统边界、定期分红和目标盈两条业务线 | 帮你把 PLM 讲成业务规则系统，而不是 CRUD |
| [developer-walkthrough.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/developer-walkthrough.md) | 从需求、数据库、Java 后端、前端、外部接口、跑批一路讲开发过程 | 帮你回答“你到底怎么开发这个系统” |
| [feature-implementation-guide.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/feature-implementation-guide.md) | 逐个功能解释业务输入、数据库存储、Java 动作、跑批触发和输出结果 | 帮你把功能拆成可讲的技术动作 |
| [development-diary.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统复现项目/docs/development-diary.md) | 记录开发推进、重构原因、边界修正和实现取舍 | 帮你讲出工程判断，而不是背项目介绍 |

---

## 三、这组文档最该抓住什么

1. `PLM 不是产品 CRUD 系统，而是生命周期重大事件监控和提醒系统。`
2. `定期分红和目标盈是两条不同业务线，公共能力可以复用，但业务逻辑不能混成一团。`
3. `系统边界要讲清：PLM 负责规则、跑批、提醒和日志；TA / 数据中台负责基础数据、日历、行情和分红方案。`
4. `技术讲法要围绕数据库表、Java Service、规则类、跑批、文件输出、日志和报告。`
5. `复现项目的价值是帮你把“我参与过”讲成“我知道系统怎么做”。`

---

## 四、和原项目讲法怎么配合

先用这份建立面试口径：

- [产品生命周期管理系统_项目讲法.md](notes/面试学习/开发岗/开发课程/03_项目表达/产品生命周期管理系统_项目讲法.md)

如果面试官继续追问技术细节，再打开这组复现文档。

最稳的复习顺序是：

```text
产品生命周期管理系统_项目讲法
  -> workflow.md
  -> developer-walkthrough.md
  -> feature-implementation-guide.md
  -> development-diary.md
```

---

## 五、最后记忆法

PLM 项目按这句话讲：

`业务上管生命周期事件，技术上拆业务线和公共能力，工程上靠跑批、接口、日志和提醒闭环。`
