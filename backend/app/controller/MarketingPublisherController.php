<?php

namespace app\controller;

use app\common\Result;
use app\service\PublisherService;
use think\facade\Db;

/**
 * 自动发布服务的账号管理入口（扫码登录 / 登录态校验 / 退出）。
 *
 * 这里只是把前端的请求透传给跑在 Windows 宿主机上的 publisher-service，
 * 自身不保存任何登录态——Cookie 由发布服务沉淀在浏览器 user_data_dir 里。
 */
class MarketingPublisherController
{
    private PublisherService $publisher;

    public function __construct()
    {
        $this->publisher = new PublisherService();
    }

    /**
     * 健康检查：前端进入「账号管理」先打一下，判断宿主机服务是否在线。
     */
    public function health()
    {
        $resp = $this->publisher->health();
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 列出 4 个平台的登录状态 / 队列 / 扫码入口。
     */
    public function accounts()
    {
        $resp = $this->publisher->accounts();
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 发起扫码登录：返回 session_id，前端每秒轮询 loginStatus 拿二维码 base64。
     */
    public function loginStart($platform)
    {
        $account = (string)(request()->post('account', 'default'));
        $resp = $this->publisher->startLogin($platform, $account);
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 轮询登录会话：pending → waiting_scan → success / failed / expired。
     */
    public function loginStatus($platform, $session)
    {
        $resp = $this->publisher->loginStatus($platform, $session);
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 取消正在进行的登录会话。
     */
    public function loginCancel($platform, $session)
    {
        $resp = $this->publisher->cancelLogin($platform, $session);
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 主动校验某平台登录态（会开浏览器跑一圈，比较慢，给足超时）。
     */
    public function check($platform)
    {
        $account = (string)(request()->post('account', 'default'));
        $resp = $this->publisher->checkAccount($platform, $account);
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 退出登录：清空浏览器 Cookie。
     */
    public function logout($platform)
    {
        $account = (string)(request()->get('account', 'default'));
        $resp = $this->publisher->logout($platform, $account);
        if (!$resp['ok']) {
            return Result::error($resp['message'], $resp['code'] ?: 502);
        }
        return Result::success($resp['data'], $resp['message']);
    }

    /**
     * 透传发布服务的失败截图（二进制）。path 来自任务记录的 screenshot 字段。
     */
    public function screenshot()
    {
        $path = (string)(request()->get('path', ''));
        if ($path === '') {
            return Result::error('缺少截图路径', 400);
        }

        $resp = $this->publisher->screenshotRaw($path);
        if (!$resp['ok']) {
            return json(['code' => $resp['code'] ?: 500, 'message' => '截图获取失败：' . $resp['error'], 'data' => null]);
        }

        header('Content-Type: ' . ($resp['content_type'] ?: 'image/png'));
        echo $resp['body'];
        exit;
    }
}
