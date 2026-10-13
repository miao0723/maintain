<?php

// +----------------------------------------------------------------------
// | 权限体系配置：三角色 + 路由→权限码映射（接口级鉴权）
// |
// | 角色：
// |  - boss     老板：全部数据与系统配置权限（等同于超级管理员，直接放行）
// |  - repairer 维修人员：维修相关业务模块读写权限
// |  - staff    其他人员：仅可登录并访问无关只读页面，禁止人事/维修/配置类功能
// |
// | 鉴权三级：
// |  - 菜单级：前端按 permissions 树过滤菜单（PermissionController/myPermissions）
// |  - 接口级：PermissionCheck 中间件按下方 route_map 校验，未授权返回 403
// |  - 按钮级：前端 v-permission 指令按 permissions 的 button 码控制
// +----------------------------------------------------------------------

return [

    // 三角色定义（role_code => 元数据）
    'roles' => [
        'boss' => [
            'label'      => '老板',
            'is_boss'    => true,
            'description'=> '全部数据与系统配置权限',
        ],
        'repairer' => [
            'label'      => '维修人员',
            'is_boss'    => false,
            'description'=> '维修相关业务模块读写权限',
        ],
        'staff' => [
            'label'      => '其他人员',
            'is_boss'    => false,
            'description'=> '仅可登录并访问无关只读页面，禁止访问人事/维修/配置类功能',
        ],
    ],

    // 路由资源（/api 后第一段，连字符保留）=> 所需权限模块码（点分）
    // 命中的路由按 模块.view/create/edit/delete 校验；未命中的路由：
    //   GET(读) 放行、写(POST/PUT/DELETE) 一律 403（非老板）。
    'route_map' => [
        // —— 系统/人事/配置（仅老板）——
        'users'             => 'system.users',
        'roles'             => 'system.roles',
        'permissions'       => 'system.permissions',
        'bindings'          => 'system.binding',
        'personnel'         => 'system.personnel',
        'external-personnel'=> 'system.personnel',
        'organizations'     => 'system.organizations',
        'departments'       => 'system.departments',
        'agreement'         => 'system.agreement',
        'system-params'     => 'system.params',
        'system-logs'       => 'system.logs',

        // —— 维修业务（维修人员可读写）——
        'devices'                    => 'repair.devices',
        'order-devices'              => 'repair.order_devices',
        'repair-orders'              => 'repair.orders',
        'workorders'                 => 'repair.workorders',
        'engineers'                  => 'repair.engineers',
        'schedules'                  => 'repair.schedules',
        'inspections'                => 'repair.inspections',
        'external-repairs'           => 'repair.external',
        'repair-progress'            => 'repair.progress',
        'progress-apply'             => 'repair.progress_apply',
        'progress-photo'             => 'repair.progress_photo',
        'progress-video'             => 'repair.progress_video',
        'miniprogram-repair-progress'=> 'repair.miniprogram_progress',
        'miniprogram-reviews'        => 'repair.reviews',
        'miniprogram-progress-media' => 'repair.progress_media',
        'repair-categories'          => 'repair.categories',
        'repair-machines'            => 'repair.machines',
        'quotation-orders'           => 'repair.quotation',
        'test-reports'               => 'repair.test_report',
        'repair-reports'             => 'repair.repair_report',
        'repair-contracts'           => 'repair.contract',
        'contract-templates'         => 'repair.contract_template',
        'repair-reminders'           => 'repair.reminder',
        'common-problems'            => 'repair.content',
        'maintenance-items'          => 'repair.content',
        'maintenance'                => 'repair.maintenance',
    ],

    // 维修人员角色默认授予的权限码（支持通配符 repair.*）
    'repairer_grants' => [
        'repair.*',
        'statistics.*',
        'inventory.*',
    ],

    // 其他人员角色默认授予的权限码（仅无关只读，且默认规则已允许其读未映射资源）
    'staff_grants' => [],
];
