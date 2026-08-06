<?php

namespace app\controller;

use app\model\DouyinContent;
use app\common\Result;

/**
 * 抖音内容管理控制器
 */
class DouyinController
{
    /**
     * 获取内容列表
     * GET /douyin-contents
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $type = request()->get('type', '');
        $status = request()->get('status', '');

        try {
            $query = DouyinContent::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('title|description|tags', '%' . $keyword . '%');
            }

            // 类型筛选
            if (!empty($type)) {
                $query->where('type', $type);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $contents = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $contents,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取内容详情
     * GET /douyin-contents/{id}
     */
    public function read($id)
    {
        try {
            $content = DouyinContent::find($id);

            if (!$content) {
                return Result::error('内容不存在', 404);
            }

            return Result::success($content);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建内容
     * POST /douyin-contents
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'title' => 'require|max:200',
                'type' => 'require|in:video,image,text',
                'content' => 'require',
                'status' => 'in:draft,published,unpublished',
            ])->check($data);

            $content = DouyinContent::create($data);

            return Result::success($content, '内容创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新内容
     * PUT /douyin-contents/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $content = DouyinContent::find($id);

            if (!$content) {
                return Result::error('内容不存在', 404);
            }

            // 验证
            validate([
                'title' => 'require|max:200',
                'type' => 'require|in:video,image,text',
                'content' => 'require',
                'status' => 'in:draft,published,unpublished',
            ])->check($data);

            $content->save($data);

            return Result::success($content, '内容更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除内容
     * DELETE /douyin-contents/{id}
     */
    public function delete($id)
    {
        try {
            $content = DouyinContent::find($id);

            if (!$content) {
                return Result::error('内容不存在', 404);
            }

            $content->delete();

            return Result::success(null, '内容删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
