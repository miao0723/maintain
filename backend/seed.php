<?php

require __DIR__ . '/vendor/autoload.php';

// Database configuration
$host = 'mysql';
$dbname = 'cmms_db';
$username = 'cmms_user';
$password = 'cmms_pass';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to database successfully\n\n";

    // Check if admin user already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    $adminExists = $stmt->fetchColumn();

    if ($adminExists) {
        echo "Admin user already exists, skipping seed.\n";
    } else {
        // Create admin user
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password, real_name, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $passwordHash, '系统管理员', 'admin@cmms.com', '13800138000', 1]);
        $adminId = $pdo->lastInsertId();
        echo "Created admin user (ID: $adminId)\n";

        // Create admin permissions for device module
        $permissions = json_encode(['view', 'create', 'update', 'delete']);
        $stmt = $pdo->prepare("INSERT INTO permissions (user_id, module, actions) VALUES (?, ?, ?)");
        $stmt->execute([$adminId, 'devices', $permissions]);
        echo "Created device permissions for admin user\n";
    }

    // Create some sample departments
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM departments");
    $stmt->execute();
    $deptCount = $stmt->fetchColumn();

    if ($deptCount == 0) {
        $depts = [
            ['name' => '技术部', 'parent_id' => null, 'sort_order' => 1],
            ['name' => '维修组', 'parent_id' => null, 'sort_order' => 2],
            ['name' => '生产部', 'parent_id' => null, 'sort_order' => 3],
        ];

        $deptMap = [];
        foreach ($depts as $index => $dept) {
            $stmt = $pdo->prepare("INSERT INTO departments (name, parent_id, sort_order, status) VALUES (?, ?, ?, 1)");
            $stmt->execute([$dept['name'], $dept['parent_id'], $dept['sort_order']]);
            $deptId = $pdo->lastInsertId();
            $deptMap[$index] = $deptId;
            echo "Created department: {$dept['name']} (ID: $deptId)\n";
        }
    } else {
        echo "Departments already exist ($deptCount records), skipping.\n";
    }

    // Create sample device categories
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM device_categories");
    $stmt->execute();
    $catCount = $stmt->fetchColumn();

    if ($catCount == 0) {
        $categories = [
            ['name' => '生产设备', 'description' => '用于生产制造的各种设备'],
            ['name' => '检测设备', 'description' => '用于质量检测的仪器设备'],
            ['name' => '辅助设备', 'description' => '辅助生产作业的设备'],
            ['name' => '运输设备', 'description' => '物料运输相关设备'],
        ];

        foreach ($categories as $cat) {
            $stmt = $pdo->prepare("INSERT INTO device_categories (name, description) VALUES (?, ?)");
            $stmt->execute([$cat['name'], $cat['description']]);
            $catId = $pdo->lastInsertId();
            echo "Created device category: {$cat['name']} (ID: $catId)\n";
        }
    } else {
        echo "Device categories already exist ($catCount records), skipping.\n";
    }

    echo "\n=== Seeding completed successfully ===\n";

    // Show summary
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    echo "Users: " . $stmt->fetchColumn() . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM departments");
    echo "Departments: " . $stmt->fetchColumn() . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM device_categories");
    echo "Device Categories: " . $stmt->fetchColumn() . "\n";
    $stmt = $pdo->query("SELECT COUNT(*) FROM permissions");
    echo "Permissions: " . $stmt->fetchColumn() . "\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
