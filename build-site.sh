#!/usr/bin/env bash
# Builds every lab*/ folder that has a package.json into site/<lab>/ and writes a home page listing them.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf site && mkdir site
links=""
for dir in lab*/; do
  lab=${dir%/}
  [ -f "$lab/package.json" ] || continue
  (cd "$lab" && npm ci && npm run build)
  cp -R "$lab/dist" "site/$lab"
  links+="<li><a href=\"$lab/\">${lab/lab/Lab }</a></li>"
done
cat > site/index.html <<EOF
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HCD-545 WebXR</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style></head>
<body><h1>HCD-545 WebXR</h1><ul>$links</ul></body></html>
EOF
echo "Built: $(ls site)"
