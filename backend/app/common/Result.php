<?php

namespace app\common;

class Result
{
    public static function success($data = null, $message = 'success', $code = 200)
    {
        return json([
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public static function error($message = 'error', $code = 400, $data = null)
    {
        return json([
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public static function paginated($items, $total, $page = 1, $pageSize = 20, $message = 'success')
    {
        return json([
            'code' => 200,
            'message' => $message,
            'data' => [
                'list' => $items,
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
            ],
        ]);
    }
}
