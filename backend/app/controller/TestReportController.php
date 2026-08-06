<?php

namespace app\controller;

use app\model\TestReport;
use app\common\Result;

/**
 * 检测报告管理控制器（列表/详情/增删改 + 多字段模糊搜索）
 */
class TestReportController
{
    /**
     * 将数据库行转为前端结构：workflow 使用 status 字段名
     */
    private function formatRow(TestReport $report): array
    {
        $a = $report->toArray();
        // 旧表 status 可能为 tinyint（记录标记），不暴露给前端
        if (array_key_exists('status', $a) && !is_string($a['status'])) {
            unset($a['status']);
        }
        $flow = $a['test_flow_status'] ?? 'pending';
        unset($a['test_flow_status']);
        $a['status'] = $flow;
        return $a;
    }

    private function normalizeInput(array $data): array
    {
        if (isset($data['status'])) {
            $data['test_flow_status'] = $data['status'];
            unset($data['status']);
        }
        return $data;
    }

    /**
     * GET /test-reports
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $reportNumber = (string) request()->get('report_number', '');
        $customerName = (string) request()->get('customer_name', '');
        $keyword = (string) request()->get('keyword', '');
        $status = (string) request()->get('status', '');
        $startDate = (string) request()->get('start_date', '');
        $endDate = (string) request()->get('end_date', '');

        try {
            $query = TestReport::where([])->order('id', 'desc');

            if ($keyword !== '') {
                $kw = '%' . addcslashes($keyword, '%_\\') . '%';
                $query->where(function ($q) use ($kw) {
                    $q->whereLike('report_number|customer_name|machine_name|machine_model|test_items|tester_name|test_description|suggestion', $kw);
                });
            }

            if ($reportNumber !== '') {
                $query->whereLike('report_number', '%' . addcslashes($reportNumber, '%_\\') . '%');
            }

            if ($customerName !== '') {
                $query->whereLike('customer_name', '%' . addcslashes($customerName, '%_\\') . '%');
            }

            if ($status !== '') {
                $query->where('test_flow_status', $status);
            }

            if ($startDate !== '') {
                $query->where('test_date', '>=', $startDate);
            }
            if ($endDate !== '') {
                $query->where('test_date', '<=', $endDate);
            }

            $total = $query->count();
            $reports = $query->page($page, $pageSize)->select();

            $items = [];
            foreach ($reports as $r) {
                $items[] = $this->formatRow($r);
            }

            return Result::paginated(
                $items,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * GET /test-reports/{id}
     */
    public function read($id)
    {
        try {
            $report = TestReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            return Result::success($this->formatRow($report));
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * POST /test-reports
     */
    public function save()
    {
        $data = $this->normalizeInput(request()->post());
        unset($data['id']);
        if (!isset($data['test_flow_status']) || $data['test_flow_status'] === '') {
            $data['test_flow_status'] = 'pending';
        }
        if (!isset($data['test_result']) || $data['test_result'] === '') {
            $data['test_result'] = 'qualified';
        }

        try {
            validate([
                'report_number' => 'require|unique:test_reports',
                'customer_name' => 'require',
                'machine_name' => 'require',
                'test_date' => 'require',
                'test_flow_status' => 'in:pending,testing,completed',
                'test_result' => 'in:qualified,unqualified,partial',
            ])->check($data);

            $report = TestReport::create($data);

            return Result::success($this->formatRow($report), '报告创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * PUT /test-reports/{id}
     */
    public function update($id)
    {
        $data = $this->normalizeInput(request()->put());
        unset($data['id']);
        if (!isset($data['test_flow_status']) || $data['test_flow_status'] === '') {
            $data['test_flow_status'] = 'pending';
        }
        if (!isset($data['test_result']) || $data['test_result'] === '') {
            $data['test_result'] = 'qualified';
        }

        try {
            $report = TestReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            validate([
                'report_number' => 'require|unique:test_reports,report_number,' . $id,
                'customer_name' => 'require',
                'machine_name' => 'require',
                'test_date' => 'require',
                'test_flow_status' => 'in:pending,testing,completed',
                'test_result' => 'in:qualified,unqualified,partial',
            ])->check($data);

            $report->save($data);

            return Result::success($this->formatRow($report), '报告更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * DELETE /test-reports/{id}
     */
    public function delete($id)
    {
        try {
            $report = TestReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            $report->delete();

            return Result::success(null, '报告删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
