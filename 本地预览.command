#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

PORT=8000

echo "当前项目：$ROOT_DIR"
echo "本地预览地址：http://localhost:$PORT"
echo
echo "按 Ctrl+C 可停止服务。"
echo

python3 -m http.server "$PORT"
