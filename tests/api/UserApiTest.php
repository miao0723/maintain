<?php

namespace tests\api;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class UserApiTest extends TestCase
{
    private $client;
    private $baseUrl = 'http://localhost/api/v1';
    private $adminToken;
    private $createdUserId;

    protected function setUp(): void
    {
        $this->client = new Client(['base_uri' => $this->baseUrl]);

        // 管理员登录
        $loginResponse = $this->client->post('/auth/login', [
            'json' => [
                'username' => 'admin',
                'password' => 'admin123',
            ],
        ]);

        $loginData = json_decode($loginResponse->getBody(), true);
        $this->adminToken = $loginData['data']['access_token'];
    }

    public function testCreateUser()
    {
        $response = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'testuser',
                'password' => 'test123',
                'real_name' => '测试用户',
                'phone' => '13900139000',
                'email' => 'test@example.com',
                'role_type' => 4,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(201, $data['code']);
        $this->assertEquals('testuser', $data['data']['username']);

        $this->createdUserId = $data['data']['id'];
    }

    public function testGetUserList()
    {
        $response = $this->client->get('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('items', $data['data']);
        $this->assertArrayHasKey('total', $data['data']);
    }

    public function testUpdateUser()
    {
        // 先创建用户
        $createResponse = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'updatetest',
                'password' => 'test123',
                'real_name' => '更新测试',
                'phone' => '13900139001',
                'role_type' => 4,
            ],
        ]);

        $createData = json_decode($createResponse->getBody(), true);
        $userId = $createData['data']['id'];

        // 更新用户
        $response = $this->client->put('/users/' . $userId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'real_name' => '已更新用户',
                'phone' => '13900139999',
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
        $this->assertEquals('已更新用户', $data['data']['real_name']);
    }

    public function testDeleteUser()
    {
        // 先创建用户
        $createResponse = $this->client->post('/users', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
            'json' => [
                'username' => 'deletetest',
                'password' => 'test123',
                'real_name' => '删除测试',
                'phone' => '13900139002',
                'role_type' => 4,
            ],
        ]);

        $createData = json_decode($createResponse->getBody(), true);
        $userId = $createData['data']['id'];

        // 删除用户
        $response = $this->client->delete('/users/' . $userId, [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->adminToken,
            ],
        ]);

        $data = json_decode($response->getBody(), true);

        $this->assertEquals(200, $data['code']);
    }
}