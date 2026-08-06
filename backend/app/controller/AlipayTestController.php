<?php

namespace app\controller;

use app\common\Result;
use app\model\OnlinePayment;

class AlipayTestController extends BaseController
{
    // 沙箱环境配置（从 .env 读取）
    private function getAlipayConfig()
    {
        // 优先从单独文件读取密钥；文件为空时回退到 .env 多行值
        $privateKey = $this->readKeyFromFile('.alipay_private.pem');
        if ($privateKey === '') {
            $privateKey = $this->loadEnvFromDocker('ALIPAY_PRIVATE_KEY', '');
        }

        $publicKey = $this->readKeyFromFile('.alipay_public.pem');
        if ($publicKey === '') {
            $publicKey = $this->loadEnvFromDocker('ALIPAY_PUBLIC_KEY', '');
        }

        return [
            'app_id' => $this->loadEnvFromDocker('ALIPAY_APP_ID', env('ALIPAY_APP_ID', '')),
            'private_key' => $privateKey,
            'alipay_public_key' => $publicKey,
            'gateway' => $this->loadEnvFromDocker('ALIPAY_GATEWAY', env('ALIPAY_GATEWAY', 'https://openapi-sandbox.dl.alipaydev.com/gateway.do')),
            'notify_url' => $this->loadEnvFromDocker('ALIPAY_NOTIFY_URL', env('ALIPAY_NOTIFY_URL', '')),
            'return_url' => $this->loadEnvFromDocker('ALIPAY_RETURN_URL', env('ALIPAY_RETURN_URL', '')),
            'sandbox' => filter_var($this->loadEnvFromDocker('ALIPAY_SANDBOX', env('ALIPAY_SANDBOX', true)), FILTER_VALIDATE_BOOLEAN),
            // 模拟模式：true=不调用真实API，false=调用真实支付宝
            'mock_mode' => filter_var($this->loadEnvFromDocker('ALIPAY_MOCK_MODE', env('ALIPAY_MOCK_MODE', true)), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    private function readKeyFromFile($filename)
    {
        $filepath = root_path() . $filename;
        if (!file_exists($filepath)) {
            return '';
        }
        $content = file_get_contents($filepath);
        return trim((string) $content);
    }

    /**
     * 从Docker环境变量或.env文件中加载配置（支持多行值）
     */
    private function loadEnvFromDocker($key, $default = '')
    {
        // 首先尝试从Docker环境变量获取
        $value = getenv($key);

        if ($value === false) {
            // 如果环境变量不存在，直接从.env文件读取
            return $this->readKeyFromEnvFile($key, $default);
        }

        // 检查是否是转义的多行字符串（Docker env_file处理方式）
        if (strpos($value, '\\n') !== false) {
            $value = str_replace('\\n', "\n", $value);
        }

        // 如果值太短或明显不完整，尝试从文件读取
        if (strpos($value, '-----BEGIN') !== false && strpos($value, '-----END') === false) {
            return $this->readKeyFromEnvFile($key, $default);
        }

        return $value;
    }

    /**
     * 直接从.env文件读取多行键值
     */
    private function readKeyFromEnvFile($key, $default = '')
    {
        $envFile = root_path() . '.env';

        if (!file_exists($envFile)) {
            return $default;
        }

        // 使用file_get_contents读取完整内容，然后解析
        $content = file_get_contents($envFile);

        // 查找键的位置
        $pattern = '/^' . preg_quote($key, '/') . '\s*=\s*(.*)$/ms';
        if (!preg_match($pattern, $content, $matches)) {
            return $default;
        }

        $value = $matches[1];

        // 检查是否是多行PEM格式
        if (strpos($value, '-----BEGIN') !== false) {
            // 提取完整的PEM块
            $beginPos = strpos($value, '-----BEGIN');
            $endMarker = strpos($value, '-----END', $beginPos);

            if ($endMarker !== false) {
                // 查找END行的结束位置
        $endLinePos = strpos($content, "\n", strpos($content, '-----END', strpos($content, $key)));

        if ($endLinePos === false) {
            $endLinePos = strlen($content);
        }

        // 从原始内容中提取完整的PEM块
        $keyStart = strpos($content, '-----BEGIN', strpos($content, $key));
        $keyEnd = strpos($content, '-----END', $keyStart) + 15; // 15是"-----END RSA PRIVATE KEY-----"的长度

        if ($keyEnd > $keyStart) {
            $fullKey = substr($content, $keyStart, $keyEnd - $keyStart);
            return $fullKey;
        }
            }
        }

        return $value;
    }

    // 沙箱默认密钥（支付宝沙箱官方提供的测试账号）
    private function getSandboxDefaultKeys()
    {
        return [
            'app_id' => '2021000122600000',  // 沙箱测试AppID（示例）
            'private_key' => '',
            'alipay_public_key' => '',
        ];
    }

    public function create()
    {
        try {
            $data = $this->getRequestData([
                'subject' => 'require',
                'total_amount' => 'require|float|gt:0',
                'out_trade_no' => 'require',
            ]);

            $subject = trim((string) $data['subject']);
            $body = trim((string) ($data['body'] ?? ''));
            $outTradeNo = trim((string) $data['out_trade_no']);
            $totalAmount = number_format((float) $data['total_amount'], 2, '.', '');

            $config = $this->getAlipayConfig();
            $appId = $config['app_id'];
            $privateKey = $config['private_key'];

            // 创建或更新本地获取支付记录
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();

            if (!$payment) {
                $payment = new OnlinePayment();
                $payment->order_no = $outTradeNo;
            }

            $payment->amount = $totalAmount;
            $payment->payment_method = 'alipay';
            $payment->remark = $subject . ($body ? ' - ' . $body : '');

            // 如果订单不是已支付/已退款状态，则设为待支付
            if ($payment->status !== 'paid' && $payment->status !== 'refunded') {
                $payment->status = 'pending';
            }

            $payment->save();

            // 模拟模式：不需要真实密钥
            if ($config['mock_mode']) {
                $mockPayUrl = $this->buildMockCashierUrl($outTradeNo);
                return Result::success([
                    'pay_url' => $mockPayUrl,
                    'qr_code' => null,
                    'out_trade_no' => $outTradeNo,
                    'total_amount' => $totalAmount,
                    'mock_mode' => true,
                    'mock_test_info' => [
                        'sandbox_account' => 'sandboxbt01@sandbox.com',
                        'sandbox_password' => '111111',
                        'note' => '沙箱环境已下线，此为本地模拟测试',
                        'instruction' => '点击“打开支付页面”进入模拟支付宝收银台，完成支付或取消订单'
                    ],
                    'message' => '支付订单创建成功（模拟模式）'
                ], '支付订单创建成功（模拟模式）');
            }

            // 真实沙箱模式：需要配置密钥
            if (empty($appId) || empty($privateKey)) {
                return Result::error('请先配置支付宝密钥：ALIPAY_APP_ID 和 ALIPAY_PRIVATE_KEY', 500);
            }

            // 构建支付宝支付参数
            $bizContent = [
                'out_trade_no' => $outTradeNo,
                'total_amount' => $totalAmount,
                'subject' => $subject,
                'body' => $body,
                'product_code' => 'FAST_INSTANT_TRADE_PAY',
            ];

            $params = [
                'app_id' => $appId,
                'method' => 'alipay.trade.page.pay',
                'format' => 'JSON',
                'charset' => 'utf-8',
                'sign_type' => 'RSA2',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0',
                'notify_url' => $config['notify_url'],
                'return_url' => $config['return_url'],
                'biz_content' => json_encode($bizContent, JSON_UNESCAPED_UNICODE),
            ];

            // 生成签名
            $params['sign'] = $this->generateSign($params, $privateKey);

            // 构建支付 URL
            $payUrl = $config['gateway'] . '?' . http_build_query($params);

            return Result::success([
                'pay_url' => $payUrl,
                'qr_code' => null,
                'out_trade_no' => $outTradeNo,
                'total_amount' => $totalAmount,
                'mock_mode' => false,
            ], '支付订单创建成功');
        } catch (\Throwable $e) {
            return Result::error('创建支付订单失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 模拟支付宝收银台页面
     * GET /api/payment/alipay/mock-page
     */
    public function mockPage()
    {
        $outTradeNo = trim((string) request()->get('out_trade_no', ''));

        if ($outTradeNo === '') {
            return response('<h3>缺少订单编号</h3>', 400, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        $payment = OnlinePayment::where('order_no', $outTradeNo)->find();
        if (!$payment) {
            return response('<h3>订单不存在</h3>', 404, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        $statusMap = [
            'pending' => '等待买家付款',
            'paid' => '支付成功',
            'cancelled' => '交易关闭',
            'refunded' => '已退款',
        ];

        $statusText = $statusMap[$payment->status] ?? '等待买家付款';
        $amount = number_format((float) $payment->amount, 2, '.', '');
        $subject = htmlspecialchars($payment->remark ?: '支付宝测试订单', ENT_QUOTES, 'UTF-8');
        $orderNo = htmlspecialchars($payment->order_no, ENT_QUOTES, 'UTF-8');
        $status = htmlspecialchars($payment->status, ENT_QUOTES, 'UTF-8');
        $statusText = htmlspecialchars($statusText, ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>支付宝模拟收银台</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Microsoft YaHei", sans-serif;
      background: linear-gradient(180deg, #0d6efd 0, #f5f7fb 220px);
      color: #1f2d3d;
    }
    .wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 20px 60px;
    }
    .brand {
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .card {
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(16, 47, 92, 0.18);
      overflow: hidden;
    }
    .card-header {
      padding: 24px 30px;
      border-bottom: 1px solid #eef2f7;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1677ff;
    }
    .badge {
      background: #ecf5ff;
      color: #1677ff;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 13px;
    }
    .content {
      padding: 30px;
    }
    .amount {
      text-align: center;
      margin-bottom: 28px;
    }
    .amount .label {
      color: #8a94a6;
      font-size: 14px;
    }
    .amount .value {
      margin-top: 8px;
      font-size: 42px;
      font-weight: 700;
      color: #111827;
    }
    .meta {
      background: #f8fafc;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px dashed #dbe3ef;
    }
    .row:last-child { border-bottom: 0; }
    .label { color: #6b7280; }
    .value { color: #111827; text-align: right; word-break: break-all; }
    .tips {
      padding: 16px 18px;
      border-radius: 12px;
      background: #fff7e6;
      color: #8a5a00;
      line-height: 1.7;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }
    button {
      border: 0;
      border-radius: 12px;
      padding: 14px 22px;
      font-size: 16px;
      cursor: pointer;
      transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: .55; cursor: not-allowed; transform: none; }
    .btn-primary {
      background: linear-gradient(135deg, #1677ff, #4096ff);
      color: #fff;
      box-shadow: 0 10px 20px rgba(22, 119, 255, .22);
      flex: 1;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      flex: 1;
    }
    .btn-link {
      background: transparent;
      color: #1677ff;
      padding-left: 0;
      padding-right: 0;
    }
    .footer-note {
      margin-top: 18px;
      color: #94a3b8;
      font-size: 13px;
    }
    .success {
      color: #16a34a;
      font-weight: 700;
    }
    .closed {
      color: #6b7280;
      font-weight: 700;
    }
    @media (max-width: 640px) {
      .card-header, .content { padding: 20px; }
      .amount .value { font-size: 34px; }
      .actions { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">支付宝</div>
    <div class="card">
      <div class="card-header">
        <div class="title">模拟收银台</div>
        <div class="badge">测试环境</div>
      </div>
      <div class="content">
        <div class="amount">
          <div class="label">应付金额</div>
          <div class="value">¥ {$amount}</div>
        </div>

        <div class="meta">
          <div class="row"><div class="label">订单编号</div><div class="value">{$orderNo}</div></div>
          <div class="row"><div class="label">订单说明</div><div class="value">{$subject}</div></div>
          <div class="row"><div class="label">买家账号</div><div class="value">sandboxbt01@sandbox.com</div></div>
          <div class="row"><div class="label">当前状态</div><div class="value" id="statusText" data-status="{$status}">{$statusText}</div></div>
        </div>

        <div class="tips">
          这是项目内置的支付宝模拟支付页面，用于完整演示“创建订单 -> 打开收银台 -> 确认支付/取消 -> 查询结果”的测试流程。
        </div>

        <div class="actions">
          <button id="payBtn" class="btn-primary">确认支付</button>
          <button id="cancelBtn" class="btn-secondary">取消订单</button>
        </div>

        <div style="margin-top: 10px;">
          <button id="closeBtn" class="btn-link">关闭当前页面</button>
        </div>

        <div class="footer-note">
          支付成功后，请返回“支付宝测试”页面点击“查询支付状态”或查看历史记录刷新结果。
        </div>
      </div>
    </div>
  </div>

  <script>
    const orderNo = {$this->jsonEncodeForJs($payment->order_no)};
    const payBtn = document.getElementById('payBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeBtn = document.getElementById('closeBtn');
    const statusTextEl = document.getElementById('statusText');

    const refreshButtonState = () => {
      const status = statusTextEl.dataset.status;
      payBtn.disabled = status === 'paid' || status === 'refunded';
      cancelBtn.disabled = status === 'paid' || status === 'cancelled' || status === 'refunded';
    };

    const updateStatus = (status, text) => {
      statusTextEl.dataset.status = status;
      statusTextEl.textContent = text;
      statusTextEl.className = status === 'paid' ? 'value success' : (status === 'cancelled' ? 'value closed' : 'value');
      refreshButtonState();
    };

    const submitAction = async (url, successStatus, successText) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ out_trade_no: orderNo })
        });
        const result = await response.json();
        if (!response.ok || (result.code !== 200 && result.code !== 0)) {
          throw new Error(result.message || '操作失败');
        }
        updateStatus(successStatus, successText);
        alert(result.message || '操作成功');
      } catch (error) {
        alert(error.message || '操作失败');
      }
    };

    payBtn.addEventListener('click', () => submitAction('/api/payment/alipay/mock', 'paid', '支付成功'));
    cancelBtn.addEventListener('click', () => submitAction('/api/payment/alipay/mock-cancel', 'cancelled', '交易关闭'));
    closeBtn.addEventListener('click', () => window.close());

    refreshButtonState();
  </script>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function query()
    {
        $outTradeNo = trim((string) request()->get('out_trade_no', ''));

        if ($outTradeNo === '') {
            return Result::error('订单编号不能为空', 422);
        }

        $config = $this->getAlipayConfig();

        // 模拟模式：从本地数据库获取
        if ($config['mock_mode']) {
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();

            if (!$payment) {
                return Result::error('订单不存在', 404);
            }

            $tradeStatus = match($payment->status) {
                'paid' => 'TRADE_SUCCESS',
                'pending' => 'WAIT_BUYER_PAY',
                'cancelled' => 'TRADE_CLOSED',
                'refunded' => 'TRADE_CLOSED',
                default => 'WAIT_BUYER_PAY',
            };

            return Result::success([
                'out_trade_no' => $payment->order_no,
                'trade_no' => $payment->trade_no,
                'subject' => $payment->remark ?: '支付宝测试订单',
                'total_amount' => $payment->amount,
                'buyer_logon_id' => 'sandboxbt01@sandbox.com',
                'trade_status' => $tradeStatus,
                'gmt_payment' => $payment->paid_at ? date('Y-m-d H:i:s', strtotime($payment->paid_at)) : null,
                'refund_amount' => $payment->refund_amount,
                'refund_at' => $payment->refund_at ? date('Y-m-d H:i:s', strtotime($payment->refund_at)) : null,
                'mock_mode' => true,
            ], '查询成功（模拟数据）');
        }

        $appId = $config['app_id'];
        $privateKey = $config['private_key'];

        if (empty($appId) || empty($privateKey)) {
            return Result::error('请先配置支付宝密钥', 500);
        }

        // 构建查询请求
        $bizContent = [
            'out_trade_no' => $outTradeNo,
        ];

        $params = [
            'app_id' => $appId,
            'method' => 'alipay.trade.query',
            'format' => 'JSON',
            'charset' => 'utf-8',
            'sign_type' => 'RSA2',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0',
            'biz_content' => json_encode($bizContent, JSON_UNESCAPED_UNICODE),
        ];

        try {
            $params['sign'] = $this->generateSign($params, $privateKey);

            // 发送请求
            $response = $this->httpPost($config['gateway'], $params);
            $result = json_decode($response, true);

            if (isset($result['alipay_trade_query_response'])) {
                $data = $result['alipay_trade_query_response'];
                return Result::success([
                    'out_trade_no' => $data['out_trade_no'] ?? $outTradeNo,
                    'trade_no' => $data['trade_no'] ?? null,
                    'subject' => $data['subject'] ?? '支付宝测试订单',
                    'total_amount' => $data['total_amount'] ?? null,
                    'buyer_logon_id' => $data['buyer_logon_id'] ?? null,
                    'trade_status' => $data['trade_status'] ?? 'WAIT_BUYER_PAY',
                    'gmt_payment' => $data['gmt_payment'] ?? null,
                ], '查询成功');
            }

            return Result::error('支付宝返回数据格式错误', 500);
        } catch (\Throwable $e) {
            return Result::error('查询失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 模拟支付接口
     * POST /api/payment/alipay/mock
     */
    public function mockPay()
    {
        try {
            $data = $this->getRequestData([
                'out_trade_no' => 'require',
            ]);

            $outTradeNo = trim((string) $data['out_trade_no']);
            $config = $this->getAlipayConfig();

            if (!$config['mock_mode']) {
                return Result::error('模拟支付仅在模拟模式下可用', 400);
            }

            // 获取支付记录
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();

            if (!$payment) {
                return Result::error('订单不存在', 404);
            }

            if ($payment->status === 'paid') {
                return Result::error('该订单已完成支付', 400);
            }

            if ($payment->status === 'refunded') {
                return Result::error('该订单已退款', 400);
            }

            // 生成模拟交易号
            $tradeNo = 'ALI' . date('YmdHis') . substr(md5($outTradeNo), 0, 6);

            // 更新支付状态
            $payment->status = 'paid';
            $payment->trade_no = $tradeNo;
            $payment->paid_at = date('Y-m-d H:i:s');
            $payment->save();

            return Result::success([
                'out_trade_no' => $payment->order_no,
                'trade_no' => $payment->trade_no,
                'total_amount' => $payment->amount,
                'trade_status' => 'TRADE_SUCCESS',
                'gmt_payment' => $payment->paid_at,
                'mock_mode' => true,
            ], '模拟支付成功');
        } catch (\Throwable $e) {
            return Result::error('模拟支付失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 模拟取消支付
     * POST /api/payment/alipay/mock-cancel
     */
    public function mockCancel()
    {
        try {
            $data = $this->getRequestData([
                'out_trade_no' => 'require',
            ]);

            $outTradeNo = trim((string) $data['out_trade_no']);
            $config = $this->getAlipayConfig();

            if (!$config['mock_mode']) {
                return Result::error('模拟取消仅在模拟模式下可用', 400);
            }

            // 获取支付记录
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();

            if (!$payment) {
                return Result::error('订单不存在', 404);
            }

            if ($payment->status === 'paid') {
                return Result::error('已支付的订单无法取消', 400);
            }

            if ($payment->status === 'cancelled') {
                return Result::success(null, '订单已取消');
            }

            // 更新支付状态
            $payment->status = 'cancelled';
            $payment->cancelled_at = date('Y-m-d H:i:s');
            $payment->save();

            return Result::success([
                'out_trade_no' => $payment->order_no,
                'trade_status' => 'TRADE_CLOSED',
                'mock_mode' => true,
            ], '模拟取消成功');
        } catch (\Throwable $e) {
            return Result::error('模拟取消失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 生成 RSA2 签名
     */
    private function generateSign($params, $privateKey)
    {
        // 排序并拼接参数
        ksort($params);
        $signString = '';
        foreach ($params as $key => $value) {
            // biz_content 不参与签名计算
            if ($key !== 'sign' && $key !== 'biz_content' && $value !== '' && $value !== null) {
                $signString .= $key . '=' . $value . '&';
            }
        }
        $signString = rtrim($signString, '&');

        // 处理私钥格式
        $privateKeyPem = $this->formatPrivateKey($privateKey);

        $key = openssl_pkey_get_private($privateKeyPem);
        if (!$key) {
            throw new \Exception('私钥格式错误，请检查 ALIPAY_PRIVATE_KEY 配置');
        }

        $signature = '';
        openssl_sign($signString, $signature, $key, OPENSSL_ALGO_SHA256);
        return base64_encode($signature);
    }

    /**
     * 验签方法
     */
    private function verifySign($params, $publicKey)
    {
        // 解析公钥
        $publicKeyPem = $this->formatPublicKey($publicKey);
        $key = openssl_pkey_get_public($publicKeyPem);
        if (!$key) {
            throw new \Exception('公钥格式错误');
        }

        // 从参数中获取签名
        $sign = $params['sign'] ?? '';
        unset($params['sign']);

        // 排序并拼接参数（biz_content 不参与签名）
        ksort($params);
        $signString = '';
        foreach ($params as $key => $value) {
            if ($key !== 'sign' && $key !== 'biz_content' && $value !== '' && $value !== null) {
                $signString .= $key . '=' . $value . '&';
            }
        }
        $signString = rtrim($signString, '&');

        // 验签
        return openssl_verify($signString, base64_decode($sign), $key, OPENSSL_ALGO_SHA256);
    }

    /**
     * 格式化私钥
     */
    private function formatPrivateKey($privateKey)
    {
        // 如果已经是 PEM 格式，直接返回
        if (strpos($privateKey, '-----BEGIN') !== false) {
            return $privateKey;
        }

        // 尝试 PKCS1 格式
        $pem = "-----BEGIN RSA PRIVATE KEY-----\n";
        $pem .= chunk_split($privateKey, 64, "\n");
        $pem .= "-----END RSA PRIVATE KEY-----";

        if (openssl_pkey_get_private($pem)) {
            return $pem;
        }

        // 尝试 PKCS8 格式
        $pem = "-----BEGIN PRIVATE KEY-----\n";
        $pem .= chunk_split($privateKey, 64, "\n");
        $pem .= "-----END PRIVATE KEY-----";

        if (openssl_pkey_get_private($pem)) {
            return $pem;
        }

        return $privateKey;
    }

    /**
     * 格式化公钥
     */
    private function formatPublicKey($publicKey)
    {
        // 如果已经是 PEM 格式，直接返回
        if (strpos($publicKey, '-----BEGIN') !== false) {
            return $publicKey;
        }

        // 添加 PEM 标记
        $pem = "-----BEGIN PUBLIC KEY-----\n";
        $pem .= chunk_split($publicKey, 64, "\n");
        $pem .= "-----END PUBLIC KEY-----";

        return $pem;
    }

    /**
     * 异步通知处理
     * POST /api/payment/alipay/notify
     */
    public function notify()
    {
        try {
            $data = request()->post();
            $config = $this->getAlipayConfig();

            // 模拟模式下不做验签
            if ($config['mock_mode']) {
                \think\facade\Log::info('支付宝异步通知（模拟模式）：' . json_encode($data));

                return 'success';
            }

            // 验签
            if (!$this->verifySign($data, $config['alipay_public_key'])) {
                \think\facade\Log::error('支付宝异步通知验签失败');
                return 'fail';
            }

            $outTradeNo = $data['out_trade_no'] ?? '';
            $tradeStatus = $data['trade_status'] ?? '';

            // 更新订单状态
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();
            if ($payment) {
                if ($tradeStatus === 'TRADE_SUCCESS' || $tradeStatus === 'TRADE_FINISHED') {
                    $payment->status = 'paid';
                    $payment->trade_no = $data['trade_no'] ?? '';
                    $payment->paid_at = date('Y-m-d H:i:s');
                } elseif ($tradeStatus === 'TRADE_CLOSED') {
                    $payment->status = 'cancelled';
                    $payment->cancelled_at = date('Y-m-d H:i:s');
                }
                $payment->save();
            }

            return 'success';
        } catch (\Throwable $e) {
            \think\facade\Log::error('支付宝异步通知处理失败：' . $e->getMessage());
            return 'fail';
        }
    }

    /**
     * 模拟退款
     * POST /api/payment/alipay/mock-refund
     */
    public function mockRefund()
    {
        try {
            $data = $this->getRequestData([
                'out_trade_no' => 'require',
                'refund_amount' => 'float',
            ]);

            $outTradeNo = trim((string) $data['out_trade_no']);
            $refundAmount = isset($data['refund_amount']) ? (float) $data['refund_amount'] : null;
            $config = $this->getAlipayConfig();

            if (!$config['mock_mode']) {
                return Result::error('模拟退款仅在模拟模式下可用', 400);
            }

            // 获取支付记录
            $payment = OnlinePayment::where('order_no', $outTradeNo)->find();

            if (!$payment) {
                return Result::error('订单不存在', 404);
            }

            if ($payment->status !== 'paid') {
                return Result::error('只有已支付的订单才能退款', 400);
            }

            if ($payment->status === 'refunded') {
                return Result::error('该订单已退款', 400);
            }

            if ($refundAmount && $refundAmount > $payment->amount) {
                return Result::error('退款金额不能超过支付金额', 400);
            }

            // 更新退款状态
            $payment->status = 'refunded';
            $payment->refund_amount = $refundAmount ?: $payment->amount;
            $payment->refund_at = date('Y-m-d H:i:s');
            $payment->save();

            return Result::success([
                'out_trade_no' => $payment->order_no,
                'refund_amount' => $payment->refund_amount,
                'mock_mode' => true,
            ], '模拟退款成功');
        } catch (\Throwable $e) {
            return Result::error('模拟退款失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 发送 HTTP POST 请求
     */
    private function httpPost($url, $params)
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('HTTP 请求失败：' . $error);
        }

        return $response;
    }

    private function buildMockCashierUrl(string $outTradeNo): string
    {
        $base = rtrim((string) request()->domain(), '/');
        return $base . '/api/payment/alipay/mock-page?out_trade_no=' . urlencode($outTradeNo);
    }

    private function jsonEncodeForJs(string $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
