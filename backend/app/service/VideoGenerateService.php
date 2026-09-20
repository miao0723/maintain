<?php

namespace app\service;

use think\facade\Db;

/**
 * 阿里云百炼（DashScope）通义万相文生视频服务
 *
 * 异步任务模型：createTask() 提交 → queryTask() 轮询 → SUCCEEDED 后取 output.video_url。
 * 注意：万相生成的视频地址 24 小时内有效，调用方应在成功后尽快下载落地
 * （发布链路 PublishDispatcher::ensureLocalVideo 已兜底，生成完成时也会尽量预下载）。
 */
class VideoGenerateService
{
    /** 提交文生视频任务端点 */
    const CREATE_URL = '/api/v1/services/aigc/video-generation/video-synthesis';

    /** 异步任务查询端点前缀 */
    const TASK_URL = '/api/v1/tasks/';

    /** 默认模型：通义万相 Turbo，速度与成本均衡，适合营销素材批量产出；可用 VIDEO_GEN_MODEL 覆盖 */
    const DEFAULT_MODEL = 'wanx2.1-t2v-turbo';

    /** 画面比例 → 万相支持的分辨率（默认竖屏，匹配抖音/快手/小红书） */
    private static $ratioSizes = [
        '9:16' => '720*1280',
        '16:9' => '1280*720',
        '1:1' => '960*960',
    ];

    public function enabled()
    {
        $key = env('DASHSCOPE_API_KEY', '') ?: getenv('DASHSCOPE_API_KEY');
        return !empty($key);
    }

    public function model()
    {
        return (string)(env('VIDEO_GEN_MODEL', '') ?: self::DEFAULT_MODEL);
    }

    /**
     * 组装生成参数（尺寸/时长等口径统一在此收敛）
     * duration：万相支持 1~5 秒；prompt_extend 开启提示词智能改写以提升画面质量
     */
    public function buildParameters(array $request)
    {
        $size = trim((string)($request['size'] ?? ''));
        if ($size === '' || strpos($size, '*') === false) {
            $ratio = (string)($request['ratio'] ?? '9:16');
            $size = self::$ratioSizes[$ratio] ?? self::$ratioSizes['9:16'];
        }
        $duration = max(1, min(5, (int)($request['duration'] ?? 5)));
        $parameters = [
            'size' => $size,
            'duration' => $duration,
            'prompt_extend' => true,
        ];
        $seed = (int)($request['seed'] ?? 0);
        if ($seed > 0) {
            $parameters['seed'] = $seed;
        }
        return $parameters;
    }

    /**
     * 提交文生视频任务
     * 返回 ['ok'=>true,'task_id'=>..,'status'=>..,'raw'=>..] 或 ['ok'=>false,'error'=>..]
     */
    public function createTask($prompt, $negativePrompt, array $parameters)
    {
        $key = env('DASHSCOPE_API_KEY', '') ?: getenv('DASHSCOPE_API_KEY');
        if (empty($key)) {
            return ['ok' => false, 'error' => '未配置 DASHSCOPE_API_KEY'];
        }

        $body = [
            'model' => $this->model(),
            'input' => ['prompt' => $prompt],
            'parameters' => $parameters,
        ];
        if ($negativePrompt !== '') {
            $body['input']['negative_prompt'] = $negativePrompt;
        }

        $res = $this->request('POST', self::CREATE_URL, $key, $body, ['X-DashScope-Async: enable']);
        if ($res['error'] !== '') {
            return ['ok' => false, 'error' => '连接 DashScope 失败：' . $res['error']];
        }
        $decoded = json_decode($res['body'], true);
        $taskId = (string)($decoded['output']['task_id'] ?? '');
        if ($res['status'] >= 400 || $taskId === '') {
            $msg = (string)($decoded['message'] ?? ($decoded['output']['message'] ?? ''));
            return ['ok' => false, 'error' => 'DashScope 提交任务失败（HTTP ' . $res['status'] . '）：' . ($msg !== '' ? $msg : substr((string)$res['body'], 0, 300))];
        }
        return [
            'ok' => true,
            'task_id' => $taskId,
            'status' => (string)($decoded['output']['task_status'] ?? 'PENDING'),
            'raw' => $decoded,
        ];
    }

    /**
     * 查询任务状态
     * 返回 ['ok'=>true,'status'=>'succeeded|running|failed','video_url'=>..,'error'=>..,'raw'=>..]
     */
    public function queryTask($taskId)
    {
        $key = env('DASHSCOPE_API_KEY', '') ?: getenv('DASHSCOPE_API_KEY');
        if (empty($key)) {
            return ['ok' => false, 'error' => '未配置 DASHSCOPE_API_KEY'];
        }

        $res = $this->request('GET', self::TASK_URL . $taskId, $key, null, []);
        if ($res['error'] !== '') {
            return ['ok' => false, 'error' => '连接 DashScope 失败：' . $res['error']];
        }
        $decoded = json_decode($res['body'], true);
        $taskStatus = strtoupper((string)($decoded['output']['task_status'] ?? ''));
        if ($decoded === null || $taskStatus === '') {
            return ['ok' => false, 'error' => 'DashScope 返回了无效响应：' . substr((string)$res['body'], 0, 300)];
        }
        if ($taskStatus === 'SUCCEEDED') {
            return ['ok' => true, 'status' => 'succeeded', 'video_url' => (string)($decoded['output']['video_url'] ?? ''), 'error' => '', 'raw' => $decoded];
        }
        if (in_array($taskStatus, ['PENDING', 'RUNNING'], true)) {
            return ['ok' => true, 'status' => 'running', 'video_url' => '', 'error' => '', 'raw' => $decoded];
        }
        $code = (string)($decoded['output']['code'] ?? '');
        $msg = (string)($decoded['output']['message'] ?? ($decoded['message'] ?? '未知错误'));
        return ['ok' => true, 'status' => 'failed', 'video_url' => '', 'error' => ($code !== '' ? $code . '：' : '') . $msg, 'raw' => $decoded];
    }

    /**
     * 幂等补齐 marketing_douyin_content 的视频生成字段
     * （generate_config/workflow_result/edit_config 三列在仓库迁移中缺失，线上库状态不确定，运行期自愈）
     */
    public static function ensureColumns()
    {
        static $done = false;
        if ($done) {
            return;
        }
        $columns = Db::query(
            "SELECT COLUMN_NAME AS col FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'marketing_douyin_content'"
        );
        $exists = array_map(static function ($row) {
            return $row['col'];
        }, $columns);
        $ddl = [
            'generate_config' => "ADD COLUMN generate_config TEXT NULL COMMENT '生成参数（provider/prompt/尺寸/时长等）'",
            'workflow_result' => "ADD COLUMN workflow_result TEXT NULL COMMENT '生成服务原始返回（DashScope 任务结果）'",
            'edit_config' => "ADD COLUMN edit_config TEXT NULL COMMENT '二次优化参数'",
            'gen_task_id' => "ADD COLUMN gen_task_id VARCHAR(64) NULL COMMENT 'DashScope 异步任务ID'",
            'gen_status' => "ADD COLUMN gen_status VARCHAR(20) NULL DEFAULT 'none' COMMENT '生成状态 none/running/succeeded/failed'",
            'gen_error' => "ADD COLUMN gen_error VARCHAR(500) NULL COMMENT '生成失败原因'",
        ];
        foreach ($ddl as $name => $definition) {
            if (in_array($name, $exists, true)) {
                continue;
            }
            try {
                Db::execute("ALTER TABLE marketing_douyin_content {$definition}");
            } catch (\Exception $e) {
                // 并发请求下重复加列等情况：忽略，下次调用再补
            }
        }
        $done = true;
    }

    private function request($method, $path, $key, $body, array $extraHeaders)
    {
        $base = rtrim((string)(env('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com')), '/');
        $url = $base . $path;
        $headers = array_merge(['Authorization: Bearer ' . $key], $extraHeaders);

        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => $headers,
        ];
        if ($method === 'POST') {
            $opts[CURLOPT_POST] = true;
            $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
            $opts[CURLOPT_HTTPHEADER] = array_merge($headers, ['Content-Type: application/json']);
        }
        curl_setopt_array($ch, $opts);
        $result = curl_exec($ch);
        $error = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $logDir = runtime_path() . 'log' . DIRECTORY_SEPARATOR;
        @file_put_contents(
            $logDir . date('Ymd') . '_video_gen.log',
            sprintf("[%s] %s %s, Status: %d, Error: %s, Body: %s\n", date('Y-m-d H:i:s'), $method, $path, $status, $error ?: 'None', $result ? substr((string)$result, 0, 800) : 'Empty'),
            FILE_APPEND
        );

        return ['status' => $status, 'body' => (string)($result ?: ''), 'error' => (string)$error];
    }
}
