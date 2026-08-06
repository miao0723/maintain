<?php

namespace app\service;

use AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi;
use \Exception;
use AlibabaCloud\SDK\Dysmsapi\V20170525\Models\SendSmsRequest;
use AlibabaCloud\Tea\Util\Util;

/**
 * 阿里云号码认证服务 - 短信认证
 * 替换了原有的短信服务，使用号码认证服务的短信认证功能
 */
class SmsService
{
    private $accessKeyId;
    private $accessKeySecret;
    private $signName;
    private $templateCode;
    private $client;

    public function __construct()
    {
        $this->accessKeyId = getenv('AccessKeyId');
        $this->accessKeySecret = getenv('AccessKeySecret');
        $this->signName = getenv('ALIYUN_SMS_SIGN_NAME') ?: '维修提醒';
        $this->templateCode = getenv('ALIYUN_SMS_TEMPLATE_CODE') ?: 'SMS_123456789';
    }

    /**
     * 获取阿里云短信客户端
     */
    private function getClient()
    {
        if ($this->client === null) {
            $config = new \stdClass();
            $config->accessKeyId = $this->accessKeyId;
            $config->accessKeySecret = $this->accessKeySecret;
            $config->endpoint = "dysmsapi.aliyuncs.com";
            $config->regionId = "cn-hangzhou";

            $this->client = Dysmsapi::client($config);
        }
        return $this->client;
    }

    /**
     * 发送短信（使用号码认证服务的短信认证功能）
     * @param string $phoneNumber 目标手机号
     * @param array $templateParams 模板参数 ['param1' => 'value1', ...]
     * @param string $templateCode 模板ID（可选，默认使用配置中的）
     * @param string $signName 签名（可选，默认使用配置中的）
     * @return array [success=>bool, message=>string, data=>mixed]
     */
    public function sendSms($phoneNumber, $templateParams = [], $templateCode = null, $signName = null)
    {
        if (empty($this->accessKeyId) || empty($this->accessKeySecret)) {
            return ['success' => false, 'message' => '阿里云配置不完整，请检查 .env 文件中的 AccessKeyId 和 AccessKeySecret'];
        }

        if (empty($phoneNumber)) {
            return ['success' => false, 'message' => '手机号不能为空'];
        }

        // 规范化手机号（去除空格和横线）
        $phoneNumber = $this->normalizePhoneNumber($phoneNumber);

        // 验证手机号格式
        if (!$this->isValidPhoneNumber($phoneNumber)) {
            return ['success' => false, 'message' => '手机号格式不正确'];
        }

        $signName = $signName ?: $this->signName;
        $templateCode = $templateCode ?: $this->templateCode;

        if (empty($signName) || empty($templateCode)) {
            return ['success' => false, 'message' => '短信签名或模板ID未配置'];
        }

        try {
            $client = $this->getClient();

            $sendSmsRequest = new SendSmsRequest([
                'phoneNumbers' => $phoneNumber,
                'signName' => $signName,
                'templateCode' => $templateCode,
                'templateParam' => json_encode($templateParams, JSON_UNESCAPED_UNICODE),
            ]);

            $response = $client->sendSms($sendSmsRequest);

            $body = $response->body;
            if ($body->code === 'OK') {
                return [
                    'success' => true,
                    'message' => '短信发送成功',
                    'data' => [
                        'bizId' => $body->bizId ?? '',
                        'code' => $body->code,
                        'message' => $body->message,
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => "短信发送失败: {$body->message}",
                    'data' => [
                        'code' => $body->code,
                        'message' => $body->message,
                    ]
                ];
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => '短信发送异常: ' . $e->getMessage()
            ];
        }
    }

    /**
     * 发送维修提醒短信
     * @param string $phoneNumber 目标手机号
     * @param string $title 提醒标题
     * @param string $machineName 设备名称
     * @param string $remindDate 提醒日期
     * @return array
     */
    public function sendReminderSms($phoneNumber, $title, $machineName, $remindDate)
    {
        $templateParams = [
            'title' => $title,
            'machine' => $machineName,
            'date' => $remindDate
        ];

        return $this->sendSms($phoneNumber, $templateParams);
    }

    /**
     * 规范化手机号
     * @param string $phoneNumber
     * @return string
     */
    private function normalizePhoneNumber($phoneNumber)
    {
        // 去除空格、横线、括号等
        return preg_replace('/[\s\-\(\)]/', '', $phoneNumber);
    }

    /**
     * 验证手机号格式（中国大陆手机号）
     * @param string $phoneNumber
     * @return bool
     */
    private function isValidPhoneNumber($phoneNumber)
    {
        // 中国大陆手机号：1开头，第二位3-9，共11位
        return preg_match('/^1[3-9]\d{9}$/', $phoneNumber) === 1;
    }

    /**
     * 验证配置是否完整
     * @return array
     */
    public function validateConfig()
    {
        $errors = [];

        if (empty($this->accessKeyId)) {
            $errors[] = 'AccessKeyId 未配置';
        }

        if (empty($this->accessKeySecret)) {
            $errors[] = 'AccessKeySecret 未配置';
        }

        if (empty($this->signName)) {
            $errors[] = 'ALIYUN_SMS_SIGN_NAME 未配置';
        }

        if (empty($this->templateCode)) {
            $errors[] = 'ALIYUN_SMS_TEMPLATE_CODE 未配置';
        }

        if (empty($errors)) {
            return ['success' => true, 'message' => '配置完整'];
        }

        return ['success' => false, 'message' => implode('; ', $errors)];
    }
}
