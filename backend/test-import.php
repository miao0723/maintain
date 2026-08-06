<?php
/**
 * 人员导入功能测试脚本
 * 用法：php test-import.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

echo "=== 人员导入/导出功能测试 ===\n\n";

// 测试 1: 创建测试 Excel 文件
echo "测试 1: 创建测试 Excel 文件...\n";
try {
    $spreadsheet = new Spreadsheet();
    $worksheet = $spreadsheet->getActiveSheet();

    // 表头
    $headers = ['name', 'code', 'phone', 'department_name', 'position', 'email', 'entry_date', 'status', 'notes'];
    foreach ($headers as $index => $header) {
        $column = Coordinate::stringFromColumnIndex($index + 1);
        $worksheet->setCellValue($column . '1', $header);
    }

    // 测试数据
    $testData = [
        ['张三', 'TEST001', '13800138001', '技术部', 'engineer', 'test1@company.com', '2024-01-15', 1, '测试工程师'],
        ['李四', 'TEST002', '13800138002', '技术部', 'engineer', 'test2@company.com', '2024-02-20', 1, '高级工程师'],
        ['王五', 'TEST003', '13800138003', '销售部', 'supervisor', 'test3@company.com', '2024-03-10', 1, '销售主管'],
    ];

    foreach ($testData as $index => $row) {
        $rowNum = $index + 2;
        foreach ($row as $colIndex => $value) {
            $column = Coordinate::stringFromColumnIndex($colIndex + 1);
            $worksheet->setCellValue($column . $rowNum, $value);
        }
    }

    $testFile = __DIR__ . '/test_personnel.xlsx';
    $writer = new Xlsx($spreadsheet);
    $writer->save($testFile);
    echo "✓ 测试文件创建成功：{$testFile}\n\n";
} catch (Exception $e) {
    echo "✗ 创建测试文件失败：" . $e->getMessage() . "\n\n";
}

// 测试 2: 读取 Excel 文件
echo "测试 2: 读取 Excel 文件...\n";
try {
    if (file_exists($testFile)) {
        // 检查 ZipArchive 扩展
        if (!class_exists('ZipArchive')) {
            echo "⚠ 警告：ZipArchive 扩展未启用，无法读取 XLSX 文件\n";
            echo "  请启用 php.ini 中的 extension=zip 配置\n";
        } else {
            $spreadsheet = IOFactory::load($testFile);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray();

            echo "✓ 文件读取成功，共 " . count($data) . " 行数据\n";
            echo "表头：" . implode(', ', array_map('trim', $data[0])) . "\n";
            echo "数据行:\n";
            for ($i = 1; $i < count($data); $i++) {
                echo "  行" . ($i + 1) . ": " . implode(', ', $data[$i]) . "\n";
            }
        }
    } else {
        echo "✗ 测试文件不存在\n";
    }
} catch (Exception $e) {
    echo "✗ 读取文件失败：" . $e->getMessage() . "\n";
}

// 测试 3: 检查 Personnel 模型
echo "\n测试 3: 检查 Personnel 模型...\n";
try {
    $personnel = new \app\model\Personnel();
    echo "✓ Personnel 模型加载成功\n";
    echo "  表名：" . $personnel->getTable() . "\n";
} catch (Exception $e) {
    echo "✗ Personnel 模型加载失败：" . $e->getMessage() . "\n";
}

// 测试 4: 检查 Department 模型
echo "\n测试 4: 检查 Department 模型...\n";
try {
    $departments = \app\model\Department::all();
    echo "✓ Department 模型加载成功，共 " . count($departments) . " 个部门\n";
    foreach ($departments as $dept) {
        echo "  - {$dept->id}: {$dept->name}\n";
    }
} catch (Exception $e) {
    echo "✗ Department 模型加载失败：" . $e->getMessage() . "\n";
}

echo "\n=== 测试完成 ===\n";
