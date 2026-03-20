#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT_DIR/app-web"

rm -rf "$WEB_DIR"
mkdir -p "$WEB_DIR"

copy_path() {
  src="$1"
  dest="$WEB_DIR/$1"
  mkdir -p "$(dirname "$dest")"
  cp -R "$ROOT_DIR/$src" "$dest"
}

copy_path "index.html"
copy_path "css"
copy_path "js"
copy_path "icons"
copy_path "vendor"

if [ -f "$ROOT_DIR/sw.js" ]; then
  copy_path "sw.js"
fi

if [ -f "$ROOT_DIR/site.webmanifest" ]; then
  copy_path "site.webmanifest"
fi

echo "Prepared Capacitor web assets in $WEB_DIR"
