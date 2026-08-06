<?php

namespace app\controller;

use think\Request;

class Index
{
    public function index()
    {
        return json([
            'code' => 0,
            'message' => 'CMMS API is running',
            'data' => [
                'name' => 'CMMS 维修全流程管理系统',
                'version' => '1.0.0',
                'status' => 'online',
                'timestamp' => time()
            ]
        ]);
    }
}
