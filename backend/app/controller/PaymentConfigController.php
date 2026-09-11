<?php

namespace app\controller;

use think\facade\Db;
use think\facade\Request;

/**
 * 支付配置 - repair 库 system_config 键值表
 *
 * 管理各支付方式的启用状态等配置，小程序端与后台共用同一份配置。
 */
class PaymentConfigController extends BaseController
{
    /** 配置项定义：key => [说明, 默认值] */
    private const DEFINITIONS = [
        'payment_wechat_enabled'   => ['微信支付（小程序）', '1'],
        'payment_alipay_enabled'   => ['支付宝', '0'],
        'payment_bank_enabled'     => ['银行转账', '0'],
        'payment_balance_enabled'  => ['余额支付', '0'],
        'payment_wechat_mch_id'    => ['微信商户号', ''],
        'payment_service_phone'    => ['支付客服电话', ''],
    ];

    /**
     * 读取支付配置
     * GET /api/payment/config
     */
    public function index()
    {
        try {
            $rows = Db::connect('repair')
                ->name('system_config')
                ->whereIn('config_key', array_keys(self::DEFINITIONS))
                ->column('config_value', 'config_key');

            $items = [];
            foreach (self::DEFINITIONS as $key => [$label, $default]) {
                $items[] = [
                    'key'    => $key,
                    'label'  => $label,
                    'value'  => (string)($rows[$key] ?? $default),
                    'default' => $default,
                ];
            }

            return $this->success(['items' => $items]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 保存支付配置（键值 upsert）
     * PUT /api/payment/config   body: {values: {key: value}}
     */
    public function save()
    {
        try {
            $data = Request::post();
            $values = $data['values'] ?? [];

            if (!is_array($values) || empty($values)) {
                return $this->error('没有要保存的配置项', 422);
            }

            $now = date('Y-m-d H:i:s');
            $updated = 0;
            foreach ($values as $key => $value) {
                if (!isset(self::DEFINITIONS[$key])) {
                    continue; // 只允许白名单内的键，防止误改其他系统配置
                }
                $exists = Db::connect('repair')->name('system_config')
                    ->where('config_key', $key)->count();
                if ($exists) {
                    Db::connect('repair')->name('system_config')
                        ->where('config_key', $key)
                        ->update(['config_value' => (string)$value, 'updated_at' => $now]);
                } else {
                    Db::connect('repair')->name('system_config')->insert([
                        'config_key'   => $key,
                        'config_value' => (string)$value,
                        'updated_at'   => $now,
                    ]);
                }
                $updated++;
            }

            if ($updated === 0) {
                return $this->error('没有可识别的配置项', 422);
            }

            return $this->success(['updated' => $updated], '支付配置已保存');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
