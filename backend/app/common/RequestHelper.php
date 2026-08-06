<?php

namespace app\common;

/**
 * 请求辅助类
 * 统一处理请求数据获取
 */
class RequestHelper
{
    /**
     * 获取JSON格式的请求数据
     *
     * @return array
     */
    public static function getJsonData()
    {
        $content = file_get_contents('php://input');
        if (!empty($content)) {
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                return $data;
            }
        }
        return request()->post();
    }

    /**
     * 获取分页参数
     *
     * @param int $defaultPage
     * @param int $defaultLimit
     * @return array
     */
    public static function getPaginationParams($defaultPage = 1, $defaultLimit = 20)
    {
        return [
            'page' => request()->get('page', $defaultPage, 'intval'),
            'limit' => request()->get('limit', $defaultLimit, 'intval'),
        ];
    }

    /**
     * 获取日期范围筛选参数
     *
     * @return array
     */
    public static function getDateFilters()
    {
        return [
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
        ];
    }
}
