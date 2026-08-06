#!/bin/bash

echo "=== 知识库向量初始化脚本 ==="
echo ""

# 检查Milvus REST服务是否运行
echo "检查Milvus REST服务..."
if ! curl -s http://milvus-rest:8080/health > /dev/null 2>&1; then
    echo "❌ Milvus REST服务未运行"
    echo "请先启动: docker-compose up -d milvus-rest"
    exit 1
fi
echo "✅ Milvus REST服务运行正常"
echo ""

# 切换到web目录
cd /var/www/html

# 执行初始化脚本
echo "执行向量初始化..."
php tests/init-knowledge-base-vector.php

echo ""
echo "=== 脚本执行完成 ==="
