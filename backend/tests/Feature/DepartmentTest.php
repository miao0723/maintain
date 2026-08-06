<?php

namespace Tests\Feature;

use Tests\BaseTestCase;

class DepartmentTest extends BaseTestCase
{
    protected string $token = '';

    protected function setUp(): void
    {
        parent::setUp();
        // Login to get token
        $response = $this->post('/api/simple-login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $data = $response->getData();
        if (isset($data['data']['token'])) {
            $this->token = $data['data']['token'];
        }
    }

    public function test_get_departments_list()
    {
        $response = $this->get('/api/departments', [
            'Authorization: Bearer ' . $this->token
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertArrayHasKey('code', $data);
        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('data', $data);
        $this->assertIsArray($data['data']);
    }

    public function test_create_department()
    {
        $response = $this->post('/api/departments', [
            'name' => 'Test Department ' . time(),
            'code' => 'TEST_' . time(),
            'description' => 'Test department for automated testing'
        ], [
            'Authorization: Bearer ' . $this->token
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertEquals(201, $data['code']);
    }
}
