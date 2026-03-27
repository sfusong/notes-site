# Notes Site

一个以阅读体验为中心的个人笔记站，同时支持：

- Web 浏览
- Android App 壳
- 本地优先同步
- 多级分类

详细设计见：

- [多级分类详细设计](/Users/shifusong/notes-site/docs/multi-level-category-design.md)

## 目录结构

笔记目录位于 `notes/`，目录结构就是分类结构。

示例：

```text
notes/
  面试学习/
    产品经理_项目经理/
      BOCI问答题库_短版.md
    AI产品经理/
      第1课_AI产品经理和传统产品经理的区别.md
    开发岗/
      工银高盛/
        01_产品生命周期管理系统.md
  资管IT/
    第1讲_资管行业全景图.md
```

说明：

- 支持多级目录
- 每个目录中的 `.md` 文件都会被视为当前节点下的笔记
- `README.md` 当前也会当作普通笔记处理

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

- 稳定 `slug`
- `categoryPath`
- `categoryPathLabel`

前端行为：

- 左栏支持树形分类
- 点击任意分类节点，会显示该节点子树下的全部笔记
- 搜索范围中的“当前节点”表示当前选中分类子树
- 正文 breadcrumb 会展示完整路径

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
