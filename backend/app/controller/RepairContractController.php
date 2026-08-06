<?php

namespace app\controller;

use app\model\RepairContract;
use app\model\ContractTemplate;
use app\common\Result;
use app\validate\RepairContractValidate;

/**
 * 维修合同管理控制器
 */
class RepairContractController extends BaseController
{
    /**
     * 获取合同列表
     * GET /repair-contracts
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $contractNumber = request()->get('contract_number', '');
        $customerName = request()->get('customer_name', '');
        $keyword = request()->get('keyword', '');
        $status = request()->get('status', '');
        $startDate = request()->get('start_date', '');
        $endDate = request()->get('end_date', '');

        try {
            $query = RepairContract::with(['customer', 'machine'])->order('id', 'desc');

            if (!empty($keyword)) {
                $query->whereLike('contract_number|customer_name', '%' . $keyword . '%');
            }

            if (!empty($contractNumber)) {
                $query->where('contract_number', 'like', '%' . $contractNumber . '%');
            }

            if (!empty($customerName)) {
                $query->where('customer_name', 'like', '%' . $customerName . '%');
            }

            if (!empty($status)) {
                $query->where('status', $status);
            }

            if (!empty($startDate)) {
                $query->where('start_date', '>=', $startDate);
            }
            if (!empty($endDate)) {
                $query->where('end_date', '<=', $endDate);
            }

            $total = $query->count();
            $contracts = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $contracts,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取合同详情
     * GET /repair-contracts/{id}
     */
    public function read($id)
    {
        try {
            $contract = RepairContract::with(['customer', 'machine', 'items', 'reminders'])->find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            return Result::success($contract);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建合同
     * POST /repair-contracts
     */
    public function save()
    {
        $data = request()->post();

        try {
            $validate = new RepairContractValidate();
            if (!$validate->scene('create')->check($data)) {
                return Result::error($validate->getError(), 422);
            }

            if (empty($data['status'])) {
                $data['status'] = 'draft';
            }

            $contract = RepairContract::create($data);

            return Result::success($contract, '合同创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 从模板创建合同
     * POST /repair-contracts/create-from-template
     */
    public function createFromTemplate()
    {
        $data = request()->post();

        try {
            $templateId = $data['template_id'] ?? 0;
            $contractData = $data['contract_data'] ?? [];

            if (empty($templateId)) {
                return Result::error('模板ID不能为空', 400);
            }

            $template = ContractTemplate::find($templateId);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            $validate = new RepairContractValidate();
            if (!$validate->scene('create')->check($contractData)) {
                return Result::error($validate->getError(), 422);
            }

            $contractData['status'] = $contractData['status'] ?? 'draft';

            $contract = RepairContract::create($contractData);

            return Result::success([
                'contract' => $contract,
                'template_name' => $template->name
            ], '从模板创建合同成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新合同
     * PUT /repair-contracts/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $contract = RepairContract::find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            $validate = new RepairContractValidate();
            if (!$validate->scene('update')->check($data)) {
                return Result::error($validate->getError(), 422);
            }

            $contract->save($data);

            return Result::success($contract, '合同更新更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除合同
     * DELETE /repair-contracts/{id}
     */
    public function delete($id)
    {
        try {
            $contract = RepairContract::find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            if ($contract->status === 'active') {
                return Result::error('生效中的合同无法删除', 400);
            }

            $contract->delete();

            return Result::success(null, '合同删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 批量删除合同
     * POST /repair-contracts/batch-delete
     */
    public function batchDelete()
    {
        $data = request()->post();
        $ids = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return Result::error('请选择要删除的合同', 400);
        }

        try {
            $activeContracts = RepairContract::whereIn('id', $ids)
                ->where('status', 'active')
                ->count();

            if ($activeContracts > 0) {
                return Result::error('包含生效中的合同，无法删除', 400);
            }

            RepairContract::destroy($ids);

            return Result::success(null, '批量删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 激活合同
     * POST /repair-contracts/{id}/activate
     */
    public function activate($id)
    {
        try {
            $contract = RepairContract::find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            if ($contract->status === 'active') {
                return Result::error('合同已激活', 400);
            }

            $contract->status = 'active';
            $contract->save();

            return Result::success($contract, '合同激活成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 终止合同
     * POST /repair-contracts/{id}/terminate
     */
    public function terminate($id)
    {
        try {
            $contract = RepairContract::find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            if ($contract->status !== 'active') {
                return Result::error('只有生效中的合同才能终止', 400);
            }

            $contract->status = 'terminated';
            $contract->save();

            return Result::success($contract, '合同终止成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 导出合同
     * POST /repair-contracts/{id}/export
     */
    public function export($id)
    {
        try {
            $contract = RepairContract::with(['customer', 'machine', 'items'])->find($id);

            if (!$contract) {
                return Result::error('合同不存在', 404);
            }

            $templateId = request()->post('template_id', 0);

            if (!empty($templateId)) {
                $template = ContractTemplate::find($templateId);
                if ($template) {
                    $content = $this->renderTemplate($template->content, $contract->toArray());
                } else {
                    $content = $this->generateDefaultContract($contract);
                }
            } else {
                $content = $this->generateDefaultContract($contract);
            }

            return Result::success([
                'content' => $content,
                'contract' => $contract
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 生成默认合同内容
     * @param RepairContract $contract
     * @return string
     */
    private function generateDefaultContract($contract)
    {
        $content = "维修服务合同\n\n";
        $content .= "合同编号：{$contract->contract_number}\n";
        $content .= "客户名称：{$contract->customer_name}\n";
        $content .= "客户电话：{$contract->customer_phone}\n";
        $content .= "机械类型：{$contract->machine_type}\n";
        $content .= "开始日期：{$contract->start_date}\n";
        $content .= "结束日期：{$contract->end_date}\n";
        $content .= "合同金额：" . number_format($contract->annual_fee, 2) . " 元\n";
        $content .= "服务内容：\n{$contract->service_content}\n";

        if (!empty($contract->service_terms)) {
            $content .= "服务条款：\n{$contract->service_terms}\n";
        }

        return $content;
    }

    /**
     * 渲染模板内容
     * @param string $template 模板内容
     * @param array $data 数据
     * @return string
     */
    private function renderTemplate($template, $data)
    {
        $content = $template;

        preg_match_all('/\{\{(\w+)\}\}/', $template, $matches);

        foreach ($matches[1] as $key) {
            $placeholder = '{{' . $key . '}}';
            $value = $data[$key] ?? '';

            if (in_array($key, ['annual_fee']) && is_numeric($value)) {
                $value = number_format($value, 2);
            }

            $content = str_replace($placeholder, $value, $content);
        }

        return $content;
    }

    /**
     * 获取合同统计数据
     * GET /repair-contracts/statistics
     */
    public function statistics()
    {
        try {
            $total = RepairContract::count();
            $draft = RepairContract::where('status', 'draft')->count();
            $active = RepairContract::where('status', 'active')->count();
            $expired = RepairContract::where('status', 'expired')->count();
            $terminated = RepairContract::where('status', 'terminated')->count();

            $totalAmount = RepairContract::sum('annual_fee');
            $activeAmount = RepairContract::where('status', 'active')->sum('annual_fee');

            return Result::success([
                'total' => $total,
                'by_status' => [
                    'draft' => $draft,
                    'active' => $active,
                    'expired' => $expired,
                    'terminated' => $terminated,
                ],
                'total_amount' => $totalAmount,
                'active_amount' => $activeAmount,
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
