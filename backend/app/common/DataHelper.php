<?php

namespace app\common;

/**
 * 数据辅助类
 * 统一处理数据过滤和验证
 */
class DataHelper
{
    /**
     * 历史小程序上传目录
     */
    private const LEGACY_MINIPROGRAM_UPLOAD_ROOT = '电子维修2.0';
    private const SHARED_MINIPROGRAM_UPLOAD_ROOTS = [
        '/var/www/html/miniprogram-uploads',
        'D:\\maintain\\电子维修2.0\\uploads',
    ];

    /**
     * 过滤允许的字段
     *
     * @param array $data
     * @param array $allowedFields
     * @return array
     */
    public static function filterAllowedFields($data, $allowedFields)
    {
        return array_intersect_key($data, array_flip($allowedFields));
    }

    /**
     * 设置默认值
     *
     * @param array $data
     * @param array $defaults
     * @return array
     */
    public static function setDefaults($data, $defaults)
    {
        return array_merge($defaults, $data);
    }

    /**
     * 清理数据（移除空字符串）
     *
     * @param array $data
     * @return array
     */
    public static function sanitizeData($data)
    {
        return array_filter($data, function($value) {
            return $value !== '' && $value !== null;
        });
    }

    /**
     * 确保实体存在，否则抛出异常
     *
     * @param string $modelClass
     * @param int $id
     * @param string $errorMessage
     * @return \think\Model
     * @throws \Exception
     */
    public static function ensureEntityExists($modelClass, $id, $errorMessage = null)
    {
        $entity = $modelClass::find($id);
        if (!$entity) {
            throw new \Exception($errorMessage ?? '记录不存在');
        }
        return $entity;
    }

    /**
     * 验证唯一性
     *
     * @param string $modelClass
     * @param string $field
     * @param mixed $value
     * @param int|null $excludeId
     * @return bool
     * @throws \Exception
     */
    public static function validateUnique($modelClass, $field, $value, $excludeId = null)
    {
        $query = $modelClass::where($field, $value);
        if ($excludeId) {
            $query->where('id', '<>', $excludeId);
        }
        $exists = $query->find();
        if ($exists) {
            throw new \Exception('该值已存在');
        }
        return true;
    }

    /**
     * 批量创建记录
     *
     * @param string $modelClass
     * @param array $records
     * @return int
     */
    public static function batchCreate($modelClass, $records)
    {
        if (empty($records)) {
            return 0;
        }

        $model = new $modelClass();
        return $model->saveAll($records);
    }

    /**
     * 修复小程序上传的图片URL路径
     *
     * 小程序Express服务器将图片存储在 uploads/reviews/ 目录下，
     * nginx通过 /miniprogram-uploads/ 路径别名访问这些文件。
     * 但数据库中存储的路径是 /uploads/reviews/xxx.jpg，
     * 需要转换为 /miniprogram-uploads/reviews/xxx.jpg 才能正确访问。
     *
     * @param string|array $images 单个图片URL或图片URL数组
     * @return string|array 修复后的URL或URL数组
     */
    public static function fixMiniprogramImageUrl($images)
    {
        if (is_array($images)) {
            return array_map(function($url) {
                return self::normalizeMediaPath((string) $url);
            }, $images);
        }

        if (is_string($images)) {
            return self::normalizeMediaPath($images);
        }

        return $images;
    }

    /**
     * 修复单个图片URL
     */
    private static function fixSingleImageUrl(string $url): string
    {
        return self::normalizeMediaPath($url);
    }

    /**
     * 修复订单中的故障图片URL列表
     * 小程序订单的images字段可能存储了多个图片路径
     *
     * @param array $order 订单数据（包含images字段）
     * @return array 修复后的图片URL数组
     */
    public static function fixOrderFaultImages($order): array
    {
        $images = [];
        if (!empty($order['images'])) {
            $images = is_array($order['images']) ? $order['images'] : json_decode($order['images'], true);
            if (!$images) $images = [];
            $images = self::fixMiniprogramImageUrl($images);
        }
        return $images;
    }

    /**
     * 解析 repair 数据库中的图片 JSON 字段
     */
    public static function decodeMediaList($images): array
    {
        if (is_array($images)) {
            return self::fixMiniprogramImageUrl($images);
        }

        if (!is_string($images) || trim($images) === '') {
            return [];
        }

        $decoded = json_decode($images, true);
        if (is_array($decoded)) {
            return self::fixMiniprogramImageUrl($decoded);
        }

        return [self::normalizeMediaPath($images)];
    }

    /**
     * 统一媒体路径到当前后台可访问的 /uploads 路径
     */
    public static function normalizeMediaPath(string $url): string
    {
        $url = trim(str_replace('\\', '/', $url));
        if ($url === '') {
            return '';
        }

        if (stripos($url, 'http://') === 0 || stripos($url, 'https://') === 0 || strpos($url, '//') === 0) {
            return $url;
        }

        $uploadsPos = strpos($url, '/uploads/');
        if ($uploadsPos !== false) {
            $url = substr($url, $uploadsPos);
        }

        if (strpos($url, '/miniprogram-uploads/') === 0) {
            $url = '/uploads/' . ltrim(substr($url, strlen('/miniprogram-uploads/')), '/');
        } elseif (strpos($url, 'miniprogram-uploads/') === 0) {
            $url = '/uploads/' . substr($url, strlen('miniprogram-uploads/'));
        } elseif (strpos($url, 'uploads/') === 0) {
            $url = '/' . $url;
        } elseif ($uploadsPos === false && strpos($url, '/') !== 0) {
            $url = '/uploads/' . ltrim($url, '/');
        }

        self::ensureMediaAccessible($url);

        return $url;
    }

    /**
     * 确保旧小程序项目中的上传文件已复制到当前后台 public/uploads
     */
    public static function ensureMediaAccessible(string $relativeUrl): void
    {
        if (strpos($relativeUrl, '/uploads/') !== 0) {
            return;
        }

        $normalizedRelativePath = ltrim(str_replace('/', DIRECTORY_SEPARATOR, $relativeUrl), DIRECTORY_SEPARATOR);
        $publicFile = public_path() . $normalizedRelativePath;
        if (is_file($publicFile)) {
            return;
        }

        $sharedRoot = self::resolveSharedUploadRoot();
        $legacyFile = rtrim($sharedRoot, '\\/')
            . DIRECTORY_SEPARATOR . preg_replace('#^uploads[\\\\/]#', '', $normalizedRelativePath);

        if (!is_file($legacyFile)) {
            return;
        }

        $targetDir = dirname($publicFile);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        @copy($legacyFile, $publicFile);
    }

    /**
     * 同步指定订单的 progress 媒体目录到当前后台 public/uploads/progress
     */
    public static function syncProgressDirectoryByOrderId($orderId): void
    {
        $orderId = trim((string) $orderId);
        if ($orderId === '') {
            return;
        }

        $sourceDir = rtrim(self::resolveSharedUploadRoot(), '\\/')
            . DIRECTORY_SEPARATOR . 'progress' . DIRECTORY_SEPARATOR . $orderId;

        if (!is_dir($sourceDir)) {
            return;
        }

        $targetDir = public_path() . 'uploads' . DIRECTORY_SEPARATOR . 'progress' . DIRECTORY_SEPARATOR . $orderId;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        foreach (scandir($sourceDir) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $sourceFile = $sourceDir . DIRECTORY_SEPARATOR . $entry;
            $targetFile = $targetDir . DIRECTORY_SEPARATOR . $entry;

            if (!is_file($sourceFile) || is_file($targetFile)) {
                continue;
            }

            @copy($sourceFile, $targetFile);
        }
    }

    /**
     * 解析当前环境可用的小程序共享上传根目录
     */
    private static function resolveSharedUploadRoot(): string
    {
        foreach (self::SHARED_MINIPROGRAM_UPLOAD_ROOTS as $root) {
            if (is_dir($root)) {
                return $root;
            }
        }

        return self::SHARED_MINIPROGRAM_UPLOAD_ROOTS[0];
    }
}
