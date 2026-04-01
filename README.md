# Notes Site

一个以阅读体验为中心的个人笔记站，同时支持：

- Web 浏览
- Android App 壳
- 本地优先同步
- 多级分类
- 站内课程导航页与 Markdown 内链跳转

详细设计见：

- [多级分类详细设计](/Users/shifusong/notes-site/docs/multi-level-category-design.md)

## 目录结构

笔记目录位于 `notes/`，目录结构就是分类结构。

示例：

```text
notes/
  面试学习/
    README.md
    产品经理_项目经理/
      BOCI问答题库_短版.md
    AI产品经理/
      README.md
      第1课_AI产品经理和传统产品经理的区别.md
    开发岗/
      开发课程/
        README.md
        00_课程总纲/
          开发岗课程总纲.md
        03_项目表达/
          README.md
          产品生命周期管理系统_项目讲法.md
      工银高盛/
        README.md
        01_产品生命周期管理系统.md
  资管IT/
    第1讲_资管行业全景图.md
```

说明：

- 支持多级目录
- 每个目录中的 `.md` 文件都会被视为当前节点下的笔记
- `README.md` 会作为当前目录的导航页/入口页参与展示
- 适合把课程总纲、知识库首页、模块 README 一起纳入站内

## 标题与排序

系统会按以下优先级自动提取标题：

1. `front matter.title`
2. 正文第一个 `# 标题`
3. 文件名

课程类分类会自动规范标题，例如：

- `第8讲：资管科技系统地图`
- `Day 2：项目复盘`

排序优先级：

1. `front matter.order`
2. 文件名/标题中提取出的 `第N讲 / 第N课 / Day N`
3. 文件名自然排序

## 路由与分类路径

系统会自动为每篇笔记生成：

- 稳定 `slug`（优先基于目录路径与文件名，而不是标题）
- `categoryPath`
- `categoryPathLabel`

兼容策略：

- 如果旧链接使用了历史标题型 slug，前端仍会尝试兼容跳转
- 现在新的默认 slug 更适合课程类资料，因为标题调整后链接也不容易变

前端行为：

- 左栏支持树形分类
- 点击任意分类节点，会显示该节点子树下的全部笔记
- 搜索范围中的“当前节点”表示当前选中分类子树
- 正文 breadcrumb 会展示完整路径
- 正文里的 Markdown 内链会自动识别为站内笔记并跳转
- 旧的本机绝对路径链接如果能映射到站内笔记，也会自动兼容

## 导入外部课程资料

如果你有一套已经写好的课程型 Markdown（例如“总纲 + README + 多章节专题”），推荐按下面方式并入：

1. 在 `notes/` 下为它创建一个完整课程树
2. 保留原来的章节层级
3. 把目录中的 `README.md` 一起带入，作为课程入口页
4. 运行索引生成脚本

比如当前开发课程的整合方式就是：

```text
notes/
  面试学习/
    开发岗/
      开发课程/
        README.md
        00_课程总纲/
        01_岗位与计划/
        02_系统与交付基础/
        03_项目表达/
        04_语言与数据基础/
        05_岗位定制补充/
```

如果外部 Markdown 里原本写的是本机绝对路径链接，建议在导入时一起清洗；站内现在也会尽量兼容这类历史链接。

## 新增笔记

最常用流程：

```bash
cd /Users/shifusong/notes-site
python3 scripts/generate-index.py
```

然后提交并推送。

如果你使用现有脚本：

```bash
/Users/shifusong/notes-site/scripts/publish-notes.sh "新增笔记：xx"
```

## Front Matter

如果你想手动覆盖标题、顺序或 slug，可以在 Markdown 顶部写：

```md
---
title: 第8讲：资管科技系统地图
slug: zi-guan-it-08-system-map
order: 8
---
```

## Android App

项目支持用 Capacitor 打包 Android。

调试包构建：

```bash
cd /Users/shifusong/notes-site
npm run android:build:debug
```

当前 Android 版特点：

- 空壳 App + 首次同步
- 本地缓存笔记
- 离线阅读
- 继续阅读

更多说明见：

- [Android 快速开始](/Users/shifusong/notes-site/scripts/android-quickstart.md)
- [开发课程整合说明](/Users/shifusong/notes-site/docs/development-course-integration.md)
