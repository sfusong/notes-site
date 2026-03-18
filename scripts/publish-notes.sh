#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MESSAGE="${1:-更新笔记}"

python3 scripts/generate-index.py

git add notes

if git diff --cached --quiet -- notes; then
  echo "没有检测到 notes/ 下的变更，无需提交。"
  exit 0
fi

git commit -m "$MESSAGE"
git push

echo "已发布笔记：$MESSAGE"
