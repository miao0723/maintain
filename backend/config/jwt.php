<?php

return [
    // JWT 密钥 — 支持两种 env 命名习惯（下划线与点号）以兼容不同部署
    'secret' => env('JWT_SECRET', env('JWT.SECRET', 'your-super-secret-jwt-key-change-this-in-production')),

    // 签名算法
    'algorithm' => env('JWT_ALGORITHM', env('JWT.ALGORITHM', 'HS256')),

    // Access Token 有效期（秒）默认 2 小时
    'access_ttl' => (int) env('JWT_ACCESS_TTL', (int) env('JWT.ACCESS_TTL', 7200)),

    // Refresh Token 有效期（秒）默认 7 天
    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', (int) env('JWT.REFRESH_TTL', 604800)),
];
