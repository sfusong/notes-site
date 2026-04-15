# Markdown 语法示例

本文展示网站支持的各种 Markdown 格式，可以作为写笔记时的参考。

## 文字格式

普通段落文字，支持 **粗体**、*斜体*、~~删除线~~，以及 `行内代码`。

## 列表

**无序列表：**

- 苹果
- 香蕉
  - 大蕉
  - 小米蕉
- 橘子

**有序列表：**

1. 第一步：确定目标
2. 第二步：制定计划
3. 第三步：执行并复盘

**任务列表：**

- [x] 搭建笔记网站
- [x] 配置 GitHub Pages
- [ ] 写第一篇正式笔记

## 引用

> 学而时习之，不亦说乎？有朋自远方来，不亦乐乎？
>
> —— 《论语·学而》

## 代码块

**Python 示例：**

```python
def fibonacci(n: int) -> list[int]:
    """生成前 n 个斐波那契数列"""
    seq = [0, 1]
    for i in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(10))
# 输出：[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

**JavaScript 示例：**

```javascript
const fetchNote = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};
```

**Shell 命令：**

```bash
# 生成笔记索引
python3 scripts/generate-index.py

# 推送到 GitHub
git add .
git commit -m "新增笔记"
git push
```

## 表格

| 语言       | 创建年份 | 主要用途         |
|------------|----------|------------------|
| Python     | 1991     | 数据科学、AI、后端 |
| JavaScript | 1995     | 前端、全栈开发   |
| Rust       | 2010     | 系统编程、WebAssembly |
| Go         | 2009     | 云原生、微服务   |

## 分隔线

---

## 链接与图片

[访问 GitHub](https://github.com) 查看项目源码。

## 数学公式提示

如需支持数学公式（LaTeX），可以在 `index.html` 中引入 KaTeX：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
```
