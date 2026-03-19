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
from typing import Optional

NOTES_DIR         = "notes"
OUTPUT_FILE       = os.path.join(NOTES_DIR, "index.json")
SEARCH_INDEX_FILE = os.path.join(NOTES_DIR, "search-index.json")
PREVIEW_CHARS = 120   # 预览文字最大长度

LESSON_CATEGORIES = {
    "基金从业资格证",
    "宏观经济学",
    "资管IT",
    "资管IT学习（个人）",
}


def natural_key(value: str):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', value)]


def parse_front_matter(content: str) -> tuple[dict, str]:
    """只解析文件开头的 front matter，避免误伤正文里的 ---。"""
    if not content.startswith("---\n") and not content.startswith("---\r\n"):
        return {}, content

    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, content

    end_index = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_index = i
            break

    if end_index is None:
        return {}, content

    meta = {}
    for line in lines[1:end_index]:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip().lower()] = value.strip().strip('"').strip("'")

    body = "\n".join(lines[end_index + 1:]).lstrip("\n")
    return meta, body


def normalize_title_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("——", "：")
    text = text.replace("--", "：")
    text = text.replace("｜", "：")
    text = re.sub(r"\s*[|｜]\s*", "：", text)
    text = re.sub(r"\s*·\s*", " · ", text)
    text = re.sub(r"\s*[（(]\d+[）)]\s*$", "", text)
    return text.strip(" _-")


def extract_h1_titles(content: str) -> list[str]:
    return [
        normalize_title_text(line.strip()[2:])
        for line in content.splitlines()
        if line.strip().startswith("# ")
    ]


def strip_markdown(content: str) -> str:
    """将 Markdown 内容转为纯文本，用于全文搜索索引。"""
    _, content = parse_front_matter(content)
    # 去掉代码块
    content = re.sub(r'```[\s\S]*?```', ' ', content)
    # 去掉行内代码
    content = re.sub(r'`[^`\n]+`', ' ', content)
    # 去掉图片
    content = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    # 链接保留文字
    content = re.sub(r'\[(.+?)\]\(.*?\)', r'\1', content)
    # 去掉标题 #
    content = re.sub(r'^#{1,6}\s+', '', content, flags=re.MULTILINE)
    # 去掉粗体/斜体
    content = re.sub(r'\*{1,3}(.+?)\*{1,3}', r'\1', content)
    content = re.sub(r'_{1,3}(.+?)_{1,3}', r'\1', content)
    # 去掉引用符号
    content = re.sub(r'^[>]\s*', '', content, flags=re.MULTILINE)
    # 去掉列表符号
    content = re.sub(r'^[-*+]\s+', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\d+\.\s+', '', content, flags=re.MULTILINE)
    # 去掉分隔线
    content = re.sub(r'^[-*_]{3,}\s*$', '', content, flags=re.MULTILINE)
    # 去掉 HTML 标签
    content = re.sub(r'<[^>]+>', '', content)
    # 合并多余空白
    content = re.sub(r'[ \t]+', ' ', content)
    content = re.sub(r'\n{3,}', '\n\n', content)
    return content.strip()


def extract_title(content: str):
    """从 Markdown 内容中提取第一个 H1 标题。"""
    _, body = parse_front_matter(content)
    headings = extract_h1_titles(body)
    return headings[0] if headings else None


def extract_preview(content: str) -> str:
    """提取正文预览（去掉 Markdown 语法，取第一段文字）。"""
    _, content = parse_front_matter(content)
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


def clean_filename_stem(filename: str) -> str:
    stem = os.path.splitext(filename)[0]
    stem = stem.replace("_", " ")
    stem = re.sub(r"\s+", " ", stem)
    stem = re.sub(r"\s*[（(]\d+[）)]\s*$", "", stem)
    return stem.strip()


def extract_series_info(text: str) -> Optional[dict]:
    if not text:
        return None

    raw = normalize_title_text(text)
    patterns = [
        re.compile(r"^第\s*0*(\d+)\s*([讲课节篇章])\s*[:：]\s*(.+)$"),
        re.compile(r"^(.+?)\s*[（(]\s*第\s*0*(\d+)\s*([讲课节篇章])\s*[）)]$"),
        re.compile(r"^.+?\b第\s*0*(\d+)\s*([讲课节篇章])\b[_\s:：-]*(.+)$"),
        re.compile(r"^.+?[_\s]第\s*0*(\d+)\s*([讲课节篇章])[_\s]+(.+)$"),
    ]

    for idx, pattern in enumerate(patterns):
        m = pattern.match(raw)
        if not m:
            continue
        if idx == 1:
            subject, order, unit = m.group(1), int(m.group(2)), m.group(3)
        else:
            order, unit, subject = int(m.group(1)), m.group(2), m.group(3)
        subject = normalize_subject(subject)
        if subject:
            return {"order": order, "unit": unit, "subject": subject}
    return None


def normalize_subject(subject: str) -> str:
    subject = normalize_title_text(subject)
    subject = re.sub(r"\s*：\s*资管科技产品经理进阶课笔记\s*$", "", subject)
    subject = re.sub(r"\s*资管科技产品经理进阶课笔记\s*$", "", subject)
    subject = re.sub(r"^(公开版|完整版)\s*", "", subject)
    subject = re.sub(r"\s*(公开版|完整版|可分享|含个人分析|私人留存)\s*$", "", subject)
    subject = re.sub(r"\s*[·•]\s*(私密版|公开版|完整版.*)$", "", subject)
    return subject.strip(" _-：")


def resolve_note_metadata(category: str, filename: str, content: str) -> dict:
    front_matter, body = parse_front_matter(content)
    h1_titles = extract_h1_titles(body)
    first_h1 = h1_titles[0] if h1_titles else None
    second_h1 = h1_titles[1] if len(h1_titles) > 1 else None
    filename_title = normalize_title_text(clean_filename_stem(filename))

    raw_title = (
        normalize_title_text(front_matter.get("title", ""))
        or first_h1
        or filename_title
    )

    order = None
    unit = None
    subject = None

    for candidate in (
        front_matter.get("title", ""),
        first_h1 or "",
        second_h1 or "",
        filename_title,
    ):
        info = extract_series_info(candidate)
        if info:
            order = info["order"]
            unit = info["unit"]
            subject = info["subject"]
            break

    if subject is None and second_h1:
        subject = normalize_subject(second_h1)

    if subject is None and order is not None:
        filename_match = re.search(rf"第\s*0*{order}\s*{unit}[_\s]+(.+)$", filename_title)
        if filename_match:
            subject = normalize_subject(filename_match.group(1))

    title = raw_title
    if category in LESSON_CATEGORIES and order is not None and unit and subject:
        title = f"第{order}{unit}：{subject}"

    explicit_order = front_matter.get("order", "").strip()
    if explicit_order.isdigit():
        order = int(explicit_order)

    slug = normalize_slug(front_matter.get("slug", "") or f"{category}-{title}")
    return {
        "title": title,
        "source_title": raw_title,
        "order": order,
        "unit": unit,
        "slug": slug,
        "body": body,
    }


def normalize_slug(value: str) -> str:
    value = value.strip().lower()
    value = value.replace("（", "-").replace("）", "-")
    value = value.replace("(", "-").replace(")", "-")
    value = value.replace("：", "-").replace(":", "-")
    value = re.sub(r"[·•｜|/]+", "-", value)
    value = re.sub(r"[\s_]+", "-", value)
    value = re.sub(r"[^0-9a-z\u4e00-\u9fff-]+", "", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "note"


def process_notes_dir():
    if not os.path.isdir(NOTES_DIR):
        print(f"❌  找不到 '{NOTES_DIR}' 目录。")
        print("   请先创建 notes/ 文件夹，再把你的笔记放进去。")
        return

    categories  = []
    total_notes = 0
    used_slugs = set()

    for entry in sorted(os.listdir(NOTES_DIR)):
        entry_path = os.path.join(NOTES_DIR, entry)

        # 只处理非隐藏子目录
        if not os.path.isdir(entry_path) or entry.startswith("."):
            continue

        notes = []
        md_files = sorted(
            (f for f in os.listdir(entry_path)
             if f.endswith(".md") and not f.startswith(".")),
            key=natural_key,
        )

        for filename in md_files:
            filepath = os.path.join(entry_path, filename)
            try:
                with open(filepath, encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                print(f"⚠️  跳过 {filepath}：{e}")
                continue

            meta    = resolve_note_metadata(entry, filename, content)
            preview = extract_preview(content)
            plain   = strip_markdown(content)
            slug    = meta["slug"]
            if slug in used_slugs:
                suffix = 2
                while f"{slug}-{suffix}" in used_slugs:
                    suffix += 1
                slug = f"{slug}-{suffix}"
            used_slugs.add(slug)

            notes.append({
                "title":    meta["title"],
                "source_title": meta["source_title"],
                "order":    meta["order"],
                "unit":     meta["unit"],
                "slug":     slug,
                "filename": filename,
                "file":     f"{NOTES_DIR}/{entry}/{filename}",
                "preview":  preview,
                "_plain":   plain,
                "_cat":     entry,
            })

        notes.sort(key=lambda n: (
            n["order"] is None,
            n["order"] if n["order"] is not None else float("inf"),
            natural_key(n["filename"]),
        ))

        if notes:
            categories.append({"name": entry, "notes": notes})
            total_notes += len(notes)

    # Build clean index (strip internal fields)
    clean_categories = []
    for cat in categories:
        clean_notes = [
            {k: v for k, v in n.items() if not k.startswith("_")}
            for n in cat["notes"]
        ]
        clean_categories.append({"name": cat["name"], "notes": clean_notes})

    index = {
        "categories": clean_categories,
        "total":      total_notes,
        "generated":  datetime.now().isoformat(timespec="seconds"),
    }

    # Build search index (compact, no indent)
    search_entries = []
    for cat in categories:
        for n in cat["notes"]:
            search_entries.append({
                "title":    n["title"],
                "category": n["_cat"],
                "slug":     n["slug"],
                "file":     n["file"],
                "content":  n["_plain"],
            })

    os.makedirs(NOTES_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    with open(SEARCH_INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(search_entries, f, ensure_ascii=False, separators=(",", ":"))

    print(f"✅  已生成 {OUTPUT_FILE}")
    print(f"✅  已生成 {SEARCH_INDEX_FILE}")
    print(f"   共 {len(categories)} 个分类，{total_notes} 篇笔记")
    for cat in categories:
        print(f"   📁  {cat['name']}  ({len(cat['notes'])} 篇)")


if __name__ == "__main__":
    process_notes_dir()
