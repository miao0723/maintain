<?php
/**
 * 添加发票开票和作废权限
 *
 * 使用方法：php database/add_invoice_permissions.php
 */

require __DIR__ . '/../vendor/autoload.php';

use think\facade\Db;

// 初始化 ThinkPHP
$app = new think\App();
$app->initialize();

echo "开始添加发票相关权限...\n\n";

try {
    // 检查权限表是否存在
    $hasPermissionsTable = Db::query("SHOW TABLES LIKE 'cmms_permissions'");
    if (empty($hasPermissionsTable)) {
        echo "错误：cmms_permissions 表不存在\n";
        exit(1);
    }

    // 检查角色权限关联表是否存在
    $hasRolePermissionsTable = Db::query("SHOW TABLES LIKE 'cmms_role_permissions'");
    if (empty($hasRolePermissionsTable)) {
        echo "错误：cmms_role_permissions 表不存在\n";
        exit(1);
    }

    // 添加发票开票权限
    $issueExists = Db::table('cmms_permissions')->where('code', 'invoices:issue')->find();
    if (!$issueExists) {
        Db::table('cmms_permissions')->insert([
            'name' => '发票开票',
            'code' => 'invoices:issue',
            'description' => '开具发票权限',
            'module' => 'payment',
            'status' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        echo "✓ 添加权限：invoices:issue (发票开票)\n";
    } else {
        echo "- 权限已存在：invoices:issue\n";
    }

    // 添加发票作废权限
    $voidExists = Db::table('cmms_permissions')->where('code', 'invoices:void')->find();
    if (!$voidExists) {
        Db::table('cmms_permissions')->insert([
            'name' => '发票作废',
            'code' => 'invoices:void',
            'description' => '作废发票权限',
            'module' => 'payment',
            'status' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        echo "✓ 添加权限：invoices:void (发票作废)\n";
    } else {
        echo "- 权限已存在：invoices:void\n";
    }

    // 获取新添加的权限ID
    $issuePerm = Db::table('cmms_permissions')->where('code', 'invoices:issue')->find();
    $voidPerm = Db::table('cmms_permissions')->where('code', 'invoices:void')->find();

    echo "\n开始分配权限到角色...\n\n";

    // 获取所有角色
    $roles = Db::table('cmms_roles')->select();
    if (empty($roles)) {
        echo "警告：没有找到任何角色\n";
    }

    foreach ($roles as $role) {
        echo "处理角色：{$role['name']} (ID: {$role['id']})\n";

        // 检查并添加开票权限
        if ($issuePerm) {
            $hasIssuePerm = Db::table('cmms_role_permissions')
                ->where('role_id', $role['id'])
                ->where('permission_id', $issuePerm['id'])
                ->find();

            if (!$hasIssuePerm) {
                Db::table('cmms_role_permissions')->insert([
                    'role_id' => $role['id'],
                    'permission_id' => $issuePerm['id'],
                    'permissions' => json_encode(['canView' => true, 'canEdit' => true]),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                echo "  ✓ 添加权限：invoices:issue\n";
            } else {
                echo "  - 已有权限：invoices:issue\n";
            }
        }

        // 检查并添加作废权限
        if ($voidPerm) {
            $hasVoidPerm = Db::table('cmms_role_permissions')
                ->where('role_id', $role['id'])
                ->where('permission_id', $voidPerm['id'])
                ->find();

            if (!$hasVoidPerm) {
                Db::table('cmms_role_permissions')->insert([
                    'role_id' => $role['id'],
                    'permission_id' => $voidPerm['id'],
                    'permissions' => json_encode(['canView' => true, 'canEdit' => true]),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                echo "  ✓ 添加权限：invoices:void\n";
            } else {
                echo "  - 已有权限：invoices:void\n";
            }
        }
    }

    echo "\n✓ 权限添加完成！\n";

} catch (\Exception $e) {
    echo "错误：" . $e->getMessage() . "\n";
    echo "堆栈：\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
