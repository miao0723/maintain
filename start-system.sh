#!/bin/bash

###############################################################################
# CMMS 系统启动和诊断脚本
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CMMS 系统启动和诊断${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Docker 是否运行
echo -e "${YELLOW}1. 检查 Docker 容器状态...${NC}"
cd "$(dirname "$0")/docker"
docker-compose ps
echo ""

# 重启所有服务
echo -e "${YELLOW}2. 重启所有服务...${NC}"
docker-compose restart
echo ""

# 等待服务启动
echo -e "${YELLOW}3. 等待服务启动 (10秒)...${NC}"
sleep 10
echo ""

# 检查容器日志
echo -e "${YELLOW}4. 检查容器日志...${NC}"
echo -e "${GREEN}=== Nginx 日志 ===${NC}"
docker-compose logs nginx --tail=5
echo ""
echo -e "${GREEN}=== PHP-FPM 日志 ===${NC}"
docker-compose logs php --tail=5
echo ""
echo -e "${GREEN}=== MySQL 日志 ===${NC}"
docker-compose logs mysql --tail=5
echo ""

# 测试根路径
echo -e "${YELLOW}5. 测试根路径...${NC}"
curl -s http://localhost/ | python -m json.tool
echo ""

# 测试登录 API
echo -e "${YELLOW}6. 测试登录 API...${NC}"
echo -e "POST http://localhost/api/auth/login"
echo "Body: {\"username\":\"admin\",\"password\":\"admin123\"}"
echo ""
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  > /tmp/api_response.json

if [ -s /tmp/api_response.json ]; then
    echo "Response:"
    cat /tmp/api_response.json | python -m json.tool 2>&1 || cat /tmp/api_response.json
else
    echo -e "${RED}请求失败，查看详细错误：${NC}"
    curl -v -X POST http://localhost/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}' 2>&1 | tail -50
fi
echo ""

# 检查数据库连接
echo -e "${YELLOW}7. 检查数据库连接...${NC}"
docker exec docker-mysql-1 mysql -u root -proot123 -e "SELECT 1" 2>&1 | grep -v "Warning" && echo -e "${GREEN}✅ 数据库连接正常${NC}" || echo -e "${RED}❌ 数据库连接失败${NC}"
echo ""

# 检查用户数据
echo -e "${YELLOW}8. 检查默认用户...${NC}"
docker exec docker-mysql-1 mysql -u root -proot123 cmms_db -e "SELECT id, username, real_name, role_type, status FROM users LIMIT 5;" 2>&1 | grep -v "Warning"
echo ""

# 检查数据库表
echo -e "${YELLOW}9. 检查数据库表...${NC}"
TABLE_COUNT=$(docker exec docker-mysql-1 mysql -u root -proot123 cmms_db -e "SHOW TABLES;" 2>&1 | grep -v "Warning" | wc -l)
echo -e "数据库表总数: ${GREEN}$TABLE_COUNT${NC}"
echo ""

# 显示访问信息
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 系统启动完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "📱 访问地址："
echo -e "  - 前端: ${GREEN}http://localhost${NC}"
echo -e "  - API:  ${GREEN}http://localhost/api${NC}"
echo ""
echo -e "🔑 默认登录："
echo -e "  - 用户名: ${GREEN}admin${NC}"
echo -e "  - 密码:   ${GREEN}admin123${NC}"
echo ""
echo -e "📚 文档："
echo -e "  - API参考: ${YELLOW}backend/docs/API-REFERENCE.md${NC}"
echo -e "  - 测试指南: ${YELLOW}backend/docs/TESTING-README.md${NC}"
echo ""
echo -e "🐳 Docker命令："
echo -e "  - 查看日志: ${YELLOW}docker-compose logs -f [service]${NC}"
echo -e "  - 停止服务: ${YELLOW}docker-compose stop${NC}"
echo -e "  - 重启服务: ${YELLOW}docker-compose restart${NC}"
echo ""
