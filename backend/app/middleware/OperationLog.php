<?php

namespace app\middleware;

use app\model\SystemLog;
use app\model\Notification;
use app\service\NotificationService;
use think\facade\Db;

/**
 * 操作日志中间件 - 自动记录用户操作
 */
class OperationLog
{
    // URL路径 → 模块名称映射
    private static $moduleMap = [
        'auth'        => '系统',
        'users'       => '用户管理',
        'roles'       => '角色管理',
        'permissions' => '权限管理',
        'personnel'   => '人员管理',
        'departments' => '部门管理',
        'organizations' => '单位管理',
        'bindings'    => '绑定管理',
        'system-params' => '系统参数',
        'system-logs' => '日志管理',
        'contract-templates' => '合同模板',
        'repair-contracts'   => '合同管理',
        'workorders'  => '工单管理',
        'engineers'   => '维修人员',
        'schedules'   => '排班管理',
        'inspections' => '巡检管理',
        'repair-orders' => '维修订单',
        'external-repairs' => '联动维修',
        'repair-progress' => '维修进度',
        'progress-apply'  => '进度申请',
        'progress-photo'  => '进度照片',
        'progress-video'  => '进度视频',
        'devices'     => '设备管理',
        'parts'       => '配件管理',
        'suppliers'   => '供应商管理',
        'knowledge'   => '知识库',
        'kb'          => '知识库',
        'repair-categories' => '机械分类',
        'repair-machines'   => '机械名称',
        'common-problems'   => '常见问题',
        'quotation-orders'  => '报价单',
        'repair-reports'    => '维修报告',
        'test-reports'      => '检测报告',
        'repair-reminders'  => '维修提醒',
        'agreement'         => '免责协议',
        'costs'             => '成本分析',
        'marketing'         => '营销模块',
        'notifications' => '通知管理',
        'payment'     => '支付模块',
        'transfers'   => '转账支付',
        'invoices'    => '发票管理',
        'statistics'  => '查询统计',
        'repair-reminders' => '维修提醒',
        'maintenance' => '保养管理',
        'quotation-orders' => '报价单',
        'reports'     => '报表中心',
        'marketing'   => '营销模块',
        'costs'       => '成本分析',
        'test-reports' => '检测报告',
        'repair-reports' => '维修报告',
        'repair-categories' => '机械分类',
        'repair-machines'   => '机械名称',
    ];

    // HTTP方法 + 路径 → 操作描述
    private static function getAction($method, $path, $id)
    {
        $method = strtoupper($method);

        // 特殊路径
        if (strpos($path, 'auth/login') !== false) return '登录系统';
        if (strpos($path, 'auth/logout') !== false) return '退出系统';

        // 标准 CRUD
        if ($method === 'POST' && !$id && strpos($path, 'batch') === false && strpos($path, 'login') === false) {
            return '新增';
        }
        if ($method === 'PUT' || ($method === 'POST' && $id)) return '编辑';
        if ($method === 'DELETE') return '删除';

        // 特殊操作
        if (strpos($path, 'export') !== false) return '导出';
        if (strpos($path, 'import') !== false) return '导入';
        if (strpos($path, 'batch-delete') !== false) return '批量删除';
        if (strpos($path, 'reset-password') !== false) return '重置密码';
        if (strpos($path, 'activate') !== false) return '激活';
        if (strpos($path, 'terminate') !== false) return '终止';
        if (strpos($path, 'refresh-cache') !== false) return '刷新缓存';
        if (strpos($path, 'copy') !== false) return '复制';
        if (strpos($path, 'preview') !== false) return '预览';
        if (strpos($path, 'export-pdf') !== false) return '导出PDF';
        if (strpos($path, 'clear') !== false) return '清空';
        if (strpos($path, 'mark-all-read') !== false) return '全部已读';
        if (strpos($path, 'mark-read') !== false) return '标记已读';

        // 支付相关
        if (strpos($path, 'refund') !== false) return '退款';
        if (strpos($path, 'confirm') !== false) return '确认';
        if (strpos($path, 'cancel') !== false) return '取消';
        if (strpos($path, 'issue') !== false) return '开票';
        if (strpos($path, 'void') !== false) return '作废';

        return $method;
    }

    public function handle($request, \Closure $next)
    {
        // 放行 GET 请求（列表/详情查询不记录日志）
        if (strtoupper($request->method()) === 'GET') {
            return $next($request);
        }

        // 记录请求开始时的数据
        $startTime = microtime(true);

        $response = $next($request);

        try {
            // 只记录 2xx 和 4xx 的响应
            $statusCode = $response->getCode();
            if ($statusCode < 200 || $statusCode >= 500) {
                return $response;
            }

            $path = $request->pathinfo();
            $method = $request->method();

            // 获取模块名
            $module = '系统';
            $pathParts = explode('/', $path);
            foreach ($pathParts as $part) {
                if (isset(self::$moduleMap[$part])) {
                    $module = self::$moduleMap[$part];
                    break;
                }
            }

            // 提取 ID（如果有）
            $id = '';
            foreach ($pathParts as $i => $part) {
                if (is_numeric($part)) {
                    $id = $part;
                }
            }

            // 获取操作描述
            $action = self::getAction($method, $path, $id);

            // 登录操作特殊处理
            $logType = (strpos($path, 'auth/login') !== false) ? 'login' : 'operation';

            // 用户信息
            $userId = $request->userId ?? 0;
            $user = $request->user ?? [];
            $operator = $user['real_name'] ?? $user['username'] ?? '未知用户';

            // 记录操作参数（排除敏感字段）
            $params = $request->post();
            // 过滤密码等敏感信息
            $sensitiveKeys = ['password', 'password_confirm', 'old_password', 'new_password', 'token', 'access_token'];
            foreach ($sensitiveKeys as $key) {
                if (isset($params[$key])) {
                    $params[$key] = '***';
                }
            }

            // 响应结果描述
            $resultStr = ($statusCode < 300) ? '操作成功' : '操作失败';

            // 写入日志
            SystemLog::create([
                'log_type' => $logType,
                'user_id'  => $userId,
                'operator' => $operator,
                'module'   => $module,
                'action'   => $action,
                'ip'       => $request->ip(),
                'params'   => !empty($params) ? json_encode($params, JSON_UNESCAPED_UNICODE) : null,
                'result'   => $resultStr,
            ]);

            // 同步生成消息通知（覆盖：订单的添加改变、知识库文件上传、各种信息的修改等）
            $this->createNotificationForOperation($module, $action, $operator, $path, $id, $userId);
        } catch (\Throwable $e) {
            // 日志记录失败不影响主流程
            \think\facade\Log::warning('操作日志记录失败: ' . $e->getMessage());
        }

        return $response;
    }

    /**
     * 根据操作信息生成消息通知，广播给所有后台用户
     * 覆盖需求：订单的添加改变、知识库文件的上传、以及各类信息的修改
     */
    private function createNotificationForOperation($module, $action, $operator, $path, $id, $actorUserId)
    {
        // 通知自身、认证、系统日志等模块不生成通知，避免递归与噪音
        if (strpos($path, 'notifications') !== false
            || strpos($path, 'auth') !== false
            || strpos($path, 'system-logs') !== false) {
            return;
        }

        // 关联类型取路径中第一个匹配 moduleMap 的模块关键字
        $relatedType = '';
        $pathParts = explode('/', $path);
        foreach ($pathParts as $part) {
            if (isset(self::$moduleMap[$part])) {
                $relatedType = $part;
                break;
            }
        }

        // 通知类型归类（用于前端图标展示）
        $typeMap = [
            'repair-orders'      => 'order',
            'workorders'         => 'order',
            'knowledge'          => 'knowledge',
            'kb'                 => 'knowledge',
            'devices'            => 'device',
            'parts'              => 'stock',
            'repair-contracts'   => 'contract',
            'contract-templates' => 'contract',
            'external-repairs'   => 'repair',
            'maintenance'        => 'maintenance',
            'inspections'        => 'inspection',
        ];
        $type = $typeMap[$relatedType] ?? 'system';

        $title = "{$module} {$action}";
        $content = "{$operator} {$action}了{$module}" . ($id !== '' ? "（ID: {$id}）" : '');

        try {
            $userIds = Db::name('users')->column('id');
            if (empty($userIds)) {
                return;
            }

            $service = new NotificationService();
            $service->createBatch(
                $userIds,
                $type,
                $title,
                $content,
                $relatedType ?: null,
                $id !== '' ? intval($id) : null,
                Notification::PRIORITY_NORMAL,
                ['module' => $module, 'action' => $action, 'operator' => $operator]
            );
        } catch (\Throwable $e) {
            \think\facade\Log::warning('操作通知生成失败: ' . $e->getMessage());
        }
    }
}