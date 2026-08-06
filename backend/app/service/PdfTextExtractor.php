<?php

namespace app\service;

/**
 * 纯 PHP 实现的 PDF 文本提取服务
 *
 * 说明：当前运行环境未安装 poppler(pdftotext) 与 Python PDF 库，
 * 因此采用无外部依赖的方式提取文本：
 *   1. 若系统存在 pdftotext 命令则优先使用；
 *   2. 否则解析 PDF 内容流，对 FlateDecode 流用 zlib 解压，
 *      再提取文本显示操作符 (...)Tj / [...]TJ 中的字符串。
 *
 * 局限性：对"文本型 PDF"（可选中文字层）效果较好；
 * 扫描件 / 图片型 PDF 以及部分复杂编码的中文 PDF 可能提取不完整，
 * 此时建议在导入弹窗中粘贴文本或手动补全。
 */
class PdfTextExtractor
{
    /**
     * 提取 PDF 文本
     * @param string $path PDF 文件路径
     * @return string
     */
    public function extract(string $path): string
    {
        if (!is_file($path)) {
            throw new \Exception('PDF 文件不存在');
        }

        // 优先尝试外部工具
        $text = $this->extractWithTool($path);
        if ($text !== null && trim($text) !== '') {
            return $text;
        }

        // 回退到纯 PHP 解析
        return $this->extractWithPhp($path);
    }

    /**
     * 使用系统 pdftotext（如存在）
     */
    private function extractWithTool(string $path): ?string
    {
        $bin = $this->findBinary('pdftotext');
        if (!$bin) {
            return null;
        }

        $out = tempnam(sys_get_temp_dir(), 'pdf_');
        if (!$out) {
            return null;
        }

        $cmd = escapeshellcmd($bin) . ' ' . escapeshellarg($path) . ' ' . escapeshellarg($out) . ' 2>/dev/null';
        exec($cmd, $ignore, $rc);

        if ($rc === 0 && is_file($out) && filesize($out) > 0) {
            $txt = @file_get_contents($out);
            @unlink($out);
            return $txt !== false ? $txt : null;
        }

        @unlink($out);
        return null;
    }

    /**
     * 纯 PHP 解析 PDF 内容流
     */
    private function extractWithPhp(string $path): string
    {
        $content = @file_get_contents($path);
        if ($content === false) {
            return '';
        }

        $texts = [];

        // 1) 提取所有 stream...endstream 块，优先解析含文本操作符的流
        if (preg_match_all('/stream\s*(\r\n|\r|\n)(.*?)(\r\n|\r|\n)endstream/s', $content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                $data = $m[2];
                $decoded = $this->tryInflate($data);
                $stream = $decoded !== false ? $decoded : $data;

                // 仅处理包含文本显示操作符的流，避免把字体/图片二进制当文本
                if (strpos($stream, 'Tj') === false && strpos($stream, 'TJ') === false) {
                    continue;
                }

                $arr = $this->extractStringsFromContent($stream);
                if (!empty($arr)) {
                    $texts[] = implode("\n", $arr);
                }
            }
        }

        // 2) 兜底：直接在整文件中扫描文本操作符
        if (empty($texts)) {
            $arr = $this->extractStringsFromContent($content);
            if (!empty($arr)) {
                $texts[] = implode("\n", $arr);
            }
        }

        return implode("\n", $texts);
    }

    /**
     * 尝试对 PDF 流解压（FlateDecode 使用 zlib/RFC1950）
     */
    private function tryInflate(string $data)
    {
        $d = @gzuncompress($data);
        if ($d !== false) {
            return $d;
        }
        $d = @gzinflate($data);
        if ($d !== false) {
            return $d;
        }
        return false;
    }

    /**
     * 从 PDF 内容流中提取所有字符串字面量（括号平衡扫描）
     * @return array 解码后的字符串数组
     */
    private function extractStringsFromContent(string $c): array
    {
        $out = [];
        $len = strlen($c);
        $i = 0;

        while ($i < $len) {
            if ($c[$i] === '(') {
                $depth = 1;
                $j = $i + 1;
                $buf = '';

                while ($j < $len) {
                    $ch = $c[$j];

                    if ($ch === '\\') {
                        if ($j + 1 < $len) {
                            $nx = $c[$j + 1];
                            if ($nx === 'n') {
                                $buf .= "\n";
                            } elseif ($nx === 'r') {
                                $buf .= "\r";
                            } elseif ($nx === 't') {
                                $buf .= "\t";
                            } elseif ($nx === 'b') {
                                $buf .= "\b";
                            } elseif ($nx === 'f') {
                                $buf .= "\f";
                            } elseif ($nx === '(') {
                                $buf .= '(';
                            } elseif ($nx === ')') {
                                $buf .= ')';
                            } elseif ($nx === '\\') {
                                $buf .= '\\';
                            } elseif ($nx >= '0' && $nx <= '9') {
                                if (preg_match('/^[0-7]{1,3}/', substr($c, $j + 1), $mm)) {
                                    $buf .= chr(octdec($mm[0]));
                                    $j += strlen($mm[0]);
                                } else {
                                    $buf .= $nx;
                                }
                                $j += 2;
                                continue;
                            } else {
                                $buf .= $nx;
                            }
                            $j += 2;
                            continue;
                        }
                        $j++;
                        continue;
                    }

                    if ($ch === '(') {
                        $depth++;
                        $buf .= $ch;
                        $j++;
                        continue;
                    }

                    if ($ch === ')') {
                        $depth--;
                        if ($depth === 0) {
                            $j++;
                            break;
                        }
                        $buf .= $ch;
                        $j++;
                        continue;
                    }

                    $buf .= $ch;
                    $j++;
                }

                $decoded = $this->decodeString($buf);
                if ($this->isReadable($decoded)) {
                    $out[] = $decoded;
                }

                $i = $j;
                continue;
            }

            $i++;
        }

        return $out;
    }

    /**
     * 解码字符串字面量中的转义与字符集
     */
    private function decodeString(string $s): string
    {
        $len = strlen($s);
        if ($len === 0) {
            return '';
        }

        // UTF-16BE 检测（Identity-H 等编码，包含大量 0x00）
        $nul = substr_count($s, "\0");
        if ($nul > 0 && $nul / $len > 0.35) {
            $conv = @mb_convert_encoding($s, 'UTF-8', 'UTF-16BE');
            if ($conv !== false && $conv !== '') {
                return $conv;
            }
        }

        // GBK 回退
        if (preg_match('/[\x80-\xff]/', $s)) {
            $g = @mb_convert_encoding($s, 'UTF-8', 'GBK');
            if ($g !== false && $g !== '') {
                return $g;
            }
        }

        return $s;
    }

    /**
     * 过滤掉不可读（多为二进制/控制字符）的字符串
     */
    private function isReadable(string $s): bool
    {
        if (trim($s) === '') {
            return false;
        }

        $ctrl = 0;
        $total = 0;
        for ($k = 0; $k < strlen($s); $k++) {
            $o = ord($s[$k]);
            if ($o < 32 && !in_array($o, [9, 10, 13], true)) {
                $ctrl++;
            }
            $total++;
        }

        if ($total > 0 && $ctrl / $total > 0.3) {
            return false;
        }

        return true;
    }

    /**
     * 查找可执行文件
     */
    private function findBinary(string $name): ?string
    {
        $candidates = [$name, '/usr/bin/' . $name, '/usr/local/bin/' . $name];
        foreach ($candidates as $bin) {
            $output = [];
            @exec($bin . ' -v 2>/dev/null', $output, $rc);
            if ($rc === 0) {
                return $bin;
            }
        }
        return null;
    }
}
