<?php

namespace app\middleware;

class Cors
{
    public function handle($request, \Closure $next)
    {
        // 处理预检请求
        if ($request->method() == 'OPTIONS') {
            return response('', 200, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
            ]);
        }

        $response = $next($request);

        // 添加 CORS 头
        $response->header([
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type',
        ]);

        return $response;
    }
}