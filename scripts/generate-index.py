#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate-index.py
-----------------
递归扫描 notes/ 目录，生成：

- notes/index.json
- notes/search-index.json

支持多级分类：

notes/
  面试学习/
    开发岗/
      开发课程/
        xxx.md
      项目面试资料包/
        xxx.md
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime
from typing import Optional

NOTES_DIR = "notes"
OUTPUT_FILE = os.path.join(NOTES_DIR, "index.json")
SEARCH_INDEX_FILE = os.path.join(NOTES_DIR, "search-index.json")
PREVIEW_CHARS = 120

LESSON_CATEGORIES = {
    "基金从业资格证",
    "宏观经济学",
    "资管IT",
    "资管IT学习（个人）",
    "面试学习",
}


def natural_key(value: str):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r"(\d+)", value)]


def path_key(parts: list[str]) -> str:
    return "/".join(parts)


def path_label(parts: list[str]) -> str:
    return " / ".join(parts)


def note_in_path(note_key: str, category_key: str) -> bool:
    return note_key == category_key or note_key.startswith(f"{category_key}/")


def parse_front_matter(content: str) -> tuple[dict, str]:
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
    _, content = parse_front_matter(content)
    content = re.sub(r"```[\s\S]*?```", " ", content)
    content = re.sub(r"`[^`\n]+`", " ", content)
    content = re.sub(r"!\[.*?\]\(.*?\)", "", content)
    content = re.sub(r"\[(.+?)\]\(.*?\)", r"\1", content)
    content = re.sub(r"^#{1,6}\s+", "", content, flags=re.MULTILINE)
    content = re.sub(r"\*{1,3}(.+?)\*{1,3}", r"\1", content)
    content = re.sub(r"_{1,3}(.+?)_{1,3}", r"\1", content)
    content = re.sub(r"^[>]\s*", "", content, flags=re.MULTILINE)
    content = re.sub(r"^[-*+]\s+", "", content, flags=re.MULTILINE)
    content = re.sub(r"^\d+\.\s+", "", content, flags=re.MULTILINE)
    content = re.sub(r"^[-*_]{3,}\s*$", "", content, flags=re.MULTILINE)
    content = re.sub(r"<[^>]+>", "", content)
    content = re.sub(r"[ \t]+", " ", content)
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip()


def extract_preview(content: str) -> str:
    _, content = parse_front_matter(content)
    in_code = False
    parts = []

    for line in content.splitlines():
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue

        if stripped.startswith(("#", "---", "===", "![", "<")):
            continue

        if not stripped:
            if parts:
                break
            continue

        text = re.sub(r"\*\*(.+?)\*\*", r"\1", stripped)
        text = re.sub(r"\*(.+?)\*", r"\1", text)
        text = re.sub(r"`(.+?)`", r"\1", text)
        text = re.sub(r"\[(.+?)\]\S*", r"\1", text)
        text = re.sub(r"^[-*+>]\s+", "", text)
        text = re.sub(r"^\d+\.\s+", "", text)
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


def normalize_subject(subject: str) -> str:
    subject = normalize_title_text(subject)
    subject = re.sub(r"\s*：\s*资管科技产品经理进阶课笔记\s*$", "", subject)
    subject = re.sub(r"\s*资管科技产品经理进阶课笔记\s*$", "", subject)
    subject = re.sub(r"^(公开版|完整版)\s*", "", subject)
    subject = re.sub(r"\s*(公开版|完整版|可分享|含个人分析|私人留存)\s*$", "", subject)
    subject = re.sub(r"\s*[·•]\s*(私密版|公开版|完整版.*)$", "", subject)
    return subject.strip(" _-：")


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
        match = pattern.match(raw)
        if not match:
            continue
        if idx == 1:
            subject, order, unit = match.group(1), int(match.group(2)), match.group(3)
        else:
            order, unit, subject = int(match.group(1)), match.group(2), match.group(3)
        subject = normalize_subject(subject)
        if subject:
            return {"order": order, "unit": unit, "subject": subject}

    day_patterns = [
        re.compile(r"^day\s*0*(\d+)\s*(?:课件)?\s*[:：]\s*(.+)$", re.IGNORECASE),
        re.compile(r"^day\s*0*(\d+)[_\s-]+(.+)$", re.IGNORECASE),
    ]
    for pattern in day_patterns:
        match = pattern.match(raw)
        if not match:
            continue
        subject = normalize_subject(match.group(2))
        if subject:
            return {"order": int(match.group(1)), "unit": "day", "subject": subject}
    return None


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


def path_based_slug(path_parts: list[str], filename: str) -> str:
    stem = os.path.splitext(filename)[0]
    if stem.lower() == "readme":
        source = "/".join(path_parts)
    else:
        source = "/".join(path_parts + [stem])
    return normalize_slug(source)


def resolve_note_metadata(root_category: str, path_parts: list[str], filename: str, content: str) -> dict:
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

    if subject is None and order is not None and unit:
        filename_match = re.search(rf"第\s*0*{order}\s*{unit}[_\s]+(.+)$", filename_title)
        if filename_match:
            subject = normalize_subject(filename_match.group(1))

    title = raw_title
    if root_category in LESSON_CATEGORIES and order is not None and unit and subject:
        title = f"Day {order}：{subject}" if unit == "day" else f"第{order}{unit}：{subject}"

    explicit_order = front_matter.get("order", "").strip()
    if explicit_order.isdigit():
        order = int(explicit_order)

    legacy_slug = normalize_slug("-".join(path_parts + [title]))
    slug = normalize_slug(front_matter.get("slug", "") or path_based_slug(path_parts, filename))
    legacy_slugs = []
    if legacy_slug and legacy_slug != slug:
        legacy_slugs.append(legacy_slug)
    return {
        "title": title,
        "source_title": raw_title,
        "order": order,
        "unit": unit,
        "slug": slug,
        "legacy_slugs": legacy_slugs,
        "body": body,
    }


def sort_notes(notes: list[dict]) -> list[dict]:
    return sorted(
        notes,
        key=lambda note: (
            note["filename"].lower() != "readme.md",
            note["order"] is None,
            note["order"] if note["order"] is not None else float("inf"),
            natural_key(note["filename"]),
        ),
    )


def build_note_entry(dir_parts: list[str], filename: str, content: str, used_slugs: set[str]) -> dict:
    root_category = dir_parts[0]
    leaf_category = dir_parts[-1]
    category_key = path_key(dir_parts)
    category_path_label = path_label(dir_parts)

    meta = resolve_note_metadata(root_category, dir_parts, filename, content)
    preview = extract_preview(content)
    plain = strip_markdown(content)
    slug = meta["slug"]
    if slug in used_slugs:
      suffix = 2
      while f"{slug}-{suffix}" in used_slugs:
          suffix += 1
      slug = f"{slug}-{suffix}"
    used_slugs.add(slug)

    return {
        "title": meta["title"],
        "source_title": meta["source_title"],
        "order": meta["order"],
        "unit": meta["unit"],
        "slug": slug,
        "legacySlugs": meta["legacy_slugs"],
        "filename": filename,
        "file": f"{NOTES_DIR}/{'/'.join(dir_parts)}/{filename}",
        "preview": preview,
        "category": leaf_category,
        "rootCategory": root_category,
        "categoryKey": category_key,
        "categoryPath": dir_parts[:],
        "categoryPathLabel": category_path_label,
        "_plain": plain,
    }


def scan_category_dir(dir_path: str, dir_parts: list[str], used_slugs: set[str], all_notes: list[dict]) -> Optional[dict]:
    entries = sorted(os.listdir(dir_path), key=natural_key)
    direct_notes = []
    children = []

    md_files = [
        entry
        for entry in entries
        if entry.endswith(".md") and not entry.startswith(".") and os.path.isfile(os.path.join(dir_path, entry))
    ]
    for filename in md_files:
        filepath = os.path.join(dir_path, filename)
        try:
            with open(filepath, encoding="utf-8") as file_obj:
                content = file_obj.read()
        except Exception as exc:
            print(f"⚠️  跳过 {filepath}：{exc}")
            continue

        note = build_note_entry(dir_parts, filename, content, used_slugs)
        direct_notes.append(note)

    direct_notes = sort_notes(direct_notes)
    all_notes.extend(direct_notes)

    subdirs = [
        entry
        for entry in entries
        if os.path.isdir(os.path.join(dir_path, entry)) and not entry.startswith(".")
    ]
    for child_name in subdirs:
        child = scan_category_dir(
            os.path.join(dir_path, child_name),
            dir_parts + [child_name],
            used_slugs,
            all_notes,
        )
        if child:
            children.append(child)

    total_note_count = len(direct_notes) + sum(child["totalNoteCount"] for child in children)
    if total_note_count == 0:
        return None

    return {
        "name": dir_parts[-1],
        "key": path_key(dir_parts),
        "path": dir_parts[:],
        "pathLabel": path_label(dir_parts),
        "depth": len(dir_parts) - 1,
        "directNoteCount": len(direct_notes),
        "totalNoteCount": total_note_count,
        "children": children,
    }


def clean_note_entry(note: dict) -> dict:
    return {key: value for key, value in note.items() if not key.startswith("_")}


def flatten_tree_notes(nodes: list[dict]) -> list[dict]:
    flattened = []
    for node in nodes:
        flattened.extend(node.get("notes", []))
        flattened.extend(flatten_tree_notes(node.get("children", [])))
    return flattened


def process_notes_dir():
    if not os.path.isdir(NOTES_DIR):
        print(f"❌  找不到 '{NOTES_DIR}' 目录。")
        print("   请先创建 notes/ 文件夹，再把你的笔记放进去。")
        return

    category_tree = []
    all_notes = []
    used_slugs = set()

    for entry in sorted(os.listdir(NOTES_DIR), key=natural_key):
        entry_path = os.path.join(NOTES_DIR, entry)
        if not os.path.isdir(entry_path) or entry.startswith("."):
            continue

        node = scan_category_dir(entry_path, [entry], used_slugs, all_notes)
        if node:
            category_tree.append(node)

    clean_notes = [clean_note_entry(note) for note in all_notes]
    search_entries = [
        {
            "title": note["title"],
            "category": note["category"],
            "categoryPath": note["categoryPath"],
            "categoryPathLabel": note["categoryPathLabel"],
            "slug": note["slug"],
            "file": note["file"],
            "content": note["_plain"],
        }
        for note in all_notes
    ]

    index = {
        "categoryTree": category_tree,
        "allNotes": clean_notes,
        "total": len(clean_notes),
        "generated": datetime.now().isoformat(timespec="seconds"),
    }

    os.makedirs(NOTES_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as file_obj:
        json.dump(index, file_obj, ensure_ascii=False, indent=2)

    with open(SEARCH_INDEX_FILE, "w", encoding="utf-8") as file_obj:
        json.dump(search_entries, file_obj, ensure_ascii=False, separators=(",", ":"))

    print(f"✅  已生成 {OUTPUT_FILE}")
    print(f"✅  已生成 {SEARCH_INDEX_FILE}")
    print(f"   共 {len(category_tree)} 个根分类，{len(clean_notes)} 篇笔记")
    for node in category_tree:
        print(f"   📁  {node['pathLabel']}  ({node['totalNoteCount']} 篇)")


if __name__ == "__main__":
    process_notes_dir()
