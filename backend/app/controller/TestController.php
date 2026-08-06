<?php

namespace app\controller;

class TestController
{
    public function index()
    {
        return json_encode([
            'code' => 200,
            'message' => 'Test route works!',
            'data' => [
                'method' => request()->method(),
                'url' => request()->url(),
                'pathinfo' => request()->pathinfo(),
            ]
        ]);
    }
}
