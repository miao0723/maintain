<?php

namespace app\controller;

use app\common\Result;
use app\model\KbCollection;
use think\facade\Log;

/**
 * 知识库集合管理控制器
 */
class KbCollectionController extends BaseController
{
    /**
     * 知识库列表
     */
    public function index()
    {
        $params = request()->param();
        $query = KbCollection::with('creator');

        if (!empty($params['name'])) {
            $query->where('name', 'like', "%{$params['name']}%");
        }

        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }

        $page = intval($params['page'] ?? 1);
        $pageSize = intval($params['pageSize'] ?? 20);

        $total = $query->count();
        $list = $query->order('created_at', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();

        return Result::paginated($list, $total, $page, $pageSize);
    }

    /**
     * 知识库详情
     */
    public function read($id)
    {
        $collection = KbCollection::with(['creator', 'files' => function ($query) {
            $query->order('created_at', 'desc')->limit(10);
        }])->find($id);

        if (!$collection) {
            return Result::error('知识库不存在', 404);
        }

        return Result::success($collection);
    }

    /**
     * 创建知识库
     */
    public function save()
    {
        $data = $this->getRequestData();

        if (empty($data['name'])) {
            return Result::error('知识库名称不能为空', 400);
        }

        try {
            $userId = $this->getUserId();

            $collection = KbCollection::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'milvus_collection_name' => 'mysql_fulltext',
                'icon' => $data['icon'] ?? null,
                'status' => 1,
                'created_by' => $userId,
            ]);

            return Result::success($collection, '创建成功');

        } catch (\Exception $e) {
            return Result::error('创建失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 更新知识库
     */
    public function update($id)
    {
        $collection = KbCollection::find($id);
        if (!$collection) {
            return Result::error('知识库不存在', 404);
        }

        $data = $this->getRequestData();

        try {
            if (isset($data['name'])) {
                $collection->name = $data['name'];
            }
            if (isset($data['description'])) {
                $collection->description = $data['description'];
            }
            if (isset($data['icon'])) {
                $collection->icon = $data['icon'];
            }
            if (isset($data['status'])) {
                $collection->status = intval($data['status']);
            }

            $collection->save();

            return Result::success($collection, '更新成功');

        } catch (\Exception $e) {
            return Result::error('更新失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 删除知识库
     */
    public function delete($id)
    {
        $collection = KbCollection::find($id);
        if (!$collection) {
            return Result::error('知识库不存在', 404);
        }

        try {
            $collection->delete();
            return Result::success(null, '删除成功');

        } catch (\Exception $e) {
            return Result::error('删除失败: ' . $e->getMessage(), 500);
        }
    }
}
