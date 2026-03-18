#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "当前项目：$ROOT_DIR"
echo
read -r -p "请输入提交说明（直接回车则使用“更新笔记”）: " MESSAGE
MESSAGE="${MESSAGE:-更新笔记}"

./scripts/publish-notes.sh "$MESSAGE"

echo
echo "发布完成，按回车键关闭窗口。"
read -r
