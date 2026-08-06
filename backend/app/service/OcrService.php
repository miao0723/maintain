<?php

namespace app\service;

use think\facade\Log;

/**
 * OCR 识别服务
 * 使用 Kimi OCR 识别文档内容
 */
class OcrService
{
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('KIMI_API_KEY');
    }

    /**
     * 识别合同文件内容
     * @param string $filePath 文件路径
     * @return array 识别结果
     */
    public function recognizeContract($filePath)
    {
        try {
            $fileExt = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

            // 只支持图片格式进行 OCR，PDF/DOC 需要先转换
            if (!in_array($fileExt, ['jpg', 'jpeg', 'png', 'gif'])) {
                return [
                    'note' => '当前仅支持图片格式的 OCR 识别，PDF/DOC 文件请手动填写信息'
                ];
            }

            // TODO: 实现 Kimi OCR API 调用
            // 暂时返回空结果，避免报错
            return [
                'note' => 'OCR 识别功能开发中'
            ];

        } catch (\Exception $e) {
            Log::error('OCR 识别异常：' . $e->getMessage());
            return [
                'error' => 'OCR 识别失败：' . $e->getMessage()
            ];
        }
    }
}
