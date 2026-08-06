<?php

namespace app\service;

use app\common\DataHelper;

class RepairMediaService
{
    public function normalizeProgressMediaPaths(array $paths, string $orderId): array
    {
        $normalized = [];
        foreach ($paths as $path) {
            $normalized[] = $this->normalizeProgressMediaPath((string) $path, $orderId);
        }

        return $normalized;
    }

    public function normalizeProgressMediaPath(string $path, string $orderId): string
    {
        $path = trim($path);
        if ($path === '' || $orderId === '') {
            return $path;
        }

        if (strpos($path, '/uploads/progress/') === 0) {
            $this->ensureProgressMediaAccessible($path);
            return $path;
        }

        if (strpos($path, '/uploads/general/') !== 0) {
            return $path;
        }

        $filename = basename($path);
        if ($filename === '' || $filename === '.' || $filename === '..') {
            return $path;
        }

        $targetRelativePath = '/uploads/progress/' . $orderId . '/' . $filename;
        $sourceFile = public_path() . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);
        $targetFile = public_path() . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $targetRelativePath), DIRECTORY_SEPARATOR);
        $targetDir = dirname($targetFile);

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        if (is_file($sourceFile) && $sourceFile !== $targetFile) {
            if (!is_file($targetFile)) {
                @rename($sourceFile, $targetFile);
            } else {
                @unlink($sourceFile);
            }
        }

        $this->ensureProgressMediaAccessible($targetRelativePath);

        return $targetRelativePath;
    }

    public function ensureProgressMediaAccessible(string $relativePath): void
    {
        if (strpos($relativePath, '/uploads/progress/') !== 0) {
            return;
        }

        $normalizedRelativePath = ltrim(str_replace('/', DIRECTORY_SEPARATOR, $relativePath), DIRECTORY_SEPARATOR);
        $publicFile = public_path() . $normalizedRelativePath;
        if (is_file($publicFile)) {
            return;
        }

        $sourceFile = 'D:\\maintain\\电子维修2.0\\uploads' . DIRECTORY_SEPARATOR
            . ltrim(str_replace('/uploads/progress/', 'progress' . DIRECTORY_SEPARATOR, $relativePath), '/\\');

        if (!is_file($sourceFile)) {
            return;
        }

        $targetDir = dirname($publicFile);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        @copy($sourceFile, $publicFile);
    }

    public function normalizeOutputMediaPath(string $path): string
    {
        return DataHelper::normalizeMediaPath($path);
    }
}
