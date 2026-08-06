<?php

namespace app\common;

use think\facade\Db;

/**
 * 事务辅助类
 * 统一处理数据库事务
 */
class TransactionHelper
{
    /**
     * 在事务中执行回调
     *
     * @param callable $callback
     * @return mixed
     * @throws \Exception
     */
    public static function run(callable $callback)
    {
        Db::startTrans();
        try {
            $result = $callback();
            Db::commit();
            return $result;
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 在事务中执行回调并返回结果
     *
     * @param callable $callback
     * @param mixed $defaultOnError
     * @return mixed
     */
    public static function runWithReturn(callable $callback, $defaultOnError = null)
    {
        Db::startTrans();
        try {
            $result = $callback();
            Db::commit();
            return $result;
        } catch (\Exception $e) {
            Db::rollback();
            return $defaultOnError;
        }
    }
}
