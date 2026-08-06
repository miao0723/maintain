<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

abstract class BaseTestCase extends TestCase
{
    protected string $baseUrl = 'http://localhost:8000';

    /**
     * Make a GET request
     */
    protected function get(string $uri, array $headers = [])
    {
        return $this->request('GET', $uri, [], $headers);
    }

    /**
     * Make a POST request
     */
    protected function post(string $uri, array $data = [], array $headers = [])
    {
        return $this->request('POST', $uri, $data, $headers);
    }

    /**
     * Make a PUT request
     */
    protected function put(string $uri, array $data = [], array $headers = [])
    {
        return $this->request('PUT', $uri, $data, $headers);
    }

    /**
     * Make a DELETE request
     */
    protected function delete(string $uri, array $headers = [])
    {
        return $this->request('DELETE', $uri, [], $headers);
    }

    /**
     * Make HTTP request
     */
    protected function request(string $method, string $uri, array $data = [], array $headers = [])
    {
        $url = $this->baseUrl . $uri;

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
            'Content-Type: application/json',
            'Accept: application/json',
        ], $headers));

        if (!empty($data) && in_array($method, ['POST', 'PUT'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return new TestResponse($statusCode, $response);
    }
}

/**
 * Test response helper
 */
class TestResponse
{
    protected int $statusCode;
    protected string $content;

    public function __construct(int $statusCode, string $content)
    {
        $this->statusCode = $statusCode;
        $this->content = $content;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function getData(): array
    {
        return json_decode($this->content, true) ?? [];
    }
}
