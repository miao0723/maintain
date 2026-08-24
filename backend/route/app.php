<?php

// +----------------------------------------------------------------------
// | 路由设置
// +----------------------------------------------------------------------

use think\facade\Route;

// 诊断测试路由
Route::get('diagnose-api', function() {
    $data = [
        'status' => 'ok',
        'message' => 'API路由正常',
        'php_version' => PHP_VERSION,
        'time' => date('Y-m-d H:i:s'),
        'helper_functions' => [
            'env' => function_exists('env'),
            'config' => function_exists('config'),
        ],
        'config' => [
            'database' => config('database.default'),
            'cache' => config('cache.default'),
        ],
    ];
    return json($data);
});

// 测试路由
Route::get('test', 'TestController/index');
Route::post('test', 'TestController/index');

// API路由
Route::group('api', function () {
    // 认证路由（无需 Token）
    Route::group('auth', function () {
        Route::post('login', 'AuthController/login');
        Route::post('refresh', 'AuthController/refresh');

        // 简化版登录测试路由
        Route::post('login-test', function() {
            try {
                $data = request()->post();

                // 简单验证
                if (empty($data['username']) || empty($data['password'])) {
                    return json([
                        'code' => 400,
                        'message' => '用户名和密码不能为空',
                        'data' => null
                    ]);
                }

                // 查询用户
                $user = \app\model\User::where('username', $data['username'])->find();

                if (!$user) {
                    return json([
                        'code' => 401,
                        'message' => '用户名或密码错误',
                        'data' => null
                    ]);
                }

                // 验证密码
                if (!password_verify($data['password'], $user->password)) {
                    return json([
                        'code' => 401,
                        'message' => '用户名或密码错误',
                        'data' => null
                    ]);
                }

                // 生成token
                $token = \app\service\JwtService::createAccessToken($user->id, $user->role_type);
                $refreshToken = \app\service\JwtService::createRefreshToken($user->id);

                return json([
                    'code' => 200,
                    'message' => '登录成功',
                    'data' => [
                        'access_token' => $token,
                        'refresh_token' => $refreshToken,
                        'token_type' => 'Bearer',
                        'expires_in' => 7200,
                        'user' => [
                            'id' => $user->id,
                            'username' => $user->username,
                            'real_name' => $user->real_name,
                            'role_type' => $user->role_type,
                        ]
                    ]
                ]);

            } catch (\Exception $e) {
                return json([
                    'code' => 500,
                    'message' => '登录失败: ' . $e->getMessage(),
                    'data' => null
                ]);
            }
        });
    })->allowCrossDomain();

    // 简化登录路由（测试用）
    Route::post('simple-login', 'SimpleAuth/login')->allowCrossDomain();

    // 简单邮件发送 API（用于前端直接发送自定义内容，无需 Token）
    Route::post('mail/send', 'MailController/send')->allowCrossDomain();

    // 支付测试 API（无需 Token，供前端支付宝测试页调用）
    Route::group('payment/alipay', function () {
        Route::post('create', 'AlipayTestController/create');
        Route::get('query', 'AlipayTestController/query');
        Route::get('mock-page', 'AlipayTestController/mockPage');
        Route::post('mock', 'AlipayTestController/mockPay');
        Route::post('mock-cancel', 'AlipayTestController/mockCancel');
        Route::post('notify', 'AlipayTestController/notify');
        Route::post('mock-refund', 'AlipayTestController/mockRefund');
    })->allowCrossDomain();

    // 小程序公开路由（无需认证）
    Route::group('miniprogram', function () {
        Route::post('login', 'MiniprogramController/login');
        Route::post('chat/message', 'MiniprogramController/chatMessage');
        Route::post('chat/transfer-to-human', 'MiniprogramController/transferToHuman');
    })->allowCrossDomain();

    // 小程序产品相关（无需认证）
    Route::get('products', 'MiniprogramController/getProducts')->allowCrossDomain();
    Route::get('products/:id', 'MiniprogramController/getProductDetail')->allowCrossDomain();
    Route::get('products/search/:keyword', 'MiniprogramController/searchProducts')->allowCrossDomain();

    // 小程序后台认证（独立账号体系）
    Route::group('mini-admin/auth', function () {
        Route::post('login', 'MiniAdminAuthController/login');
    })->allowCrossDomain();

    // 需要认证的路由
    Route::group(function () {
        // 认证相关
        Route::group('auth', function () {
            Route::post('logout', 'AuthController/logout');
            Route::get('profile', 'AuthController/profile');
        });

        // 用户管理
        Route::group('users', function () {
            Route::get('/', 'UserController/index');
            Route::get('/:id', 'UserController/read');
            Route::post('/', 'UserController/save');
            Route::put('/:id', 'UserController/update');
            Route::delete('/:id', 'UserController/delete');
            Route::post('/:id/reset-password', 'UserController/resetPassword');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 角色管理
        Route::group('roles', function () {
            Route::get('/', 'RoleController/index');
            Route::get('/:id', 'RoleController/read');
            Route::post('/', 'RoleController/save');
            Route::put('/:id', 'RoleController/update');
            Route::delete('/:id', 'RoleController/delete');
            Route::get('/:id/permissions', 'RoleController/getPermissions');
            Route::post('/:id/permissions', 'RoleController/setPermissions');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 权限管理
        Route::group('permissions', function () {
            Route::get('/', 'PermissionController/index');
            Route::get('/:id', 'PermissionController/read');
            Route::post('/', 'PermissionController/save');
            Route::put('/:id', 'PermissionController/update');
            Route::delete('/:id', 'PermissionController/delete');
            Route::post('/save-all', 'PermissionController/saveAll');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 绑定解绑管理
        Route::group('bindings', function () {
            // 人员部门绑定
            Route::get('personnel-department', 'BindingController/getPersonnelDepartmentList');
            Route::post('personnel-department', 'BindingController/bindPersonnelToDepartment');
            Route::delete('personnel-department/:personnelId', 'BindingController/unbindPersonnelFromDepartment');

            // 工程师用户绑定
            Route::get('engineer-user', 'BindingController/getEngineerUserList');
            Route::post('engineer-user', 'BindingController/bindEngineerToUser');
            Route::delete('engineer-user/:engineerId', 'BindingController/unbindEngineerFromUser');

            // 用户角色绑定
            Route::get('user-role', 'BindingController/getUserRoleList');
            Route::post('user-role', 'BindingController/bindUserToRole');
            Route::delete('user-role/:userId/:roleId', 'BindingController/unbindUserFromRole');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 人员管理
        Route::group('personnel', function () {
            Route::get('/', 'PersonnelController/index');
            Route::get('/:id', 'PersonnelController/read');
            Route::post('/', 'PersonnelController/save');
            Route::put('/:id', 'PersonnelController/update');
            Route::delete('/:id', 'PersonnelController/delete');
            Route::post('/batch', 'PersonnelController/batchSave');
            Route::post('/import', 'PersonnelController/import');
            Route::get('/export', 'PersonnelController/export');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 单位管理
        Route::group('organizations', function () {
            Route::get('/', 'OrganizationController/index');
            Route::get('/:id', 'OrganizationController/read');
            Route::post('/', 'OrganizationController/save');
            Route::put('/:id', 'OrganizationController/update');
            Route::delete('/:id', 'OrganizationController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 部门管理
        Route::group('departments', function () {
            Route::get('/', 'DepartmentController/index');
            Route::get('/:id', 'DepartmentController/read');
            Route::post('/', 'DepartmentController/save');
            Route::put('/:id', 'DepartmentController/update');
            Route::delete('/:id', 'DepartmentController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 免责协议管理
        Route::group('agreement', function () {
            Route::get('/', 'AgreementController/index');
            Route::get('/:id/preview', 'AgreementController/preview');
            Route::get('/:id', 'AgreementController/read');
            Route::post('/', 'AgreementController/save');
            Route::put('/:id', 'AgreementController/update');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 系统参数管理
        Route::group('system-params', function () {
            Route::get('/', 'SystemParamController/index');
            Route::get('/:id', 'SystemParamController/read');
            Route::post('/', 'SystemParamController/save');
            Route::put('/:id', 'SystemParamController/update');
            Route::delete('/:id', 'SystemParamController/delete');
            Route::post('/refresh-cache', 'SystemParamController/refreshCache');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 系统日志管理
        Route::group('system-logs', function () {
            Route::get('/', 'SystemLogController/index');
            Route::get('/:id', 'SystemLogController/read');
            Route::post('/clear', 'SystemLogController/clear');
            Route::get('/export', 'SystemLogController/export');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 首页看板统计
        Route::get('statistics/dashboard', 'StatisticsController/dashboard');
        Route::get('statistics/income', 'StatisticsController/income');
        Route::post('statistics/income/summary', 'StatisticsController/generateIncomeSummary');
        Route::get('statistics/expense', 'StatisticsController/expense');
        Route::post('statistics/expense/summary', 'StatisticsController/generateExpenseSummary');
        Route::get('statistics/orders', 'StatisticsController/orders');
        Route::post('statistics/orders/summary', 'StatisticsController/generateOrderSummary');
        Route::get('statistics/timeout', 'StatisticsController/timeout');
        Route::post('statistics/timeout/summary', 'StatisticsController/generateSummary');
        Route::post('statistics/timeout/send-email', 'StatisticsController/sendEmail');

        // 设备分类管理（必须在设备管理之前定义，避免路由冲突）
        Route::get('devices/categories', 'DeviceCategoryController/index');
        Route::post('devices/categories', 'DeviceCategoryController/save');
        Route::put('devices/categories/:id', 'DeviceCategoryController/update');
        Route::delete('devices/categories/:id', 'DeviceCategoryController/delete');

        // 设备管理
        Route::group('devices', function () {
            Route::get('/', 'DeviceController/index');
            Route::get('/:id', 'DeviceController/read');
            Route::post('/', 'DeviceController/save');
            Route::put('/:id', 'DeviceController/update');
            Route::delete('/:id', 'DeviceController/delete');
            Route::get('/:id/history', 'DeviceController/history');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 订单设备明细管理（关联小程序订单 repair.orders.id）
        Route::group('order-devices', function () {
            Route::get('/', 'OrderDeviceController/index');
            Route::get('/:id', 'OrderDeviceController/read');
            Route::post('/', 'OrderDeviceController/save');
            Route::put('/:id', 'OrderDeviceController/update');
            Route::delete('/:id', 'OrderDeviceController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 小程序订单管理
        Route::group('repair-orders', function () {
            Route::get('/', 'RepairOrderController/index');
            // 静态路由必须定义在 /:id 动态路由之前，否则会被当作 id 匹配
            Route::get('/pending', 'RepairOrderController/pending');
            Route::get('/processing', 'RepairOrderController/processing');
            Route::get('/statistics', 'RepairOrderController/statistics');
            Route::get('/:id', 'RepairOrderController/read');
            Route::post('/:id/accept', 'RepairOrderController/accept');
            Route::post('/:id/status', 'RepairOrderController/updateStatus');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 联动维修
        Route::group('external-repairs', function () {
            Route::get('/', 'ExternalRepairController/index');
            Route::get('/:id', 'ExternalRepairController/read');
            Route::post('/', 'ExternalRepairController/save');
            Route::put('/:id', 'ExternalRepairController/update');
            Route::delete('/:id', 'ExternalRepairController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 维修进度
        Route::group('repair-progress', function () {
            Route::get('/', 'RepairProgressController/index');
            Route::get('/order/:orderId', 'RepairProgressController/orderProgress');
            Route::get('/:id', 'RepairProgressController/read');
            Route::post('/', 'RepairProgressController/save');
            Route::put('/:id', 'RepairProgressController/update');
            Route::delete('/:id', 'RepairProgressController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 小程序维修进度（直接读取repair数据库）
        Route::group('miniprogram-repair-progress', function () {
            Route::get('/', 'MiniprogramRepairProgressController/index');
            Route::get('statistics', 'MiniprogramRepairProgressController/statistics');
            Route::get('/:id/photos', 'MiniprogramRepairProgressController/getPhotos');
            Route::get('/:id/videos', 'MiniprogramRepairProgressController/getVideos');
            Route::put('/:id/progress', 'MiniprogramRepairProgressController/updateProgress');
            Route::get('/:id', 'MiniprogramRepairProgressController/read');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 小程序订单评价（读取 repair.order_reviews）
        Route::group('miniprogram-reviews', function () {
            Route::get('/', 'MiniprogramOrderReviewController/index');
            Route::get('statistics', 'MiniprogramOrderReviewController/statistics');
            Route::get('/:id', 'MiniprogramOrderReviewController/read');
            Route::delete('/:id', 'MiniprogramOrderReviewController/delete');
            Route::post('/:id/reply', 'MiniprogramOrderReviewController/reply');
            Route::get('/export', 'MiniprogramOrderReviewController/export');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 小程序进度媒体（照片和视频）查询
        Route::group('miniprogram-progress-media', function () {
            Route::get('photos', 'MiniprogramProgressMediaController/getPhotos');
            Route::get('photos/:orderId', 'MiniprogramProgressMediaController/getPhotosByOrder');
            Route::get('photos/detail/:id', 'MiniprogramProgressMediaController/getPhotoDetail');
            Route::post('photos', 'MiniprogramProgressMediaController/createPhoto');
            Route::put('photos/:id', 'MiniprogramProgressMediaController/updatePhoto');
            Route::delete('photos/:id', 'MiniprogramProgressMediaController/deletePhoto');

            Route::get('videos', 'MiniprogramProgressMediaController/getVideos');
            Route::get('videos/:orderId', 'MiniprogramProgressMediaController/getVideosByOrder');
            Route::get('videos/detail/:id', 'MiniprogramProgressMediaController/getVideoDetail');
            Route::post('videos', 'MiniprogramProgressMediaController/createVideo');
            Route::put('videos/:id', 'MiniprogramProgressMediaController/updateVideo');
            Route::delete('videos/:id', 'MiniprogramProgressMediaController/deleteVideo');

            Route::get('summary', 'MiniprogramProgressMediaController/getSummary');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 进度申请（读取repair数据库）
        Route::group('progress-apply', function () {
            Route::get('/', 'ProgressApplyController/index');
            Route::get('/statistics', 'ProgressApplyController/statistics');
            Route::post('/sync', 'ProgressApplyController/sync');
            Route::get('/:id', 'ProgressApplyController/read');
            Route::post('/', 'ProgressApplyController/save');
            Route::post('/:id/approve', 'ProgressApplyController/approve');
            Route::post('/:id/reject', 'ProgressApplyController/reject');
            Route::delete('/:id', 'ProgressApplyController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 进度照片
        Route::group('progress-photo', function () {
            Route::get('/', 'ProgressPhotoController/index');
            Route::get('/:id', 'ProgressPhotoController/read');
            Route::post('/', 'ProgressPhotoController/save');
            Route::put('/:id', 'ProgressPhotoController/update');
            Route::delete('/:id', 'ProgressPhotoController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 进度视频
        Route::group('progress-video', function () {
            Route::get('/', 'ProgressVideoController/index');
            Route::get('/:id', 'ProgressVideoController/read');
            Route::post('/', 'ProgressVideoController/save');
            Route::put('/:id', 'ProgressVideoController/update');
            Route::delete('/:id', 'ProgressVideoController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 营销模块
        Route::group('marketing', function () {
            Route::group('cases', function () {
                Route::get('/', 'MarketingCaseController/index');
                Route::get('/:id', 'MarketingCaseController/read');
                Route::post('/', 'MarketingCaseController/save');
                Route::put('/:id', 'MarketingCaseController/update');
                Route::delete('/:id', 'MarketingCaseController/delete');
            });

            Route::group('partners', function () {
                Route::get('/', 'MarketingPartnerController/index');
                Route::get('/:id', 'MarketingPartnerController/read');
                Route::post('/', 'MarketingPartnerController/save');
                Route::put('/:id', 'MarketingPartnerController/update');
                Route::delete('/:id', 'MarketingPartnerController/delete');
            });

            Route::group('douyin', function () {
                Route::get('/', 'MarketingDouyinController/index');
                Route::post('generate', 'MarketingDouyinController/generate');
                Route::get('test-coze', 'MarketingDouyinController/testCozeConnection');
                Route::get('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/optimize', 'MarketingDouyinController/optimize');
                Route::post('/:id/publish', 'MarketingDouyinController/publish');
                Route::post('publish/callback', 'MarketingDouyinController/publishCallback');
                Route::get('/:id/publish/status', 'MarketingDouyinController/checkPublishStatus');
                Route::get('/:id', 'MarketingDouyinController/read');
                Route::post('/', 'MarketingDouyinController/save');
                Route::put('/:id', 'MarketingDouyinController/update');
                Route::delete('/:id', 'MarketingDouyinController/delete');
            });

            Route::group('xiaohongshu', function () {
                Route::get('/', 'MarketingXiaohongshuController/index');
                Route::get('/:id/download', 'MarketingXiaohongshuController/download');
                Route::post('/:id/download', 'MarketingXiaohongshuController/download');
                Route::post('/:id/publish', 'MarketingXiaohongshuController/publish');
                Route::post('publish/callback', 'MarketingXiaohongshuController/publishCallback');
                Route::get('/:id/publish/status', 'MarketingXiaohongshuController/checkPublishStatus');
                Route::get('/:id', 'MarketingXiaohongshuController/read');
                Route::post('/', 'MarketingXiaohongshuController/save');
                Route::put('/:id', 'MarketingXiaohongshuController/update');
                Route::delete('/:id', 'MarketingXiaohongshuController/delete');
            });

            Route::group('bilibili', function () {
                Route::get('/', 'MarketingDouyinController/index');
                Route::get('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/publish', 'MarketingDouyinController/publishBili');
                Route::post('publish/callback', 'MarketingDouyinController/publishCallbackBili');
                Route::get('/:id/publish/status', 'MarketingDouyinController/checkPublishStatusBili');
                Route::get('/:id', 'MarketingDouyinController/read');
                Route::post('/', 'MarketingDouyinController/save');
                Route::put('/:id', 'MarketingDouyinController/update');
                Route::delete('/:id', 'MarketingDouyinController/delete');
            });

            Route::group('kuaishou', function () {
                Route::get('/', 'MarketingDouyinController/index');
                Route::get('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/download', 'MarketingDouyinController/download');
                Route::post('/:id/publish', 'MarketingDouyinController/publishKs');
                Route::post('publish/callback', 'MarketingDouyinController/publishCallbackKs');
                Route::get('/:id/publish/status', 'MarketingDouyinController/checkPublishStatusKs');
                Route::get('/:id', 'MarketingDouyinController/read');
                Route::post('/', 'MarketingDouyinController/save');
                Route::put('/:id', 'MarketingDouyinController/update');
                Route::delete('/:id', 'MarketingDouyinController/delete');
            });

            Route::get('service-config', 'MarketingServiceConfigController/index');
            Route::put('service-config', 'MarketingServiceConfigController/update');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 工单管理
        Route::group('workorders', function () {
            Route::get('/', 'WorkOrderController/index');
            Route::get('/:id', 'WorkOrderController/read');
            Route::post('/', 'WorkOrderController/save');
            Route::put('/:id', 'WorkOrderController/update');
            Route::delete('/:id', 'WorkOrderController/delete');

            Route::post('/:id/assign', 'WorkOrderController/assign');
            Route::post('/:id/accept', 'WorkOrderController/accept');
            Route::post('/:id/start', 'WorkOrderController/start');
            Route::post('/:id/complete', 'WorkOrderController/complete');
            Route::post('/:id/verify', 'WorkOrderController/verify');
            Route::post('/:id/close', 'WorkOrderController/close');

            Route::get('my', 'WorkOrderController/my');
            Route::get('statistics', 'WorkOrderController/statistics');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修人员管理
        Route::group('engineers', function () {
            Route::get('/', 'EngineerController/index');
            Route::get('/:id', 'EngineerController/read');
            Route::post('/', 'EngineerController/save');
            Route::put('/:id', 'EngineerController/update');
            Route::delete('/:id', 'EngineerController/delete');

            Route::get('available', 'EngineerController/available');
            Route::get('recommend', 'EngineerController/recommend');
            Route::get(':id/performance', 'EngineerController/performance');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 排班管理
        Route::group('schedules', function () {
            Route::get('/', 'ScheduleController/index');
            Route::get('/:id', 'ScheduleController/read');
            Route::post('/', 'ScheduleController/save');
            Route::put('/:id', 'ScheduleController/update');
            Route::delete('/:id', 'ScheduleController/delete');

            Route::get('overview', 'ScheduleController/overview');
            Route::post('batch', 'ScheduleController/batchCreate');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 巡检管理
        Route::group('inspections', function () {
            Route::get('/', 'InspectionTaskController/index');
            Route::get('/:id', 'InspectionTaskController/read');
            Route::post('/', 'InspectionTaskController/save');
            Route::put('/:id', 'InspectionTaskController/update');
            Route::delete('/:id', 'InspectionTaskController/delete');

            Route::post('/:id/execute', 'InspectionTaskController/execute');
            Route::get('my', 'InspectionTaskController/my');
            Route::get('overdue', 'InspectionTaskController/overdue');
            Route::get('statistics', 'InspectionTaskController/statistics');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修内容管理（小程序常见问题 - 替换原维修内容）
        Route::group('common-problems', function () {
            Route::get('/device-types', 'CommonProblemController/deviceTypes');
            Route::get('/', 'CommonProblemController/index');
            Route::get('/:id', 'CommonProblemController/read');
            Route::post('/', 'CommonProblemController/save');
            Route::put('/:id', 'CommonProblemController/update');
            Route::delete('/:id', 'CommonProblemController/delete');
            // 数据同步
            Route::post('sync/to-local', 'CommonProblemController/syncToLocal');
            Route::post('sync/from-local', 'CommonProblemController/syncFromLocal');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 兼容旧版：保留原 maintenance-items 路由（指向新控制器）
        Route::group('maintenance-items', function () {
            Route::get('/categories', 'CommonProblemController/deviceTypes');
            Route::get('/', 'CommonProblemController/index');
            Route::get('/:id', 'CommonProblemController/read');
            Route::post('/', 'CommonProblemController/save');
            Route::put('/:id', 'CommonProblemController/update');
            Route::delete('/:id', 'CommonProblemController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修报价单管理
        Route::group('quotation-orders', function () {
            Route::get('/', 'QuotationOrderController/index');
            Route::get('/:id', 'QuotationOrderController/read');
            Route::get('/order/:orderNo', 'QuotationOrderController/getByOrderNo');
            Route::post('/', 'QuotationOrderController/save');
            Route::put('/:id', 'QuotationOrderController/update');
            Route::delete('/:id', 'QuotationOrderController/delete');
            Route::post('/:id/submit', 'QuotationOrderController/submit');
            Route::post('/:id/accept', 'QuotationOrderController/accept');
            Route::post('/:id/reject', 'QuotationOrderController/reject');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 保养管理
        Route::group('maintenance', function () {
            Route::group('plans', function () {
                Route::get('/', 'MaintenancePlanController/index');
                Route::get('/:id', 'MaintenancePlanController/read');
                Route::post('/', 'MaintenancePlanController/save');
                Route::put('/:id', 'MaintenancePlanController/update');
                Route::delete('/:id', 'MaintenancePlanController/delete');
                Route::post('/:id/execute', 'MaintenancePlanController/execute');
            });

            Route::get('history', 'MaintenancePlanController/history');
            Route::get('due', 'MaintenancePlanController/due');
            Route::get('statistics', 'MaintenancePlanController/statistics');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 配件管理
        Route::group('parts', function () {
            Route::get('/', 'SparePartController/index');
            Route::post('/', 'SparePartController/save');

            Route::get('alerts', 'SparePartController/alerts');
            Route::get('records', 'SparePartController/records');
            Route::get('statistics', 'SparePartController/statistics');
            Route::get('export', 'SparePartController/export');

            Route::get('/:id', 'SparePartController/read');
            Route::put('/:id', 'SparePartController/update');
            Route::delete('/:id', 'SparePartController/delete');

            Route::post('/:id/in', 'SparePartController/stockIn');
            Route::post('/:id/out', 'SparePartController/stockOut');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 供应商管理
        Route::group('suppliers', function () {
            Route::get('/', 'SupplierController/index');
            Route::get('/:id', 'SupplierController/read');
            Route::post('/', 'SupplierController/save');
            Route::put('/:id', 'SupplierController/update');
            Route::delete('/:id', 'SupplierController/delete');

            Route::get('statistics', 'SupplierController/statistics');
            Route::get(':id/parts', 'SupplierController/parts');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 机械分类管理
        Route::group('repair-categories', function () {
            Route::get('/', 'RepairCategoryController/index');
            Route::get('active-list', 'RepairCategoryController/activeList');
            Route::get('/:id', 'RepairCategoryController/read');
            Route::post('/', 'RepairCategoryController/save');
            Route::put('/:id', 'RepairCategoryController/update');
            Route::delete('/:id', 'RepairCategoryController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修业务 - 机械名称管理
        Route::group('repair-machines', function () {
            Route::get('/', 'RepairMachineController/index');
            Route::get('category/:categoryId', 'RepairMachineController/byCategory');
            Route::get('/:id', 'RepairMachineController/read');
            Route::post('/', 'RepairMachineController/save');
            Route::put('/:id', 'RepairMachineController/update');
            Route::delete('/:id', 'RepairMachineController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 知识库管理
        Route::group('knowledge', function () {
            Route::get('/', 'KnowledgeBaseController/index');
            Route::get('/:id', 'KnowledgeBaseController/read');
            Route::post('/', 'KnowledgeBaseController/save');
            Route::put('/:id', 'KnowledgeBaseController/update');
            Route::delete('/:id', 'KnowledgeBaseController/delete');

            Route::get('search', 'KnowledgeBaseController/search');
            Route::get('hot', 'KnowledgeBaseController/hot');
            Route::get('statistics', 'KnowledgeBaseController/statistics');

            // 向量搜索相关
            Route::post('vector/rebuild', 'KnowledgeBaseController/rebuildVector');
            Route::get('vector/stats', 'KnowledgeBaseController/vectorStats');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 知识库模块（向量知识库 + RAG对话）
        Route::group('kb', function () {
            // 知识库集合管理
            Route::group('collections', function () {
                Route::get('/', 'KbCollectionController/index');
                Route::get('/:id', 'KbCollectionController/read');
                Route::post('/', 'KbCollectionController/save');
                Route::put('/:id', 'KbCollectionController/update');
                Route::delete('/:id', 'KbCollectionController/delete');
            });

            // 文件管理
            Route::group('files', function () {
                Route::get('/', 'KbFileController/index');
                // 注意：更具体的路由必须在更通用的路由之前
                Route::get('/:id/content', 'KbFileController/getFileContent');
                Route::get('/:id/download', 'KbFileController/download')->allowCrossDomain();
                Route::get('/:id', 'KbFileController/read');
                Route::post('/upload', 'KbFileController/upload');
                Route::delete('/:id', 'KbFileController/delete');
                Route::post('/:id/reprocess', 'KbFileController/reprocess');
                Route::post('/batch-reprocess', 'KbFileController/batchReprocess');
            });

            // AI 聊天
            Route::group('chat', function () {
                // 带参数的路由必须放在不带参数的路由之前
                Route::delete('sessions/:sessionId', 'KbChatController/deleteSession');
                Route::get('sessions/:sessionId/messages', 'KbChatController/messages');
                Route::post('sessions/:sessionId/send', 'KbChatController/send');
                Route::get('sessions', 'KbChatController/sessions');
                Route::post('sessions', 'KbChatController/createSession');
            })->middleware(function($request, $next) {
                \think\facade\Log::info('KB Chat路由 - Path: ' . $request->pathinfo() . ', Method: ' . $request->method());
                return $next($request);
            });
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 成本分析
        Route::group('costs', function () {
            Route::get('overview', 'CostAnalysisController/overview');
            Route::get('trend', 'CostAnalysisController/trend');
            Route::get('top-devices', 'CostAnalysisController/topDevices');
            Route::get('department-stats', 'CostAnalysisController/departmentStats');
            Route::get('cost-type-analysis', 'CostAnalysisController/costTypeAnalysis');
            Route::get('top-parts', 'CostAnalysisController/topParts');
            Route::get('comprehensive', 'CostAnalysisController/comprehensive');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 报表中心
        Route::group('reports', function () {
            Route::get('types', 'ReportController/types');
            Route::get('device', 'ReportController/device');
            Route::get('maintenance', 'ReportController/maintenance');
            Route::get('inventory', 'ReportController/inventory');
            Route::get('cost', 'ReportController/cost');
            Route::get(':type', 'ReportController/generate');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 通知中心
        Route::group('notifications', function () {
            Route::get('/', 'NotificationController/index');
            Route::get('unread-count', 'NotificationController/unreadCount');
            Route::get('statistics', 'NotificationController/statistics');

            Route::post('mark-all-read', 'NotificationController/markAllAsRead');
            Route::delete('clear-read', 'NotificationController/clearRead');
            Route::post('create', 'NotificationController/create');
            Route::post('create-batch', 'NotificationController/createBatch');
            Route::post('check-stock-alerts', 'NotificationController/checkStockAlerts');
            Route::post('check-maintenance', 'NotificationController/checkMaintenanceDue');

            Route::post('mark-read/:id', 'NotificationController/markAsRead');
            Route::delete(':id', 'NotificationController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 系统智能体
        Route::group('agent', function () {
            Route::post('chat', 'AgentController/chat');
        });

        // 检测报告管理
        Route::group('test-reports', function () {
            Route::get('/', 'TestReportController/index');
            Route::get('/:id', 'TestReportController/read');
            Route::post('/', 'TestReportController/save');
            Route::put('/:id', 'TestReportController/update');
            Route::delete('/:id', 'TestReportController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修报告管理
        Route::group('repair-reports', function () {
            Route::post('/import', 'RepairReportController/importFromRepair');
            Route::get('/import-preview', 'RepairReportController/importPreview');
            Route::post('/import-single', 'RepairReportController/importSingle');

            Route::get('/', 'RepairReportController/index');
            Route::get('/:id', 'RepairReportController/read');
            Route::post('/', 'RepairReportController/save');
            Route::put('/:id', 'RepairReportController/update');
            Route::delete('/:id', 'RepairReportController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 维修合同管理
        Route::group('repair-contracts', function () {
            Route::get('/', 'RepairContractController/index');
            Route::get('statistics', 'RepairContractController/statistics');
            Route::get('/:id', 'RepairContractController/read');
            Route::post('/', 'RepairContractController/save');
            Route::post('create-from-template', 'RepairContractController/createFromTemplate');
            Route::post('batch-delete', 'RepairContractController/batchDelete');
            Route::put('/:id', 'RepairContractController/update');
            Route::delete('/:id', 'RepairContractController/delete');
            Route::post('/:id/activate', 'RepairContractController/activate');
            Route::post('/:id/terminate', 'RepairContractController/terminate');
            Route::post('/:id/export', 'RepairContractController/export');

            // 合同项目明细
            Route::get('/:contractId/items', 'RepairContractItemController/index');
            Route::get('/:contractId/items/summary', 'RepairContractItemController/summary');
            Route::post('/:contractId/items', 'RepairContractItemController/save');
            Route::post('/:contractId/items/batch', 'RepairContractItemController/batchSave');
            Route::get('items/:id', 'RepairContractItemController/read');
            Route::put('items/:id', 'RepairContractItemController/update');
            Route::delete('items/:id', 'RepairContractItemController/delete');
            Route::post('items/batch-delete', 'RepairContractItemController/batchDelete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 合同模板管理
        Route::group('contract-templates', function () {
            Route::get('/', 'ContractTemplateController/index');
            Route::get('variables', 'ContractTemplateController/getVariables');
            Route::post('import-pdf', 'ContractTemplateController/importPdf');
            Route::post('parse-text', 'ContractTemplateController/parseText');
            Route::get('/:id', 'ContractTemplateController/read');
            Route::post('/', 'ContractTemplateController/save');
            Route::post('export-pdf', 'ContractTemplateController/exportPdf');
            Route::post('batch-delete', 'ContractTemplateController/batchDelete');
            Route::post('/:id/preview', 'ContractTemplateController/preview');
            Route::post('/:id/copy', 'ContractTemplateController/copy');
            Route::put('/:id', 'ContractTemplateController/update');
            Route::delete('/:id', 'ContractTemplateController/delete');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 支付模块
        Route::group('payment', function () {
            // 转账支付
            Route::group('transfers', function () {
                Route::get('/', 'TransferController/index');
                Route::get('statistics', 'TransferController/statistics');
                Route::get('export', 'TransferController/export');
                Route::get('/:id', 'TransferController/read');
                Route::post('/', 'TransferController/save');
                Route::put('/:id', 'TransferController/update');
                Route::delete('/:id', 'TransferController/delete');
                Route::post('/:id/confirm', 'TransferController/confirm');
                Route::post('/:id/cancel', 'TransferController/cancel');
            });

            // 在线支付
            Route::group('online', function () {
                Route::get('/', 'OnlinePaymentController/index');
                Route::get('statistics', 'OnlinePaymentController/statistics');
                Route::get('analytics', 'OnlinePaymentController/analytics');
                Route::get('/:id', 'OnlinePaymentController/read');
                Route::post('/', 'OnlinePaymentController/save');
                Route::put('/:id', 'OnlinePaymentController/update');
                Route::delete('/:id', 'OnlinePaymentController/delete');
                Route::post('/:id/refund', 'OnlinePaymentController/refund');
            });

            // 发票管理
            Route::group('invoices', function () {
                Route::get('/', 'InvoiceController/index');
                Route::get('statistics', 'InvoiceController/statistics');
                Route::get('export', 'InvoiceController/export');
                Route::get('/:id', 'InvoiceController/read');
                Route::post('/', 'InvoiceController/save');
                Route::put('/:id', 'InvoiceController/update');
                Route::delete('/:id', 'InvoiceController/delete');
                Route::post('/:id/issue', 'InvoiceController/issue');
                Route::post('/:id/void', 'InvoiceController/voidInvoice');
            });
        })->middleware([\app\middleware\JwtAuth::class, \app\middleware\PermissionCheck::class])->allowCrossDomain();

        // 维修提醒管理
        Route::group('repair-reminders', function () {
            Route::get('/', 'RepairReminderController/index');
            // 具体路径必须放在 /:id 动态路由之前，否则会被当作 id 匹配
            Route::get('overdue-orders', 'RepairReminderController/overdueOrders');
            Route::post('/send-due-email', 'RepairReminderController/sendDueEmail');
            Route::get('/:id', 'RepairReminderController/read');
            Route::post('/', 'RepairReminderController/save');
            Route::put('/:id', 'RepairReminderController/update');
            Route::delete('/:id', 'RepairReminderController/delete');
            Route::post('/:id/send-email', 'RepairReminderController/sendEmail');
            Route::post('/:id/send-order-reminder', 'RepairReminderController/sendOrderReminder');
        })->middleware([\app\middleware\PermissionCheck::class]);

        // 小程序需要认证的路由
        Route::group('miniprogram', function () {
            Route::get('user/info', 'MiniprogramController/getUserInfo');
            Route::post('user/avatar', 'MiniprogramController/uploadAvatar');

            Route::get('addresses', 'MiniprogramController/getAddresses');
            Route::post('addresses', 'MiniprogramController/createAddress');
            Route::put('addresses/:id', 'MiniprogramController/updateAddress');
            Route::delete('addresses/:id', 'MiniprogramController/deleteAddress');
            Route::post('addresses/:id/default', 'MiniprogramController/setDefaultAddress');

            Route::post('orders/create', 'MiniprogramController/createOrder');
            Route::get('orders/user/:userId', 'MiniprogramController/getUserOrders');
            Route::get('orders/:id/detail', 'MiniprogramController/getOrderDetail');
            Route::post('orders/:id/cancel', 'MiniprogramController/cancelOrder');
            Route::put('orders/:id/edit', 'MiniprogramController/editOrder');
            Route::post('orders/:id/refund', 'MiniprogramController/refundOrder');
            Route::post('orders/submit-review', 'MiniprogramController/submitReview');

            Route::get('chat/human-status', 'MiniprogramController/getHumanStatus');
            Route::post('chat/clear-history', 'MiniprogramController/clearHistory');
        })->middleware([\app\middleware\JwtAuth::class])->allowCrossDomain();

        // 小程序进度同步（需要认证）
        Route::group('miniprogram-progress', function () {
            Route::post('sync', 'MiniprogramProgressSyncController/syncProgress');
            Route::post('sync-photo', 'MiniprogramProgressSyncController/syncProgressPhoto');
            Route::post('sync-video', 'MiniprogramProgressSyncController/syncProgressVideo');
            Route::get('/:orderId', 'MiniprogramProgressSyncController/getMiniprogramOrderProgress');
        })->middleware([\app\middleware\JwtAuth::class])->allowCrossDomain();
        // 小程序进度上传（需要认证）

        // 小程序数据同步（需要认证）
        Route::group('miniprogram-sync', function () {
            Route::post('progress', 'MiniprogramDataSyncController/syncProgress');
            Route::post('photos', 'MiniprogramDataSyncController/syncProgressPhotos');
            Route::post('videos', 'MiniprogramDataSyncController/syncProgressVideos');
            Route::post('all', 'MiniprogramDataSyncController/syncAll');
        })->middleware([\app\middleware\JwtAuth::class])->allowCrossDomain();
        Route::group('miniprogram-upload', function () {
            Route::post('photo', 'MiniprogramProgressUploadController/uploadPhoto');
            Route::post('video', 'MiniprogramProgressUploadController/uploadVideo');
        })->middleware([\app\middleware\JwtAuth::class])->allowCrossDomain();

        // 小程序单位相关（兼容小程序调用，需要认证）
        Route::group('user', function () {
            Route::get('companies', 'MiniprogramController/getCompanies');
            Route::post('companies', 'MiniprogramController/createCompany');
            Route::put('companies/:id', 'MiniprogramController/updateCompany');
            Route::delete('companies/:id', 'MiniprogramController/deleteCompany');
            Route::post('companies/:id/default', 'MiniprogramController/setDefaultCompany');
        })->middleware([\app\middleware\JwtAuth::class])->allowCrossDomain();

        // 用户信息更新（兼容小程序调用）
        Route::post('auth/profile', 'MiniprogramController/updateProfile')
            ->middleware([\app\middleware\JwtAuth::class])
            ->allowCrossDomain();

        })->middleware([\app\middleware\JwtAuth::class, \app\middleware\OperationLog::class])->allowCrossDomain();

    // 对外只读接口（供其它系统拉取设备信息；API Key 鉴权，免 JWT，允许跨域）
    Route::group('open/order-devices', function () {
        Route::get('/', 'OpenOrderDeviceController/index');
        Route::get('/:id', 'OpenOrderDeviceController/read');
    })->allowCrossDomain();

    // 小程序后台 - 独立认证 + 权限
    Route::group('mini-admin', function () {
        Route::group('auth', function () {
            Route::post('logout', 'MiniAdminAuthController/logout');
            Route::get('profile', 'MiniAdminAuthController/profile');
        });

        Route::group('orders', function () {
            Route::get('/', 'MiniAdminOrderController/index');
            Route::get('/:id', 'MiniAdminOrderController/read');
            Route::post('/', 'MiniAdminOrderController/save');
            Route::put('/:id', 'MiniAdminOrderController/update');
            Route::delete('/:id', 'MiniAdminOrderController/delete');
        });

        Route::group('progress', function () {
            Route::get('/', 'MiniAdminProgressController/index');
            Route::get('statistics', 'MiniAdminProgressController/statistics');
            Route::get('/:id/photos', 'MiniAdminProgressController/getPhotos');
            Route::get('/:id/videos', 'MiniAdminProgressController/getVideos');
            Route::put('/:id/progress', 'MiniAdminProgressController/updateProgress');
            Route::get('/:id', 'MiniAdminProgressController/read');
        });

        Route::group('progress-media', function () {
            Route::get('summary', 'MiniAdminProgressMediaController/getSummary');
            Route::get('photos', 'MiniAdminProgressMediaController/getPhotos');
            Route::get('photos/:orderId', 'MiniAdminProgressMediaController/getPhotosByOrder');
            Route::get('photos/detail/:id', 'MiniAdminProgressMediaController/getPhotoDetail');
            Route::post('photos', 'MiniAdminProgressMediaController/createPhoto');
            Route::put('photos/:id', 'MiniAdminProgressMediaController/updatePhoto');
            Route::delete('photos/:id', 'MiniAdminProgressMediaController/deletePhoto');
            Route::get('videos', 'MiniAdminProgressMediaController/getVideos');
            Route::get('videos/:orderId', 'MiniAdminProgressMediaController/getVideosByOrder');
            Route::get('videos/detail/:id', 'MiniAdminProgressMediaController/getVideoDetail');
            Route::post('videos', 'MiniAdminProgressMediaController/createVideo');
            Route::put('videos/:id', 'MiniAdminProgressMediaController/updateVideo');
            Route::delete('videos/:id', 'MiniAdminProgressMediaController/deleteVideo');
        });

        Route::group('progress-apply', function () {
            Route::get('/', 'MiniAdminProgressApplyController/index');
            Route::get('statistics', 'MiniAdminProgressApplyController/statistics');
            Route::post('sync', 'MiniAdminProgressApplyController/sync');
            Route::get('/:id', 'MiniAdminProgressApplyController/read');
            Route::post('/', 'MiniAdminProgressApplyController/save');
            Route::post('/:id/approve', 'MiniAdminProgressApplyController/approve');
            Route::post('/:id/reject', 'MiniAdminProgressApplyController/reject');
            Route::delete('/:id', 'MiniAdminProgressApplyController/delete');
        });

        Route::group('reviews', function () {
            Route::get('/', 'MiniAdminReviewController/index');
            Route::get('statistics', 'MiniAdminReviewController/statistics');
            Route::get('export', 'MiniAdminReviewController/export');
            Route::get('/:id', 'MiniAdminReviewController/read');
            Route::post('/:id/reply', 'MiniAdminReviewController/reply');
            Route::delete('/:id', 'MiniAdminReviewController/delete');
        });

        Route::group('users', function () {
            Route::get('/', 'MiniAdminUserController/index');
            Route::get('/:id', 'MiniAdminUserController/read');
            Route::put('/:id', 'MiniAdminUserController/update');
            Route::delete('/:id', 'MiniAdminUserController/delete');
        });

        Route::group('addresses', function () {
            Route::get('/', 'MiniAdminAddressController/index');
            Route::get('/:id', 'MiniAdminAddressController/read');
            Route::post('/', 'MiniAdminAddressController/save');
            Route::put('/:id', 'MiniAdminAddressController/update');
            Route::delete('/:id', 'MiniAdminAddressController/delete');
        });

        Route::group('units', function () {
            Route::get('/', 'MiniAdminUnitController/index');
            Route::get('/:id', 'MiniAdminUnitController/read');
            Route::post('/', 'MiniAdminUnitController/save');
            Route::put('/:id', 'MiniAdminUnitController/update');
            Route::delete('/:id', 'MiniAdminUnitController/delete');
        });

        Route::group('brands', function () {
            Route::get('/', 'MiniAdminBrandController/index');
            Route::get('/:id', 'MiniAdminBrandController/read');
            Route::post('/', 'MiniAdminBrandController/save');
            Route::put('/:id', 'MiniAdminBrandController/update');
            Route::delete('/:id', 'MiniAdminBrandController/delete');
        });

        Route::group('device-types', function () {
            Route::get('/', 'MiniAdminDeviceTypeController/index');
            Route::get('/:id', 'MiniAdminDeviceTypeController/read');
            Route::post('/', 'MiniAdminDeviceTypeController/save');
            Route::put('/:id', 'MiniAdminDeviceTypeController/update');
            Route::delete('/:id', 'MiniAdminDeviceTypeController/delete');
        });

        Route::group('common-problems', function () {
            Route::get('/', 'MiniAdminCommonProblemController/index');
            Route::get('device-types', 'MiniAdminCommonProblemController/deviceTypes');
            Route::post('sync/to-local', 'MiniAdminCommonProblemController/syncToLocal');
            Route::post('sync/from-local', 'MiniAdminCommonProblemController/syncFromLocal');
            Route::get('/:id', 'MiniAdminCommonProblemController/read');
            Route::post('/', 'MiniAdminCommonProblemController/save');
            Route::put('/:id', 'MiniAdminCommonProblemController/update');
            Route::delete('/:id', 'MiniAdminCommonProblemController/delete');
        });

        Route::group('chats', function () {
            Route::get('/', 'MiniAdminChatController/index');
            Route::get('/:id', 'MiniAdminChatController/read');
            Route::put('/:id', 'MiniAdminChatController/update');
            Route::post('messages/:id/remark', 'MiniAdminChatController/remarkMessage');
        });

        Route::group('payments', function () {
            Route::get('/', 'MiniAdminPaymentController/index');
            Route::get('/:id', 'MiniAdminPaymentController/read');
            Route::put('/:id', 'MiniAdminPaymentController/update');
            Route::delete('/:id', 'MiniAdminPaymentController/delete');
        });

        Route::group('configs', function () {
            Route::get('/', 'MiniAdminSystemConfigController/index');
            Route::get('/:id', 'MiniAdminSystemConfigController/read');
            Route::post('/', 'MiniAdminSystemConfigController/save');
            Route::put('/:id', 'MiniAdminSystemConfigController/update');
            Route::delete('/:id', 'MiniAdminSystemConfigController/delete');
        });

        Route::group('sync-logs', function () {
            Route::get('/', 'MiniAdminSyncLogController/index');
            Route::get('/:id', 'MiniAdminSyncLogController/read');
            Route::post('/:id/retry', 'MiniAdminSyncLogController/retry');
        });
    })->middleware([\app\middleware\MiniAdminJwtAuth::class, \app\middleware\MiniAdminPermissionCheck::class])->allowCrossDomain();

    // 附件管理（Docker 数据卷存储）
    Route::group('attachments', function () {
        Route::get('/', 'AttachmentController/index');
        Route::post('upload', 'AttachmentController/upload');
        Route::get('serve/:id', 'AttachmentController/serve');
        Route::get('download/:id', 'AttachmentController/download');
        Route::delete('/:id', 'AttachmentController/delete');
    })->allowCrossDomain();

    // 文件上传（公开路由，兼容旧版接口）
    Route::post('upload', 'UploadController/upload');

    // 批量重新处理文件（临时公开路由，用于测试）
    Route::post('kb/batch-reprocess', 'KbFileController/batchReprocess')->allowCrossDomain();
})->allowCrossDomain();
