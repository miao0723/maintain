<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../app/provider.php';

try {
    // 查找用户
    $user = \app\model\User::where('username', 'admin')->find();
    
    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    echo json_encode([
        'user_id' => $user->id,
        'username' => $user->username,
        'password_hash' => $user->password,
        'status' => $user->status,
        'password_verify' => password_verify('123456', $user->password)
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
