<?php

namespace app\controller;

use app\common\Result;
use think\facade\Log;

/**
 * 控制器基类
 */
class BaseController
{
    /**
     * 操作成功返回数据
     * @param mixed $data 返回数据
     * @param string $message 提示信息
     * @param int $code 状态码
     * @return \think\Response
     */
    protected function success($data = null, $message = 'success', $code = 200)
    {
        return Result::success($data, $message, $code);
    }

    /**
     * 操作失败返回数据
     * @param string $message 错误信息
     * @param int $code 状态码
     * @param mixed $data 返回数据
     * @return \think\Response
     */
    protected function error($message = 'error', $code = 400, $data = null)
    {
        return Result::error($message, $code, $data);
    }

    /**
     * 获取请求参数
     * @param array $rules 验证规则
     * @param array $message 验证消息
     * @return array
     */
    protected function getRequestData($rules = [], $message = [])
    {
        // 调试：记录原始请求
        $url = request()->url();
        Log::info("获取请求数据参数 - URL: " . $url);

        $data = request()->post();

        if (empty($data)) {
            $raw = file_get_contents('php://input');
            Log::info("从php://input读取原始数据: " . $raw);
            $json = json_decode($raw, true);
            if (is_array($json)) {
                $data = $json;
            }
        }

        Log::info("获取请求数据 - 解析后的数据: " . json_encode($data, JSON_UNESCAPED_UNICODE));

        if (!empty($rules)) {
            $validate = validate()->rule($rules)->message($message);
            if (!$validate->check($data)) {
                throw new \Exception($validate->getError());
            }
        }

        return $data;
    }

    protected function getUserId()
    {
        $userId = request()->userId ?? null;
        if (!$userId) {
            throw new \Exception('未登录');
        }
        return intval($userId);
    }
}
