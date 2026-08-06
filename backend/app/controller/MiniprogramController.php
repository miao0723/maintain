<?php

namespace app\controller;

use app\model\User;
use app\model\Order;
use app\model\Notification;
use app\service\NotificationService;
use think\facade\Db;
use app\common\Result;

/**
 * 小程序专用控制器
 * 为电子维修2.0小程序提供API接口
 */
class MiniprogramController
{
    /**
     * 小程序登录（兼容格式）
     * POST /api/miniprogram/login
     */
    public function login()
    {
        $data = request()->post();

        // 验证输入
        if (empty($data['code'])) {
            return Result::error('缺少code参数', 400);
        }

        // 这里应该是微信登录验证
        // 暂时简化处理：如果有username/password则使用普通登录
        if (!empty($data['username']) && !empty($data['password'])) {
            $user = User::where('username', $data['username'])->find();

            if (!$user || !password_verify($data['password'], $user->password)) {
                return Result::error('用户名或密码错误', 401);
            }

            // 生成token
            $token = \app\service\JwtService::createAccessToken($user->id, $user->role_type ?? 1);
            $refreshToken = \app\service\JwtService::createRefreshToken($user->id);

            // 角色映射：将整数role_type映射为字符串role（小程序期望的格式）
            $roleMap = [
                1 => 'super_admin',  // 管理员
                2 => 'admin',        // 部门管理
                3 => 'engineer',     // 工程师
                4 => 'user'          // 普通用户
            ];
            $role = $roleMap[$user->role_type] ?? 'user';

            return Result::success([
                'token' => $token,
                'access_token' => $token,
                'refresh_token' => $refreshToken,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'real_name' => $user->real_name,
                    'nickname' => $user->real_name,  // 小程序期望的昵称字段
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar ?? '',
                    'phone' => $user->phone,
                    'role' => $role,                 // 小程序期望的role字符串
                    'role_type' => $user->role_type ?? 1
                ]
            ], '登录成功');
        }

        // 微信code登录（需要实现微信登录逻辑）
        // 这里暂时返回错误，需要完善
        return Result::error('微信登录功能待完善，请使用username/password登录', 400);
    }

    /**
     * 获取用户信息
     * GET /api/miniprogram/user/info
     */
    public function getUserInfo()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $user = User::find($userId);
        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        // 角色映射：将整数role_type映射为字符串role（小程序期望的格式）
        $roleMap = [
            1 => 'super_admin',  // 管理员
            2 => 'admin',        // 部门管理
            3 => 'engineer',     // 工程师
            4 => 'user'          // 普通用户
        ];
        $role = $roleMap[$user->role_type] ?? 'user';

        return Result::success([
            'id' => $user->id,
            'username' => $user->username,
            'real_name' => $user->real_name,
            'nickname' => $user->real_name,  // 小程序期望的昵称字段
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar ?? '',
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $role,                 // 小程序期望的role字符串
            'role_type' => $user->role_type ?? 1,
            'department_id' => $user->department_id
        ]);
    }

    /**
     * 获取地址列表
     * GET /api/miniprogram/addresses
     */
    public function getAddresses()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 从用户表或其他地址表获取地址
        // 这里暂时返回空数组，需要根据实际数据库结构调整
        return Result::success([], '获取成功');
    }

    /**
     * 创建地址
     * POST /api/miniprogram/addresses
     */
    public function createAddress()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 验证必填字段
        if (empty($data['contact_name']) || empty($data['contact_phone']) || empty($data['detail'])) {
            return Result::error('缺少必填字段', 400);
        }

        // 这里需要根据实际数据库表结构来存储地址
        // 暂时返回成功

        return Result::success([
            'id' => time(),
            'contact_name' => $data['contact_name'],
            'contact_phone' => $data['contact_phone'],
            'province' => $data['province'] ?? '',
            'city' => $data['city'] ?? '',
            'district' => $data['district'] ?? '',
            'detail' => $data['detail'],
            'is_default' => 0
        ], '地址创建成功');
    }

    /**
     * 创建维修订单
     * POST /api/miniprogram/orders/create
     */
    public function createOrder()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 兼容 JSON 与表单请求体：先读取原始输入（避免 post() 提前消费 php://input）
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $data = request()->post();
        }

        // 验证必填字段
        if (empty($data['device_type']) || empty($data['problem'])) {
            return Result::error('缺少必填字段', 400);
        }

        // 生成订单号
        $orderNo = 'ORD' . date('YmdHis') . rand(1000, 9999);

        // 创建订单数据
        $orderData = [
            'order_no' => $orderNo,
            'user_id' => $userId,
            'order_type' => $data['order_type'] ?? 'repair',
            'device_type_id' => $data['device_type'],
            'problem_description' => $data['problem'],
            'custom_description' => $data['description'] ?? '',
            'images' => $data['images'] ?? [],
            'service_type' => $data['service_type'] ?? 'shop',
            'estimated_price' => $data['estimated_price'] ?? 0,
            'status' => 'pending',
            'progress' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

        // 保存到数据库
        // 这里需要根据实际的订单表结构来保存
        // 暂时返回成功

        // 生成消息通知：通知所有后台用户有新维修订单
        try {
            $userIds = Db::name('users')->column('id');
            if (!empty($userIds)) {
                $notifyService = new NotificationService();
                $notifyService->createBatch(
                    $userIds,
                    'order',
                    '新的维修订单',
                    "用户（ID: {$userId}）提交了新维修订单 {$orderNo}",
                    'repair-orders',
                    null,
                    Notification::PRIORITY_HIGH,
                    ['order_no' => $orderNo]
                );
            }
        } catch (\Throwable $e) {
            // 通知生成失败不影响下单主流程
        }

        return Result::success([
            'order_id' => $orderNo,
            'order_no' => $orderNo,
            'estimated_price' => $orderData['estimated_price']
        ], '订单创建成功');
    }

    /**
     * 获取用户订单列表
     * GET /api/miniprogram/orders/user/:userId
     */
    public function getUserOrders($userId)
    {
        if (!$userId) {
            return Result::error('用户ID不能为空', 400);
        }

        // 从数据库获取订单列表
        // 这里暂时返回空数组
        return Result::success([
            'items' => [],
            'total' => 0,
            'page' => 1,
            'pageSize' => 20
        ], '获取成功');
    }

    /**
     * 获取订单详情
     * GET /api/miniprogram/orders/:id/detail
     */
    public function getOrderDetail($id)
    {
        // 从数据库获取订单详情
        // 这里暂时返回空数据
        return Result::success([
            'id' => $id,
            'order_no' => '',
            'status' => 'pending',
            'progress' => 0
        ], '获取成功');
    }

    /**
     * 上传头像
     * POST /api/miniprogram/user/avatar
     */
    public function uploadAvatar()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $file = request()->file('avatar');
        if (!$file) {
            return Result::error('请选择文件', 400);
        }

        // 处理文件上传
        // 这里需要实现实际的文件上传逻辑
        // 暂时返回成功

        $avatarUrl = '/uploads/avatars/' . $userId . '.jpg';

        return Result::success([
            'avatar_url' => $avatarUrl
        ], '上传成功');
    }

    /**
     * AI客服消息
     * POST /api/miniprogram/chat/message
     */
    public function chatMessage()
    {
        $data = request()->post();

        if (empty($data['message'])) {
            return Result::error('消息不能为空', 400);
        }

        // 这里可以集成AI客服功能
        // 暂时返回简单回复

        $response = $this->getAIResponse($data['message']);

        return Result::success([
            'message' => $response,
            'timestamp' => time()
        ], '发送成功');
    }

    /**
     * 获取AI回复
     */
    private function getAIResponse($message)
    {
        // 简单的关键词匹配回复
        $keywords = [
            '维修' => '您可以点击"维修"菜单进行维修下单',
            '价格' => '具体价格需要根据故障情况评估',
            '地址' => '您可以在"我的"页面管理收货地址',
            '订单' => '您可以在"我的"页面查看订单状态',
            '人工' => '正在为您转接人工客服...'
        ];

        foreach ($keywords as $key => $value) {
            if (strpos($message, $key) !== false) {
                return $value;
            }
        }

        return '您好，我是智能客服。您可以咨询以下内容：维修服务、价格咨询、地址管理、订单查询等。如需人工服务，请回复"人工客服"。';
    }

    /**
     * 转人工客服
     * POST /api/miniprogram/chat/transfer-to-human
     */
    public function transferToHuman()
    {
        return Result::success([
            'status' => 'connecting',
            'message' => '正在为您连接人工客服，请稍候...'
        ], '转接成功');
    }

    /**
     * 查询人工客服状态
     * GET /api/miniprogram/chat/human-status
     */
    public function getHumanStatus()
    {
        $conversationId = request()->get('conversationId');

        return Result::success([
            'status' => 'available',
            'message' => '人工客服在线'
        ], '获取成功');
    }

    /**
     * 清空对话历史
     * POST /api/miniprogram/chat/clear-history
     */
    public function clearHistory()
    {
        $data = request()->post();
        $conversationId = $data['conversationId'] ?? '';

        return Result::success([
            'cleared' => true
        ], '清空成功');
    }

    /**
     * 更新地址
     * PUT /api/miniprogram/addresses/{id}
     */
    public function updateAddress($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 更新地址
        // 这里需要根据实际数据库表结构来更新

        return Result::success([
            'id' => $id,
            'updated' => true
        ], '地址更新成功');
    }

    /**
     * 删除地址
     * DELETE /api/miniprogram/addresses/{id}
     */
    public function deleteAddress($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 删除地址
        // 这里需要根据实际数据库表结构来删除

        return Result::success([
            'deleted' => true
        ], '地址删除成功');
    }

    /**
     * 设置默认地址
     * POST /api/miniprogram/addresses/{id}/default
     */
    public function setDefaultAddress($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 设置默认地址
        // 这里需要根据实际数据库表结构来更新

        return Result::success([
            'id' => $id,
            'is_default' => true
        ], '设置成功');
    }

    /**
     * 取消订单
     * POST /api/miniprogram/orders/{id}/cancel
     */
    public function cancelOrder($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 取消订单
        // 这里需要根据实际数据库表结构来更新

        return Result::success([
            'id' => $id,
            'status' => 'cancelled'
        ], '订单已取消');
    }

    /**
     * 编辑订单
     * PUT /api/miniprogram/orders/{id}/edit
     */
    public function editOrder($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 编辑订单
        // 这里需要根据实际数据库表结构来更新

        return Result::success([
            'id' => $id,
            'updated' => true
        ], '订单更新成功');
    }

    /**
     * 申请退款
     * POST /api/miniprogram/orders/{id}/refund
     */
    public function refundOrder($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 申请退款
        // 这里需要根据实际数据库表结构来更新

        return Result::success([
            'id' => $id,
            'refund_status' => 'pending'
        ], '退款申请已提交');
    }

    /**
     * 提交评价
     * POST /api/miniprogram/orders/submit-review
     */
    public function submitReview()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 提交评价
        // 这里需要根据实际数据库表结构来保存

        return Result::success([
            'review_id' => time()
        ], '评价提交成功');
    }

    /**
     * 更新用户信息
     * PUT /api/auth/profile
     */
    public function updateProfile()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        // 更新用户信息
        $user = User::find($userId);
        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        // 更新字段
        if (isset($data['real_name'])) {
            $user->real_name = $data['real_name'];
        }
        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        $user->save();

        return Result::success([
            'id' => $user->id,
            'username' => $user->username,
            'real_name' => $user->real_name,
            'phone' => $user->phone,
            'email' => $user->email
        ], '更新成功');
    }

    /**
     * 获取产品列表
     * GET /api/products
     */
    public function getProducts()
    {
        // 暂时返回空的产品列表
        // 实际应该从产品表查询
        return Result::success([
            'items' => [],
            'total' => 0,
            'page' => 1,
            'pageSize' => 20
        ], '获取成功');
    }

    /**
     * 获取产品详情
     * GET /api/products/{id}
     */
    public function getProductDetail($id)
    {
        return Result::success([
            'id' => $id,
            'name' => '产品名称',
            'description' => '产品描述'
        ], '获取成功');
    }

    /**
     * 搜索产品
     * GET /api/products/search/{keyword}
     */
    public function searchProducts($keyword)
    {
        return Result::success([
            'items' => [],
            'total' => 0,
            'keyword' => $keyword
        ], '搜索成功');
    }

    /**
     * 获取单位列表
     * GET /api/user/companies
     */
    public function getCompanies()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        // 暂时返回空的单位列表
        // 实际应该从单位表查询
        return Result::success([
            'items' => [],
            'total' => 0
        ], '获取成功');
    }

    /**
     * 创建单位
     * POST /api/user/companies
     */
    public function createCompany()
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->post();

        return Result::success([
            'id' => time(),
            'created' => true
        ], '创建成功');
    }

    /**
     * 更新单位
     * PUT /api/user/companies/{id}
     */
    public function updateCompany($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        $data = request()->put();

        return Result::success([
            'id' => $id,
            'updated' => true
        ], '更新成功');
    }

    /**
     * 删除单位
     * DELETE /api/user/companies/{id}
     */
    public function deleteCompany($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        return Result::success([
            'deleted' => true
        ], '删除成功');
    }

    /**
     * 设置默认单位
     * POST /api/user/companies/{id}/default
     */
    public function setDefaultCompany($id)
    {
        $userId = request()->userId ?? 0;

        if (!$userId) {
            return Result::error('未登录', 401);
        }

        return Result::success([
            'id' => $id,
            'is_default' => true
        ], '设置成功');
    }
}
