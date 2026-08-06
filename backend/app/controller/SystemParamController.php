<?php

namespace app\controller;

use app\model\SystemParam;
use app\common\Result;

/**
 * 系统参数管理控制器
 */
class SystemParamController
{
    /**
     * API字段 → 数据库字段 映射
     */
    private function mapToDb($data)
    {
        $map = [
            'group'     => 'group_name',
            'group_name' => 'group_name',
            'key'       => 'param_key',
            'param_key'  => 'param_key',
            'value'     => 'param_value',
            'param_value' => 'param_value',
            'name'      => 'name',
            'description' => 'description',
        ];
        $result = [];
        foreach ($data as $k => $v) {
            if (isset($map[$k])) {
                $result[$map[$k]] = $v;
            }
        }
        return $result;
    }

    /**
     * 数据库字段 → API字段 映射
     */
    private function mapToApi($item)
    {
        if ($item instanceof \think\Model) {
            $item = $item->toArray();
        }
        if (isset($item['group_name'])) {
            $item['group'] = $item['group_name'];
        }
        if (isset($item['param_key'])) {
            $item['key'] = $item['param_key'];
        }
        if (isset($item['param_value'])) {
            $item['value'] = $item['param_value'];
        }
        return $item;
    }

    /**
     * 获取参数列表
     * GET /system-params
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $group = request()->get('group', '');

        try {
            $query = SystemParam::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|param_key|description', '%' . $keyword . '%');
            }

            // 分组筛选
            if (!empty($group)) {
                $query->where('group_name', $group);
            }

            $total = $query->count();
            $params = $query->page($page, $pageSize)->select();

            // 字段映射
            $list = [];
            foreach ($params as $p) {
                $list[] = $this->mapToApi($p);
            }

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取参数详情
     * GET /system-params/{id}
     */
    public function read($id)
    {
        try {
            $param = SystemParam::find($id);

            if (!$param) {
                return Result::error('参数不存在', 404);
            }

            return Result::success($this->mapToApi($param));
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建参数
     * POST /system-params
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'key' => 'require|unique:system_param,param_key|max:100',
                'value' => 'require',
                'group' => 'require|max:50',
                'description' => 'max:500',
            ])->check($data);

            $param = SystemParam::create($this->mapToDb($data));

            return Result::success($this->mapToApi($param), '参数创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新参数
     * PUT /system-params/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $param = SystemParam::find($id);

            if (!$param) {
                return Result::error('参数不存在', 404);
            }

            // 验证
            validate([
                'key' => 'require|unique:system_param,param_key,' . $id . '|max:100',
                'value' => 'require',
                'group' => 'require|max:50',
                'description' => 'max:500',
            ])->check($data);

            $param->save($this->mapToDb($data));

            return Result::success($this->mapToApi($param), '参数更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除参数
     * DELETE /system-params/{id}
     */
    public function delete($id)
    {
        try {
            $param = SystemParam::find($id);

            if (!$param) {
                return Result::error('参数不存在', 404);
            }

            $param->delete();

            return Result::success(null, '参数删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 刷新参数缓存
     * POST /system-params/refresh-cache
     */
    public function refreshCache()
    {
        try {
            // 清理系统参数缓存
            cache('system_params', null);
            $params = SystemParam::select();
            $cacheData = [];
            foreach ($params as $p) {
                $cacheData[$p->param_key] = $p->param_value;
            }
            cache('system_params', $cacheData, 86400);

            return Result::success(null, '参数缓存已刷新');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
