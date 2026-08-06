<?php

namespace app\controller;

use app\model\RepairContractItem;
use app\common\Result;

/**
 * 合同项目明细管理控制器
 */
class RepairContractItemController extends BaseController
{
    /**
     * 获取合同项目明细列表
     * GET /repair-contracts/{contractId}/items
     */
    public function index($contractId)
    {
        try {
            $query = RepairContractItem::where('contract_id', $contractId)->order('id', 'asc');
            $items = $query->select();

            return Result::success([
                'list' => $items,
                'total' => count($items)
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取项目明细详情
     * GET /repair-contracts/items/{id}
     */
    public function read($id)
    {
        try {
            $item = RepairContractItem::with(['contract'])->find($id);

            if (!$item) {
                return Result::error('项目明细不存在', 404);
            }

            return Result::success($item);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建项目明细
     * POST /repair-contracts/{contractId}/items
     */
    public function save($contractId)
    {
        $data = request()->post();

        try {
            $data['contract_id'] = $contractId;

            if (empty($data['item_name'])) {
                return Result::error('项目名称不能为空', 400);
            }

            if (empty($data['unit_price'])) {
                $data['unit_price'] = 0;
            }

            if (empty($data['quantity'])) {
                $data['quantity'] = 1;
            }

            $data['total_price'] = $data['unit_price'] * $data['quantity'];

            $item = RepairContractItem::create($data);

            return Result::success($item, '项目明细创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 批量创建项目明细
     * POST /repair-contracts/{contractId}/items/batch
     */
    public function batchSave($contractId)
    {
        $data = request()->post();
        $items = $data['items'] ?? [];

        if (empty($items) || !is_array($items)) {
            return Result::error('请提供项目明细数据', 400);
        }

        try {
            $createdItems = [];

            foreach ($items as $itemData) {
                $itemData['contract_id'] = $contractId;

                if (empty($itemData['item_name'])) {
                    continue;
                }

                if (empty($itemData['unit_price'])) {
                    $itemData['unit_price'] = 0;
                }

                if (empty($itemData['quantity'])) {
                    $itemData['quantity'] = 1;
                }

                $itemData['total_price'] = $itemData['unit_price'] * $itemData['quantity'];

                $item = RepairContractItem::create($itemData);
                $createdItems[] = $item;
            }

            return Result::success([
                'list' => $createdItems,
                'total' => count($createdItems)
            ], '批量创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新项目明细
     * PUT /repair-contracts/items/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $item = RepairContractItem::find($id);

            if (!$item) {
                return Result::error('项目明细不存在', 404);
            }

            if (isset($data['unit_price']) || isset($data['quantity'])) {
                $unitPrice = $data['unit_price'] ?? $item->unit_price;
                $quantity = $data['quantity'] ?? $item->quantity;
                $data['total_price'] = $unitPrice * $quantity;
            }

            $item->save($data);

            return Result::success($item, '项目明细更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除项目明细
     * DELETE /repair-contracts/items/{id}
     */
    public function delete($id)
    {
        try {
            $item = RepairContractItem::find($id);

            if (!$item) {
                return Result::error('项目明细不存在', 404);
            }

            $item->delete();

            return Result::success(null, '项目明细删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 批量删除项目明细
     * POST /repair-contracts/items/batch-delete
     */
    public function batchDelete()
    {
        $data = request()->post();
        $ids = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return Result::error('请选择要删除的项目明细', 400);
        }

        try {
            RepairContractItem::destroy($ids);

            return Result::success(null, '批量删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取合同项目明细总计
     * GET /repair-contracts/{contractId}/items/summary
     */
    public function summary($contractId)
    {
        try {
            $items = RepairContractItem::where('contract_id', $contractId)->select();
            $totalAmount = 0;

            foreach ($items as $item) {
                $totalAmount += $item->total_price;
            }

            return Result::success([
                'total_count' => count($items),
                'total_amount' => $totalAmount,
                'items' => $items
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
