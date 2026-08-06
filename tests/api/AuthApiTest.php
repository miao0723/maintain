<?php

namespace tests\api;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class AuthApiTest extends TestCase
{
    private $client;
    private $baseUrl = 'http://localhost/api/v1';
    private $accessToken;
    private $refreshToken;

    protected function setUp(): void
    {
        $this->client = new Client(['base_uri' => $this->baseUrl]);
    }

    public function testLoginSuccess()
    {
        $response = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('access_token', $data['data']);
        $this->assertArrayHasKey('refresh_token', $data['data']);

        $this->accessToken = $data['data']['access_token'];
        $this->refreshToken = $data['data']['refresh_token'];
    }

    public function testLoginWithWrongCredentials()
    {
        $response = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'wrong_password',
            ],
            'http_errors' => false,
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(401, $data['code']);
    }

    public function testRefreshToken()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $refreshToken = $loginData['data']['refresh_token'];

        // 刷新 Token
        $response = $this->client->post('/auth/refresh', [
            'json' => [
                'refresh_token' => $refreshToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('access_token', $data['data']);
    }

    public function testGetProfile()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $accessToken = $loginData['data']['access_token'];

        // 获取用户信息
        $response = $this->client->get('/auth/profile', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertEquals('admin', $data['data']['username']);
    }

    public function testLogout()
    {
        // 先登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $accessToken = $loginData['data']['access_token'];

        // 登出
        $response = $this->client->post('/auth/logout', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
    }
}