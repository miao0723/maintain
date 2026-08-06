<?php

namespace Tests\Feature;

use Tests\BaseTestCase;

class AuthTest extends BaseTestCase
{
    public function test_login_with_valid_credentials()
    {
        $response = $this->post('/api/simple-login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertArrayHasKey('code', $data);
        $this->assertEquals(200, $data['code']);
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('token', $data['data']);
    }

    public function test_login_with_invalid_credentials()
    {
        $response = $this->post('/api/simple-login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertArrayHasKey('code', $data);
        $this->assertEquals(401, $data['code']);
    }

    public function test_login_with_missing_credentials()
    {
        $response = $this->post('/api/simple-login', [
            'username' => '',
            'password' => '',
        ]);

        $this->assertEquals(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertEquals(400, $data['code']);
    }
}
