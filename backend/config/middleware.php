<?php

return [
    // 别名或分组
    '__alias__' => [
        'JwtAuth' => app\middleware\JwtAuth::class,
        'PermissionCheck' => app\middleware\PermissionCheck::class,
        'MiniAdminJwtAuth' => app\middleware\MiniAdminJwtAuth::class,
        'MiniAdminPermissionCheck' => app\middleware\MiniAdminPermissionCheck::class,
    ],
];
