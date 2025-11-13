#!/bin/bash
# 检查构建产物体积脚本

echo "=========================================="
echo "构建产物体积检查"
echo "=========================================="
echo ""

echo "📦 原始文件大小:"
du -sh dist/*.js 2>/dev/null | sort -h
echo ""

echo "📊 Gzip 压缩后体积:"
for file in dist/*.js; do
  if [ -f "$file" ]; then
    size=$(gzip -c "$file" | wc -c)
    size_kb=$(echo "scale=1; $size / 1024" | bc)
    echo "  $(basename $file): ${size_kb} KB"
  fi
done
echo ""

echo "📈 总体积统计:"
total_raw=$(du -sb dist/*.js 2>/dev/null | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')
total_gzip=$(for file in dist/*.js; do [ -f "$file" ] && gzip -c "$file" | wc -c; done | awk '{sum+=$1} END {printf "%.1f KB", sum/1024}')
echo "  原始大小总计: $total_raw"
echo "  Gzip 大小总计: $total_gzip"
echo ""

echo "✅ 目标检查:"
gzip_total=$(for file in dist/*.js; do [ -f "$file" ] && gzip -c "$file" | wc -c; done | awk '{sum+=$1} END {print sum}')
if [ "$gzip_total" -lt 307200 ]; then
  echo "  ✅ Gzip 总体积 ($(echo "scale=1; $gzip_total/1024" | bc) KB) < 300 KB，目标达成！"
else
  echo "  ❌ Gzip 总体积 ($(echo "scale=1; $gzip_total/1024" | bc) KB) >= 300 KB，需要进一步优化"
fi
echo ""

echo "=========================================="

