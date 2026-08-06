<?php

namespace app\controller;

use app\model\Order;
use app\common\Result;

/**
 * 订单管理控制器
 */
class OrderController
{
    /**
     * 获取订单列表（分页、搜索）
     * GET /orders
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $status = request()->get('status', '');
        $startDate = request()->get('start_date', '');
        $endDate = request()->get('end_date', '');

        try {
            $query = Order::with(['customer', 'items'])->order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('order_number|customer_name', '%' . $keyword . '%');
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // 日期范围筛选
            if (!empty($startDate)) {
                $query->where('created_at', '>=', $startDate);
            }
            if (!empty($endDate)) {
                $query->where('created_at', '<=', $endDate);
            }

            $total = $query->count();
            $orders = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $orders,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单详情
     * GET /orders/{id}
     */
    public function read($id)
    {
        try {
            $order = Order::with(['customer', 'items', 'payments'])->find($id);

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            return Result::success($order);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建订单
     * POST /orders
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'order_number' => 'require|unique:order',
                'customer_id' => 'require|integer',
                'total_amount' => 'require|float',
                'status' => 'in:pending,processing,completed,cancelled',
            ])->check($data);

            $order = Order::create($data);

            return Result::success($order, '订单创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新订单
     * PUT /orders/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $order = Order::find($id);

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 验证
            validate([
                'order_number' => 'require|unique:order,order_number,' . $id,
                'customer_id' => 'require|integer',
                'total_amount' => 'require|float',
                'status' => 'in:pending,processing,completed,cancelled',
            ])->check($data);

            $order->save($data);

            return Result::success($order, '订单更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除订单
     * DELETE /orders/{id}
     */
    public function delete($id)
    {
        try {
            $order = Order::find($id);

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 检查订单状态
            if ($order->status === 'completed') {
                return Result::error('已完成订单无法删除', 400);
            }

            $order->delete();

            return Result::success(null, '订单删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
