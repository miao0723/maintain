<?php
/**
 * 统计数据同步脚本
 * 将实际的业务数据同步到统计表
 *
 * 使用方法：
 * php sync_statistics.php
 * php sync_statistics.php --from=2024-01-01 --to=2024-12-31
 */

define('APP_PATH', __DIR__ . '/');

require __DIR__ . '/vendor/autoload.php';

$app = new think\App();
$app->initialize();

use app\service\StatisticsService;

$statisticsService = new StatisticsService();

// 解析参数
$startDate = null;
$endDate = null;

$args = $argv ?? [];
foreach ($args as $arg) {
    if (strpos($arg, '--from=') === 0) {
        $startDate = substr($arg, 7);
    } elseif (strpos($arg, '--to=') === 0) {
        $endDate = substr($arg, 5);
    }
}

echo "开始同步统计数据...\n";
if ($startDate) echo "  起始日期: {$startDate}\n";
if ($endDate) echo "  结束日期: {$endDate}\n";
echo "\n";

try {
    // 同步在线支付
    echo "正在同步在线支付数据...";
    $onlineCount = $statisticsService->syncOnlinePayments($startDate, $endDate);
    echo " 完成 ({$onlineCount} 条)\n";

    // 同步转账
    echo "正在同步转账数据...";
    $transferCount = $statisticsService->syncTransfers($startDate, $endDate);
    echo " 完成 ({$transferCount} 条)\n";

    // 同步订单
    echo "正在同步订单数据...";
    $orderCount = $statisticsService->syncOrders($startDate, $endDate);
    echo " 完成 ({$orderCount} 条)\n";

    echo "\n数据同步完成！\n";
    echo "  在线支付: {$onlineCount} 条\n";
    echo "  转账记录: {$transferCount} 条\n";
    echo "  订单记录: {$orderCount} 条\n";

} catch (\Exception $e) {
    echo "\n同步失败: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
