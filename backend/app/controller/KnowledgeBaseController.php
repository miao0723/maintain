<?php

namespace app\controller;

use app\service\KnowledgeBaseService;
use app\validate\KnowledgeBaseValidate;
use think\facade\Request;

class KnowledgeBaseController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new KnowledgeBaseService();
    }

    /**
     * 获取知识库列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'status' => Request::param('status', ''),
                'category_id' => Request::param('category_id', ''),
                'device_id' => Request::param('device_id', ''),
                'difficulty_level' => Request::param('difficulty_level', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取知识库详情
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
     * 创建知识库条目
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(KnowledgeBaseValidate::class)
                ->scene('create')
                ->check($data);

            $userId = Request::instance()->userId ?? null;
            $result = $this->service->create($data, $userId);

            return $this->success($result, '知识库条目创建成功', 201);
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新知识库条目
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(KnowledgeBaseValidate::class)
                ->scene('update')
                ->check($data);

            $result = $this->service->update($id, $data);

            return $this->success($result, '知识库条目更新成功');
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除知识库条目
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '知识库条目删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 智能搜索
     */
    public function search()
    {
        try {
            $keyword = Request::param('keyword', '');
            $limit = Request::param('limit', 10, 'intval');
            $useVector = Request::param('use_vector', true, 'bool');

            $result = $this->service->search($keyword, $limit, $useVector);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取热门知识
     */
    public function hot()
    {
        try {
            $limit = Request::param('limit', 10, 'intval');

            $result = $this->service->getHotKnowledge($limit);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取统计数据
     */
    public function statistics()
    {
        try {
            $result = $this->service->getStatistics();

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 重建向量索引
     */
    public function rebuildVector()
    {
        try {
            $result = $this->service->rebuildVectorIndex();

            return $this->success($result, '向量索引重建完成');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取向量索引统计
     */
    public function vectorStats()
    {
        try {
            $result = $this->service->getVectorStats();

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
