<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MarketingDouyinController
{
    public function testCozeConnection()
    {
        try {
            $token = env('coze_API', '') ?: getenv('coze_API');
            if (empty($token)) return Result::error('未配置 Coze Token', 500);

            $testPayload = [
                'test' => true,
                'prompt' => 'test connection',
            ];

            $response = $this->postJson('https://njgbwq9tmx.coze.site/stream_run', $testPayload, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
            ]);

            return Result::success([
                'status' => $response['status'],
                'error' => $response['error'],
                'errno' => $response['errno'] ?? 0,
                'body' => substr($response['body'], 0, 1000),
                'token_present' => !empty($token),
                'token_length' => strlen($token),
            ]);
        } catch (\Exception $e) {
            return Result::error('测试失败：' . $e->getMessage(), 500);
        }
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

    public function generate()
    {
        $data = request()->post();
        $prompt = trim((string)($data['prompt'] ?? ''));
        $title = trim((string)($data['douyin_title'] ?? ''));
        $saveToLibrary = array_key_exists('save_to_library', $data) ? (bool)$data['save_to_library'] : true;

        if ($prompt === '') return Result::error('视频创意描述不能为空', 400);
        if ($title === '') return Result::error('抖音标题不能为空', 400);

        $token = env('coze_API', '') ?: getenv('coze_API');
        if (empty($token)) return Result::error('未配置 Coze Token', 500);

        $payload = [
            'prompt' => $prompt,
            'resolution' => (string)($data['resolution'] ?? '1080p'),
            'ratio' => (string)($data['ratio'] ?? '9:16'),
            'duration' => (int)($data['duration'] ?? 30),
            'watermark' => (bool)($data['watermark'] ?? false),
            'douyin_title' => $title,
            'douyin_desc' => (string)($data['douyin_desc'] ?? ''),
            'douyin_tags' => (string)($data['douyin_tags'] ?? ''),
            'video_config' => $this->normalizeVideoConfig($data['video_config'] ?? []),
        ];

        try {
            $response = $this->postJson('https://njgbwq9tmx.coze.site/stream_run', $payload, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
            ]);

            if ($response['error']) {
                return Result::error($this->buildCozeErrorMessage($response['error']), 500);
            }

            if ($response['status'] >= 400) {
                $rawMessage = $response['body'] ?: ('HTTP ' . $response['status']);
                return Result::error($this->buildCozeErrorMessage($rawMessage), 500);
            }

            $decoded = json_decode($response['body'], true);
            if ($decoded === null && !empty($response['body'])) {
                return Result::error('Coze 工作流返回了无效的 JSON 响应：' . substr($response['body'], 0, 500), 500);
            }

            $decoded = json_decode($response['body'], true);
            $videoUrl = $this->extractFirstValue($decoded, ['video_url', 'videoUrl', 'url', 'output_url', 'result_url', 'file_url']);
            $cover = $this->extractFirstValue($decoded, ['cover', 'cover_url', 'poster', 'thumbnail', 'image_url']);
            $views = (int)$this->extractFirstValue($decoded, ['views', 'play_count', 'view_count'], 0);
            $likes = (int)$this->extractFirstValue($decoded, ['likes', 'like_count'], 0);
            $comments = (int)$this->extractFirstValue($decoded, ['comments', 'comment_count'], 0);
            $shares = (int)$this->extractFirstValue($decoded, ['shares', 'share_count'], 0);

            $record = [
                'title' => $payload['douyin_title'],
                'video_url' => is_string($videoUrl) ? $videoUrl : '',
                'cover' => is_string($cover) ? $cover : '',
                'description' => $payload['douyin_desc'] ?: '',
                'tags' => $payload['douyin_tags'],
                'views' => $views,
                'likes' => $likes,
                'comments' => $comments,
                'shares' => $shares,
                'generate_config' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'workflow_result' => json_encode($decoded !== null ? $decoded : $response['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'status' => 0,
                'publish_time' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $saved = null;
            if ($saveToLibrary) {
                $id = Db::name('marketing_douyin_content')->insertGetId($record);
                $saved = Db::name('marketing_douyin_content')->find($id);
            }

            return Result::success([
                'saved' => $saved,
                'can_publish' => !empty($videoUrl),
                'save_to_library' => $saveToLibrary,
                'draft_material' => $record,
                'workflow_status' => $response['status'],
                'workflow_result' => $decoded !== null ? $decoded : $response['body'],
            ], $saveToLibrary ? '视频创建成功，已保存到素材库' : '视频创建成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function optimize($id)
    {
        $data = request()->post();
        $editConfig = $this->normalizeOptimizeConfig($data['edit_config'] ?? []);

        try {
            $content = Db::name('marketing_douyin_content')->find($id);
            if (!$content) return Result::error('内容不存在', 404);

            $token = env('coze_API', '') ?: getenv('coze_API');
            if (empty($token)) return Result::error('未配置 Coze Token', 500);

            $sourceVideoUrl = (string)($content['video_url'] ?? '');
            if ($sourceVideoUrl === '') return Result::error('当前素材缺少视频地址，无法优化', 400);

            $payload = [
                'mode' => 'optimize',
                'source_video_url' => $sourceVideoUrl,
                'title' => (string)($content['title'] ?? ''),
                'description' => (string)($content['description'] ?? ''),
                'tags' => (string)($content['tags'] ?? ''),
                'edit_config' => $editConfig,
            ];

            $response = $this->postJson('https://njgbwq9tmx.coze.site/stream_run', $payload, [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
            ]);

            if ($response['error']) {
                return Result::error($this->buildCozeErrorMessage($response['error']), 500);
            }

            if ($response['status'] >= 400) {
                $rawMessage = $response['body'] ?: ('HTTP ' . $response['status']);
                return Result::error($this->buildCozeErrorMessage($rawMessage), 500);
            }

            $decoded = json_decode($response['body'], true);
            $optimizedVideoUrl = $this->extractFirstValue($decoded, ['optimized_video_url', 'video_url', 'videoUrl', 'url', 'output_url', 'result_url', 'file_url'], $sourceVideoUrl);
            $optimizedCover = $this->extractFirstValue($decoded, ['optimized_cover', 'cover', 'cover_url', 'poster', 'thumbnail', 'image_url'], (string)($content['cover'] ?? ''));
            $optimizedTitle = $this->extractFirstValue($decoded, ['title', 'optimized_title'], (string)($content['title'] ?? ''));
            $optimizedDescription = $this->extractFirstValue($decoded, ['description', 'optimized_description'], (string)($content['description'] ?? ''));
            $optimizedTags = $this->extractFirstValue($decoded, ['tags', 'optimized_tags'], (string)($content['tags'] ?? ''));

            $updateData = [
                'video_url' => is_string($optimizedVideoUrl) ? $optimizedVideoUrl : $sourceVideoUrl,
                'cover' => is_string($optimizedCover) ? $optimizedCover : (string)($content['cover'] ?? ''),
                'title' => is_string($optimizedTitle) ? $optimizedTitle : (string)($content['title'] ?? ''),
                'description' => is_string($optimizedDescription) ? $optimizedDescription : (string)($content['description'] ?? ''),
                'tags' => is_string($optimizedTags) ? $optimizedTags : (string)($content['tags'] ?? ''),
                'edit_config' => json_encode($editConfig, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'workflow_result' => json_encode($decoded !== null ? $decoded : $response['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            Db::name('marketing_douyin_content')->where('id', $id)->update($updateData);
            $updated = Db::name('marketing_douyin_content')->find($id);

            return Result::success([
                'material' => $updated,
                'updated_material' => $updated,
                'workflow_status' => $response['status'],
                'workflow_result' => $decoded !== null ? $decoded : $response['body'],
            ], '视频优化成功');
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

    public function publish($id)
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

    public function checkPublishStatus($id)
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
     * Publish to B站 - trigger RPA file
     */
    public function publishBili($id)
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
     * RPA B站 publish callback
     */
    public function publishCallbackBili()
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
     * Check B站 publish status
     */
    public function checkPublishStatusBili($id)
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
     * Publish to 快手 - trigger RPA file
     */
    public function publishKs($id)
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
     * RPA 快手 publish callback
     */
    public function publishCallbackKs()
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
     * Check 快手 publish status
     */
    public function checkPublishStatusKs($id)
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