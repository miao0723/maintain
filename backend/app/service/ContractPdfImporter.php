<?php

namespace app\service;

/**
 * 合同 PDF 导入器
 *
 * 职责：
 *  - 调用 PdfTextExtractor 提取 PDF 文本；
 *  - 从文本中识别"标签：值"形式的字段，映射为模板变量；
 *  - 将原文中的值替换为 {{变量}} 占位符，生成可用模板内容。
 *
 * 同时支持传入纯文本（从 PDF 阅读器复制）进行解析。
 */
class ContractPdfImporter
{
    /**
     * 中文标签 -> 模板变量 key 映射
     */
    const LABEL_MAP = [
        '合同编号' => 'contract_number',
        '编号' => 'contract_number',
        '合同名称' => 'contract_name',
        '名称' => 'contract_name',
        '甲方' => 'customer_name',
        '委托方' => 'customer_name',
        '买方' => 'customer_name',
        '客户名称' => 'customer_name',
        '乙方' => 'company_name',
        '服务方' => 'company_name',
        '卖方' => 'company_name',
        '公司名称' => 'company_name',
        '签订日期' => 'sign_date',
        '签署日期' => 'sign_date',
        '签约日期' => 'sign_date',
        '签订地点' => 'sign_place',
        '签署地点' => 'sign_place',
        '开始日期' => 'start_date',
        '起始日期' => 'start_date',
        '生效日期' => 'start_date',
        '结束日期' => 'end_date',
        '终止日期' => 'end_date',
        '有效期至' => 'end_date',
        '联系电话' => 'customer_phone',
        '电话' => 'customer_phone',
        '联系人电话' => 'customer_phone',
        '联系地址' => 'company_address',
        '地址' => 'company_address',
        '公司地址' => 'company_address',
        '金额' => 'annual_fee',
        '合同金额' => 'annual_fee',
        '总费用' => 'annual_fee',
        '总价' => 'annual_fee',
        '总金额' => 'annual_fee',
        '合同总价' => 'total_amount',
        '产品名称' => 'product_name',
        '产品' => 'product_name',
        '货物名称' => 'product_name',
        '规格型号' => 'product_spec',
        '型号' => 'product_spec',
        '数量' => 'quantity',
        '单价' => 'unit_price',
        '交货日期' => 'delivery_date',
        '交付日期' => 'delivery_date',
        '交货地点' => 'delivery_place',
        '交付地点' => 'delivery_place',
        '付款方式' => 'payment_method',
        '质量标准' => 'quality_standard',
        '质量要求' => 'quality_standard',
        '验收方式' => 'acceptance_method',
        '验收标准' => 'acceptance_method',
        '违约责任' => 'liability_terms',
        '争议解决' => 'dispute_resolution',
        '买方签字' => 'buyer_sign',
        '卖方签字' => 'seller_sign',
        '机械类型' => 'machine_type',
        '设备类型' => 'machine_type',
        '服务内容' => 'service_content',
        '服务标的' => 'service_content',
    ];

    /**
     * 从 PDF 文件导入
     */
    public function importFromFile(string $path): array
    {
        $text = (new PdfTextExtractor())->extract($path);
        return $this->importFromText($text);
    }

    /**
     * 从纯文本导入（粘贴的合同文本）
     */
    public function importFromText(string $text): array
    {
        $text = trim($text);
        $lines = preg_split('/\r\n|\r|\n/', $text);
        $lines = $lines === false ? [] : $lines;

        $fields = [];
        $used = [];
        $contentLines = [];

        // 行首：标签（中文/字母/数字/括号/斜杠，1-16 字符） + 冒号 + 值
        $labelRe = '/^([\x{4e00}-\x{9fff}A-Za-z0-9_（）()\/\-]{1,16})[:：]\s*(.*)$/u';

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                $contentLines[] = '';
                continue;
            }

            if (preg_match($labelRe, $line, $m)) {
                $label = trim($m[1]);
                $value = trim($m[2] ?? '');
                $key = $this->mapLabel($label);

                if ($key) {
                    if (!isset($used[$key])) {
                        $fields[] = [
                            'key' => $key,
                            'label' => $label,
                            'sample' => $value,
                        ];
                        $used[$key] = true;
                    }
                    $contentLines[] = $label . '：{{' . $key . '}}';
                    continue;
                }
            }

            $contentLines[] = $line;
        }

        return [
            'raw_text' => $text,
            'content' => implode("\n", $contentLines),
            'fields' => $fields,
        ];
    }

    /**
     * 将中文标签映射为模板变量 key
     */
    private function mapLabel(string $label): ?string
    {
        $label = trim($label);
        // 去掉括号备注，如 "甲方（委托方）" -> "甲方"
        $norm = preg_replace('/[（(][^（）()]*[）)]/u', '', $label);
        $norm = trim($norm);

        if (isset(self::LABEL_MAP[$norm])) {
            return self::LABEL_MAP[$norm];
        }

        // 前缀/包含匹配
        foreach (self::LABEL_MAP as $k => $v) {
            if (strpos($label, $k) !== false) {
                return $v;
            }
        }

        return null;
    }
}
