<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 客服配置控制器
 * 表: marketing_service_config
 */
class MarketingServiceConfigController
{
    /**
     * 获取客服配置
     * GET /api/marketing/service-config
     */
    public function index()
    {
        try {
            // 获取第一条有数据的配置记录（系统只有一条配置）
            $config = Db::name('marketing_service_config')
                ->where('phone', '<>', '')
                ->find();

            if (!$config) {
                // 如果不存在有数据的配置，返回默认空数据
                return Result::success([
                    'id' => 0,
                    'phone' => '',
                    'wechat' => '',
                    'qq' => '',
                    'email' => '',
                    'work_time' => '',
                    'qrcode' => '',
                    'description' => '',
                    'status' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }

            return Result::success($config);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新客服配置
     * PUT /api/marketing/service-config
     */
    public function update()
    {
        $data = request()->put();

        try {
            // 验证必填字段
            if (empty($data['phone'])) {
                return Result::error('客服电话不能为空', 400);
            }

            // 获取当前有数据的配置
            $config = Db::name('marketing_service_config')
                ->where('phone', '<>', '')
                ->find();

            if ($config) {
                // 更新现有配置
                $data['updated_at'] = date('Y-m-d H:i:s');
                Db::name('marketing_service_config')->where('id', $config['id'])->update($data);
                $config = Db::name('marketing_service_config')->find($config['id']);
            } else {
                // 创建新配置
                $data['created_at'] = date('Y-m-d H:i:s');
                $data['updated_at'] = date('Y-m-d H:i:s');
                $id = Db::name('marketing_service_config')->insertGetId($data);
                $config = Db::name('marketing_service_config')->find($id);
            }

            return Result::success($config, '客服配置更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}