<?php

namespace app\service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use think\facade\Cache;

class JwtService
{
    private static $secret;
    private static $algorithm;
    private static $accessTTL;
    private static $refreshTTL;

    public static function init()
    {
        $config = config('jwt');
        self::$secret = $config['secret'];
        self::$algorithm = $config['algorithm'];
        self::$accessTTL = $config['access_ttl'];
        self::$refreshTTL = $config['refresh_ttl'];
    }

    /**
     * 生成 Access Token
     */
    public static function createAccessToken($userId, $roleType, $guard = 'web', array $extraClaims = [])
    {
        self::init();

        $payload = [
            'iss' => 'cmms-api',          // 签发者
            'iat' => time(),              // 签发时间
            'exp' => time() + self::$accessTTL,  // 过期时间
            'type' => 'access',           // Token 类型
            'user_id' => $userId,
            'role_type' => $roleType,
            'guard' => $guard,
        ];

        if (!empty($extraClaims)) {
            $payload = array_merge($payload, $extraClaims);
        }

        return JWT::encode($payload, self::$secret, self::$algorithm);
    }

    /**
     * 生成 Refresh Token
     */
    public static function createRefreshToken($userId, $guard = 'web')
    {
        self::init();

        $payload = [
            'iss' => 'cmms-api',
            'iat' => time(),
            'exp' => time() + self::$refreshTTL,
            'type' => 'refresh',
            'user_id' => $userId,
            'guard' => $guard,
        ];

        $token = JWT::encode($payload, self::$secret, self::$algorithm);

        // 存储 Refresh Token 到 Redis
        Cache::set('refresh_token:' . $guard . ':' . $userId, $token, self::$refreshTTL);

        return $token;
    }

    /**
     * 验证并解码 Token
     */
    public static function verifyToken($token)
    {
        self::init();

        try {
            $decoded = JWT::decode($token, new Key(self::$secret, self::$algorithm));
            return (array) $decoded;
        } catch (\Firebase\JWT\ExpiredException $e) {
            throw new \Exception('Token 已过期');
        } catch (\Exception $e) {
            throw new \Exception('Token 验证失败');
        }
    }

    /**
     * 刷新 Access Token
     */
    public static function refreshAccessToken($refreshToken)
    {
        self::init();

        try {
            $payload = self::verifyToken($refreshToken);

            if ($payload['type'] !== 'refresh') {
                throw new \Exception('Token 类型错误');
            }

            $userId = $payload['user_id'];

            // 验证 Refresh Token 是否在 Redis 中
            $guard = $payload['guard'] ?? 'web';
            $storedToken = Cache::get('refresh_token:' . $guard . ':' . $userId);
            if ($storedToken !== $refreshToken) {
                throw new \Exception('Refresh Token 无效');
            }

            // 获取用户信息
            $user = \app\model\User::find($userId);
            if (!$user) {
                throw new \Exception('用户不存在');
            }

            // 生成新的 Access Token
            return self::createAccessToken($userId, $user->role_type, $guard);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * 撤销 Refresh Token（登出时使用）
     */
    public static function revokeRefreshToken($userId, $guard = 'web')
    {
        Cache::delete('refresh_token:' . $guard . ':' . $userId);
    }
}
