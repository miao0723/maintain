<?php

namespace app\controller;

use app\common\Result;
use app\service\PublishDispatcher;
use app\service\PublisherService;
use app\service\VideoGenerateService;
use think\facade\Db;

class MarketingDouyinController
{
    /**
     * 取某平台的发布编排器（脚本发布模式）
     */
    private function dispatcher(string $platform): PublishDispatcher
    {
        return new PublishDispatcher($platform);
    }

    public function testCozeConnection()
    {
        // 2026-09 起视频生成已切换为阿里云百炼（通义万相文生视频）；
        // 保留原路由用于前端连通性检查，实际检查 DASHSCOPE_API_KEY 配置
        $service = new VideoGenerateService();
        $key = env('DASHSCOPE_API_KEY', '') ?: getenv('DASHSCOPE_API_KEY');
        return Result::success([
            'provider' => 'dashscope',
            'model' => $service->model(),
            'status' => !empty($key) ? 200 : 500,
            'error' => empty($key) ? '未配置 DASHSCOPE_API_KEY' : '',
            'token_present' => !empty($key),
            'token_length' => strlen((string)$key),
        ]);
    }

    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', request()->get('page_size', 20));
        $status = request()->get('status', '');
        $keyword = request()->get('keyword', request()->get('title', ''));

        try {
            $query = Db::name('marketing_douyin_content');
            if ($status !== '') $query->where('status', $status);
            if (!empty($keyword)) $query->whereLike('title|description|tags', '%' . $keyword . '%');

            $total = $query->count();
            $list = $query->order('publish_time', 'desc')->order('id', 'desc')->page($page, $pageSize)->select()->toArray();
            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 生成视频：阿里云百炼·通义万相文生视频（异步任务）
     * 提交后立即返回任务 ID，前端通过 /:id/generate/status 轮询进度
     */
    public function generate()
    {
        $data = request()->post();
        $prompt = trim((string)($data['prompt'] ?? ''));
        $title = trim((string)($data['douyin_title'] ?? ''));

        if ($prompt === '') return Result::error('视频创意描述不能为空', 400);
        if ($title === '') return Result::error('抖音标题不能为空', 400);

        $service = new VideoGenerateService();
        if (!$service->enabled()) {
            return Result::error('未配置 DASHSCOPE_API_KEY，无法使用通义万相文生视频', 500);
        }

        try {
            VideoGenerateService::ensureColumns();

            // 将营销要素并入提示词（万相只吃一段文本，提示词越具体画面越可控）
            $videoConfig = $this->normalizeVideoConfig($data['video_config'] ?? []);
            $promptParts = [$prompt];
            if (!empty($videoConfig['visual_style'])) $promptParts[] = '画面风格：' . $videoConfig['visual_style'];
            if (!empty($videoConfig['selling_points'])) $promptParts[] = '突出卖点：' . implode('、', (array)$videoConfig['selling_points']);
            if (!empty($videoConfig['hook_text'])) $promptParts[] = '开头钩子：' . $videoConfig['hook_text'];
            if (!empty($videoConfig['cta_text'])) $promptParts[] = '结尾引导：' . $videoConfig['cta_text'];
            $finalPrompt = implode('；', $promptParts);

            $parameters = $service->buildParameters([
                'ratio' => (string)($data['ratio'] ?? '9:16'),
                'size' => (string)($data['size'] ?? ''),
                'duration' => (int)($data['duration'] ?? 5),
                'seed' => (int)($data['seed'] ?? 0),
            ]);

            $payload = [
                'provider' => 'dashscope',
                'model' => $service->model(),
                'prompt' => $prompt,
                'final_prompt' => $finalPrompt,
                'negative_prompt' => (string)($data['negative_prompt'] ?? ''),
                'ratio' => (string)($data['ratio'] ?? '9:16'),
                'parameters' => $parameters,
                'douyin_title' => $title,
                'douyin_desc' => (string)($data['douyin_desc'] ?? ''),
                'douyin_tags' => (string)($data['douyin_tags'] ?? ''),
                'video_config' => $videoConfig,
                'auto_publish' => !empty($data['auto_publish']),
                'auto_publish_platform' => (string)($data['auto_publish_platform'] ?? 'douyin'),
            ];

            $task = $service->createTask($finalPrompt, $payload['negative_prompt'], $parameters);
            if (!$task['ok']) {
                return Result::error($task['error'], 500);
            }

            $now = date('Y-m-d H:i:s');
            $record = [
                'title' => $title,
                'video_url' => '',
                'cover' => '',
                'description' => $payload['douyin_desc'],
                'tags' => $payload['douyin_tags'],
                'generate_config' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'workflow_result' => json_encode($task['raw'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'gen_task_id' => $task['task_id'],
                'gen_status' => 'running',
                'gen_error' => null,
                'status' => 0,
                'publish_time' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $id = Db::name('marketing_douyin_content')->insertGetId($record);

            return Result::success([
                'id' => $id,
                'gen_task_id' => $task['task_id'],
                'gen_status' => 'running',
                'model' => $service->model(),
                'parameters' => $parameters,
                'poll_url' => '/api/marketing/douyin/' . $id . '/generate/status',
            ], '视频生成任务已提交（通义万相），生成约需 1~3 分钟，请稍候查看进度');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 轮询视频生成进度：成功时回写 video_url 并尽量预下载（万相地址 24 小时有效）；
     * 生成参数带 auto_publish 时自动触发发布编排
     */
    public function generateStatus($id)
    {
        try {
            VideoGenerateService::ensureColumns();
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);

            $taskId = (string)($content['gen_task_id'] ?? '');
            if ($taskId === '') {
                // 兼容旧素材（非异步生成）：有视频即视为完成
                return Result::success([
                    'id' => $id,
                    'gen_status' => !empty($content['video_url']) ? 'succeeded' : 'none',
                    'video_url' => (string)($content['video_url'] ?? ''),
                    'gen_error' => '',
                    'material' => $content,
                    'auto_publish' => null,
                ]);
            }

            $service = new VideoGenerateService();
            $task = $service->queryTask($taskId);
            if (!$task['ok']) return Result::error($task['error'], 500);

            $update = [
                'gen_status' => $task['status'],
                'workflow_result' => json_encode($task['raw'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            if ($task['status'] === 'succeeded') {
                $update['video_url'] = $task['video_url'];
                $update['gen_error'] = null;
            } elseif ($task['status'] === 'failed') {
                $update['gen_error'] = mb_substr($task['error'], 0, 480);
            }
            Db::name('marketing_douyin_content')->where('id', $id)->update($update);
            $content = Db::name('marketing_douyin_content')->find($id);

            $autoPublishResult = null;
            if ($task['status'] === 'succeeded') {
                // 视频地址 24 小时过期：共享目录环境（docker）下预下载落地
                try {
                    $this->tryDownloadGeneratedVideo($content);
                    $content = Db::name('marketing_douyin_content')->find($id);
                } catch (\Exception $e) {
                    // 预下载失败不阻塞：发布链路 PublishDispatcher 发布前仍会下载
                }

                $config = json_decode((string)($content['generate_config'] ?? '{}'), true) ?: [];
                if (!empty($config['auto_publish']) && (int)$content['status'] !== 1) {
                    $platform = (string)($config['auto_publish_platform'] ?? 'douyin');
                    if (PublisherService::enabled()) {
                        try {
                            $autoPublishResult = $this->dispatcher($platform)->publish($id);
                        } catch (\Exception $e) {
                            $autoPublishResult = ['error' => $e->getMessage()];
                        }
                    }
                }
            }

            return Result::success([
                'id' => $id,
                'gen_status' => $task['status'],
                'video_url' => (string)($content['video_url'] ?? ''),
                'gen_error' => (string)($content['gen_error'] ?? ''),
                'material' => $content,
                'auto_publish' => $autoPublishResult,
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function tryDownloadGeneratedVideo(array $content)
    {
        if (!empty($content['local_path'])) return;
        $dir = (string)(env('PUBLISHER_SHARED_VIDEO_DIR', ''));
        if ($dir === '' || !is_dir($dir)) return; // 本地开发等无共享目录环境跳过
        $this->downloadVideoToSharedLibrary($content['id'], $content, $dir);
    }

    /**
     * 视频二次优化：基于原生成参数 + 优化要求，重新提交通义万相生成任务
     */
    public function optimize($id)
    {
        $data = request()->post();
        $editConfig = $this->normalizeOptimizeConfig($data['edit_config'] ?? []);

        try {
            VideoGenerateService::ensureColumns();
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);

            $service = new VideoGenerateService();
            if (!$service->enabled()) {
                return Result::error('未配置 DASHSCOPE_API_KEY，无法使用通义万相文生视频', 500);
            }

            $oldConfig = json_decode((string)($content['generate_config'] ?? '{}'), true) ?: [];
            $basePrompt = trim((string)($oldConfig['prompt'] ?? ''));
            if ($basePrompt === '') {
                $basePrompt = trim((string)($content['title'] . ' ' . $content['description']));
            }

            $optimizeHints = [];
            if (!empty($editConfig['optimize_prompt'])) $optimizeHints[] = (string)$editConfig['optimize_prompt'];
            if (!empty($editConfig['title_style'])) $optimizeHints[] = '标题风格：' . $editConfig['title_style'];
            if (!empty($editConfig['subtitle_style']) && $editConfig['subtitle_style'] !== '保持原样') $optimizeHints[] = '字幕风格：' . $editConfig['subtitle_style'];
            if (!empty($editConfig['visual_style'])) $optimizeHints[] = '画面风格：' . $editConfig['visual_style'];
            $prompt = $basePrompt . '。优化要求：' . implode('；', array_filter($optimizeHints));

            $parameters = $service->buildParameters(array_merge(
                ['ratio' => (string)($oldConfig['ratio'] ?? '9:16')],
                is_array($oldConfig['parameters'] ?? null) ? $oldConfig['parameters'] : []
            ));

            $task = $service->createTask($prompt, (string)($oldConfig['negative_prompt'] ?? ''), $parameters);
            if (!$task['ok']) {
                return Result::error($task['error'], 500);
            }

            $newConfig = array_merge($oldConfig, [
                'prompt' => $prompt,
                'parameters' => $parameters,
                'optimize_mode' => true,
            ]);
            Db::name('marketing_douyin_content')->where('id', $id)->update([
                'edit_config' => json_encode($editConfig, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'generate_config' => json_encode($newConfig, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'gen_task_id' => $task['task_id'],
                'gen_status' => 'running',
                'gen_error' => null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return Result::success([
                'id' => $id,
                'gen_task_id' => $task['task_id'],
                'gen_status' => 'running',
                'poll_url' => '/api/marketing/douyin/' . $id . '/generate/status',
            ], '视频优化任务已提交，正在通过通义万相重新生成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function read($id)
    {
        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);
            return Result::success($content);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function save()
    {
        $data = request()->post();
        if (empty($data['title'])) return Result::error('视频标题不能为空', 400);
        if (empty($data['video_url'])) return Result::error('视频链接不能为空', 400);

        try {
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');
            if (isset($data['status']) && $data['status'] == 1 && empty($data['publish_time'])) $data['publish_time'] = date('Y-m-d H:i:s');
            $id = Db::name('marketing_douyin_content')->insertGetId($data);
            return Result::success(Db::name('marketing_douyin_content')->find($id), '内容创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function update($id)
    {
        $data = request()->put();
        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);
            if (isset($data['title']) && empty($data['title'])) return Result::error('视频标题不能为空', 400);
            if (isset($data['video_url']) && empty($data['video_url'])) return Result::error('视频链接不能为空', 400);
            $data['updated_at'] = date('Y-m-d H:i:s');
            if (isset($data['status']) && $data['status'] == 1 && empty($data['publish_time'])) $data['publish_time'] = date('Y-m-d H:i:s');
            Db::name('marketing_douyin_content')->where('id', $id)->update($data);
            return Result::success(Db::name('marketing_douyin_content')->find($id), '内容更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function delete($id)
    {
        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);
            Db::name('marketing_douyin_content')->delete($id);
            return Result::success(null, '内容删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 发布到抖音。
     *
     * 默认走「脚本发布」模式（Playwright 自动化，PUBLISHER_MODE=script）；
     * 如需临时回退到影刀 RPA，把 backend/.env 的 PUBLISHER_MODE 改成 rpa 即可。
     */
    public function publish($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('douyin')->publish($id);
        }
        return $this->publishViaRpa($id);
    }

    /**
     * 【旧链路，保留备用】通过影刀文件触发器发布
     */
    private function publishViaRpa($id)
    {
        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);

            $rpaEnabled = env('RPA_ENABLED', false);
            if (!$rpaEnabled) {
                return Result::error('RPA发布功能未启用，请在配置文件中开启', 500);
            }

            if (empty($content['local_path']) || !file_exists($content['local_path'])) {
                $downloadResult = $this->downloadVideoToLocal($id, $content);
                if (!$downloadResult['success']) {
                    return Result::error('发布前下载视频失败：' . $downloadResult['message'], 500);
                }
                $content = Db::name('marketing_douyin_content')->find($id);
            }

            $triggerDir = rtrim((string)env('RPA_TRIGGER_DIR', 'E:/我的/文件触发器'), '/\\');
            $inputFile = env('RPA_INPUT_FILE', 'input.json');
            $inputPath = $triggerDir . DIRECTORY_SEPARATOR . $inputFile;
            $sharedVideoDir = rtrim((string)env('RPA_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos'), '/\\');
            $sharedHostVideoDir = rtrim((string)env('RPA_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos'), '/\\');
            $localPath = $content['local_path'] ?? '';
            $normalizedLocalPath = str_replace(['/', '\\'], '/', $localPath);
            $normalizedSharedVideoDir = str_replace(['/', '\\'], '/', $sharedVideoDir);

            if (empty($localPath) || !file_exists($localPath) || strpos($normalizedLocalPath, $normalizedSharedVideoDir . '/') !== 0) {
                $downloadResult = $this->downloadVideoToSharedLibrary($id, $content, $sharedVideoDir);
                if (!$downloadResult['success']) {
                    return Result::error('发布前下载视频失败：' . $downloadResult['message'], 500);
                }
                $content = Db::name('marketing_douyin_content')->find($id);
                $localPath = $content['local_path'] ?? '';
            }

            $hostVideoPath = $this->mapSharedVideoPathToHostPath($localPath, $sharedVideoDir, $sharedHostVideoDir);
            $title = $content['title'] ?: ($content['description'] ?: '');
            $tags = (string)($content['tags'] ?? '');
$description = (string)($content['description'] ?? '');

            $payload = [
                'id' => $content['id'],
                'video_url' => $hostVideoPath,
                'title' => $title,
    'description' => $description,
                'tags' => $tags,
                'local_path' => $hostVideoPath,
                'callback_url' => request()->scheme() . '://' . request()->host() . '/api/marketing/douyin/publish/callback',
            ];

            $jsonContent = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            if (file_put_contents($inputPath, $jsonContent) === false) {
                return Result::error('写入触发文件失败，请检查目录权限', 500);
            }

            return Result::success([
                'trigger_file' => $inputPath,
                'rpa_video_path' => $hostVideoPath,
                'payload' => $payload,
                'message' => '发布任务已触发，请等待RPA处理。请确认影刀读取 video_url、title、tags 三个字段。',
            ], '发布任务已提交');
        } catch (Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function mapLocalPathToHostPath(string $localPath)
    {
        $sharedVideoDir = rtrim((string)env('RPA_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos'), '/\\');
        $sharedHostVideoDir = rtrim((string)env('RPA_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos'), '/\\');

        return $this->mapSharedVideoPathToHostPath($localPath, $sharedVideoDir, $sharedHostVideoDir);
    }

    private function mapSharedVideoPathToHostPath(string $localPath, string $sharedVideoDir, string $sharedHostVideoDir)
    {
        if ($localPath === '') {
            return '';
        }

        $normalizedLocalPath = str_replace(['/', '\\'], '/', $localPath);
        $normalizedSharedVideoDir = str_replace(['/', '\\'], '/', $sharedVideoDir);
        $normalizedSharedHostVideoDir = str_replace(['/', '\\'], '/', $sharedHostVideoDir);

        if (strpos($normalizedLocalPath, $normalizedSharedVideoDir) === 0) {
            $mappedPath = $normalizedSharedHostVideoDir . substr($normalizedLocalPath, strlen($normalizedSharedVideoDir));
        } else {
            $mappedPath = $normalizedLocalPath;
        }

        return str_replace('/', '\\', $mappedPath);
    }

    private function downloadVideoToSharedLibrary($id, $content, string $sharedVideoDir)
    {
        $videoUrl = $content['video_url'] ?? '';
        if (empty($videoUrl)) {
            return ['success' => false, 'message' => '视频地址为空'];
        }

        if (!is_dir($sharedVideoDir)) {
            mkdir($sharedVideoDir, 0777, true);
        }

        $extension = 'mp4';
        $path = (string)parse_url($videoUrl, PHP_URL_PATH);
        if ($path && preg_match('/\.([a-zA-Z0-9]+)$/', $path, $matches)) {
            $candidate = strtolower($matches[1]);
            if (in_array($candidate, ['mp4', 'mov', 'avi', 'mkv', 'webm'])) {
                $extension = $candidate;
            }
        }

        $filename = 'video_' . $id . '_' . time() . '.' . $extension;
        $localPath = $sharedVideoDir . DIRECTORY_SEPARATOR . $filename;

        $ch = curl_init($videoUrl);
        $fp = fopen($localPath, 'wb');
        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_TIMEOUT => 300,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
        $success = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        fclose($fp);

        if (!$success || $httpCode >= 400) {
            if (file_exists($localPath)) unlink($localPath);
            return ['success' => false, 'message' => '下载失败' . ($curlError ? '：' . $curlError : '，HTTP状态码: ' . $httpCode)];
        }

        $fileSize = filesize($localPath);
        if ($fileSize === 0) {
            if (file_exists($localPath)) unlink($localPath);
            return ['success' => false, 'message' => '下载的文件为空'];
        }

        Db::name('marketing_douyin_content')->where('id', $id)->update([
            'local_path' => $localPath,
            'local_filename' => $filename,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return [
            'success' => true,
            'local_path' => $localPath,
            'local_filename' => $filename,
            'file_size' => $fileSize,
        ];
    }

    public function publishCallback()
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('douyin')->callback();
        }
        return $this->publishCallbackViaRpa();
    }

    private function publishCallbackViaRpa()
    {
        $data = request()->post();
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'unknown';
        $result = $data['result'] ?? [];

        if (!$id) {
            return Result::error('缺少内容ID', 400);
        }

        try {
            $updateData = [
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            if ($status === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($result['views'])) $updateData['views'] = $result['views'];
                if (isset($result['likes'])) $updateData['likes'] = $result['likes'];
                if (isset($result['comments'])) $updateData['comments'] = $result['comments'];
                if (isset($result['shares'])) $updateData['shares'] = $result['shares'];
            }

            Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);
            return Result::success(null, '回调处理成功');
        } catch (Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 查询抖音发布进度（脚本模式下返回真实百分比与当前步骤）
     */
    public function checkPublishStatus($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('douyin')->status($id);
        }
        return $this->checkPublishStatusViaRpa($id);
    }

    private function checkPublishStatusViaRpa($id)
    {
        try {
            $triggerDir = env('RPA_TRIGGER_DIR', 'E:/我的/文件触发器');
            $outputFile = env('RPA_OUTPUT_FILE', 'output.json');
            $outputPath = $triggerDir . '/' . $outputFile;

            if (!file_exists($outputPath)) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $outputContent = file_get_contents($outputPath);
            $outputData = json_decode($outputContent, true);

            if (!$outputData || !isset($outputData['id']) || $outputData['id'] != $id) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $updateData = ['updated_at' => date('Y-m-d H:i:s')];

            if (isset($outputData['status']) && $outputData['status'] === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($outputData['views'])) $updateData['views'] = $outputData['views'];
                if (isset($outputData['likes'])) $updateData['likes'] = $outputData['likes'];
                if (isset($outputData['comments'])) $updateData['comments'] = $outputData['comments'];
                if (isset($outputData['shares'])) $updateData['shares'] = $outputData['shares'];

                Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);

                unlink($outputPath);

                return Result::success(['status' => 'success', 'message' => '发布成功']);
            }

            return Result::success(['status' => 'processing', 'message' => '处理中']);
        } catch (Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function download($id)
    {
        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);

            $directDownload = (bool)request()->get('direct', false);

            if (empty($content['local_path']) || !file_exists($content['local_path'])) {
                $downloadResult = $this->downloadVideoToLocal($id, $content);
                if (!$downloadResult['success']) {
                    return Result::error($downloadResult['message'], 500);
                }

                $content = Db::name('marketing_douyin_content')->find($id);
            }

            if ($directDownload) {
                $downloadName = $content['local_filename'] ?: basename($content['local_path']);
                return download($content['local_path'], $downloadName);
            }

            return Result::success([
                'id' => $content['id'],
                'title' => $content['title'],
                'video_url' => $content['video_url'],
                'local_path' => $content['local_path'],
                'local_filename' => $content['local_filename'],
                'description' => $content['description'],
                'tags' => $content['tags'],
                'downloaded_at' => date('Y-m-d H:i:s'),
            ], '下载成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function downloadVideoToLocal($id, $content)
    {
        $videoUrl = $content['video_url'] ?? '';
        if (empty($videoUrl)) {
            return ['success' => false, 'message' => '视频地址为空'];
        }

        $downloadDir = rtrim((string)env('RPA_TRIGGER_DIR', '/var/www/html/rpa_files'), '/\\') . DIRECTORY_SEPARATOR . 'videos';
        if (!is_dir($downloadDir)) {
            mkdir($downloadDir, 0777, true);
        }

        $extension = 'mp4';
        $path = (string)parse_url($videoUrl, PHP_URL_PATH);
        if ($path && preg_match('/\.([a-zA-Z0-9]+)$/', $path, $matches)) {
            $candidate = strtolower($matches[1]);
            if (in_array($candidate, ['mp4', 'mov', 'avi', 'mkv', 'webm'])) {
                $extension = $candidate;
            }
        }

        $filename = 'video_' . $id . '_' . time() . '.' . $extension;
        $localPath = $downloadDir . DIRECTORY_SEPARATOR . $filename;

        $ch = curl_init($videoUrl);
        $fp = fopen($localPath, 'wb');
        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_TIMEOUT => 300,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
        $success = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        fclose($fp);

        if (!$success || $httpCode >= 400) {
            if (file_exists($localPath)) unlink($localPath);
            return ['success' => false, 'message' => '下载失败' . ($curlError ? '：' . $curlError : '，HTTP状态码: ' . $httpCode)];
        }

        $fileSize = filesize($localPath);
        if ($fileSize === 0) {
            if (file_exists($localPath)) unlink($localPath);
            return ['success' => false, 'message' => '下载的文件为空'];
        }

        Db::name('marketing_douyin_content')->where('id', $id)->update([
            'local_path' => $localPath,
            'local_filename' => $filename,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return [
            'success' => true,
            'local_path' => $localPath,
            'local_filename' => $filename,
            'file_size' => $fileSize,
        ];
    }

    private function normalizeVideoConfig($config)
    {
        $config = is_array($config) ? $config : [];

        return [
            'target_audience' => (string)($config['target_audience'] ?? '通用本地客户'),
            'selling_points' => $this->normalizeStringList($config['selling_points'] ?? ['快速上门', '透明报价', '维修质保']),
            'hook_text' => (string)($config['hook_text'] ?? ''),
            'cta_text' => (string)($config['cta_text'] ?? '私信咨询，马上安排'),
            'visual_style' => (string)($config['visual_style'] ?? '真实案例风'),
            'voice_type' => (string)($config['voice_type'] ?? '女声'),
            'subtitle_style' => (string)($config['subtitle_style'] ?? '营销大字'),
            'bgm_style' => (string)($config['bgm_style'] ?? '轻快可信'),
        ];
    }

    private function normalizeOptimizeConfig($config)
    {
        $config = is_array($config) ? $config : [];

        return [
            'cover_text' => (string)($config['cover_text'] ?? ''),
            'subtitle_style' => (string)($config['subtitle_style'] ?? '营销大字'),
            'voice_type' => (string)($config['voice_type'] ?? '保持原样'),
            'bgm_style' => (string)($config['bgm_style'] ?? '保持原样'),
            'trim_duration' => (int)($config['trim_duration'] ?? 0),
            'add_intro' => (bool)($config['add_intro'] ?? true),
            'add_outro' => (bool)($config['add_outro'] ?? false),
            'title_style' => (string)($config['title_style'] ?? '强转化'),
            'optimize_prompt' => (string)($config['optimize_prompt'] ?? '保留原视频核心内容，强化封面、标题和转化表达。'),
        ];
    }

    private function normalizeStringList($value)
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(static function ($item) {
                return trim((string)$item);
            }, $value)));
        }

        return array_values(array_filter(array_map('trim', preg_split('/[，,]/', (string)$value))));
    }

    private function postJson($url, $payload, $headers = [])
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 180,
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);
        $result = curl_exec($ch);
        $error = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno = curl_errno($ch);

        $logDir = runtime_path() . 'log' . DIRECTORY_SEPARATOR;
        $logFile = $logDir . date('Ymd') . '_coze.log';
        $logEntry = sprintf(
            "[%s] URL: %s, Status: %d, Error: %s, Errno: %d, Body: %s\n",
            date('Y-m-d H:i:s'),
            $url,
            $status,
            $error ?: 'None',
            $errno,
            $result ? substr($result, 0, 1000) : 'Empty'
        );
        file_put_contents($logFile, $logEntry, FILE_APPEND);

        curl_close($ch);
        return ['status' => $status, 'body' => $result ?: '', 'error' => $error, 'errno' => $errno];
    }

    private function buildCozeErrorMessage($message)
    {
        $text = (string)$message;

        if (stripos($text, 'unavailable') !== false || stripos($text, '503') !== false) {
            return 'Coze 服务暂时不可用，请稍后重试。';
        }

        if (stripos($text, 'invalid') !== false || stripos($text, '401') !== false) {
            return 'Coze API Token 无效或已过期，请联系管理员更新配置。';
        }

        if (stripos($text, 'ErrTooManyRequests') !== false || stripos($text, '限流') !== false) {
            return 'Coze 当前触发限流，请稍后重试。建议间隔 1-3 分钟后再创建，或降低并发调用次数。';
        }

        if (stripos($text, 'Forbidden') !== false || stripos($text, '403') !== false) {
            return 'Coze 工作流调用被拒绝，请检查工作流内部视频生成能力的权限、额度或账号状态。';
        }

        if (stripos($text, 'timeout') !== false || stripos($text, '超时') !== false) {
            return 'Coze 工作流处理超时，请稍后重试。';
        }

        return 'Coze 工作流调用失败：' . substr($text, 0, 200);
    }

    private function extractFirstValue($data, $keys, $default = '')
    {
        if (!is_array($data)) return $default;
        foreach ($keys as $key) {
            if (array_key_exists($key, $data) && $data[$key] !== null && $data[$key] !== '') return $data[$key];
        }
        foreach ($data as $value) {
            if (is_array($value)) {
                $found = $this->extractFirstValue($value, $keys, null);
                if ($found !== null && $found !== '') return $found;
            }
        }
        return $default;
    }

    /**
     * Get B站 RPA config
     */
    private function getRpaConfigBili()
    {
        return [
            'enabled' => env('RPA_BILIBILI_ENABLED', true),
            'trigger_dir' => env('RPA_BILIBILI_TRIGGER_DIR', '/var/www/html/rpa_files_bilibili'),
            'host_trigger_dir' => env('RPA_BILIBILI_HOST_TRIGGER_DIR', 'D:\\maintain\\docker\\rpa_files'),
            'shared_video_dir' => env('RPA_BILIBILI_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos'),
            'shared_host_video_dir' => env('RPA_BILIBILI_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos'),
            'input_file' => env('RPA_BILIBILI_INPUT_FILE', 'input.json'),
            'output_file' => env('RPA_BILIBILI_OUTPUT_FILE', 'output.json'),
        ];
    }

    /**
     * Get 快手 RPA config
     */
    private function getRpaConfigKs()
    {
        return [
            'enabled' => env('RPA_KUAISHOU_ENABLED', true),
            'trigger_dir' => env('RPA_KUAISHOU_TRIGGER_DIR', '/var/www/html/rpa_files_ks'),
            'host_trigger_dir' => env('RPA_KUAISHOU_HOST_TRIGGER_DIR', 'D:\\maintain\\backend\\rpa_files_ks'),
            'shared_video_dir' => env('RPA_KUAISHOU_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos'),
            'shared_host_video_dir' => env('RPA_KUAISHOU_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos'),
            'input_file' => env('RPA_KUAISHOU_INPUT_FILE', 'input.json'),
            'output_file' => env('RPA_KUAISHOU_OUTPUT_FILE', 'output.json'),
        ];
    }

    /**
     * 发布到B站（脚本发布模式，失败时可通过 PUBLISHER_MODE=rpa 回退影刀）
     */
    public function publishBili($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('bilibili')->publish($id);
        }
        return $this->publishBiliViaRpa($id);
    }

    /**
     * 【旧链路，保留备用】B站影刀文件触发发布
     */
    private function publishBiliViaRpa($id)
    {
        $config = $this->getRpaConfigBili();

        if (!$config['enabled']) {
            return Result::error('RPA未启用', 500);
        }

        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) {
                return Result::error('内容不存在，ID: ' . $id, 404);
            }

            $triggerDir = $config['trigger_dir'];
            $triggerDir = rtrim($triggerDir, '/\\');
            $hostTriggerDir = rtrim((string)$config['host_trigger_dir'], '/\\');
            $sharedVideoDir = rtrim((string)$config['shared_video_dir'], '/\\');
            $sharedHostVideoDir = rtrim((string)$config['shared_host_video_dir'], '/\\');

            // Create directory if not exists
            if (!is_dir($triggerDir)) {
                @mkdir($triggerDir, 0777, true);
            }

            $localPath = $content['local_path'] ?? '';
            $normalizedLocalPath = str_replace(['/', '\\'], '/', $localPath);
            $normalizedSharedVideoDir = str_replace(['/', '\\'], '/', $sharedVideoDir);

            if (empty($localPath) || !file_exists($localPath) || strpos($normalizedLocalPath, $normalizedSharedVideoDir . '/') !== 0) {
                $downloadResult = $this->downloadVideoToSharedLibrary($id, $content, $sharedVideoDir);
                if (!$downloadResult['success']) {
                    return Result::error('发布前下载视频失败：' . $downloadResult['message'], 500);
                }
                $content = Db::name('marketing_douyin_content')->find($id);
                $localPath = $content['local_path'] ?? '';
            }

            if (empty($localPath)) {
                $localPath = $sharedVideoDir . DIRECTORY_SEPARATOR . 'video_' . $id . '.mp4';
            }

            $hostVideoPath = $this->mapSharedVideoPathToHostPath($localPath, $sharedVideoDir, $sharedHostVideoDir);
            $title = $content['title'] ?: ($content['description'] ?: '');
            $tags = (string)($content['tags'] ?? '');
$description = (string)($content['description'] ?? '');

            // Build payload for B站 (same format as 小红书)
            $payload = [
                'id' => $content['id'],
                'video_url' => $hostVideoPath,
                'title' => $title,
    'description' => $description,
                'tags' => $tags,
                'local_path' => $hostVideoPath,
                'callback_url' => request()->scheme() . '://' . request()->host() . '/api/marketing/bilibili/publish/callback',
            ];

            $inputPath = $triggerDir . DIRECTORY_SEPARATOR . $config['input_file'];

            $jsonContent = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            $writeResult = @file_put_contents($inputPath, $jsonContent);
            if ($writeResult === false) {
                return Result::error('写入触发文件失败: ' . $inputPath, 500);
            }

            return Result::success([
                'trigger_file' => $inputPath,
                'rpa_video_path' => $hostVideoPath,
                'payload' => $payload,
                'message' => '发布任务已提交，Docker 将读取B站触发目录中的 input.json',
            ], '发布成功');
        } catch (\Exception $e) {
            return Result::error('发布失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * B站发布回调：脚本模式走 publisher-service，旧影刀模式保留
     */
    public function publishCallbackBili()
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('bilibili')->callback();
        }
        return $this->publishCallbackBiliViaRpa();
    }

    /**
     * 【旧链路，保留备用】RPA B站 publish callback
     */
    private function publishCallbackBiliViaRpa()
    {
        $data = request()->post();
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'unknown';
        $result = $data['result'] ?? [];

        if (!$id) {
            return Result::error('缺少内容ID', 400);
        }

        try {
            $updateData = [
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            if ($status === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($result['views'])) $updateData['views'] = $result['views'];
                if (isset($result['likes'])) $updateData['likes'] = $result['likes'];
                if (isset($result['comments'])) $updateData['comments'] = $result['comments'];
                if (isset($result['shares'])) $updateData['shares'] = $result['shares'];
            }

            Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);
            return Result::success(null, '回调处理成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 查询B站发布进度
     */
    public function checkPublishStatusBili($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('bilibili')->status($id);
        }
        return $this->checkPublishStatusBiliViaRpa($id);
    }

    /**
     * 【旧链路，保留备用】Check B站 publish status
     */
    private function checkPublishStatusBiliViaRpa($id)
    {
        $config = $this->getRpaConfigBili();
        try {
            $triggerDir = $config['trigger_dir'];
            $outputPath = $triggerDir . '/' . $config['output_file'];

            if (!file_exists($outputPath)) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $outputContent = file_get_contents($outputPath);
            $outputData = json_decode($outputContent, true);

            if (!$outputData || !isset($outputData['id']) || $outputData['id'] != $id) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $updateData = ['updated_at' => date('Y-m-d H:i:s')];

            if (isset($outputData['status']) && $outputData['status'] === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($outputData['views'])) $updateData['views'] = $outputData['views'];
                if (isset($outputData['likes'])) $updateData['likes'] = $outputData['likes'];
                if (isset($outputData['comments'])) $updateData['comments'] = $outputData['comments'];
                if (isset($outputData['shares'])) $updateData['shares'] = $outputData['shares'];

                Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);

                unlink($outputPath);

                return Result::success(['status' => 'success', 'message' => '发布成功']);
            }

            return Result::success(['status' => 'processing', 'message' => '处理中']);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 快手发布：脚本模式走 publisher-service
     */
    public function publishKs($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('kuaishou')->publish($id);
        }
        return $this->publishKsViaRpa($id);
    }

    /**
     * 【旧链路，保留备用】Publish to 快手 - trigger RPA file
     */
    private function publishKsViaRpa($id)
    {
        $config = $this->getRpaConfigKs();

        if (!$config['enabled']) {
            return Result::error('RPA未启用', 500);
        }

        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) {
                return Result::error('内容不存在，ID: ' . $id, 404);
            }

            $triggerDir = $config['trigger_dir'];
            $triggerDir = rtrim($triggerDir, '/\\');
            $hostTriggerDir = rtrim((string)$config['host_trigger_dir'], '/\\');
            $sharedVideoDir = rtrim((string)$config['shared_video_dir'], '/\\');
            $sharedHostVideoDir = rtrim((string)$config['shared_host_video_dir'], '/\\');

            // Create directory if not exists
            if (!is_dir($triggerDir)) {
                @mkdir($triggerDir, 0777, true);
            }

            $localPath = $content['local_path'] ?? '';
            $normalizedLocalPath = str_replace(['/', '\\'], '/', $localPath);
            $normalizedSharedVideoDir = str_replace(['/', '\\'], '/', $sharedVideoDir);

            if (empty($localPath) || !file_exists($localPath) || strpos($normalizedLocalPath, $normalizedSharedVideoDir . '/') !== 0) {
                $downloadResult = $this->downloadVideoToSharedLibrary($id, $content, $sharedVideoDir);
                if (!$downloadResult['success']) {
                    return Result::error('发布前下载视频失败：' . $downloadResult['message'], 500);
                }
                $content = Db::name('marketing_douyin_content')->find($id);
                $localPath = $content['local_path'] ?? '';
            }

            if (empty($localPath)) {
                $localPath = $sharedVideoDir . DIRECTORY_SEPARATOR . 'video_' . $id . '.mp4';
            }

            $hostVideoPath = $this->mapSharedVideoPathToHostPath($localPath, $sharedVideoDir, $sharedHostVideoDir);
            $title = $content['title'] ?: ($content['description'] ?: '');
            $tags = (string)($content['tags'] ?? '');
            $description = (string)($content['description'] ?? '');

            // Build payload for 快手
            $payload = [
                'id' => $content['id'],
                'video_url' => $hostVideoPath,
                'title' => $title,
                'description' => $description,
                'tags' => $tags,
                'local_path' => $hostVideoPath,
                'callback_url' => request()->scheme() . '://' . request()->host() . '/api/marketing/kuaishou/publish/callback',
            ];

            $inputPath = $triggerDir . DIRECTORY_SEPARATOR . $config['input_file'];

            $jsonContent = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            $writeResult = @file_put_contents($inputPath, $jsonContent);
            if ($writeResult === false) {
                return Result::error('写入触发文件失败: ' . $inputPath, 500);
            }

            return Result::success([
                'trigger_file' => $inputPath,
                'rpa_video_path' => $hostVideoPath,
                'payload' => $payload,
                'message' => '发布任务已提交，RPA 将读取快手触发目录中的 input.json',
            ], '发布成功');
        } catch (\Exception $e) {
            return Result::error('发布失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 快手发布回调
     */
    public function publishCallbackKs()
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('kuaishou')->callback();
        }
        return $this->publishCallbackKsViaRpa();
    }

    /**
     * 【旧链路，保留备用】RPA 快手 publish callback
     */
    private function publishCallbackKsViaRpa()
    {
        $data = request()->post();
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'unknown';
        $result = $data['result'] ?? [];

        if (!$id) {
            return Result::error('缺少内容ID', 400);
        }

        try {
            $updateData = [
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            if ($status === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($result['views'])) $updateData['views'] = $result['views'];
                if (isset($result['likes'])) $updateData['likes'] = $result['likes'];
                if (isset($result['comments'])) $updateData['comments'] = $result['comments'];
                if (isset($result['shares'])) $updateData['shares'] = $result['shares'];
            }

            Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);
            return Result::success(null, '回调处理成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 查询快手发布进度
     */
    public function checkPublishStatusKs($id)
    {
        if (PublisherService::enabled()) {
            return $this->dispatcher('kuaishou')->status($id);
        }
        return $this->checkPublishStatusKsViaRpa($id);
    }

    /**
     * 【旧链路，保留备用】Check 快手 publish status
     */
    private function checkPublishStatusKsViaRpa($id)
    {
        $config = $this->getRpaConfigKs();
        try {
            $triggerDir = $config['trigger_dir'];
            $outputPath = $triggerDir . '/' . $config['output_file'];

            if (!file_exists($outputPath)) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $outputContent = file_get_contents($outputPath);
            $outputData = json_decode($outputContent, true);

            if (!$outputData || !isset($outputData['id']) || $outputData['id'] != $id) {
                return Result::success(['status' => 'pending', 'message' => '等待RPA处理中']);
            }

            $updateData = ['updated_at' => date('Y-m-d H:i:s')];

            if (isset($outputData['status']) && $outputData['status'] === 'success') {
                $updateData['status'] = 1;
                $updateData['publish_time'] = date('Y-m-d H:i:s');
                if (isset($outputData['views'])) $updateData['views'] = $outputData['views'];
                if (isset($outputData['likes'])) $updateData['likes'] = $outputData['likes'];
                if (isset($outputData['comments'])) $updateData['comments'] = $outputData['comments'];
                if (isset($outputData['shares'])) $updateData['shares'] = $outputData['shares'];

                Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);

                unlink($outputPath);

                return Result::success(['status' => 'success', 'message' => '发布成功']);
            }

            return Result::success(['status' => 'processing', 'message' => '处理中']);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}