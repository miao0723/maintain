<?php

namespace app\service;

/**
 * 敏感字段加密 / 脱敏服务
 *
 * - 落库加密：phone / id_card / address 等使用 AES-256-GCM 对称加密后存储。
 * - 展示脱敏：接口与前端默认只看到脱敏结果；拥有敏感查看权限的用户可解密还原。
 *
 * 密钥来自 config('external.encryption.key')（base64，32 字节），由环境变量注入。
 */
class CryptoService
{
    /** 加密算法 */
    const CIPHER = 'aes-256-gcm';

    /** 密文前缀，便于识别历史明文 */
    const PREFIX = 'enc:v1:';

    /**
     * 获取原始密钥（32 字节二进制）
     */
    protected static function key(): string
    {
        $b64 = (string) config('external.encryption.key');
        $raw = base64_decode($b64, true);
        if ($raw === false || strlen($raw) !== 32) {
            // 兜底：对任意长度输入做一次哈希，保证仍是 32 字节（但生产应配置正确密钥）
            $raw = hash('sha256', $b64, true);
        }
        return $raw;
    }

    /**
     * 加密明文，返回可安全入库的字符串（含 IV + TAG + 密文，base64 封装）。
     */
    public static function encrypt(?string $plain): ?string
    {
        if ($plain === null || $plain === '') {
            return $plain;
        }
        $ivLen = openssl_cipher_iv_length(self::CIPHER);
        $iv = random_bytes($ivLen);
        $tag = '';
        $cipher = openssl_encrypt($plain, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) {
            return $plain; // 极端情况下不阻断业务，但不推荐
        }
        return self::PREFIX . base64_encode($iv . $tag . $cipher);
    }

    /**
     * 解密。非本服务加密的串（无前缀）原样返回，便于兼容历史明文。
     */
    public static function decrypt(?string $stored): ?string
    {
        if ($stored === null || $stored === '' || strncmp($stored, self::PREFIX, strlen(self::PREFIX)) !== 0) {
            return $stored;
        }
        $data = base64_decode(substr($stored, strlen(self::PREFIX)), true);
        if ($data === false) {
            return null;
        }
        $ivLen = openssl_cipher_iv_length(self::CIPHER);
        $tagLen = 16; // GCM tag 16 字节
        $iv = substr($data, 0, $ivLen);
        $tag = substr($data, $ivLen, $tagLen);
        $cipher = substr($data, $ivLen + $tagLen);
        $plain = openssl_decrypt($cipher, self::CIPHER, self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        return $plain === false ? null : $plain;
    }

    /**
     * 判断一段串是否为本服务加密串
     */
    public static function isEncrypted(?string $value): bool
    {
        return is_string($value) && strncmp($value, self::PREFIX, strlen(self::PREFIX)) === 0;
    }

    // ===== 脱敏（展示用，不可逆） =====

    /** 手机号：138****1234 */
    public static function maskPhone(?string $phone): string
    {
        if (!$phone) return '';
        $len = mb_strlen($phone);
        if ($len <= 7) return str_repeat('*', $len);
        return mb_substr($phone, 0, 3) . str_repeat('*', max(0, $len - 7)) . mb_substr($phone, -4);
    }

    /** 身份证：保留前 4 后 4，如 3101************23 */
    public static function maskIdCard(?string $idCard): string
    {
        if (!$idCard) return '';
        $len = mb_strlen($idCard);
        if ($len <= 8) return str_repeat('*', $len);
        return mb_substr($idCard, 0, 4) . str_repeat('*', $len - 8) . mb_substr($idCard, -4);
    }

    /** 地址：保留前 6 字符，其余掩去 */
    public static function maskAddress(?string $address): string
    {
        if (!$address) return '';
        $len = mb_strlen($address);
        if ($len <= 6) return $address;
        return mb_substr($address, 0, 6) . str_repeat('*', max(1, $len - 6));
    }

    /**
     * 通用脱敏入口：根据字段名选择脱敏策略。
     */
    public static function mask(string $field, ?string $value): string
    {
        switch ($field) {
            case 'phone': return self::maskPhone($value);
            case 'id_card': return self::maskIdCard($value);
            case 'address': return self::maskAddress($value);
            default:
                if (!$value) return '';
                $len = mb_strlen($value);
                return $len <= 2 ? $value : mb_substr($value, 0, 1) . str_repeat('*', $len - 1);
        }
    }
}
