<?php

namespace app\controller;

use app\service\QcService;
use think\facade\Request;

/**
 * 质检中心控制器 - repair 库
 */
class QcController extends BaseController
{
    private QcService $service;

    public function __construct()
    {
        $this->service = new QcService();
    }

    // ---------------- 模板 / 质检项 / 成色标准 / 版本 ----------------

    public function templates()
    {
        try {
            return $this->success($this->service->templateList(Request::param()));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function templateDetail($id)
    {
        try {
            return $this->success($this->service->templateDetail((int)$id));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    public function templateSave()
    {
        try {
            $result = $this->service->templateSave($this->getRequestData());
            return $this->success($result, '模板已创建', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function templateUpdate($id)
    {
        try {
            $result = $this->service->templateUpdate((int)$id, $this->getRequestData());
            return $this->success($result, '模板已更新');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function templateDelete($id)
    {
        try {
            $this->service->templateDelete((int)$id);
            return $this->success(null, '模板已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function itemSave($templateId)
    {
        try {
            $result = $this->service->itemSave((int)$templateId, $this->getRequestData());
            return $this->success($result, '质检项已添加', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function itemUpdate($id)
    {
        try {
            $result = $this->service->itemUpdate((int)$id, $this->getRequestData());
            return $this->success($result, '质检项已更新');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function itemDelete($id)
    {
        try {
            $this->service->itemDelete((int)$id);
            return $this->success(null, '质检项已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function gradeSave($templateId)
    {
        try {
            $result = $this->service->gradeSave((int)$templateId, $this->getRequestData());
            return $this->success($result, '成色标准已添加', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function gradeUpdate($id)
    {
        try {
            $result = $this->service->gradeUpdate((int)$id, $this->getRequestData());
            return $this->success($result, '成色标准已更新');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function gradeDelete($id)
    {
        try {
            $this->service->gradeDelete((int)$id);
            return $this->success(null, '成色标准已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function publishVersion($templateId)
    {
        try {
            $data = $this->getRequestData();
            $userId = Request::instance()->userId ?? null;
            $result = $this->service->publishVersion(
                (int)$templateId,
                trim((string)($data['changelog'] ?? '')),
                $userId
            );
            return $this->success($result, '版本已发布', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    // ---------------- 质检单 ----------------

    public function orders()
    {
        try {
            return $this->success($this->service->orderList(Request::param()));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function orderDetail($id)
    {
        try {
            return $this->success($this->service->orderDetail((int)$id));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    public function orderCreate()
    {
        try {
            $userId = Request::instance()->userId ?? null;
            $result = $this->service->orderCreate($this->getRequestData(), $userId);
            return $this->success($result, '质检单已创建', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function orderStart($id)
    {
        try {
            return $this->success($this->service->orderStart((int)$id), '已开始质检');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function orderGrade($id)
    {
        try {
            $result = $this->service->orderGrade((int)$id, $this->getRequestData());
            return $this->success($result, '定级已提交');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function priceSuggestion($id)
    {
        try {
            $gradeKey = (string)Request::param('grade_key', '');
            return $this->success($this->service->priceSuggestion((int)$id, $gradeKey));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function orderComplete($id)
    {
        try {
            return $this->success($this->service->orderComplete((int)$id), '质检单已完成');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function report($id)
    {
        try {
            return $this->success($this->service->report((int)$id));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    // ---------------- 媒体 / 复核 ----------------

    public function mediaSave($qcOrderId)
    {
        try {
            $result = $this->service->mediaSave((int)$qcOrderId, $this->getRequestData());
            return $this->success($result, '已上传', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function mediaDelete($mediaId)
    {
        try {
            $this->service->mediaDelete((int)$mediaId);
            return $this->success(null, '已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function reviewSave($qcOrderId)
    {
        try {
            $result = $this->service->reviewSave((int)$qcOrderId, $this->getRequestData());
            return $this->success($result, '已提交', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function reviewResolve($reviewId)
    {
        try {
            $result = $this->service->reviewResolve((int)$reviewId, $this->getRequestData());
            return $this->success($result, '已处理');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
