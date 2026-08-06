<?php

namespace app\controller;

use app\model\Machine;
use app\common\Result;

/**
 * 机械管理控制器
 */
class MachineController
{
    /**
     * 获取机械列表（分页、搜索）
     * GET /machines
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $categoryId = request()->get('category_id', '');
        $status = request()->get('status', '');

        try {
            $query = Machine::with(['category'])->order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|serial_number|model', '%' . $keyword . '%');
            }

            // 分类筛选
            if (!empty($categoryId)) {
                $query->where('category_id', $categoryId);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $machines = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $machines,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取机械详情
     * GET /machines/{id}
     */
    public function read($id)
    {
        try {
            $machine = Machine::with(['category', 'repairs', 'inspections'])->find($id);

            if (!$machine) {
                return Result::error('机械不存在', 404);
            }

            return Result::success($machine);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建机械
     * POST /machines
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require',
                'serial_number' => 'require|unique:machine',
                'category_id' => 'require|integer',
                'model' => 'max:100',
                'manufacturer' => 'max:100',
            ])->check($data);

            $machine = Machine::create($data);

            return Result::success($machine, '机械创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新机械
     * PUT /machines/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $machine = Machine::find($id);

            if (!$machine) {
                return Result::error('机械不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require',
                'serial_number' => 'require|unique:machine,serial_number,' . $id,
                'category_id' => 'require|integer',
                'model' => 'max:100',
                'manufacturer' => 'max:100',
            ])->check($data);

            $machine->save($data);

            return Result::success($machine, '机械更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除机械
     * DELETE /machines/{id}
     */
    public function delete($id)
    {
        try {
            $machine = Machine::find($id);

            if (!$machine) {
                return Result::error('机械不存在', 404);
            }

            // 检查是否有关联记录
            if ($machine->repairs()->count() > 0 || $machine->inspections()->count() > 0) {
                return Result::error('该机械有关联记录，无法删除', 400);
            }

            $machine->delete();

            return Result::success(null, '机械删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
