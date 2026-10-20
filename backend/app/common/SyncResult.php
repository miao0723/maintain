<?php

namespace app\common;

/**
 * 对外只读同步接口 —— 统一响应封装
 *
 * 响应结构（与现有 Result 解耦，专门为外部系统同步场景设计）：
 * {
 *   "code": 0,                  // 业务状态码：0 = 成功，非 0 = 失败
 *   "error_code": "SUCCESS",    // 机器可读错误码（成功为 SUCCESS）
 *   "message": "success",       // 人类可读消息
 *   "data": {
 *     "list": [...],            // 数据列表
 *     "total": 123,             // 满足条件的总数（用于外部系统分页拉取）
 *     "page": 1,                // 当前页码
 *     "page_size": 20,          // 每页条数
 *     "has_more": true,         // 是否还有下一页（便于增量拉取判断）
 *     "time_field": "updated_at"// 本次增量同步所用时间字段
 *   }
 * }
 */
class SyncResult
{
    /** 业务成功状态码 */
    public const CODE_SUCCESS = 0;
    /** 业务失败状态码（统一前缀，便于外部系统判断） */
    public const CODE_FAIL = 1;

    /**
     * 成功响应
     */
    public static function success(
        array  $list,
        int    $total,
        int    $page,
        int    $pageSize,
        string $timeField,
        array  $extra = []
    ) {
        $data = [
            'list'       => $list,
            'total'      => $total,
            'page'       => $page,
            'page_size'  => $pageSize,
            'has_more'   => ($page * $pageSize) < $total,
            'time_field' => $timeField,
        ];
        if (!empty($extra)) {
            $data = array_merge($data, $extra);
        }

        return json([
            'code'       => self::CODE_SUCCESS,
            'error_code' => 'SUCCESS',
            'message'    => 'success',
            'data'       => $data,
        ]);
    }

    /**
     * 失败响应
     *
     * @param string $message   人类可读错误消息
     * @param string $errorCode 机器可读错误码（UNAUTHORIZED / INVALID_PARAM / INTERNAL_ERROR ...）
     * @param int    $httpCode HTTP 状态码（401 / 400 / 500 ...）
     * @param mixed  $data     可选附加数据
     */
    public static function fail(
        string $message,
        string $errorCode = 'INTERNAL_ERROR',
        int    $httpCode = 400,
        $data = null
    ) {
        return json([
            'code'       => self::CODE_FAIL,
            'error_code' => $errorCode,
            'message'    => $message,
            'data'       => $data,
        ])->code($httpCode);
    }
}
