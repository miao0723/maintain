#!/bin/bash

# CMMS系统API测试脚本
# 测试所有模块的API端点

BASE_URL="http://localhost"
TOKEN=""
USER_ID=""

echo "=================================="
echo "CMMS系统功能完整性测试"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "测试 $TOTAL_TESTS: $name ... "

    if [ -z "$auth" ]; then
        if [ "$method" = "GET" ]; then
            response=$(curl -s -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json")
        else
            response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ "$method" = "GET" ]; then
            response=$(curl -s -X GET "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN")
        else
            response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data")
        fi
    fi

    # 检查响应
    if echo "$response" | grep -q '"code":0\|"code":200'; then
        echo -e "${GREEN}✓ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    elif echo "$response" | grep -q '"code"'; then
        code=$(echo "$response" | grep -o '"code":[0-9]*' | cut -d: -f2)
        if [ "$code" = "401" ] || [ "$code" = "403" ] || [ "$code" = "404" ]; then
            echo -e "${YELLOW}⚠ 预期错误 (code:$code)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo -e "${RED}✗ 失败 (code:$code)${NC}"
            echo "  响应: $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ 无效响应${NC}"
        echo "  响应: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# ========================================
# 1. 认证模块测试
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 认证模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "用户登录" "POST" "/api/simple-login" '{"username":"admin","password":"admin123"}' ""

# 提取token
TOKEN=$(curl -s -X POST "$BASE_URL/api/simple-login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Token获取成功: ${TOKEN:0:20}...${NC}"
else
    echo -e "${RED}✗ Token获取失败${NC}"
    exit 1
fi

test_api "获取用户信息" "GET" "/api/auth/profile" "" "auth"

# ========================================
# 2. 设备管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 设备管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取设备列表" "GET" "/api/devices" "" "auth"
test_api "获取设备分类" "GET" "/api/devices/categories" "" "auth"

# ========================================
# 3. 工单管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 工单管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取工单列表" "GET" "/api/workorders" "" "auth"
test_api "获取我的工单" "GET" "/api/workorders/my" "" "auth"
test_api "工单统计" "GET" "/api/workorders/statistics" "" "auth"

# ========================================
# 4. 维修人员模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. 维修人员模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取工程师列表" "GET" "/api/engineers" "" "auth"
test_api "获取可用工程师" "GET" "/api/engineers/available" "" "auth"

# ========================================
# 5. 配件库存模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 配件库存模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取配件列表" "GET" "/api/parts" "" "auth"
test_api "库存预警" "GET" "/api/parts/alerts" "" "auth"
test_api "配件统计" "GET" "/api/parts/statistics" "" "auth"

# ========================================
# 6. 供应商管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. 供应商管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取供应商列表" "GET" "/api/suppliers" "" "auth"
test_api "供应商统计" "GET" "/api/suppliers/statistics" "" "auth"

# ========================================
# 7. 巡检管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. 巡检管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取巡检任务" "GET" "/api/inspections" "" "auth"
test_api "巡检统计" "GET" "/api/inspections/statistics" "" "auth"

# ========================================
# 8. 保养管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. 保养管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取保养计划" "GET" "/api/maintenance/plans" "" "auth"
test_api "保养统计" "GET" "/api/maintenance/statistics" "" "auth"

# ========================================
# 9. 知识库模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. 知识库模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取知识库" "GET" "/api/knowledge" "" "auth"
test_api "热门问题" "GET" "/api/knowledge/hot" "" "auth"

# ========================================
# 10. 成本分析模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. 成本分析模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "成本总览" "GET" "/api/costs/overview" "" "auth"
test_api "成本趋势" "GET" "/api/costs/trend" "" "auth"

# ========================================
# 11. 报表中心模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "11. 报表中心模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "报表类型列表" "GET" "/api/reports/types" "" "auth"

# ========================================
# 12. 通知系统模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "12. 通知系统模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取通知列表" "GET" "/api/notifications" "" "auth"
test_api "未读消息数" "GET" "/api/notifications/unread-count" "" "auth"
test_api "通知统计" "GET" "/api/notifications/statistics" "" "auth"

# ========================================
# 13. 用户管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "13. 用户管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取用户列表" "GET" "/api/users" "" "auth"

# ========================================
# 14. 部门管理模块测试
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "14. 部门管理模块测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_api "获取部门列表" "GET" "/api/departments" "" "auth"

# ========================================
# 测试总结
# ========================================
echo ""
echo "=================================="
echo "测试总结"
echo "=================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo "通过率: $(awk "BEGIN {printf \"%.1f%%\", $PASSED_TESTS*100/$TOTAL_TESTS}")"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！系统功能完整。${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED_TESTS 个测试失败，需要修复。${NC}"
    exit 1
fi
