#!/bin/bash

###############################################################################
# CMMS Backend API - 端点测试脚本
# 用于测试所有核心API端点的可用性
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BASE_URL="${API_BASE_URL:-http://localhost:8000/api}"
TOKEN=""
TEST_USER="admin"
TEST_PASS="admin123"

# 统计变量
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# 辅助函数
###############################################################################

print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="${5:-200}"
    local auth_required="${6:-true}"

    ((TOTAL_TESTS++))
    echo ""
    print_info "Testing: $name"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"
    echo "  Expected: $expected_code"

    # 构建curl命令
    local cmd="curl -s -w '\n%{http_code}' -X $method"
    cmd="$cmd '${BASE_URL}${endpoint}'"
    cmd="$cmd -H 'Content-Type: application/json'"

    if [ "$auth_required" = "true" ] && [ -n "$TOKEN" ]; then
        cmd="$cmd -H 'Authorization: Bearer ${TOKEN}'"
    fi

    if [ -n "$data" ]; then
        cmd="$cmd -d '${data}'"
    fi

    # 执行请求
    response=$(eval "$cmd")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        print_success "$name - HTTP $http_code"
        echo "  Response: $(echo "$body" | head -c 100)..."
    else
        print_error "$name - Got $http_code, expected $expected_code"
        echo "  Response: $body"
    fi
}

###############################################################################
# 测试流程
###############################################################################

print_header "CMMS API 端点测试"

# 检查服务是否运行
echo ""
print_info "检查服务状态..."
if ! curl -s -f "${BASE_URL%/api}/test" > /dev/null 2>&1; then
    print_error "服务未运行，请先启动服务"
    echo "  提示: 使用 'php think run' 或 Docker 启动服务"
    exit 1
fi
print_success "服务正在运行"

###############################################################################
# 1. 认证测试
###############################################################################
print_header "1. 认证端点测试"

# 登录获取token
print_info "登录获取访问令牌..."
login_response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${TEST_USER}\",\"password\":\"${TEST_PASS}\"}")

TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    print_success "登录成功"
    echo "  Token: ${TOKEN:0:20}..."
else
    print_error "登录失败"
    echo "  Response: $login_response"
    exit 1
fi

# 测试认证端点
test_endpoint "获取用户信息" "GET" "/auth/profile" "" "200"
test_endpoint "刷新令牌" "POST" "/auth/refresh" "" "200"

###############################################################################
# 2. 用户管理测试
###############################################################################
print_header "2. 用户管理测试"

test_endpoint "获取用户列表" "GET" "/users" "" "200"
test_endpoint "获取当前用户详情" "GET" "/users/1" "" "200"

###############################################################################
# 3. 部门管理测试
###############################################################################
print_header "3. 部门管理测试"

test_endpoint "获取部门列表" "GET" "/departments" "" "200"

###############################################################################
# 4. 设备管理测试
###############################################################################
print_header "4. 设备管理测试"

test_endpoint "获取设备列表" "GET" "/devices" "" "200"
test_endpoint "获取设备分类" "GET" "/devices/categories" "" "200"

###############################################################################
# 5. 工单管理测试
###############################################################################
print_header "5. 工单管理测试"

test_endpoint "获取工单列表" "GET" "/workorders" "" "200"
test_endpoint "获取我的工单" "GET" "/workorders/my" "" "200"
test_endpoint "获取工单统计" "GET" "/workorders/statistics" "" "200"

###############################################################################
# 6. 维修人员测试
###############################################################################
print_header "6. 维修人员测试"

test_endpoint "获取维修人员列表" "GET" "/engineers" "" "200"
test_endpoint "获取可用维修人员" "GET" "/engineers/available" "" "200"

###############################################################################
# 7. 排班管理测试
###############################################################################
print_header "7. 排班管理测试"

test_endpoint "获取排班列表" "GET" "/schedules" "" "200"
test_endpoint "获取排班总览" "GET" "/schedules/overview" "" "200"

###############################################################################
# 8. 巡检管理测试
###############################################################################
print_header "8. 巡检管理测试"

test_endpoint "获取巡检任务列表" "GET" "/inspections" "" "200"
test_endpoint "获取过期巡检" "GET" "/inspections/overdue" "" "200"
test_endpoint "获取巡检统计" "GET" "/inspections/statistics" "" "200"

###############################################################################
# 9. 保养管理测试
###############################################################################
print_header "9. 保养管理测试"

test_endpoint "获取保养计划列表" "GET" "/maintenance/plans" "" "200"
test_endpoint "获取到期保养" "GET" "/maintenance/due" "" "200"
test_endpoint "获取保养统计" "GET" "/maintenance/statistics" "" "200"

###############################################################################
# 10. 配件管理测试
###############################################################################
print_header "10. 配件管理测试"

test_endpoint "获取配件列表" "GET" "/parts" "" "200"
test_endpoint "获取库存预警" "GET" "/parts/alerts" "" "200"
test_endpoint "获取配件统计" "GET" "/parts/statistics" "" "200"

###############################################################################
# 11. 供应商管理测试
###############################################################################
print_header "11. 供应商管理测试"

test_endpoint "获取供应商列表" "GET" "/suppliers" "" "200"
test_endpoint "获取供应商统计" "GET" "/suppliers/statistics" "" "200"

###############################################################################
# 12. 知识库测试
###############################################################################
print_header "12. 知识库测试"

test_endpoint "获取知识库列表" "GET" "/knowledge" "" "200"
test_endpoint "搜索知识库" "GET" "/knowledge/search?keyword=test" "" "200"
test_endpoint "获取热门文章" "GET" "/knowledge/hot" "" "200"

###############################################################################
# 13. 成本分析测试
###############################################################################
print_header "13. 成本分析测试"

test_endpoint "成本总览" "GET" "/costs/overview" "" "200"
test_endpoint "成本趋势" "GET" "/costs/trend" "" "200"
test_endpoint "设备成本排名" "GET" "/costs/top-devices" "" "200"

###############################################################################
# 14. 报表中心测试
###############################################################################
print_header "14. 报表中心测试"

test_endpoint "获取报表类型" "GET" "/reports/types" "" "200"
test_endpoint "设备报表" "GET" "/reports/device" "" "200"
test_endpoint "维修报表" "GET" "/reports/maintenance" "" "200"

###############################################################################
# 15. 通知中心测试
###############################################################################
print_header "15. 通知中心测试"

test_endpoint "获取通知列表" "GET" "/notifications" "" "200"
test_endpoint "获取未读数量" "GET" "/notifications/unread-count" "" "200"
test_endpoint "获取通知统计" "GET" "/notifications/statistics" "" "200"

###############################################################################
# 测试总结
###############################################################################
print_header "测试总结"

echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    print_success "所有测试通过！"
    exit 0
else
    echo ""
    print_error "部分测试失败，请检查"
    exit 1
fi
