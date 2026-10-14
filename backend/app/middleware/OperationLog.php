<?php

namespace app\middleware;

use app\model\SystemLog;
use app\model\Notification;
use app\service\NotificationService;
use app\service\PermissionService;
use think\facade\Db;

/**
 * 操作日志中间件 - 自动记录用户操作
 */
class OperationLog
{
    /** @var array|null 本次请求的精确通知（业务代码设置，中间件读取后广播并清空） */
    private static $pendingNotify = null;

    /** 业务代码调用：设置本次请求的精确消息通知（含单号/设备/评分等），优先级高于通用文案 */
    public static function setNotify(array $notify): void
    {
        self::$pendingNotify = $notify;
    }

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
        'performance' => '维修绩效',
        'work-orders' => '维修工单',
        'work-order'  => '维修工单',
        'score-rules' => '评分规则',
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

        // 登录/退出
        if (strpos($path, 'auth/login') !== false) return '登录系统';
        if (strpos($path, 'auth/logout') !== false) return '退出系统';

        // 维修工单领域动作（限定在工单路径内，避免误伤 order-reviews 等）
        if (strpos($path, 'work-order') !== false) {
            if (strpos($path, 'deliver') !== false) return '交付';
            if (strpos($path, 'review') !== false) return '验收';
            if (strpos($path, 'accept') !== false) return '接单';
        }

        // 其它按路径关键字的动作（早于通用 CRUD 判定）
        $keywordActions = [
            'export-pdf'     => '导出PDF',
            'batch-delete'   => '批量删除',
            'reset-password' => '重置密码',
            'refresh-cache'  => '刷新缓存',
            'mark-all-read'  => '全部已读',
            'mark-read'      => '标记已读',
            'export'         => '导出',
            'import'         => '导入',
            'reprocess'      => '重新处理',
            'upload'         => '上传',
            'activate'       => '激活',
            'terminate'      => '终止',
            'refund'         => '退款',
            'confirm'        => '确认',
            'cancel'         => '取消',
            'issue'          => '开票',
            'void'           => '作废',
            'copy'           => '复制',
            'preview'        => '预览',
            'clear'          => '清空',
        ];
        foreach ($keywordActions as $kw => $verb) {
            if (strpos($path, $kw) !== false) return $verb;
        }

        // 通用 CRUD
        if ($method === 'POST' && !$id && strpos($path, 'batch') === false && strpos($path, 'login') === false) {
            return '新增';
        }
        if ($method === 'PUT' || ($method === 'POST' && $id)) return '编辑';
        if ($method === 'DELETE') return '删除';

        return $method;
    }

    public function handle($request, \Closure $next)
    {
        self::$pendingNotify = null; // 防御：清理可能残留的静态值，保证每请求独立
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

            // 获取模块名（取路径中最具体的匹配段，如 performance/work-orders → 维修工单）
            $module = '系统';
            $pathParts = explode('/', $path);
            foreach ($pathParts as $part) {
                if (isset(self::$moduleMap[$part])) {
                    $module = self::$moduleMap[$part];
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

            // 仅在操作成功时生成消息通知（失败的 4xx 只留审计日志，不广播，减少噪音）
            if ($statusCode < 300) {
                $this->createNotificationForOperation($request, $module, $action, $operator, $path, $id, $userId);
            }
        } catch (\Throwable $e) {
            // 日志记录失败不影响主流程
            \think\facade\Log::warning('操作日志记录失败: ' . $e->getMessage());
        }

        return $response;
    }

    /**
     * 根据操作信息生成消息通知，广播给所有后台用户。
     * 优先使用业务代码通过 request()->notify 提供的精确通知（含单号/设备/评分等）；
     * 否则从请求参数提取对象名称，生成“谁 对 哪个对象 做了什么”的具体文案。
     */
    private function createNotificationForOperation($request, $module, $action, $operator, $path, $id, $actorUserId)
    {
        // 通知自身、认证、系统日志等模块不生成通知，避免递归与噪音
        if (strpos($path, 'notifications') !== false
            || strpos($path, 'auth') !== false
            || strpos($path, 'system-logs') !== false) {
            return;
        }

        // 关联类型取路径中最具体的匹配段（与模块名一致）
        $relatedType = '';
        $pathParts = explode('/', $path);
        foreach ($pathParts as $part) {
            if (isset(self::$moduleMap[$part])) {
                $relatedType = $part;
            }
        }

        // 通知类型归类（用于前端图标展示）
        $typeMap = [
            'repair-orders'      => 'order',
            'workorders'         => 'order',
            'work-order'         => 'order',
            'work-orders'        => 'order',
            'performance'        => 'order',
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

        // 业务精确通知优先（控制器通过 OperationLog::setNotify 设置）
        $custom = self::$pendingNotify;
        if (is_array($custom) && !empty($custom['content'])) {
            $title       = (string)($custom['title'] ?? "{$module} {$action}");
            $content     = (string)$custom['content'];
            $type        = (string)($custom['type'] ?? $type);
            $relatedType = $custom['related_type'] ?? ($relatedType ?: null);
            $relatedId   = $custom['related_id'] ?? ($id !== '' ? intval($id) : null);
        } else {
            // 兜底：提取对象名称，让通知具体到“哪一个”
            $subject  = $this->extractSubject($request);
            $title    = "{$module} {$action}";
            $content  = "{$operator} {$action}了{$module}";
            if ($subject !== '') {
                $content .= "「{$subject}」";
            }
            if ($id !== '') {
                $content .= "（ID: {$id}）";
            }
            $relatedId = $id !== '' ? intval($id) : null;
        }

        try {
            // 按权限投递：只发给“能看到该模块”的用户（老板/超管始终收到），并排除操作者本人，
            // 避免“全员可见全部通知”。无对应权限码的未知模块默认仅老板可见。
            $requiredCode = $this->requiredViewCode($relatedType);
            $userIds = $this->audienceUserIds($requiredCode, $actorUserId);
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
                $relatedId,
                Notification::PRIORITY_NORMAL,
                ['module' => $module, 'action' => $action, 'operator' => $operator]
            );
        } catch (\Throwable $e) {
            \think\facade\Log::warning('操作通知生成失败: ' . $e->getMessage());
        }
    }

    /**
     * 从请求参数中提取一个可读的“对象名称”，让兜底通知具体到条目（如故障描述/名称/单号）
     */
    private function extractSubject($request): string
    {
        $params = [];
        if (is_object($request) && method_exists($request, 'post')) {
            $params = $request->post();
        }
        if (empty($params)) {
            return '';
        }
        $keys = ['order_no', 'name', 'title', 'subject', 'device_name', 'file_name', 'filename',
                 'fault_desc', 'real_name', 'engineer_name', 'company_name', 'remark'];
        foreach ($keys as $k) {
            if (!empty($params[$k]) && is_scalar($params[$k])) {
                $s = trim((string)$params[$k]);
                if ($s !== '' && $s !== '***') {
                    return mb_substr($s, 0, 40);
                }
            }
        }
        return '';
    }

    /**
     * 通知关联模块 → 查看所需权限码（.view）。用于按权限投递：
     * 只有“能查看该模块”的用户才收到对应通知；老板/超管始终收到。
     * 未纳入映射的未知模块返回 null（仅老板可见），避免又变成全员广播。
     */
    private function requiredViewCode($relatedType)
    {
        if (empty($relatedType)) {
            return null;
        }
        // 未在 route_map 或需明确的模块
        $override = [
            'performance' => 'performance.view',
            'work-orders' => 'performance.view',
            'work-order'  => 'performance.view',
            // 知识库无独立权限码，按“维修业务人员”(工人/老板/人事 均持 performance.view) 投递
            'knowledge'   => 'performance.view',
            'kb'          => 'performance.view',
            'parts'       => 'inventory.parts.view',
        ];
        if (isset($override[$relatedType])) {
            return $override[$relatedType];
        }
        $routeMap = (array) config('permission.route_map');
        if (isset($routeMap[$relatedType])) {
            return $routeMap[$relatedType] . '.view';
        }
        return null;
    }

    /**
     * 解析通知受众：老板/超管（始终）+ 持有 $requiredCode 权限的用户；排除操作者本人。
     * 权限判定复用 PermissionService（role_id + user_roles 多角色、通配符/祖先匹配），与接口鉴权一致。
     */
    private function audienceUserIds($requiredCode, $excludeUserId = 0)
    {
        $users = Db::name('users')->field('id, role_type, role_id')->select()->toArray();
        if (empty($users)) {
            return [];
        }

        // 用户 → 角色 id 集合（主角色 + user_roles 多角色）
        $userRoleIds = [];
        foreach ($users as $u) {
            $rids = [];
            if (!empty($u['role_id'])) {
                $rids[] = (int) $u['role_id'];
            }
            $userRoleIds[(int) $u['id']] = $rids;
        }
        foreach (Db::name('user_roles')->field('user_id, role_id')->select()->toArray() as $ur) {
            $userRoleIds[(int) $ur['user_id']][] = (int) $ur['role_id'];
        }

        // 角色 → 授权码
        $roleCodes = [];
        $rows = Db::name('role_permissions')->alias('rp')
            ->join('permissions p', 'p.id = rp.permission_id')
            ->where('p.status', 1)
            ->field('rp.role_id, p.code')
            ->select()->toArray();
        foreach ($rows as $r) {
            $roleCodes[(int) $r['role_id']][] = $r['code'];
        }
        $roleCodeById = Db::name('roles')->column('code', 'id'); // id => code

        $ids = [];
        foreach ($users as $u) {
            $uid = (int) $u['id'];
            if ($excludeUserId && $uid === (int) $excludeUserId) {
                continue; // 不通知操作者本人（前端已有操作成功提示）
            }
            // 老板/超管始终收到
            $isBoss = ((int) ($u['role_type'] ?? 0) === 1)
                || in_array($uid, [1, 2], true)
                || in_array($roleCodeById[(int) ($u['role_id'] ?? 0)] ?? '', ['admin', 'boss', 'super_admin'], true);
            if ($isBoss) {
                $ids[] = $uid;
                continue;
            }
            if ($requiredCode === null) {
                continue; // 未知/仅老板模块：非老板不投递
            }
            $codes = [];
            foreach (array_unique($userRoleIds[$uid] ?? []) as $rid) {
                foreach ($roleCodes[$rid] ?? [] as $c) {
                    $codes[] = $c;
                }
            }
            if (!empty($codes) && PermissionService::match($codes, $requiredCode)) {
                $ids[] = $uid;
            }
        }
        return array_values(array_unique($ids));
    }
}