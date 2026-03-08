#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-index.py
-----------------
扫描 notes/ 目录，为每个子文件夹（分类）中的 .md 文件生成索引。
输出：notes/index.json

用法：
    python3 scripts/generate-index.py

每次新增文件夹或 md 文件后重新运行即可。
"""

import os
import re
import json
from datetime import datetime

NOTES_DIR    = "notes"
OUTPUT_FILE  = os.path.join(NOTES_DIR, "index.json")
PREVIEW_CHARS = 120   # 预览文字最大长度


def extract_title(content: str):
    """从 Markdown 内容中提取第一个 H1 标题。"""
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return None


def extract_preview(content: str) -> str:
    """提取正文预览（去掉 Markdown 语法，取第一段文字）。"""
    in_code = False
    parts   = []

    for line in content.splitlines():
        stripped = line.strip()

        # 跳过代码块
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue

        # 跳过标题、分隔线、图片、HTML
        if stripped.startswith(("#", "---", "===", "![", "<")):
            continue

        # 遇到空行且已有内容：结束第一段
        if not stripped:
            if parts:
                break
            continue

        # 去除常见 Markdown 语法
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', stripped)   # 粗体
        text = re.sub(r'\*(.+?)\*',     r'\1', text)        # 斜体
        text = re.sub(r'`(.+?)`',       r'\1', text)        # 行内代码
        text = re.sub(r'\[(.+?)\]\S*',  r'\1', text)        # 链接
        text = re.sub(r'^[-*+>]\s+',    '',    text)        # 列表/引用
        text = re.sub(r'^\d+\.\s+',     '',    text)        # 有序列表
        text = text.strip()

        if text:
            parts.append(text)

        if sum(len(p) for p in parts) >= PREVIEW_CHARS:
            break

    preview = " ".join(parts)
    if len(preview) > PREVIEW_CHARS:
        preview = preview[:PREVIEW_CHARS].rstrip() + "…"
    return preview


def process_notes_dir():
    if not os.path.isdir(NOTES_DIR):
        print(f"❌  找不到 '{NOTES_DIR}' 目录。")
        print("   请先创建 notes/ 文件夹，再把你的笔记放进去。")
        return

    categories  = []
    total_notes = 0

    for entry in sorted(os.listdir(NOTES_DIR)):
        entry_path = os.path.join(NOTES_DIR, entry)

        # 只处理非隐藏子目录
        if not os.path.isdir(entry_path) or entry.startswith("."):
            continue

        notes = []
        md_files = sorted(
            (f for f in os.listdir(entry_path)
             if f.endswith(".md") and not f.startswith(".")),
            key=lambda f: [int(c) if c.isdigit() else c.lower()
                           for c in re.split(r'(\d+)', f)],
        )

        for filename in md_files:
            filepath = os.path.join(entry_path, filename)
            try:
                with open(filepath, encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                print(f"⚠️  跳过 {filepath}：{e}")
                continue

            title   = extract_title(content) or os.path.splitext(filename)[0]
            preview = extract_preview(content)

            notes.append({
                "title":    title,
                "filename": filename,
                "file":     f"{NOTES_DIR}/{entry}/{filename}",
                "preview":  preview,
            })

        if notes:
            categories.append({"name": entry, "notes": notes})
            total_notes += len(notes)

    index = {
        "categories": categories,
        "total":      total_notes,
        "generated":  datetime.now().isoformat(timespec="seconds"),
    }

    os.makedirs(NOTES_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"✅  已生成 {OUTPUT_FILE}")
    print(f"   共 {len(categories)} 个分类，{total_notes} 篇笔记")
    for cat in categories:
        print(f"   📁  {cat['name']}  ({len(cat['notes'])} 篇)")


if __name__ == "__main__":
    process_notes_dir()
