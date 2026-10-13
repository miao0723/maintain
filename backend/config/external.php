<?php

// +----------------------------------------------------------------------
// | 外部系统人员接口配置
// |
// | 所有地址 / 账号 / 密钥均通过环境变量注入，代码内不硬编码任何真实凭据。
// | 对应 .env 中的 EXTERNAL_PERSONNEL_* 系列变量（见 .env.example）。
// +----------------------------------------------------------------------

return [

    'personnel' => [

        // 外部系统基础地址（如 https://oa.example.com），末尾不带 /
        'base_url' => env('EXTERNAL_PERSONNEL_BASE_URL', ''),

        // 登录接口路径（POST，返回 data.access_token）
        'login_path' => env('EXTERNAL_PERSONNEL_LOGIN_PATH', '/api/auth/login'),

        // 人员列表接口路径（GET，分页 page / page_size，支持 keyword）
        'list_path' => env('EXTERNAL_PERSONNEL_LIST_PATH', '/api/personnel/list'),

        // 服务账号（agent_bot），密码从环境变量读取，禁止硬编码
        'account'      => env('EXTERNAL_PERSONNEL_ACCOUNT', 'agent_bot'),
        'password'     => env('EXTERNAL_PERSONNEL_PASSWORD', ''),

        // 登录请求体的账号/密码字段名（不同系统字段名可能不同，可配置）
        'account_field' => env('EXTERNAL_PERSONNEL_ACCOUNT_FIELD', 'username'),
        'password_field' => env('EXTERNAL_PERSONNEL_PASSWORD_FIELD', 'password'),

        // 鉴权头前缀，登录后按 "Authorization: {prefix}{token}" 调用
        'token_prefix' => env('EXTERNAL_PERSONNEL_TOKEN_PREFIX', 'Bearer '),

        // 分页
        'page_size' => (int) env('EXTERNAL_PERSONNEL_PAGE_SIZE', 100),
        'max_pages' => (int) env('EXTERNAL_PERSONNEL_MAX_PAGES', 200), // 防止异常死循环

        // 请求超时（秒）
        'timeout' => (int) env('EXTERNAL_PERSONNEL_TIMEOUT', 20),

        // Token 缓存 key 与 TTL（秒）。TTL 略小于外部 token 有效期，过期自动重登。
        'token_cache_key' => env('EXTERNAL_PERSONNEL_TOKEN_CACHE_KEY', 'external_personnel:token'),
        'token_cache_ttl' => (int) env('EXTERNAL_PERSONNEL_TOKEN_CACHE_TTL', 3600),

        // 接口响应字段映射：外部字段名 => 本地字段名
        // 若外部字段名不同，只需改这里，无需改代码
        'field_map' => [
            'id'               => env('EXTERNAL_PERSONNEL_F_ID', 'id'),
            'employee_name'    => env('EXTERNAL_PERSONNEL_F_NAME', 'employee_name'),
            'department'       => env('EXTERNAL_PERSONNEL_F_DEPT', 'department'),
            'position'         => env('EXTERNAL_PERSONNEL_F_POSITION', 'position'),
            'status'           => env('EXTERNAL_PERSONNEL_F_STATUS', 'status'),
            'is_active'        => env('EXTERNAL_PERSONNEL_F_IS_ACTIVE', 'is_active'),
            'wps_user_id'      => env('EXTERNAL_PERSONNEL_F_WPS', 'wps_user_id'),
            'phone'            => env('EXTERNAL_PERSONNEL_F_PHONE', 'phone'),
            'id_card'          => env('EXTERNAL_PERSONNEL_F_ID_CARD', 'id_card'),
            'address'          => env('EXTERNAL_PERSONNEL_F_ADDRESS', 'address'),
            'contract_start'   => env('EXTERNAL_PERSONNEL_F_CONTRACT_START', 'contract_start_date'),
            'contract_end'     => env('EXTERNAL_PERSONNEL_F_CONTRACT_END', 'contract_end_date'),
            'annual_leave'     => env('EXTERNAL_PERSONNEL_F_ANNUAL_LEAVE', 'annual_leave_days'),
        ],

        // 视为“离职/停用”的状态值（命中即本地置为禁用，不删除）
        'inactive_status' => array_filter(array_map('trim', explode(',',
            env('EXTERNAL_PERSONNEL_INACTIVE_STATUS', 'resigned,left,inactive,disabled,离职,停用')
        ))),
    ],

    // 敏感字段加密密钥（AES-256-GCM，base64）。生产环境必须通过环境变量覆盖。
    'encryption' => [
        'key' => env('EXTERNAL_PERSONNEL_ENC_KEY', base64_encode(str_repeat('0', 32))),
    ],
];
