<?php

namespace app\service;

use app\common\Result;
use think\facade\Db;

/**
 * 各平台自动发布的统一编排层。
 *
 * 四个平台（抖音/小红书/快手/B站）的发布流程只有平台名不同，所以全部收敛到这里，
 * 控制器只需 new PublishDispatcher('douyin')->publish($id) 一行即可。
 *
 * 与旧影刀方案的差异：
 *   旧：写 input.json 到影刀监控目录 → 轮询 output.json
 *   新：HTTP 调用 publisher-service → 轮询任务状态（有实时进度和明确报错）
 */
class PublishDispatcher
{
    private const CONTENT_TABLE = 'marketing_douyin_content';
    private const TASK_TABLE    = 'marketing_publish_task';

    /** 平台中文名，用于提示语 */
    private const LABELS = [
        'douyin'      => '抖音',
        'xiaohongshu' => '小红书',
        'kuaishou'    => '快手',
        'bilibili'    => 'B站',
    ];

    private string $platform;
    private string $label;
    private PublisherService $publisher;

    public function __construct(string $platform)
    {
        $this->platform  = $platform;
        $this->label     = self::LABELS[$platform] ?? $platform;
        $this->publisher = new PublisherService();
    }

    // ==================================================================== 发布

    /**
     * 提交发布任务：一键把视频 + 文案 + 话题推给发布服务
     */
    public function publish($id)
    {
        try {
            $content = Db::name(self::CONTENT_TABLE)->find($id);
            if (!$content) {
                return Result::error('内容不存在', 404);
            }

            // 1. 确保视频已经落到宿主机可见的共享目录
            $prepared = $this->ensureLocalVideo((int)$id, $content);
            if (!$prepared['success']) {
                return Result::error('发布前准备视频失败：' . $prepared['message'], 500);
            }
            $hostVideoPath = $prepared['host_path'];

            // 2. 组装发布参数：标题、文案、话题全部带上
            $overrides = request()->post();
            $title       = trim((string)($overrides['title'] ?? ($content['title'] ?: $content['description'] ?? '')));
            $description = (string)($overrides['description'] ?? ($content['description'] ?? ''));
            $tags        = $this->parseTags($overrides['tags'] ?? ($content['tags'] ?? ''));

            $payload = [
                'platform'       => $this->platform,
                'biz_id'         => (int)$content['id'],
                'video_path'     => $hostVideoPath,
                'title'          => $title,
                'description'    => $description,
                'tags'           => $tags,
                'account'        => (string)($overrides['account'] ?? 'default'),
                'visibility'     => (string)($overrides['visibility'] ?? 'public'),
                'allow_download' => (bool)($overrides['allow_download'] ?? true),
                'scheduled_at'   => $overrides['scheduled_at'] ?? null,
                'extra'          => is_array($overrides['extra'] ?? null) ? $overrides['extra'] : [],
            ];

            $callbackUrl = $this->callbackUrl();
            if ($callbackUrl !== '') {
                $payload['callback_url'] = $callbackUrl;
            }

            // 3. 丢给发布服务
            $resp = $this->publisher->publish($payload);
            if (!$resp['ok']) {
                return Result::error('提交' . $this->label . '发布任务失败：' . $resp['message'], 500);
            }

            $taskId = (string)($resp['data']['task_id'] ?? '');
            if ($taskId === '') {
                return Result::error('发布服务未返回任务ID，响应：' . json_encode($resp['data'], JSON_UNESCAPED_UNICODE), 500);
            }

            // 4. 记录任务，供后续状态查询
            $this->recordTask((int)$id, $taskId, [
                'status'   => 'pending',
                'stage'    => '已排队',
                'progress' => 0,
                'message'  => (string)$resp['message'],
                'title'    => $title,
                'tags'     => implode(',', $tags),
            ]);

            return Result::success([
                'task_id'        => $taskId,
                'platform'       => $this->platform,
                'video_path'     => $hostVideoPath,
                'title'          => $title,
                'description'    => $description,
                'tags'           => $tags,
                'queue_position' => $resp['data']['queue_position'] ?? 0,
                'message'        => $this->label . '发布任务已提交，正在自动填写文案与话题并上传',
            ], '发布任务已提交');
        } catch (\Throwable $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    // ==================================================================== 状态

    /**
     * 查询发布进度。前端轮询这个接口。
     */
    public function status($id)
    {
        try {
            $task = Db::name(self::TASK_TABLE)
                ->where('content_id', $id)
                ->where('platform', $this->platform)
                ->order('id', 'desc')
                ->find();

            if (!$task) {
                return Result::success([
                    'status'   => 'pending',
                    'progress' => 0,
                    'stage'    => '',
                    'message'  => '尚未提交发布任务',
                ]);
            }

            // 已经是终态就直接返回，不用再问发布服务
            if (in_array($task['status'], ['success', 'failed'], true)) {
                return Result::success($this->taskView($task));
            }

            $resp = $this->publisher->task((string)$task['task_id']);
            if (!$resp['ok']) {
                // 发布服务暂时不可达时不判死，让前端继续轮询
                return Result::success([
                    'status'   => 'processing',
                    'progress' => (int)$task['progress'],
                    'stage'    => (string)$task['stage'],
                    'message'  => $resp['message'],
                    'task_id'  => $task['task_id'],
                ]);
            }

            $remote = $resp['data'] ?? [];
            $status = (string)($remote['status'] ?? 'pending');

            $update = [
                'status'     => $status,
                'stage'      => (string)($remote['stage'] ?? ''),
                'progress'   => (int)($remote['progress'] ?? 0),
                'message'    => (string)($remote['message'] ?? ''),
                'result_url' => (string)($remote['result_url'] ?? ''),
                'screenshot' => (string)($remote['screenshot'] ?? ''),
                'attempts'   => (int)($remote['attempts'] ?? 0),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            Db::name(self::TASK_TABLE)->where('id', $task['id'])->update($update);

            // 发布成功 → 回写内容表
            if ($status === 'success') {
                $this->markContentPublished((int)$id);
            }

            return Result::success([
                'status'     => $status === 'running' ? 'processing' : $status,
                'raw_status' => $status,
                'progress'   => $update['progress'],
                'stage'      => $update['stage'],
                'message'    => $update['message'],
                'result_url' => $update['result_url'],
                'attempts'   => $update['attempts'],
                'task_id'    => $task['task_id'],
                'platform'   => $this->platform,
            ]);
        } catch (\Throwable $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * publisher-service 主动回调（可选链路，polling 已能覆盖）
     */
    public function callback()
    {
        $data   = request()->post();
        $id     = $data['id'] ?? null;
        $status = (string)($data['status'] ?? 'unknown');
        $taskId = (string)($data['task_id'] ?? '');

        if (!$id) {
            return Result::error('缺少内容ID', 400);
        }

        try {
            if ($taskId !== '') {
                Db::name(self::TASK_TABLE)->where('task_id', $taskId)->update([
                    'status'     => $status,
                    'message'    => (string)($data['result']['error'] ?? ($status === 'success' ? '发布成功' : '')),
                    'result_url' => (string)($data['result']['result_url'] ?? ''),
                    'progress'   => $status === 'success' ? 100 : 0,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }

            if ($status === 'success') {
                $this->markContentPublished((int)$id, is_array($data['result'] ?? null) ? $data['result'] : []);
            }

            return Result::success(null, '回调处理成功');
        } catch (\Throwable $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    // ==================================================================== 内部

    private function taskView(array $task): array
    {
        return [
            'status'     => $task['status'] === 'running' ? 'processing' : $task['status'],
            'raw_status' => $task['status'],
            'progress'   => (int)$task['progress'],
            'stage'      => (string)$task['stage'],
            'message'    => (string)$task['message'],
            'result_url' => (string)$task['result_url'],
            'attempts'   => (int)$task['attempts'],
            'task_id'    => $task['task_id'],
            'platform'   => $this->platform,
        ];
    }

    private function markContentPublished(int $id, array $result = []): void
    {
        $update = [
            'status'       => 1,
            'publish_time' => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        foreach (['views', 'likes', 'comments', 'shares'] as $metric) {
            if (isset($result[$metric])) {
                $update[$metric] = (int)$result[$metric];
            }
        }
        Db::name(self::CONTENT_TABLE)->where('id', $id)->update($update);
    }

    /**
     * 话题解析：把 "维修,手机维修" / "#维修 #手机维修" / "维修、上门" 统一成数组
     */
    private function parseTags($raw): array
    {
        if (is_array($raw)) {
            $parts = $raw;
        } else {
            $normalized = str_replace(['，', '、', '#', '＃', "\n", "\r", "\t"], ',', (string)$raw);
            $parts = explode(',', $normalized);
        }

        $tags = [];
        foreach ($parts as $part) {
            $tag = trim((string)$part, " \t\n\r\0\x0B#＃");
            if ($tag !== '' && !in_array($tag, $tags, true)) {
                $tags[] = $tag;
            }
        }
        return $tags;
    }

    /**
     * 确保视频在共享目录里，并返回宿主机可访问的绝对路径。
     *
     * publisher-service 跑在 Windows 宿主机上，读不到容器内部路径，
     * 所以必须把容器路径映射成 D:\... 这样的宿主机路径。
     */
    private function ensureLocalVideo(int $id, array $content): array
    {
        $sharedVideoDir     = rtrim((string)env('PUBLISHER_SHARED_VIDEO_DIR', env('RPA_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos')), '/\\');
        $sharedHostVideoDir = rtrim((string)env('PUBLISHER_SHARED_HOST_VIDEO_DIR', env('RPA_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos')), '/\\');

        $localPath = (string)($content['local_path'] ?? '');
        $normLocal = str_replace('\\', '/', $localPath);
        $normShare = str_replace('\\', '/', $sharedVideoDir);

        $needDownload = $localPath === ''
            || !file_exists($localPath)
            || strpos($normLocal, $normShare . '/') !== 0;

        if ($needDownload) {
            $downloaded = $this->downloadToSharedDir($id, $content, $sharedVideoDir);
            if (!$downloaded['success']) {
                return $downloaded;
            }
            $localPath = $downloaded['local_path'];
        }

        return [
            'success'    => true,
            'message'    => 'ok',
            'local_path' => $localPath,
            'host_path'  => $this->mapToHostPath($localPath, $sharedVideoDir, $sharedHostVideoDir),
        ];
    }

    private function mapToHostPath(string $localPath, string $sharedVideoDir, string $sharedHostVideoDir): string
    {
        if ($localPath === '') {
            return '';
        }
        $normLocal = str_replace('\\', '/', $localPath);
        $normShare = str_replace('\\', '/', $sharedVideoDir);
        $normHost  = str_replace('\\', '/', $sharedHostVideoDir);

        if (strpos($normLocal, $normShare) === 0) {
            $mapped = $normHost . substr($normLocal, strlen($normShare));
        } else {
            $mapped = $normLocal;
        }

        // Windows 宿主机用反斜杠
        return str_replace('/', '\\', $mapped);
    }

    private function downloadToSharedDir(int $id, array $content, string $sharedVideoDir): array
    {
        $videoUrl = (string)($content['video_url'] ?? '');
        if ($videoUrl === '') {
            return ['success' => false, 'message' => '视频地址为空，请先上传或生成视频'];
        }

        if (!is_dir($sharedVideoDir) && !mkdir($sharedVideoDir, 0777, true) && !is_dir($sharedVideoDir)) {
            return ['success' => false, 'message' => '共享视频目录不可写：' . $sharedVideoDir];
        }

        $extension = 'mp4';
        $path = (string)parse_url($videoUrl, PHP_URL_PATH);
        if ($path && preg_match('/\.([a-zA-Z0-9]+)$/', $path, $m)) {
            $candidate = strtolower($m[1]);
            if (in_array($candidate, ['mp4', 'mov', 'avi', 'mkv', 'webm'], true)) {
                $extension = $candidate;
            }
        }

        $filename  = 'video_' . $id . '_' . time() . '.' . $extension;
        $localPath = $sharedVideoDir . DIRECTORY_SEPARATOR . $filename;

        $fp = fopen($localPath, 'wb');
        if ($fp === false) {
            return ['success' => false, 'message' => '无法创建本地文件：' . $localPath];
        }

        $ch = curl_init($videoUrl);
        curl_setopt_array($ch, [
            CURLOPT_FILE           => $fp,
            CURLOPT_TIMEOUT        => 600,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
        $success  = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);
        fclose($fp);

        if (!$success || $httpCode >= 400) {
            @unlink($localPath);
            return [
                'success' => false,
                'message' => '下载视频失败' . ($curlErr !== '' ? '：' . $curlErr : '，HTTP ' . $httpCode),
            ];
        }

        if (filesize($localPath) === 0) {
            @unlink($localPath);
            return ['success' => false, 'message' => '下载到的视频文件为空'];
        }

        Db::name(self::CONTENT_TABLE)->where('id', $id)->update([
            'local_path'     => $localPath,
            'local_filename' => $filename,
            'updated_at'     => date('Y-m-d H:i:s'),
        ]);

        return ['success' => true, 'message' => 'ok', 'local_path' => $localPath];
    }

    private function recordTask(int $contentId, string $taskId, array $extra): void
    {
        Db::name(self::TASK_TABLE)->insert(array_merge([
            'content_id' => $contentId,
            'platform'   => $this->platform,
            'task_id'    => $taskId,
            'status'     => 'pending',
            'stage'      => '',
            'progress'   => 0,
            'message'    => '',
            'result_url' => '',
            'screenshot' => '',
            'attempts'   => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ], $extra));
    }

    /**
     * 回调地址。publisher-service 在宿主机上，必须用宿主机能访问到的后端地址，
     * 所以走显式配置；没配就返回空字符串，完全依赖前端轮询。
     */
    private function callbackUrl(): string
    {
        $base = rtrim((string)env('PUBLISHER_CALLBACK_BASE', ''), '/');
        if ($base === '') {
            return '';
        }
        return $base . '/api/marketing/' . $this->platform . '/publish/callback';
    }
}
