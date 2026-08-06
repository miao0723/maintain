<?php

namespace app\service;

use app\model\QuotationOrder;
use app\model\QuotationItem;
use think\facade\Db;

class QuotationOrderService
{
    /**
     * 生成报价单号
     */
    protected function generateQuotationNo()
    {
        $date = date('Ymd');
        $prefix = 'QT' . $date;

        $lastOrder = QuotationOrder::where('quotation_no', 'like', $prefix . '%')
            ->order('id', 'desc')
            ->find();

        $seq = 1;
        if ($lastOrder) {
            $lastSeq = (int)substr($lastOrder->quotation_no, -4);
            $seq = $lastSeq + 1;
        }

        return $prefix . sprintf('%04d', $seq);
    }

    /**
     * 获取报价单列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = QuotationOrder::with(['items', 'creator']);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按订单号搜索
        if (isset($filters['order_no']) && !empty($filters['order_no'])) {
            $query->where('order_no', 'like', '%' . $filters['order_no'] . '%');
        }

        // 按报价单号搜索
        if (isset($filters['quotation_no']) && !empty($filters['quotation_no'])) {
            $query->where('quotation_no', 'like', '%' . $filters['quotation_no'] . '%');
        }

        // 按客户名称搜索
        if (isset($filters['customer_name']) && !empty($filters['customer_name'])) {
            $query->where('customer_name', 'like', '%' . $filters['customer_name'] . '%');
        }

        // 按创建时间范围筛选
        if (isset($filters['date_start']) && !empty($filters['date_start'])) {
            $query->where('created_at', '>=', $filters['date_start'] . ' 00:00:00');
        }
        if (isset($filters['date_end']) && !empty($filters['date_end'])) {
            $query->where('created_at', '<=', $filters['date_end'] . ' 23:59:59');
        }

        // 排序：按创建时间倒序
        $query->order('created_at', 'desc');

        $total = $query->count();
        $list = $query->page($page, $limit)->select()->toArray();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取报价单详情
     */
    public function getDetail($id)
    {
        $quotation = QuotationOrder::with(['items', 'creator', 'acceptor'])->find($id);

        if (!$quotation) {
            throw new \Exception('报价单不存在');
        }

        return $quotation->toArray();
    }

    /**
     * 创建报价单
     */
    public function create($data, $userId = null)
    {
        Db::startTrans();
        try {
            // 检查订单是否已存在报价单
            if (isset($data['order_id'])) {
                $existQuotation = QuotationOrder::where('order_id', $data['order_id'])->find();
                if ($existQuotation) {
                    throw new \Exception('该订单已存在报价单');
                }
            }

            $quotationData = [
                'quotation_no' => $this->generateQuotationNo(),
                'order_id' => $data['order_id'] ?? null,
                'order_no' => $data['order_no'] ?? '',
                'customer_name' => $data['customer_name'] ?? '',
                'customer_phone' => $data['customer_phone'] ?? '',
                'device_model' => $data['device_model'] ?? '',
                'fault_description' => $data['fault_description'] ?? '',
                'status' => $data['status'] ?? QuotationOrder::STATUS_DRAFT,
                'total_amount' => $data['total_amount'] ?? 0,
                'discount' => $data['discount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'final_amount' => $data['final_amount'] ?? 0,
                'remark' => $data['remark'] ?? '',
                'valid_until' => $data['valid_until'] ?? null,
                'created_by' => $userId,
            ];

            $quotation = QuotationOrder::create($quotationData);

            // 保存报价项目
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    if (!empty($item['item_name'])) {
                        $quantity = floatval($item['quantity'] ?? 1);
                        $unitPrice = floatval($item['unit_price'] ?? 0);
                        $totalPrice = $quantity * $unitPrice;

                        QuotationItem::create([
                            'quotation_id' => $quotation->id,
                            'item_type' => $item['item_type'] ?? 1,
                            'item_name' => $item['item_name'],
                            'description' => $item['description'] ?? '',
                            'quantity' => $quantity,
                            'unit' => $item['unit'] ?? '项',
                            'unit_price' => $unitPrice,
                            'total_price' => $totalPrice,
                            'sort' => $item['sort'] ?? 0,
                        ]);
                    }
                }
            }

            Db::commit();
            return $this->getDetail($quotation->id);
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 更新报价单
     */
    public function update($id, $data)
    {
        Db::startTrans();
        try {
            $quotation = QuotationOrder::find($id);

            if (!$quotation) {
                throw new \Exception('报价单不存在');
            }

            // 已提交的报价单不能修改项目
            if ($quotation->status >= QuotationOrder::STATUS_SUBMITTED) {
                throw new \Exception('已提交的报价单不能修改');
            }

            $quotation->save([
                'customer_name' => $data['customer_name'] ?? $quotation->customer_name,
                'customer_phone' => $data['customer_phone'] ?? $quotation->customer_phone,
                'device_model' => $data['device_model'] ?? $quotation->device_model,
                'fault_description' => $data['fault_description'] ?? $quotation->fault_description,
                'total_amount' => $data['total_amount'] ?? $quotation->total_amount,
                'discount' => $data['discount'] ?? $quotation->discount,
                'discount_amount' => $data['discount_amount'] ?? $quotation->discount_amount,
                'final_amount' => $data['final_amount'] ?? $quotation->final_amount,
                'remark' => $data['remark'] ?? $quotation->remark,
                'valid_until' => $data['valid_until'] ?? $quotation->valid_until,
            ]);

            // 更新报价项目
            if (isset($data['items']) && is_array($data['items'])) {
                // 删除原有项目
                QuotationItem::where('quotation_id', $id)->delete();

                // 保存新项目
                foreach ($data['items'] as $item) {
                    if (!empty($item['item_name'])) {
                        $quantity = floatval($item['quantity'] ?? 1);
                        $unitPrice = floatval($item['unit_price'] ?? 0);
                        $totalPrice = $quantity * $unitPrice;

                        QuotationItem::create([
                            'quotation_id' => $id,
                            'item_type' => $item['item_type'] ?? 1,
                            'item_name' => $item['item_name'],
                            'description' => $item['description'] ?? '',
                            'quantity' => $quantity,
                            'unit' => $item['unit'] ?? '项',
                            'unit_price' => $unitPrice,
                            'total_price' => $totalPrice,
                            'sort' => $item['sort'] ?? 0,
                        ]);
                    }
                }
            }

            Db::commit();
            return $this->getDetail($id);
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 删除报价单
     */
    public function delete($id)
    {
        Db::startTrans();
        try {
            $quotation = QuotationOrder::find($id);

            if (!$quotation) {
                throw new \Exception('报价单不存在');
            }

            if ($quotation->status >= QuotationOrder::STATUS_SUBMITTED) {
                throw new \Exception('已提交的报价单不能删除');
            }

            // 删除关联项目
            QuotationItem::where('quotation_id', $id)->delete();
            $quotation->delete();

            Db::commit();
            return true;
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 提交报价单
     */
    public function submit($id)
    {
        $quotation = QuotationOrder::find($id);

        if (!$quotation) {
            throw new \Exception('报价单不存在');
        }

        if ($quotation->status !== QuotationOrder::STATUS_DRAFT) {
            throw new \Exception('只有草稿状态的报价单可以提交');
        }

        $quotation->status = QuotationOrder::STATUS_SUBMITTED;
        $quotation->save();

        return $quotation->toArray();
    }

    /**
     * 接受报价单
     */
    public function accept($id, $userId)
    {
        $quotation = QuotationOrder::find($id);

        if (!$quotation) {
            throw new \Exception('报价单不存在');
        }

        if ($quotation->status !== QuotationOrder::STATUS_SUBMITTED) {
            throw new \Exception('只有已提交的报价单可以接受');
        }

        $quotation->status = QuotationOrder::STATUS_ACCEPTED;
        $quotation->accepted_by = $userId;
        $quotation->accepted_at = date('Y-m-d H:i:s');
        $quotation->save();

        return $quotation->toArray();
    }

    /**
     * 拒绝报价单
     */
    public function reject($id, $reason)
    {
        $quotation = QuotationOrder::find($id);

        if (!$quotation) {
            throw new \Exception('报价单不存在');
        }

        if ($quotation->status !== QuotationOrder::STATUS_SUBMITTED) {
            throw new \Exception('只有已提交的报价单可以拒绝');
        }

        $quotation->status = QuotationOrder::STATUS_REJECTED;
        $quotation->rejected_reason = $reason;
        $quotation->save();

        return $quotation->toArray();
    }

    /**
     * 检查订单是否已有报价单
     */
    public function checkOrderHasQuotation($orderId)
    {
        return QuotationOrder::where('order_id', $orderId)->find();
    }
}
