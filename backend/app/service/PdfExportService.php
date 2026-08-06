<?php

namespace app\service;

/**
 * PDF导出服务
 */
class PdfExportService
{
    private $tempDir;
    private $fontDir;

    public function __construct()
    {
        $this->tempDir = runtime_path('temp') . 'pdf' . DIRECTORY_SEPARATOR;
        $this->fontDir = app()->getRootPath() . 'fonts' . DIRECTORY_SEPARATOR;

        // 确保目录存在
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
    }

    /**
     * 生成合同PDF
     * @param string $content 合同内容
     * @param array $data 合同数据
     * @return string PDF文件路径
     */
    public function generateContractPdf($content, $data = [])
    {
        try {
            // 方法1: 使用TCPDF库（推荐）
            return $this->generateWithTcpdf($content, $data);
        } catch (\Exception $e) {
            // 方法2: 如果TCPDF不可用，使用简单的HTML转PDF方法
            return $this->generateWithHtml($content, $data);
        }
    }

    /**
     * 使用TCPDF生成PDF
     * @param string $content 合同内容
     * @param array $data 合同数据
     * @return string PDF文件路径
     */
    private function generateWithTcpdf($content, $data = [])
    {
        // 检查TCPDF是否可用
        if (!class_exists('TCPDF')) {
            throw new \Exception('TCPDF库未安装');
        }

        // 创建PDF对象
        $pdf = new \TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        // 设置文档信息
        $contractNumber = $data['contract_number'] ?? '合同';
        $pdf->SetCreator('CMMS维修管理系统');
        $pdf->SetAuthor('CMMS');
        $pdf->SetTitle($contractNumber);
        $pdf->SetSubject('维修合同');

        // 设置页边距
        $pdf->SetMargins(20, 20, 20, 20);

        // 设置自动分页
        $pdf->SetAutoPageBreak(true, 15);

        // 添加页面
        $pdf->AddPage();

        // 设置字体（使用中文字体体）
        $fontPath = $this->getChineseFontPath();
        if ($fontPath && file_exists($fontPath)) {
            $pdf->setFont('cid0cs', '', 12);
        } else {
            $pdf->setFont('helvetica', '', 12);
        }

        // 处理内容，转换为HTML格式
        $htmlContent = $this->formatContentForPdf($content);

        // 写入HTML内容
        $pdf->writeHTML($htmlContent, true, false, true, false, '');

        // 生成PDF文件
        $fileName = 'contract_' . uniqid() . '.pdf';
        $filePath = $this->tempDir . $fileName;
        $pdf->Output($filePath, 'F');

        return $filePath;
    }

    /**
     * 使用简单HTML方法生成PDF
     * @param string $content 合同内容
     * @param array $data 合同数据
     * @return string PDF文件路径
     */
    private function generateWithHtml($content, $data = [])
    {
        // 创建HTML内容
        $html = $this->createHtmlTemplate($content, $data);

        // 保存为HTML文件
        $htmlFileName = 'contract_' . uniqid() . '.html';
        $htmlFilePath = $this->tempDir . $htmlFileName;
        file_put_contents($htmlFilePath, $html);

        // 使用wkhtmltopdf转换为PDF
        $pdfFileName = 'contract_' . uniqid() . '.pdf';
        $pdfFilePath = $this->tempDir . $pdfFileName;

        $command = sprintf(
            'wkhtmltopdf --encoding UTF-8 --page-size A4 --margin-top 20 --margin-bottom 20 --margin-left 20 --margin-right 20 %s %s',
            $htmlFilePath,
            $pdfFilePath
        );

        // 尝试使用MCP服务或者系统命令
        if (function_exists('exec') && $this->commandExists('wkhtmltopdf')) {
            exec($command, $output, $returnCode);

            if ($returnCode === 0 && file_exists($pdfFilePath)) {
                // 删除临时HTML文件
                unlink($htmlFilePath);
                return $pdfFilePath;
            }
        }

        // 如果wkhtmltopdf不可用，返回HTML文件路径（前端可以处理）
        return $htmlFilePath;
    }

    /**
     * 格式化内容为PDF格式
     * @param string $content 原始内容
     * @return string 格式化后的HTML内容
     */
    private function formatContentForPdf($content)
    {
        // 将换行符转换为HTML换行
        $html = nl2br(htmlspecialchars($content));

        // 添加基本的HTML结构
        $htmlTemplate = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: "SimSun", "宋体", serif;
            font-size: 12pt;
            line-height: 1.8;
            margin: 20px;
        }
        h1, h2, h3 {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 10px;
            text-align: justify;
        }
        .section {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #000;
        }
        .signature {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 45%;
            text-align: center;
        }
    </style>
</head>
<body>
    {$html}
</body>
</html>
HTML;

        return $htmlTemplate;
    }

    /**
     * 创建HTML模板
     * @param string $content 合同内容
     * @param array $data 合同数据
     * @return string HTML内容
     */
    private function createHtmlTemplate($content, $data = [])
    {
        $contractNumber = $data['contract_number'] ?? '合同';
        $customerName = $data['customer_name'] ?? '';
        $signDate = $data['sign_date'] ?? date('Y-m-d');

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{$contractNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: "SimSun", "宋体", "Microsoft YaHei", sans-serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0;
        }
        .content {
            text-align: justify;
            white-space: pre-wrap;
        }
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature {
            width: 40%;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            margin-top: 20px;
            height: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>维修服务合同</h1>
    </div>
    <div class="content">
        {$content}
    </div>
    <div class="footer">
        <div class="signature">
            <div>甲方（签字）</div>
            <div class="signature-line"></div>
            <div>日期：{$signDate}</div>
        </div>
        <div class="signature">
            <div>乙方（签字）</div>
            <div class="signature-line"></div>
            <div>日期：{$signDate}</div>
        </div>
    </div>
</body>
</html>
HTML;

        return $html;
    }

    /**
     * 获取中文字体路径
     * @return string|null 字体路径
     */
    private function getChineseFontPath()
    {
        $possibleFonts = [
            $this->fontDir . 'simhei.ttf',
            $this->fontDir . 'simsun.ttc',
            $this->fontDir . 'simkai.ttf',
            '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
            'C:\\Windows\\Fonts\\simhei.ttf',
            'C:\\Windows\\Fonts\\simsun.ttc',
        ];

        foreach ($possibleFonts as $font) {
            if (file_exists($font)) {
                return $font;
            }
        }

        return null;
    }

    /**
     * 检查命令是否存在
     * @param string $command 命令名称
     * @return bool
     */
    private function commandExists($command)
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $testCommand = sprintf('where %s', $command);
        } else {
            $testCommand = sprintf('which %s', $command);
        }

        exec($testCommand, $output, $returnCode);
        return $returnCode === 0;
    }

    /**
     * 清理临时文件
     */
    public function cleanup()
    {
        if (is_dir($this->tempDir)) {
            $files = glob($this->tempDir . '*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
    }
}
