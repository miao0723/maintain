<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MarketingXiaohongshuController
{
	/**
	 * Get RPA config - read from .env
	 */
	private function getRpaConfig()
	{
		return [
			'enabled' => env('RPA_XHS_ENABLED', true),
			'trigger_dir' => env('RPA_XHS_TRIGGER_DIR', '/var/www/html/rpa_files_xhs'),
			'host_trigger_dir' => env('RPA_XHS_HOST_TRIGGER_DIR', 'D:\\maintain\\docker\\rpa_files'),
			'shared_video_dir' => env('RPA_XHS_SHARED_VIDEO_DIR', '/var/www/html/rpa_files/videos'),
			'shared_host_video_dir' => env('RPA_XHS_SHARED_HOST_VIDEO_DIR', 'D:\\maintain\\docker\\rpa_files\\videos'),
			'input_file' => env('RPA_XHS_INPUT_FILE', 'input.json'),
			'output_file' => env('RPA_XHS_OUTPUT_FILE', 'output.json'),
		];
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

	public function read($id)
	{
		try {
			$content = Db::name('marketing_douyin_content')->find($id);
			if (!$content) return Result::error('Content not found', 404);
			return Result::success($content);
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	public function save()
	{
		$data = request()->post();
		if (empty($data['title'])) return Result::error('Title is required', 400);
		if (empty($data['video_url'])) return Result::error('Video URL is required', 400);

		try {
			$data['created_at'] = date('Y-m-d H:i:s');
			$data['updated_at'] = date('Y-m-d H:i:s');
			if (isset($data['status']) && $data['status'] == 1 && empty($data['publish_time'])) $data['publish_time'] = date('Y-m-d H:i:s');
			$id = Db::name('marketing_douyin_content')->insertGetId($data);
			return Result::success(Db::name('marketing_douyin_content')->find($id), 'Created successfully', 201);
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	public function update($id)
	{
		$data = request()->put();
		try {
			$content = Db::name('marketing_douyin_content')->find($id);
			if (!$content) return Result::error('Content not found', 404);
			if (isset($data['title']) && empty($data['title'])) return Result::error('Title is required', 400);
			if (isset($data['video_url']) && empty($data['video_url'])) return Result::error('Video URL is required', 400);
			$data['updated_at'] = date('Y-m-d H:i:s');
			if (isset($data['status']) && $data['status'] == 1 && empty($data['publish_time'])) $data['publish_time'] = date('Y-m-d H:i:s');
			Db::name('marketing_douyin_content')->where('id', $id)->update($data);
			return Result::success(Db::name('marketing_douyin_content')->find($id), 'Updated successfully');
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	public function delete($id)
	{
		try {
			$content = Db::name('marketing_douyin_content')->find($id);
			if (!$content) return Result::error('Content not found', 404);
			Db::name('marketing_douyin_content')->delete($id);
			return Result::success(null, 'Deleted successfully');
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	/**
	 * Publish to Xiaohongshu - trigger RPA file
	 */
	public function publish($id)
	{
		$config = $this->getRpaConfig();

		// Debug log
		file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " publish() called id=$id\n", FILE_APPEND);

		if (!$config['enabled']) {
			file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " RPA not enabled\n", FILE_APPEND);
			return Result::error('RPA not enabled', 500);
		}

		try {
			$content = Db::name('marketing_douyin_content')->find($id);
			if (!$content) {
				return Result::error('Content not found, ID: ' . $id, 404);
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

			// Build payload
			$payload = [
				'id' => $content['id'],
				'video_url' => $hostVideoPath,
				'title' => $title,
    'description' => $description,
				'tags' => $tags,
				'local_path' => $hostVideoPath,
				'callback_url' => request()->scheme() . '://' . request()->host() . '/api/marketing/xiaohongshu/publish/callback',
			];

			$inputPath = $triggerDir . DIRECTORY_SEPARATOR . $config['input_file'];
			file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " inputPath=$inputPath, hostTriggerDir=$hostTriggerDir, hostVideoPath=$hostVideoPath\n", FILE_APPEND);

			$jsonContent = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

			$writeResult = @file_put_contents($inputPath, $jsonContent);
			if ($writeResult === false) {
				file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " FAILED to write $inputPath\n", FILE_APPEND);
				return Result::error('Failed to write trigger file: ' . $inputPath, 500);
			}

			file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " SUCCESS wrote $inputPath\n", FILE_APPEND);

			return Result::success([
				'trigger_file' => $inputPath,
				'rpa_video_path' => $hostVideoPath,
				'payload' => $payload,
				'message' => '发布任务已提交，Docker 将读取小红书触发目录中的 input.json',
			], '发布成功');
		} catch (\Exception $e) {
			file_put_contents('/tmp/xhs_debug.log', date('Y-m-d H:i:s') . " Exception: " . $e->getMessage() . "\n", FILE_APPEND);
			return Result::error('Publish failed: ' . $e->getMessage(), 500);
		}
	}

	/**
	 * Map container path to host path
	 */
	private function mapLocalPathToHostPath(string $localPath, $config = null)
	{
		if ($config === null) {
			$config = $this->getRpaConfig();
		}

		return $this->mapSharedVideoPathToHostPath($localPath, (string)$config['shared_video_dir'], (string)$config['shared_host_video_dir']);
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
		if (!is_dir($sharedVideoDir)) {
			mkdir($sharedVideoDir, 0777, true);
		}

		$videoUrl = $content['video_url'] ?? '';
		if (empty($videoUrl)) {
			return ['success' => false, 'message' => 'Video URL is empty'];
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
			return ['success' => false, 'message' => 'Download failed' . ($curlError ? ': ' . $curlError : ', HTTP: ' . $httpCode)];
		}

		$fileSize = filesize($localPath);
		if ($fileSize === 0) {
			if (file_exists($localPath)) unlink($localPath);
			return ['success' => false, 'message' => 'Downloaded file is empty'];
		}

		Db::name('marketing_douyin_content')->where('id', $id)->update([
			'local_path' => $localPath,
			'local_filename' => basename($localPath),
			'updated_at' => date('Y-m-d H:i:s'),
		]);

		return [
			'success' => true,
			'local_path' => $localPath,
			'local_filename' => basename($localPath),
			'file_size' => $fileSize,
		];
	}

	/**
	 * RPA publish callback
	 */
	public function publishCallback()
	{
		$data = request()->post();
		$id = $data['id'] ?? null;
		$status = $data['status'] ?? 'unknown';
		$result = $data['result'] ?? [];

		if (!$id) {
			return Result::error('Missing content ID', 400);
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
			return Result::success(null, 'Callback processed');
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	/**
	 * Check publish status
	 */
	public function checkPublishStatus($id)
	{
		$config = $this->getRpaConfig();
		try {
			$triggerDir = $config['trigger_dir'];
			$outputPath = $triggerDir . '/' . $config['output_file'];

			if (!file_exists($outputPath)) {
				return Result::success(['status' => 'pending', 'message' => 'Waiting for RPA']);
			}

			$outputContent = file_get_contents($outputPath);
			$outputData = json_decode($outputContent, true);

			if (!$outputData || !isset($outputData['id']) || $outputData['id'] != $id) {
				return Result::success(['status' => 'pending', 'message' => 'Waiting for RPA']);
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

				return Result::success(['status' => 'success', 'message' => 'Published successfully']);
			}

			return Result::success(['status' => 'processing', 'message' => 'Processing']);
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	/**
	 * Download video to local
	 */
	public function download($id)
	{
		try {
			$content = Db::name('marketing_douyin_content')->find($id);
			if (!$content) return Result::error('Content not found', 404);

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
			], 'Downloaded successfully');
		} catch (\Exception $e) {
			return Result::error($e->getMessage(), 500);
		}
	}

	/**
	 * Download video to local storage
	 */
	private function downloadVideoToLocal($id, $content)
	{
		$config = $this->getRpaConfig();
		$triggerDir = $config['trigger_dir'];
		$downloadDir = rtrim($triggerDir, '/\\') . DIRECTORY_SEPARATOR . 'videos';

		if (!is_dir($downloadDir)) {
			mkdir($downloadDir, 0777, true);
		}

		$videoUrl = $content['video_url'] ?? '';
		if (empty($videoUrl)) {
			return ['success' => false, 'message' => 'Video URL is empty'];
		}

		$extension = 'mp4';
		$path = (string)parse_url($videoUrl, PHP_URL_PATH);
		if ($path && preg_match('/\.([a-zA-Z0-9]+)$/', $path, $matches)) {
			$candidate = strtolower($matches[1]);
			if (in_array($candidate, ['mp4', 'mov', 'avi', 'mkv', 'webm'])) {
				$extension = $candidate;
			}
		}

		$filename = 'xhs_video_' . $id . '_' . time() . '.' . $extension;
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
			return ['success' => false, 'message' => 'Download failed' . ($curlError ? ': ' . $curlError : ', HTTP: ' . $httpCode)];
		}

		$fileSize = filesize($localPath);
		if ($fileSize === 0) {
			if (file_exists($localPath)) unlink($localPath);
			return ['success' => false, 'message' => 'Downloaded file is empty'];
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
}