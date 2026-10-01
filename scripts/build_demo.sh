#!/bin/bash

# собирает статическую демо-версию фронтенда для GitHub Pages в папку _site
# использование: ./scripts/build_demo.sh

set -e

OUT=_site

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R static/. "$OUT/"
cp demo/demo.js "$OUT/js/demo.js"

# пути делаем относительными и подключаем demo.js перед app.js
sed -e 's|"/static/|"|g' \
    -e 's|<script src="js/app.js"></script>|<script src="js/demo.js"></script><script src="js/app.js"></script>|' \
    static/index.html > "$OUT/index.html"

grep -q 'js/demo.js' "$OUT/index.html" || { echo "Ошибка: demo.js не подключен"; exit 1; }

echo "Демо-версия собрана в $OUT/"
