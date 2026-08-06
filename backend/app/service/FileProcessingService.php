<?php

namespace app\service;

use app\model\KbChunk;
use app\model\KbFile;
use think\facade\Log;

/**
 * 文件处理服务
 * 负责文件文本提取和分块
 *
 * 不再包含向量化步骤，使用 MySQL FULLTEXT 全文检索
 */
class FileProcessingService
{
    /**
     * 处理文件：提取文本 -> 分块
     */
    public function processFile(KbFile $file): bool
    {
        try {
            Log::info("开始处理文件: {$file->original_name} (ID: {$file->id})");

            // 更新状态为处理中
            $file->chunk_status = 1;
            $file->chunk_error = null;
            $file->save();

            // === 阶段1: 提取文本 ===
            $fullPath = root_path() . 'public/' . $file->file_path;
            if (!file_exists($fullPath)) {
                throw new \Exception("文件不存在: {$fullPath}");
            }

            Log::info("开始提取文本: {$file->original_name}, 类型: {$file->file_type}");
            $text = $this->extractText($fullPath, $file->file_type);
            Log::info("文本提取完成: {$file->original_name}, 字符数: " . mb_strlen($text, 'UTF-8'));

            if (empty(trim($text))) {
                $file->chunk_status = 3;
                $file->chunk_error = '文件未能提取到有效文本内容';
                $file->save();
                Log::warning("文本提取为空: {$file->original_name}");
                return false;
            }

            $file->extracted_text = $text;
            $file->text_char_count = mb_strlen($text, 'UTF-8');
            $file->save();

            // === 阶段2: 分块 ===
            Log::info("开始分块: {$file->original_name}");
            $chunks = $this->chunkText($text, 512, 64);
            Log::info("分块完成: {$file->original_name}, 块数: " . count($chunks));

            if (empty($chunks)) {
                $file->chunk_status = 3;
                $file->chunk_error = '文本分块失败';
                $file->save();
                Log::warning("分块结果为空: {$file->original_name}");
                return false;
            }

            // 清除旧分块
            KbChunk::where('file_id', $file->id)->delete();

            // 保存块到MySQL
            $savedChunks = [];
            foreach ($chunks as $index => $chunkText) {
                $chunk = KbChunk::create([
                    'file_id' => $file->id,
                    'collection_id' => $file->collection_id,
                    'chunk_index' => $index,
                    'content' => $chunkText,
                    'char_count' => mb_strlen($chunkText, 'UTF-8'),
                ]);
                $savedChunks[] = $chunk;
            }

            // 更新文件状态为已完成
            $file->chunk_count = count($savedChunks);
            $file->chunk_status = 2;
            $file->chunk_error = null;
            $file->save();

            // 更新知识库统计
            $this->updateCollectionStats($file->collection_id);

            Log::info("文件处理完成: {$file->original_name}, 分块数: " . count($savedChunks));
            return true;

        } catch (\Exception $e) {
            $errorMsg = $e->getMessage() . "\n" . $e->getTraceAsString();
            Log::error("文件处理失败: {$file->original_name}, 错误: " . $errorMsg);

            try {
                $file->chunk_status = 3;
                $file->chunk_error = mb_substr($e->getMessage(), 0, 500, 'UTF-8');
                $file->save();
            } catch (\Exception $saveError) {
                Log::error("保存文件状态失败: " . $saveError->getMessage());
            }

            return false;
        }
    }

    /**
     * 提取文本
     */
    public function extractText(string $filePath, string $fileType): string
    {
        if (!file_exists($filePath)) {
            throw new \Exception("文件不存在: {$filePath}");
        }

        switch (strtolower($fileType)) {
            case 'pdf':
                return $this->extractFromPdf($filePath);
            case 'doc':
            case 'docx':
                return $this->extractFromDocx($filePath);
            case 'xls':
            case 'xlsx':
                return $this->extractFromXlsx($filePath);
            case 'ppt':
            case 'pptx':
                return $this->extractFromPptx($filePath);
            case 'txt':
            case 'md':
                return file_get_contents($filePath);
            case 'csv':
                return $this->extractFromCsv($filePath);
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
                return $this->extractFromImage($filePath);
            default:
                $content = file_get_contents($filePath);
                return mb_check_encoding($content, 'UTF-8') ? $content : '';
        }
    }

    /**
     * 从PDF提取文本
     */
    private function extractFromPdf(string $filePath): string
    {
        // 方式1: 尝试 smalot/pdfparser
        if (class_exists(\Smalot\PdfParser\Parser::class)) {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($filePath);
                $text = $pdf->getText();
                if (!empty(trim($text))) {
                    return $text;
                }
            } catch (\Exception $e) {
                Log::warning("smalot/pdfparser 解析失败: " . $e->getMessage());
            }
        }

        // 方式2: 尝试 pdftotext 命令行
        $output = [];
        exec("pdftotext " . escapeshellarg($filePath) . " - 2>/dev/null", $output);
        $text = implode("\n", $output);
        if (!empty(trim($text))) {
            return $text;
        }

        // 方式3: 用Qwen VL对PDF首页做OCR（如果PDF是扫描件）
        try {
            $apiKey = env('DASHSCOPE_API_KEY', '');
            if (!empty($apiKey)) {
                return $this->extractFromImageViaQwen($filePath, 'pdf');
            }
        } catch (\Exception $e) {
            Log::warning("PDF OCR回退失败: " . $e->getMessage());
        }

        return '';
    }

    /**
     * 从DOCX提取文本
     */
    private function extractFromDocx(string $filePath): string
    {
        // 方式1: PhpWord
        if (class_exists(\PhpOffice\PhpWord\IOFactory::class)) {
            try {
                $phpWord = \PhpOffice\PhpWord\IOFactory::load($filePath);
                $text = '';

                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getText')) {
                            $text .= $element->getText() . "\n";
                        } elseif (method_exists($element, 'getElements')) {
                            foreach ($element->getElements() as $child) {
                                if (method_exists($child, 'getText')) {
                                    $text .= $child->getText() . "\n";
                                }
                            }
                        }
                    }
                }

                if (!empty(trim($text))) {
                    return $text;
                }
            } catch (\Exception $e) {
                Log::warning("PhpWord解析失败: " . $e->getMessage());
            }
        }

        // 方式2: 解压docx读取XML
        try {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $content = $zip->getFromName('word/document.xml');
                $zip->close();
                if ($content) {
                    $content = preg_replace('/<[^>]+>/', ' ', $content);
                    $content = preg_replace('/\s+/', ' ', $content);
                    return trim($content);
                }
            }
        } catch (\Exception $e) {
            Log::warning("DOCX XML解析失败: " . $e->getMessage());
        }

        return '';
    }

    /**
     * 从XLSX提取文本
     */
    private function extractFromXlsx(string $filePath): string
    {
        if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            // 回退: 解压xlsx读取XML
            try {
                $zip = new \ZipArchive();
                if ($zip->open($filePath) === true) {
                    $text = '';
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $name = $zip->getNameIndex($i);
                        if (strpos($name, 'xl/sharedStrings') !== false || strpos($name, 'xl/worksheets/') !== false) {
                            $content = $zip->getFromIndex($i);
                            $content = preg_replace('/<[^>]+>/', ' ', $content);
                            $content = preg_replace('/\s+/', ' ', $content);
                            $text .= $content . "\n";
                        }
                    }
                    $zip->close();
                    if (!empty(trim($text))) {
                        return $text;
                    }
                }
            } catch (\Exception $e) {
                Log::warning("XLSX XML解析失败: " . $e->getMessage());
            }
            return '';
        }

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $text = '';

            foreach ($spreadsheet->getAllSheets() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    $cellText = [];
                    foreach ($row->getCellIterator() as $cell) {
                        $value = $cell->getValue();
                        if ($value !== null) {
                            $cellText[] = (string) $value;
                        }
                    }
                    if (!empty($cellText)) {
                        $text .= implode("\t", $cellText) . "\n";
                    }
                }
            }

            return $text;
        } catch (\Exception $e) {
            Log::warning("XLSX解析失败: " . $e->getMessage());
            return '';
        }
    }

    /**
     * 从PPTX提取文本
     */
    private function extractFromPptx(string $filePath): string
    {
        if (class_exists(\PhpOffice\PhpPresentation\IOFactory::class)) {
            try {
                $presentation = \PhpOffice\PhpPresentation\IOFactory::load($filePath);
                $text = '';

                foreach ($presentation->getAllSlides() as $slide) {
                    foreach ($slide->getShapeCollection() as $shape) {
                        if ($shape instanceof \PhpOffice\PhpPresentation\Shape\RichText) {
                            foreach ($shape->getParagraphs() as $paragraph) {
                                foreach ($paragraph->getRichTextElements() as $element) {
                                    $text .= $element->getText();
                                }
                                $text .= "\n";
                            }
                        }
                    }
                }

                if (!empty(trim($text))) {
                    return $text;
                }
            } catch (\Exception $e) {
                Log::warning("PhpPresentation解析失败: " . $e->getMessage());
            }
        }

        // 回退: 解压pptx读取XML
        try {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $text = '';
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    if (strpos($name, 'ppt/slides/slide') !== false && substr($name, -4) === '.xml') {
                        $content = $zip->getFromIndex($i);
                        $content = preg_replace('/<[^>]+>/', ' ', $content);
                        $content = preg_replace('/\s+/', ' ', $content);
                        $text .= $content . "\n";
                    }
                }
                $zip->close();
                if (!empty(trim($text))) {
                    return $text;
                }
            }
        } catch (\Exception $e) {
            Log::warning("PPTX XML解析失败: " . $e->getMessage());
        }

        return '';
    }

    /**
     * 从CSV提取文本
     */
    private function extractFromCsv(string $filePath): string
    {
        $text = '';
        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                $text .= implode("\t", $row) . "\n";
            }
            fclose($handle);
        }
        return $text;
    }

    /**
     * 从图片提取文本(使用Qwen VL进行OCR)
     */
    private function extractFromImage(string $filePath): string
    {
        try {
            $apiKey = env('DASHSCOPE_API_KEY', '');
            if (empty($apiKey)) {
                Log::warning("OCR服务未配置: DASHSCOPE_API_KEY 未设置");
                return '[图片文件 - 未配置OCR服务]';
            }

            Log::info("开始OCR识别图片: " . basename($filePath));
            $result = $this->extractFromImageViaQwen($filePath, 'image');
            Log::info("OCR识别完成: " . basename($filePath) . ", 结果长度: " . mb_strlen($result, 'UTF-8'));

            return $result;
        } catch (\Exception $e) {
            $errorMsg = $e->getMessage();
            Log::error("图片OCR异常: {$errorMsg}");
            Log::error("堆栈信息: " . $e->getTraceAsString());
            return "[图片文件 - OCR异常: {$errorMsg}]";
        }
    }

    /**
     * 调用Qwen VL进行图片/PDF OCR
     */
    private function extractFromImageViaQwen(string $filePath, string $sourceType = 'image'): string
    {
        $apiKey = env('DASHSCOPE_API_KEY', '');
        if (empty($apiKey)) {
            throw new \Exception("DASHSCOPE_API_KEY 未配置");
        }

        Log::info("准备调用Qwen VL OCR: 文件大小=" . filesize($filePath) . " bytes");

        $imageData = base64_encode(file_get_contents($filePath));
        $mimeType = mime_content_type($filePath) ?: ($sourceType === 'pdf' ? 'application/pdf' : 'image/jpeg');

        $prompt = $sourceType === 'pdf'
            ? '请详细描述这个PDF页面中的所有文字和技术信息，包括任何表格、图表、标注等内容。'
            : '请详细描述这张图片中的所有文字和技术信息，包括任何表格、图表、标注等内容。';

        $payload = [
            'model' => env('DASHSCOPE_MODEL', 'qwen2.5-vl-72b-instruct'),
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        ['type' => 'image_url', 'image_url' => ['url' => "data:{$mimeType};base64,{$imageData}"]],
                        ['type' => 'text', 'text' => $prompt],
                    ],
                ],
            ],
            'temperature' => 0.1,
            'max_tokens' => 2000,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ]);
        // 图片OCR可能需要更长时间
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 60);

        Log::info("开始发送OCR请求到DashScope...");
        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            $errorMsg = "Qwen VL OCR curl错误: {$error}";
            Log::error($errorMsg);
            throw new \Exception($errorMsg);
        }

        Log::info("OCR请求响应完成, HTTP状态码: {$httpCode}");

        $result = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMsg = "Qwen VL OCR HTTP错误: {$httpCode}, 原始响应: " . substr($response, 0, 500);
            Log::error($errorMsg);
            throw new \Exception($errorMsg);
        }

        if (json_last_error() !== JSON_ERROR_NONE) {
            $errorMsg = "Qwen VL OCR JSON解析失败: " . json_last_error_msg() . ", 原始响应: " . substr($response, 0, 500);
            Log::error($errorMsg);
            throw new \Exception($errorMsg);
        }

        $content = $result['choices'][0]['message']['content'] ?? '';

        if (empty($content)) {
            $errorMsg = "Qwen VL OCR 返回空内容, 完整响应: " . json_encode($result, JSON_UNESCAPED_UNICODE);
            Log::warning($errorMsg);
            throw new \Exception("OCR返回空内容");
        }

        return $content;
    }

    /**
     * 文本分块（滑动窗口）
     * @param string $text 原始文本
     * @param int $chunkSize 块大小（字符数）
     * @param int $overlap 重叠字符数
     * @return array 分块文本数组
     */
    public function chunkText(string $text, int $chunkSize = 512, int $overlap = 64): array
    {
        $text = trim($text);
        if (empty($text)) {
            return [];
        }

        $totalLen = mb_strlen($text, 'UTF-8');

        if ($totalLen <= $chunkSize) {
            return [$text];
        }

        $chunks = [];
        $start = 0;

        while ($start < $totalLen) {
            $end = $start + $chunkSize;

            // 如果不是最后一块，尝试在句子边界处断开
            if ($end < $totalLen) {
                $chunk = mb_substr($text, $start, $chunkSize, 'UTF-8');

                // 优先在句号、换行处断开
                $breakChars = ['。', '！', '？', '；', "\n", '.', '!', '?', ';'];
                $breakPos = false;

                foreach ($breakChars as $char) {
                    $pos = mb_strrpos($chunk, $char, 0, 'UTF-8');
                    if ($pos !== false && $pos > $chunkSize * 0.5) {
                        $breakPos = $pos + 1;
                        break;
                    }
                }

                if ($breakPos !== false) {
                    $chunk = mb_substr($chunk, 0, $breakPos, 'UTF-8');
                    $end = $start + $breakPos;
                }
            } else {
                $chunk = mb_substr($text, $start, null, 'UTF-8');
            }

            $chunks[] = trim($chunk);

            // 下一起始位置：考虑重叠
            $start = $end - $overlap;
            if ($start <= ($end - $chunkSize + $overlap)) {
                $start = $end - $overlap;
            }

            if ($start >= $totalLen) {
                break;
            }
        }

        // 过滤空块
        return array_values(array_filter($chunks, function ($chunk) {
            return !empty(trim($chunk));
        }));
    }

    /**
     * 更新知识库统计信息
     */
    private function updateCollectionStats(int $collectionId): void
    {
        $fileCount = KbFile::where('collection_id', $collectionId)->count();
        $chunkCount = KbChunk::where('collection_id', $collectionId)->count();
        $totalChars = KbChunk::where('collection_id', $collectionId)->sum('char_count');

        \app\model\KbCollection::where('id', $collectionId)->update([
            'file_count' => $fileCount,
            'chunk_count' => $chunkCount,
            'total_chars' => $totalChars,
        ]);
    }
}
