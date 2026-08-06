<?php

namespace app\controller;

use app\service\QuotationOrderService;
use think\facade\Request;

class QuotationOrderController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new QuotationOrderService();
    }

    /**
     * 获取报价单列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $filters = [
                'status' => Request::param('status', ''),
                'order_no' => Request::param('order_no', ''),
                'quotation_no' => Request::param('quotation_no', ''),
                'customer_name' => Request::param('customer_name', ''),
                'date_start' => Request::param('date_start', ''),
                'date_end' => Request::param('date_end', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取报价单详情
     */
    public function read($id)
    {
        try {
            $result = $this->service->getDetail($id);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    /**
     * 创建报价单
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();
            $userId = $this->getUserId();

            $result = $this->service->create($data, $userId);

            return $this->success($result, '报价单创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新报价单
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->update($id, $data);

            return $this->success($result, '报价单更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除报价单
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '报价单删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 提交报价单
     */
    public function submit($id)
    {
        try {
            $result = $this->service->submit($id);
            return $this->success($result, '报价单提交成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 接受报价单
     */
    public function accept($id)
    {
        try {
            $userId = $this->getUserId();
            $result = $this->service->accept($id, $userId);
            return $this->success($result, '报价单已接受');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 拒绝报价单
     */
    public function reject($id)
    {
        try {
            $data = $this->getRequestData();
            $reason = $data['reason'] ?? '未提供原因';
            $result = $this->service->reject($id, $reason);
            return $this->success($result, '报价单已拒绝');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 根据订单号获取报价单
     */
    public function getByOrderNo($orderNo)
    {
        try {
            $quotation = \app\model\QuotationOrder::where('order_no', $orderNo)->with('items')->find();

            if (!$quotation) {
                return $this->error('该订单暂无报价单', 404);
            }

            return $this->success($quotation->toArray());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
