<?php
/**
 * 支付宝模拟支付测试脚本
 * 使用方法：php test_alipay_mock.php
 */

// 引入 ThinkPHP 框架
require __DIR__ . '/vendor/autoload.php';

// 初始化应用
$app = new think\App();

$app->initialize();

use app\model\OnlinePayment;

echo "=== 支付宝模拟支付测试 ===\n\n";

// 测试1: 创建订单
echo "1. 创建测试订单...\n";
$orderNo = 'TEST' . date('YmdHis') . rand(1000, 9999);
echo "   订单号: {$orderNo}\n";

$payment = new OnlinePayment();
$payment->order_no = $orderNo;
$payment->amount = 0.01;
$payment->payment_method = 'alipay';
$payment->status = 'pending';
$payment->remark = '测试订单';
$payment->save();

echo "   状态: {$payment->status}\n";
echo "   创建成功!\n\n";

// 测试2: 查询订单
echo "2. 查询订单状态...\n";
$payment = OnlinePayment::where('order_no', $orderNo)->find();

if ($payment) {
    echo "   订单号: {$payment->order_no}\n";
    echo "   金额: {$payment->amount}\n";
    echo "   状态: {$payment->status}\n";
    echo "   支付方式: {$payment->payment_method}\n";
} else {
    echo "   订单不存在!\n";
}
echo "\n";

// 测试3: 模拟支付
echo "3. 模拟支付...\n";
$tradeNo = 'ALI' . date('YmdHis') . substr(md5($orderNo), 0, 6);
$payment->status = 'paid';
$payment->trade_no = $tradeNo;
$payment->paid_at = date('Y-m-d H:i:s');
$payment->save();

echo "   交易号: {$tradeNo}\n";
echo "   支付时间: {$payment->paid_at}\n";
echo "   支付成功!\n\n";

// 测试4: 验证支付状态
echo "4. 验证支付状态...\n";
$payment = OnlinePayment::where('order_no', $orderNo)->find();

if ($payment) {
    echo "   订单号: {$payment->order_no}\n";
    echo "   交易号: {$payment->trade_no}\n";
    echo "   状态: {$payment->status}\n";
    echo "   支付时间: {$payment->paid_at}\n";
    echo "   验证通过!\n";
} else {
    echo "   验证失败!\n";
}
echo "\n";

// 测试5: 测试取消订单
echo "5. 测试取消订单功能...\n";
$orderNo2 = 'TEST' . date('YmdHis') . rand(1000, 9999);
$payment2 = new OnlinePayment();
$payment2->order_no = $orderNo2;
$payment2->amount = 0.02;
$payment2->payment_method = 'alipay';
$payment2->status = 'pending';
$payment2->remark = '测试取消订单';
$payment2->save();

echo "   订单号: {$orderNo2}\n";
echo "   初始状态: {$payment2->status}\n";

$payment2->status = 'cancelled';
$payment2->cancelled_at = date('Y-m-d H:i:s');
$payment2->save();

echo "   取消后状态: {$payment2->status}\n";
echo "   取消时间: {$payment2->cancelled_at}\n\n";

echo "=== 测试完成 ===\n";
