<?php

namespace app\controller;

use app\model\ContractTemplate;
use app\common\Result;
use app\validate\ContractTemplateValidate;
use app\service\ContractPdfImporter;

/**
 * 合同模板管理控制器
 */
class ContractTemplateController extends BaseController
{
    /**
     * 获取模板列表
     * GET /contract-templates
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $name = request()->get('name', '');
        $type = request()->get('type', '');
        $keyword = request()->get('keyword', '');

        try {
            $query = ContractTemplate::with(['creator'])->order('id', 'desc');

            if (!empty($name)) {
                $query->where('name', 'like', '%' . $name . '%');
            }

            if (!empty($type)) {
                $query->where('type', $type);
            }

            if (!empty($keyword)) {
                $query->where('name|description', 'like', '%' . $keyword . '%');
            }

            $total = $query->count();
            $templates = $query->page($page, $pageSize)->select();

            return Result::paginated($templates, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取模板详情
     * GET /contract-templates/{id}
     */
    public function read($id)
    {
        try {
            $template = ContractTemplate::with(['creator'])->find($id);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            return Result::success($template);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建模板
     * POST /contract-templates
     */
    public function save()
    {
        $data = request()->post();

        try {
            $validate = new ContractTemplateValidate();
            if (!$validate->scene('create')->check($data)) {
                return Result::error($validate->getError(), 422);
            }

            if (empty($data['created_by'])) {
                $data['created_by'] = $this->getUserId();
            }

            $template = ContractTemplate::create($data);

            return Result::success($template, '模板创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新模板
     * PUT /contract-templates/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $template = ContractTemplate::find($id);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            $validate = new ContractTemplateValidate();
            if (!$validate->scene('update')->check($data)) {
                return Result::error($validate->getError(), 422);
            }

            $template->save($data);

            return Result::success($template, '模板更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除模板
     * DELETE /contract-templates/{id}
     */
    public function delete($id)
    {
        try {
            $template = ContractTemplate::find($id);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            $template->delete();

            return Result::success(null, '模板删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 预览模板
     * POST /contract-templates/{id}/preview
     */
    public function preview($id)
    {
        try {
            $template = ContractTemplate::find($id);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            $contractData = request()->post('contract_data', []);
            $content = $this->renderTemplate($template->content, $contractData);

            return Result::success([
                'content' => $content,
                'template' => $template
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 批量删除模板
     * POST /contract-templates/batch-delete
     */
    public function batchDelete()
    {
        $data = request()->post();
        $ids = $data['ids'] ?? [];

        if (empty($ids) || !is_array($ids)) {
            return Result::error('请选择要删除的模板', 400);
        }

        try {
            ContractTemplate::destroy($ids);

            return Result::success(null, '批量删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 复制模板
     * POST /contract-templates/{id}/copy
     */
    public function copy($id)
    {
        try {
            $template = ContractTemplate::find($id);

            if (!$template) {
                return Result::error('模板不存在', 404);
            }

            $newTemplate = $template->replicate();
            $newTemplate->name = $template->name . ' (副本)';
            $newTemplate->created_by = $this->getUserId();
            $newTemplate->save();

            return Result::success($newTemplate, '模板复制成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取模板变量列表
     * GET /contract-templates/variables
     */
    public function getVariables()
    {
        return Result::success([
            'default_variables' => [
                ['key' => 'contract_number', 'label' => '合同编号', 'default' => ''],
                ['key' => 'customer_name', 'label' => '客户名称', 'default' => ''],
                ['key' => 'customer_phone', 'label' => '客户电话', 'default' => ''],
                ['key' => 'company_name', 'label' => '公司名称', 'default' => ''],
                ['key' => 'company_address', 'label' => '公司地址', 'default' => ''],
                ['key' => 'company_phone', 'label' => '公司电话', 'default' => ''],
                ['key' => 'machine_type', 'label' => '机械类型', 'default' => ''],
                ['key' => 'service_content', 'label' => '服务内容', 'default' => ''],
                ['key' => 'annual_fee', 'label' => '合同金额', 'default' => '0'],
                ['key' => 'start_date', 'label' => '开始日期', 'default' => ''],
                ['key' => 'end_date', 'label' => '结束日期', 'default' => ''],
                ['key' => 'sign_date', 'label' => '签订日期', 'default' => ''],
                // 交易合同专用变量
                ['key' => 'product_name', 'label' => '产品名称', 'default' => ''],
                ['key' => 'product_spec', 'label' => '规格型号', 'default' => ''],
                ['key' => 'quantity', 'label' => '数量', 'default' => '1'],
                ['key' => 'unit_price', 'label' => '单价', 'default' => '0'],
                ['key' => 'total_amount', 'label' => '总金额', 'default' => '0'],
                ['key' => 'delivery_date', 'label' => '交货日期', 'default' => ''],
                ['key' => 'delivery_place', 'label' => '交货地点', 'default' => ''],
                ['key' => 'payment_method', 'label' => '付款方式', 'default' => ''],
                ['key' => 'quality_standard', 'label' => '质量标准', 'default' => ''],
                ['key' => 'acceptance_method', 'label' => '验收方式', 'default' => ''],
                ['key' => 'liability_terms', 'label' => '违约责任', 'default' => ''],
                ['key' => 'dispute_resolution', 'label' => '争议解决', 'default' => ''],
                ['key' => 'buyer_sign', 'label' => '买方签字', 'default' => ''],
                ['key' => 'seller_sign', 'label' => '卖方签字', 'default' => ''],
                ['key' => 'sign_place', 'label' => '签订地点', 'default' => ''],
            ],
            'types' => [
                ['value' => 'repair_contract', 'label' => '维修合同'],
                ['value' => 'service_agreement', 'label' => '服务协议'],
                ['value' => 'confidentiality', 'label' => '保密协议'],
                ['value' => 'trade_contract', 'label' => '交易合同'],
            ]
        ]);
    }

    /**
     * 从上传的 PDF 合同提取字段并生成模板草稿
     * POST /contract-templates/import-pdf
     */
    public function importPdf()
    {
        $file = request()->file('file');
        if (!$file) {
            return Result::error('请上传 PDF 文件', 400);
        }

        $ext = strtolower($file->getOriginalExtension());
        if ($ext !== 'pdf') {
            return Result::error('仅支持 PDF 格式合同', 400);
        }

        if ($file->getSize() > 20 * 1024 * 1024) {
            return Result::error('PDF 文件不能超过 20MB', 400);
        }

        try {
            $dir = root_path() . 'public/uploads/contract-templates/';
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $filename = uniqid() . '_' . time() . '.pdf';
            $file->move($dir, $filename);
            $fullPath = $dir . $filename;

            $importer = new ContractPdfImporter();
            $result = $importer->importFromFile($fullPath);

            if (empty(trim($result['raw_text']))) {
                return Result::success($result, '未能从该 PDF 中提取到文字，可能是扫描件/图片型 PDF。您可在弹窗中粘贴文本后重试', 200);
            }

            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error('PDF 解析失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 从粘贴的合同文本提取字段并生成模板草稿
     * POST /contract-templates/parse-text
     */
    public function parseText()
    {
        $text = request()->post('text', '');
        if (empty(trim($text))) {
            return Result::error('请提供合同文本', 400);
        }

        try {
            $importer = new ContractPdfImporter();
            $result = $importer->importFromText($text);
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error('解析失败：' . $e->getMessage(), 500);
        }
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
     * 导出合同PDF
     * POST /contract-templates/export-pdf
     */
    public function exportPdf()
    {
        $data = request()->post();

        try {
            $templateId = $data['template_id'] ?? 0;
            $contractData = $data['contract_data'] ?? [];

            if (empty($templateId)) {
                return Result::error('请选择合同模板', 400);
            }

            if (empty($contractData)) {
                return Result::error('请填写合同信息', 400);
            }

            $template = ContractTemplate::find($templateId);

            if (!$template) {
                return Result::error('所选模板不存在，请重新选择', 404);
            }

            $contractData = $this->normalizeContractDataByTemplate($contractData, $template);
            $requiredFields = $this->getRequiredFieldsByTemplate($template);

            $missingFields = [];
            foreach ($requiredFields as $field => $label) {
                if (
                    !array_key_exists($field, $contractData) ||
                    $contractData[$field] === null ||
                    (is_string($contractData[$field]) && trim($contractData[$field]) === '')
                ) {
                    $missingFields[] = $label;
                }
            }

            if (!empty($missingFields)) {
                return Result::error('请完善合同信息，缺少以下字段：' . implode('、', $missingFields), 400);
            }

            // 渲染模板内容
            $content = $this->renderTemplate($template->content, $contractData);

            // 保存合同到数据库
            $contractData['status'] = $contractData['status'] ?? 'draft';
            $contract = new \app\model\RepairContract();
            $contract->save($contractData);

            // 生成PDF
            $pdfContent = $this->generatePDF($content, $contractData);

            // 返回PDF文件下载
            $filename = '维修合同_' . ($contractData['contract_number'] ?? 'contract') . '.pdf';
            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . urlencode($filename) . '"',
            ]);
        } catch (\PDOException $e) {
            // 数据库约束错误 - 转为中文提示
            $msg = $e->getMessage();
            if (strpos($msg, '1048') !== false) {
                preg_match("/Column '(\w+)'/", $msg, $m);
                $fieldMap = [
                    'contract_number' => '合同编号',
                    'customer_name' => '客户名称',
                    'start_date' => '开始日期',
                    'end_date' => '结束日期',
                    'sign_date' => '签订日期',
                    'company_name' => '公司名称',
                ];
                $col = $m[1] ?? '';
                $label = $fieldMap[$col] ?? $col;
                return Result::error('合同保存失败：「' . $label . '」不能为空，请返回填写完整后再试', 400);
            }
            return Result::error('合同保存失败：数据库写入异常，请检查数据后重试', 500);
        } catch (\Exception $e) {
            return Result::error('合同导出失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 生成PDF文件
     * @param string $content 合同内容
     * @param array $contractData 合同数据
     * @return string PDF二进制内容
     */
    private function generatePDF($content, $contractData)
    {
        $pdf = new \TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);

        // 设置文档信息
        $pdf->SetCreator('CMMS System');
        $pdf->SetAuthor($contractData['company_name'] ?? 'CMMS');
        $documentTitle = $contractData['document_title'] ?? '合同文件';
        $pdf->SetTitle($documentTitle . ' - ' . ($contractData['contract_number'] ?? ''));
        $pdf->SetSubject($documentTitle);

        // 设置页眉页脚
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        // 设置边距
        $pdf->SetMargins(20, 20, 20);
        $pdf->SetAutoPageBreak(true, 20);

        // 添加页面
        $pdf->AddPage();

        // 设置中文字体
        $pdf->SetFont('stsongstdlight', '', 14);

        // 标题
        $title = $documentTitle;
        $pdf->Cell(0, 10, $title, 0, 1, 'C');
        $pdf->SetFont('stsongstdlight', '', 10);
        $pdf->SetTextColor(110, 110, 110);
        $pdf->Cell(0, 6, '合同编号：' . ($contractData['contract_number'] ?? ''), 0, 1, 'R');
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Ln(4);

        // 正文内容 - 使用较小的字体
        $pdf->SetFont('stsongstdlight', '', 11);

        // 将内容按行处理，支持基本格式
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                $pdf->Ln(4);
                continue;
            }

            // 检查是否是一级标题（如 "一、服务内容"）
            if (preg_match('/^[一二三四五六七八九十]+、/', $line)) {
                $pdf->Ln(3);
                $pdf->SetFont('stsongstdlight', '', 12);
                $pdf->Cell(0, 8, $line, 0, 1, 'L');
                $pdf->SetFont('stsongstdlight', '', 11);
                continue;
            }

            // 检查是否是二级标题
            if (preg_match('/^\d+[\.\、]/', $line)) {
                $pdf->Cell(5, 7, '', 0, 0, 'L'); // 缩进
                $pdf->Cell(0, 7, $line, 0, 1, 'L');
                continue;
            }

            // 下划线占位符
            if (strpos($line, '____') !== false) {
                $pdf->Ln(5);
                $pdf->Cell(0, 8, $line, 0, 1, 'L');
                continue;
            }

            $isMetaLine = preg_match('/^(合同编号|签订地点|签订日期|买方（甲方）|卖方（乙方）|甲方（委托方）|乙方（服务方）|联系电话|地址|产品名称|规格型号|数量|单价|总金额|交货日期|交货地点|机械类型|合同总金额|日期)[：:]/u', $line);
            if ($isMetaLine) {
                $pdf->MultiCell(0, 7, $line, 0, 'L', false, 1);
                continue;
            }

            // 普通段落 - 首行留出中文合同常见段首缩进
            $pdf->Cell(7, 7, '', 0, 0, 'L');
            $pdf->MultiCell(0, 7, $line, 0, 'L', false, 1);
        }

        return $pdf->Output('', 'S');
    }

    /**
     * 根据模板类型规范化合同数据，兼容交易合同这类不使用服务起止日期的场景。
     *
     * @param array $contractData
     * @param ContractTemplate $template
     * @return array
     */
    private function normalizeContractDataByTemplate(array $contractData, ContractTemplate $template): array
    {
        $signDate = $contractData['sign_date'] ?? date('Y-m-d');
        $documentTitleMap = [
            'repair_contract' => '维修服务合同',
            'service_agreement' => '服务协议',
            'confidentiality' => '保密协议',
            'trade_contract' => '产品买卖合同',
        ];

        $contractData['document_title'] = $documentTitleMap[$template->type] ?? '合同文件';

        if ($template->type === 'trade_contract') {
            if (
                (!isset($contractData['total_amount']) || $contractData['total_amount'] === '' || $contractData['total_amount'] === null) &&
                isset($contractData['quantity'], $contractData['unit_price']) &&
                is_numeric($contractData['quantity']) &&
                is_numeric($contractData['unit_price'])
            ) {
                $contractData['total_amount'] = round((float) $contractData['quantity'] * (float) $contractData['unit_price'], 2);
            }

            // repair_contracts 表当前仍要求这些字段非空，交易合同导出时回填为合理默认值
            $contractData['machine_type'] = $contractData['machine_type'] ?? ($contractData['product_name'] ?? '产品买卖');
            $contractData['service_content'] = $contractData['service_content'] ?? (($contractData['product_name'] ?? '产品') . '销售与交付');
            $contractData['annual_fee'] = $contractData['annual_fee'] ?? ($contractData['total_amount'] ?? 0);
            $contractData['start_date'] = $contractData['start_date'] ?? $signDate;
            $contractData['end_date'] = $contractData['end_date'] ?? ($contractData['delivery_date'] ?? $signDate);
        }

        return $contractData;
    }

    /**
     * 按模板类型返回真正需要的字段。
     *
     * @param ContractTemplate $template
     * @return array<string, string>
     */
    private function getRequiredFieldsByTemplate(ContractTemplate $template): array
    {
        $common = [
            'contract_number' => '合同编号',
            'customer_name' => '客户名称',
            'sign_date' => '签订日期',
            'company_name' => '公司名称',
        ];

        if ($template->type === 'trade_contract') {
            return $common + [
                'product_name' => '产品名称',
                'quantity' => '数量',
                'unit_price' => '单价',
                'delivery_date' => '交货日期',
                'delivery_place' => '交货地点',
                'payment_method' => '付款方式',
            ];
        }

        return $common + [
            'start_date' => '开始日期',
            'end_date' => '结束日期',
        ];
    }

    /**
     * 获取当前用户ID
     * @return int
     */
    protected function getUserId()
    {
        try {
            return parent::getUserId();
        } catch (\Exception $e) {
            return 0;
        }
    }
}
