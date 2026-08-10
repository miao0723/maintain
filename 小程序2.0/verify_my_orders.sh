#!/bin/bash

echo "=========================================="
echo "管理员'我的订单'功能验证脚本"
echo "=========================================="
echo ""

# 检查文件是否存在
echo "1. 检查前端文件..."
files=(
    "pages/my-orders/my-orders.wxml"
    "pages/my-orders/my-orders.js"
    "pages/my-orders/my-orders.wxss"
    "pages/my-orders/my-orders.json"
)

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file 存在"
    else
        echo "  ✗ $file 不存在"
        all_exist=false
    fi
done

echo ""

# 检查后端API文件
echo "2. 检查后端文件..."
backend_files=(
    "backend/routes/adminRoutes.js"
    "backend/database/migrations/009_safe_add_order_assignment.sql"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file 存在"
    else
        echo "  ✗ $file 不存在"
        all_exist=false
    fi
done

echo ""

# 检查文档文件
echo "3. 检查文档文件..."
doc_files=(
    "MY_ORDERS_GUIDE.md"
    "MY_ORDERS_QUICKSTART.md"
    "MY_ORDERS_DEMO.md"
    "MY_ORDERS_SUMMARY.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file 存在"
    else
        echo "  ✗ $file 不存在"
        all_exist=false
    fi
done

echo ""

# 检查app.json配置
echo "4. 检查app.json配置..."
if grep -q "pages/my-orders/my-orders" app.json; then
    echo "  ✓ 页面已在app.json中注册"
else
    echo "  ✗ 页面未在app.json中注册"
    all_exist=false
fi

echo ""

# 统计信息
echo "5. 功能统计..."
wxml_lines=$(wc -l < pages/my-orders/my-orders.wxml 2>/dev/null || echo "0")
js_lines=$(wc -l < pages/my-orders/my-orders.js 2>/dev/null || echo "0")
wxss_lines=$(wc -l < pages/my-orders/my-orders.wxss 2>/dev/null || echo "0")

echo "  - my-orders.wxml: $wxml_lines 行"
echo "  - my-orders.js: $js_lines 行"
echo "  - my-orders.wxss: $wxss_lines 行"
echo "  总代码行数: $((wxml_lines + js_lines + wxss_lines))"

echo ""

# 最终结果
echo "=========================================="
if [ "$all_exist" = true ]; then
    echo "✅ 验证通过!所有文件都已创建。"
    echo ""
    echo "下一步:"
    echo "1. 运行数据库迁移: mysql -u username -p repair < backend/database/migrations/009_safe_add_order_assignment.sql"
    echo "2. 启动后端服务: cd backend && npm start"
    echo "3. 在微信开发者工具中预览小程序"
    echo "4. 查看 MY_ORDERS_QUICKSTART.md 了解如何使用"
else
    echo "❌ 验证失败!部分文件缺失。"
fi
echo "=========================================="
