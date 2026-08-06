<?php

namespace app\service;

/**
 * AI 服务类
 * 用于调用 DeepSeek API 进行智能总结和分析
 */
class AIService
{
    private $apiKey;
    private $apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = env('DEEPSEEK_API_KEY', '');
    }

    /**
     * 调用 DeepSeek API 生成总结
     *
     * @param array $data 超时统计数据
     * @return string 生成的总结内容
     */
    public function generateTimeoutSummary($data)
    {
        if (empty($this->apiKey)) {
            throw new \Exception('DeepSeek API Key 未配置');
        }

        $prompt = $this->buildPrompt($data);

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => '你是一个专业的维修管理系统分析助手，擅长分析超时数据并提供专业建议。请用中文回答，内容要详细、专业、实用。'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 设置超时为 120 秒
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30); // 连接超时 30 秒

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('API 请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new \Exception('API 错误: ' . ($result['error']['message'] ?? '未知错误'));
        }

        return $result['choices'][0]['message']['content'] ?? '';
    }

    /**
     * 构建提示词
     *
     * @param array $data
     * @return string
     */
    private function buildPrompt($data)
    {
        $statistics = $data['statistics'] ?? [];
        $timeline = $data['timeline'] ?? [];
        $reasonStats = $data['reason_stats'] ?? [];
        $table = $data['table'] ?? [];

        $prompt = "请分析以下维修超时统计数据，生成一份详细的超时预警报告：\n\n";

        $prompt .= "=== 统计概览 ===\n";
        $prompt .= "- 超时总数：{$statistics['total_timeouts']} 次\n";
        $prompt .= "- 响应超时：{$statistics['response_timeouts']} 次\n";
        $prompt .= "- 维修超时：{$statistics['repair_timeouts']} 次\n";
        $prompt .= "- 交付超时：{$statistics['delivery_timeouts']} 次\n\n";

        $prompt .= "=== 超时趋势 ===\n";
        if (!empty($timeline)) {
            $prompt .= "最近 " . count($timeline) . " 天的超时趋势：\n";
            foreach ($timeline as $item) {
                $total = $item['response'] + $item['repair'] + $item['delivery'];
                $prompt .= "- {$item['date']}：响应{$item['response']}次，维修{$item['repair']}次，交付{$item['delivery']}次（共{$total}次）\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 超时原因分析 ===\n";
        if (!empty($reasonStats)) {
            $prompt .= "主要原因统计：\n";
            foreach ($reasonStats as $item) {
                $prompt .= "- {$item['name']}：{$item['value']} 次\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 详细超时记录（最近10条）===\n";
        if (!empty($table)) {
            $recent = array_slice($table, 0, 10);
            foreach ($recent as $item) {
                $typeText = $item['timeout_type'] === 'response' ? '响应超时' :
                           ($item['timeout_type'] === 'repair' ? '维修超时' : '交付超时');
                $prompt .= "- 订单号：{$item['order_no']}，类型：{$typeText}，时长：{$item['timeout_duration']}，原因：{$item['reason']}，责任人：{$item['responsible']}\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 报告要求 ===\n";
        $prompt .= "请生成一份简洁美观的超时预警报告，要求：\n";
        $prompt .= "1. 使用简洁语言，每段控制在3-5行\n";
        $prompt .= "2. 突出关键数据和趋势，避免冗长描述\n";
        $prompt .= "3. 使用要点列出3-5条最核心的改进建议\n";
        $prompt .= "4. 格式清晰：用##表示章节，用-表示要点\n";
        $prompt .= "5. 总篇幅控制在800字以内，突出可执行性\n";
        $prompt .= "6. 每个章节聚焦一个核心观点，避免信息过载\n\n";

        $prompt .= "输出格式示例：\n";
        $prompt .= "## 核心发现\n";
        $prompt .= "- 总超时X次，主要集中在XX类型\n\n";
        $prompt .= "## 主要问题\n";
        $prompt .= "- 问题1：简短描述\n";
        $prompt .= "- 问题2：简短描述\n\n";
        $prompt .= "## 改进建议\n";
        $prompt .= "- 建议1：具体可执行措施\n";
        $prompt .= "- 建议2：具体可执行措施\n";

        return $prompt;
    }

    /**
     * 调用 DeepSeek API 生成收入统计总结
     *
     * @param array $data 收入统计数据
     * @return string 生成的总结内容
     */
    public function generateIncomeSummary($data)
    {
        if (empty($this->apiKey)) {
            throw new \Exception('DeepSeek API Key 未配置');
        }

        $prompt = $this->buildIncomePrompt($data);

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => '你是一个专业的财务分析助手，擅长分析收入数据并提供专业的财务见解。请用中文回答，内容要详细、专业、实用。'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('API 请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new \Exception('API 错误: ' . ($result['error']['message'] ?? '未知错误'));
        }

        return $result['choices'][0]['message']['content'] ?? '';
    }

    /**
     * 构建收入统计提示词
     *
     * @param array $data
     * @return string
     */
    private function buildIncomePrompt($data)
    {
        $statistics = $data['statistics'] ?? [];
        $timeline = $data['timeline'] ?? [];
        $table = $data['table'] ?? [];

        $prompt = "请分析以下收入统计数据，生成一份详细的收入分析报告：\n\n";

        $prompt .= "=== 统计概览 ===\n";
        $prompt .= "- 总收入：¥" . number_format($statistics['total_income'] ?? 0, 2) . "\n";
        $prompt .= "- 在线支付收入：¥" . number_format($statistics['online_income'] ?? 0, 2) . "\n";
        $prompt .= "- 转账收入：¥" . number_format($statistics['transfer_income'] ?? 0, 2) . "\n";
        $prompt .= "- 平均订单金额：¥" . number_format($statistics['avg_amount'] ?? 0, 2) . "\n";
        $prompt .= "- 增长率：" . ($statistics['growth_rate'] ?? 0) . "%\n\n";

        $prompt .= "=== 收入趋势 ===\n";
        if (!empty($timeline)) {
            $prompt .= "最近 " . count($timeline) . " 天的收入趋势：\n";
            foreach ($timeline as $item) {
                $prompt .= "- {$item['date']}：在线支付¥" . number_format($item['online_income'] ?? 0, 2) . "，转账¥" . number_format($item['transfer_income'] ?? 0, 2) . "，总收入¥" . number_format($item['total_income'] ?? 0, 2) . "\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 收入详细记录（最近15条）===\n";
        if (!empty($table)) {
            $recent = array_slice($table, 0, 15);
            foreach ($recent as $item) {
                $prompt .= "- {$item['date']}：订单数量{$item['order_count']}，在线支付¥" . number_format($item['online_income'] ?? 0, 2) . "，转账¥" . number_format($item['transfer_income'] ?? 0, 2) . "，总收入¥" . number_format($item['total_income'] ?? 0, 2) . "，增长率" . ($item['growth_rate'] ?? 0) . "%\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 报告要求 ===\n";
        $prompt .= "请生成一份简洁美观的收入分析报告，要求：\n";
        $prompt .= "1. 使用简洁语言，每段控制在3-5行\n";
        $prompt .= "2. 突出关键数据和增长趋势，避免冗长描述\n";
        $prompt .= "3. 使用要点列出3-5条最核心的财务建议\n";
        $prompt .= "4. 格式清晰：用##表示章节，用-表示要点\n";
        $prompt .= "5. 总篇幅控制在800字以内，突出可执行性\n";
        $prompt .= "6. 每个章节聚焦一个核心观点，避免信息过载\n\n";

        $prompt .= "输出格式示例：\n";
        $prompt .= "## 收入概览\n";
        $prompt .= "- 总收入¥X，增长X%，主要来自XX渠道\n\n";
        $prompt .= "## 趋势分析\n";
        $prompt .= "- 趋势：简短描述\n";
        $prompt .= "- 关键变化：简短描述\n\n";
        $prompt .= "## 优化建议\n";
        $prompt .= "- 建议1：具体可执行措施\n";
        $prompt .= "- 建议2：具体可执行措施\n";

        return $prompt;
    }

    /**
     * 调用 DeepSeek API 生成开支统计总结
     *
     * @param array $data 开支统计数据
     * @return string 生成的总结内容
     */
    public function generateExpenseSummary($data)
    {
        if (empty($this->apiKey)) {
            throw new \Exception('DeepSeek API Key 未配置');
        }

        $prompt = $this->buildExpensePrompt($data);

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => '你是一个专业的财务分析助手，擅长分析支出数据并提供专业的财务见解。请用中文回答，内容要详细、专业、实用。'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('API 请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new \Exception('API 错误: ' . ($result['error']['message'] ?? '未知错误'));
        }

        return $result['choices'][0]['message']['content'] ?? '';
    }

    /**
     * 构建开支统计提示词
     *
     * @param array $data
     * @return string
     */
    private function buildExpensePrompt($data)
    {
        $statistics = $data['statistics'] ?? [];
        $timeline = $data['timeline'] ?? [];
        $table = $data['table'] ?? [];

        $prompt = "请分析以下支出统计数据，生成一份详细的支出分析报告：\n\n";

        $prompt .= "=== 统计概览 ===\n";
        $prompt .= "- 总支出：¥" . number_format($statistics['total_expense'] ?? 0, 2) . "\n";
        $prompt .= "- 采购支出：¥" . number_format($statistics['purchase_expense'] ?? 0, 2) . "\n";
        $prompt .= "- 人员工资：¥" . number_format($statistics['salary_expense'] ?? 0, 2) . "\n";
        $prompt .= "- 运营费用：¥" . number_format($statistics['operation_expense'] ?? 0, 2) . "\n";
        $prompt .= "- 其他支出：¥" . number_format($statistics['other_expense'] ?? 0, 2) . "\n\n";

        $prompt .= "=== 支出趋势 ===\n";
        if (!empty($timeline)) {
            $prompt .= "最近 " . count($timeline) . " 天的支出趋势：\n";
            foreach ($timeline as $item) {
                $prompt .= "- {$item['date']}：采购¥" . number_format($item['purchase'] ?? 0, 2) . "，工资¥" . number_format($item['salary'] ?? 0, 2) . "，运营¥" . number_format($item['operation'] ?? 0, 2) . "\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 支出详细记录（最近15条）===\n";
        if (!empty($table)) {
            $recent = array_slice($table, 0, 15);
            foreach ($recent as $item) {
                $categoryMap = ['purchase' => '采购支出', 'salary' => '人员工资', 'operation' => '运营费用', 'other' => '其他支出'];
                $categoryText = $categoryMap[$item['category']] ?? '未知';
                $prompt .= "- {$item['expense_date']}：{$categoryText}，¥" . number_format($item['amount'] ?? 0, 2) . "，{$item['description']}，支付方式：{$item['payment_method']}，经办人：{$item['operator']}\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 报告要求 ===\n";
        $prompt .= "请根据以上数据，生成一份详细的支出分析报告，包括：\n";
        $prompt .= "1. 支出概况：总支出及各分类支出情况\n";
        $prompt .= "2. 趋势分析：支出变化趋势和波动情况\n";
        $prompt .= "3. 分类分析：各类支出的占比和重要性\n";
        $prompt .= "4. 成本控制：高成本项目分析和优化建议\n";
        $prompt .= "5. 财务建议：成本控制建议和预算规划\n\n";

        $prompt .= "报告要求：\n";
        $prompt .= "- 使用 Markdown 格式，便于阅读\n";
        $prompt .= "- 每个部分都要有详细内容，不要过于简略\n";
        $prompt .= "- 建议要具体可执行\n";
        $prompt .= "- 关注数据之间的关联性\n";

        return $prompt;
    }

    /**
     * 调用 DeepSeek API 生成订单统计总结
     *
     * @param array $data 订单统计数据
     * @return string 生成的总结内容
     */
    public function generateOrderSummary($data)
    {
        if (empty($this->apiKey)) {
            throw new \Exception('DeepSeek API Key 未配置');
        }

        $prompt = $this->buildOrderPrompt($data);

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => '你是一个专业的业务分析助手，擅长分析订单数据并提供专业的业务见解。请用中文回答，内容要详细、专业、实用。'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 2000
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('API 请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            throw new \Exception('API 错误: ' . ($result['error']['message'] ?? '未知错误'));
        }

        return $result['choices'][0]['message']['content'] ?? '';
    }

    /**
     * 构建订单统计提示词
     *
     * @param array $data
     * @return string
     */
    private function buildOrderPrompt($data)
    {
        $statistics = $data['statistics'] ?? [];
        $timeline = $data['timeline'] ?? [];
        $statusStats = $data['status_stats'] ?? [];
        $table = $data['table'] ?? [];

        $prompt = "请分析以下订单统计数据，生成一份详细的订单分析报告：\n\n";

        $prompt .= "=== 统计概览 ===\n";
        $prompt .= "- 总订单数：{$statistics['total_orders']} 单\n";
        $prompt .= "- 已完成订单：{$statistics['completed_orders']} 单\n";
        $prompt .= "- 处理中订单：{$statistics['processing_orders']} 单\n";
        $prompt .= "- 待处理订单：{$statistics['pending_orders']} 单\n";
        $prompt .= "- 完成率：" . ($statistics['completion_rate'] ?? 0) . "%\n\n";

        $prompt .= "=== 订单趋势 ===\n";
        if (!empty($timeline)) {
            $prompt .= "最近 " . count($timeline) . " 天的订单趋势：\n";
            foreach ($timeline as $item) {
                $prompt .= "- {$item['date']}：订单数量{$item['count']}\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 订单状态分布 ===\n";
        if (!empty($statusStats)) {
            $statusMap = ['pending' => '待处理', 'processing' => '处理中', 'completed' => '已完成', 'cancelled' => '已取消'];
            foreach ($statusStats as $item) {
                $statusText = $statusMap[$item['status']] ?? '未知';
                $prompt .= "- {$statusText}：{$item['count']} 单\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 订单详细记录（最近15条）===\n";
        if (!empty($table)) {
            $recent = array_slice($table, 0, 15);
            $statusMap = ['pending' => '待处理', 'processing' => '处理中', 'completed' => '已完成', 'cancelled' => '已取消'];
            foreach ($recent as $item) {
                $statusText = $statusMap[$item['status']] ?? '未知';
                $prompt .= "- 订单号：{$item['order_no']}，客户：{$item['customer_name']}，机械类型：{$item['machine_type']}，金额¥" . number_format($item['amount'] ?? 0, 2) . "，状态：{$statusText}，创建时间：{$item['created_at']}\n";
            }
        }
        $prompt .= "\n";

        $prompt .= "=== 报告要求 ===\n";
        $prompt .= "请根据以上数据，生成一份详细的订单分析报告，包括：\n";
        $prompt .= "1. 订单概况：总订单数、完成率、状态分布\n";
        $prompt .= "2. 趋势分析：订单数量变化趋势\n";
        $prompt .= "3. 状态分析：各状态订单占比和处理效率\n";
        $prompt .= "4. 业务表现：客户需求和业务量分析\n";
        $prompt .= "5. 运营建议：提高完成率和处理效率的建议\n\n";

        $prompt .= "报告要求：\n";
        $prompt .= "- 使用 Markdown 格式，便于阅读\n";
        $prompt .= "- 每个部分都要有详细内容，不要过于简略\n";
        $prompt .= "- 建议要具体可执行\n";
        $prompt .= "- 关注数据之间的关联性\n";

        return $prompt;
    }
}
