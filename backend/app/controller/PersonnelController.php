<?php

namespace app\controller;

use app\model\Personnel;
use app\common\Result;

/**
 * 人员管理控制器
 */
class PersonnelController
{
    /**
     * 获取人员列表
     * GET /personnel
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $departmentId = request()->get('department_id', '');
        $position = request()->get('position', '');
        $status = request()->get('status', '');

        try {
            $query = Personnel::with(['department'])->order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|phone|email', '%' . $keyword . '%');
            }

            // 部门筛选
            if (!empty($departmentId)) {
                $query->where('department_id', $departmentId);
            }

            // 职位筛选
            if (!empty($position)) {
                $query->where('position', $position);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $personnel = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $personnel,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取人员详情
     * GET /personnel/{id}
     */
    public function read($id)
    {
        try {
            $person = Personnel::with(['department'])->find($id);

            if (!$person) {
                return Result::error('人员不存在', 404);
            }

            return Result::success($person);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建人员
     * POST /personnel
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|max:100',
                'code' => 'max:50',
                'phone' => 'max:20',
                'email' => 'email|max:100',
                'department_id' => 'integer',
                'position' => 'max:50',
                'status' => 'integer|in:0,1',
            ])->check($data);

            $person = Personnel::create($data);

            return Result::success($person, '人员创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新人员
     * PUT /personnel/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $person = Personnel::find($id);

            if (!$person) {
                return Result::error('人员不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|max:100',
                'code' => 'max:50',
                'phone' => 'max:20',
                'email' => 'email|max:100',
                'department_id' => 'integer',
                'position' => 'max:50',
                'status' => 'integer|in:0,1',
            ])->check($data);

            $person->save($data);

            return Result::success($person, '人员更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除人员
     * DELETE /personnel/{id}
     */
    public function delete($id)
    {
        try {
            $person = Personnel::find($id);

            if (!$person) {
                return Result::error('人员不存在', 404);
            }

            $person->delete();

            return Result::success(null, '人员删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function batchSave()
    {
        $payload = request()->post();
        $items = $payload['items'] ?? [];

        if (!is_array($items) || count($items) === 0) {
            return Result::error('items 不能为空', 400);
        }

        try {
            $departments = \app\model\Department::column('id', 'name');
            $success = 0;
            $failed = 0;
            $errors = [];
            $seenCodes = [];

            foreach ($items as $index => $item) {
                $rowNum = isset($item['__row']) ? intval($item['__row']) : ($index + 2);

                if (!is_array($item)) {
                    $errors[] = ['row' => $rowNum, 'message' => '行数据格式错误'];
                    $failed++;
                    continue;
                }

                $name = isset($item['name']) ? trim(strval($item['name'])) : '';
                $code = isset($item['code']) ? trim(strval($item['code'])) : '';
                $phone = isset($item['phone']) ? trim(strval($item['phone'])) : '';
                $email = isset($item['email']) ? trim(strval($item['email'])) : '';
                $position = isset($item['position']) ? trim(strval($item['position'])) : 'engineer';
                $entryDate = isset($item['entry_date']) ? trim(strval($item['entry_date'])) : '';
                $notes = isset($item['notes']) ? trim(strval($item['notes'])) : '';
                $status = isset($item['status']) ? intval($item['status']) : 1;
                $departmentId = null;

                if (isset($item['department_id']) && $item['department_id'] !== '' && $item['department_id'] !== null) {
                    $departmentId = intval($item['department_id']);
                } elseif (isset($item['department_name']) && $item['department_name'] !== '' && $item['department_name'] !== null) {
                    $departmentName = trim(strval($item['department_name']));
                    $departmentId = $departments[$departmentName] ?? null;
                    if (!$departmentId) {
                        $errors[] = ['row' => $rowNum, 'message' => '部门 ' . $departmentName . ' 不存在'];
                        $failed++;
                        continue;
                    }
                }

                if ($name === '') {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少姓名'];
                    $failed++;
                    continue;
                }
                if ($code === '') {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少工号'];
                    $failed++;
                    continue;
                }
                if ($phone === '') {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少手机号'];
                    $failed++;
                    continue;
                }
                if (!preg_match('/^1[3-9]\d{9}$/', $phone)) {
                    $errors[] = ['row' => $rowNum, 'message' => '手机号格式错误'];
                    $failed++;
                    continue;
                }

                if (isset($seenCodes[$code])) {
                    $errors[] = ['row' => $rowNum, 'message' => '工号 ' . $code . ' 在文件中重复'];
                    $failed++;
                    continue;
                }
                $seenCodes[$code] = true;

                $exists = Personnel::where('code', $code)->find();
                if ($exists) {
                    $errors[] = ['row' => $rowNum, 'message' => '工号 ' . $code . ' 已存在'];
                    $failed++;
                    continue;
                }

                if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = ['row' => $rowNum, 'message' => '邮箱格式错误'];
                    $failed++;
                    continue;
                }

                $validPositions = ['engineer', 'supervisor', 'manager'];
                if (!in_array($position, $validPositions)) {
                    $position = 'engineer';
                }

                if (!in_array($status, [0, 1], true)) {
                    $status = 1;
                }

                $insertData = [
                    'name' => $name,
                    'code' => $code,
                    'phone' => $phone,
                    'department_id' => $departmentId,
                    'position' => $position,
                    'email' => $email !== '' ? $email : null,
                    'entry_date' => $entryDate !== '' ? $entryDate : null,
                    'status' => $status,
                    'notes' => $notes !== '' ? $notes : null,
                ];

                try {
                    Personnel::create($insertData);
                    $success++;
                } catch (\Exception $e) {
                    $errors[] = ['row' => $rowNum, 'message' => '插入失败：' . $e->getMessage()];
                    $failed++;
                }
            }

            return Result::success([
                'total' => count($items),
                'success' => $success,
                'failed' => $failed,
                'errors' => $errors,
            ], $failed === 0 ? '导入成功' : "导入完成，成功 {$success} 条，失败 {$failed} 条");
        } catch (\Exception $e) {
            return Result::error('导入失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 导入人员数据
     * POST /personnel/import
     */
    public function import()
    {
        $file = request()->file('file');

        if (!$file) {
            return Result::error('请选择要上传的文件', 400);
        }

        try {
            // 验证文件类型 - 从原始文件名获取扩展名
            $originalName = $file->getOriginalName();
            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
                return Result::error('仅支持 Excel 或 CSV 格式文件', 400);
            }

            // 验证文件大小 (10MB)
            if ($file->getSize() > 10 * 1024 * 1024) {
                return Result::error('文件大小不能超过 10MB', 400);
            }

            // 保存文件到临时目录
            $tempPath = runtime_path() . 'temp_import/';
            if (!is_dir($tempPath)) {
                mkdir($tempPath, 0755, true);
            }

            $filename = time() . '_' . $file->getFilename();
            $filepath = $tempPath . $filename;
            $file->move($tempPath, $filename);

            // 使用 PhpSpreadsheet 读取文件
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filepath);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray();

            // 移除表头
            $header = array_shift($data);
            $header = array_map(function($val) { return $val !== null ? trim($val) : ''; }, $header);

            $success = 0;
            $failed = 0;
            $errors = [];

            // 获取部门映射
            $departments = \app\model\Department::column('id', 'name');

            foreach ($data as $index => $row) {
                $rowNum = $index + 2; // 从第 2 行开始

                // 映射字段
                $item = [];
                foreach ($header as $colIndex => $colName) {
    $value = isset($row[$colIndex]) && $row[$colIndex] !== null ? $row[$colIndex] : '';
    $item[$colName] = is_string($value) ? trim($value) : $value;
                }

                // 验证必填字段
                if (empty($item['name'])) {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少姓名'];
                    $failed++;
                    continue;
                }
                if (empty($item['code'])) {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少工号'];
                    $failed++;
                    continue;
                }
                if (empty($item['phone'])) {
                    $errors[] = ['row' => $rowNum, 'message' => '缺少手机号'];
                    $failed++;
                    continue;
                }

                // 验证手机号格式
                if (!preg_match('/^1[3-9]\d{9}$/', $item['phone'])) {
                    $errors[] = ['row' => $rowNum, 'message' => '手机号格式错误'];
                    $failed++;
                    continue;
                }

                // 检查工号是否已存在
                $exists = Personnel::where('code', $item['code'])->find();
                if ($exists) {
                    $errors[] = ['row' => $rowNum, 'message' => '工号 ' . $item['code'] . ' 已存在'];
                    $failed++;
                    continue;
                }

                // 处理部门
                $departmentId = null;
                if (!empty($item['department_id'])) {
                    $departmentId = $item['department_id'];
                } elseif (!empty($item['department_name'])) {
                    $departmentId = $departments[$item['department_name']] ?? null;
                    if (!$departmentId) {
                        $errors[] = ['row' => $rowNum, 'message' => '部门 ' . $item['department_name'] . ' 不存在'];
                        $failed++;
                        continue;
                    }
                }

                // 准备数据
                $insertData = [
                    'name' => $item['name'],
                    'code' => $item['code'],
                    'phone' => $item['phone'],
                    'department_id' => $departmentId,
                    'position' => $item['position'] ?? 'engineer',
                    'email' => $item['email'] ?? null,
                    'entry_date' => $item['entry_date'] ?? null,
                    'status' => isset($item['status']) ? intval($item['status']) : 1,
                    'notes' => $item['notes'] ?? null,
                ];

                // 验证邮箱
                if (!empty($insertData['email']) && !filter_var($insertData['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors[] = ['row' => $rowNum, 'message' => '邮箱格式错误'];
                    $failed++;
                    continue;
                }

                // 验证岗位
                $validPositions = ['engineer', 'supervisor', 'manager'];
                if (!in_array($insertData['position'], $validPositions)) {
                    $insertData['position'] = 'engineer';
                }

                // 验证状态
                if (!in_array($insertData['status'], [0, 1])) {
                    $insertData['status'] = 1;
                }

                // 插入数据
                try {
                    Personnel::create($insertData);
                    $success++;
                } catch (\Exception $e) {
                    $errors[] = ['row' => $rowNum, 'message' => '插入失败：' . $e->getMessage()];
                    $failed++;
                }
            }

            // 删除临时文件
            @unlink($filepath);
            @rmdir($tempPath);

            return Result::success([
                'total' => count($data),
                'success' => $success,
                'failed' => $failed,
                'errors' => $errors,
            ], $failed === 0 ? '导入成功' : "导入完成，成功 {$success} 条，失败 {$failed} 条");
        } catch (\Exception $e) {
            return Result::error('导入失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 导出人员数据
     * GET /personnel/export
     */
    public function export()
    {
        try {
            // 获取筛选条件
            $keyword = request()->get('keyword', '');
            $departmentId = request()->get('department_id', '');
            $position = request()->get('position', '');
            $status = request()->get('status', '');

            $query = Personnel::with(['department']);

            if (!empty($keyword)) {
                $query->whereLike('name|phone|email', '%' . $keyword . '%');
            }
            if (!empty($departmentId)) {
                $query->where('department_id', $departmentId);
            }
            if (!empty($position)) {
                $query->where('position', $position);
            }
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $personnel = $query->order('id', 'desc')->select();

            // 准备数据
            $data = [];
            $positionMap = [
                'engineer' => '工程师',
                'supervisor' => '主管',
                'manager' => '经理',
            ];
            $statusMap = [
                1 => '在职',
                0 => '离职',
            ];

            foreach ($personnel as $p) {
                $data[] = [
                    'name' => $p->name,
                    'code' => $p->code,
                    'department_name' => $p->department ? $p->department->name : '',
                    'position' => $positionMap[$p->position] ?? $p->position,
                    'phone' => $p->phone,
                    'email' => $p->email ?? '',
                    'entry_date' => $p->entry_date ?? '',
                    'status' => $statusMap[$p->status] ?? ($p->status == 1 ? '在职' : '离职'),
                    'notes' => $p->notes ?? '',
                ];
            }

            // 创建 Excel 文件
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();

            // 表头
            $headers = ['姓名', '工号', '部门', '岗位', '手机号', '邮箱', '入职日期', '状态', '备注'];
            foreach ($headers as $index => $header) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
                $worksheet->setCellValue($column . '1', $header);
            }

            // 数据
            foreach ($data as $index => $row) {
                $rowNum = $index + 2;
                foreach ($row as $colIndex => $value) {
                    $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                    $worksheet->setCellValue($column . $rowNum, $value);
                }
            }

            // 设置列宽
            $worksheet->getColumnDimension('A')->setWidth(15);
            $worksheet->getColumnDimension('B')->setWidth(15);
            $worksheet->getColumnDimension('C')->setWidth(20);
            $worksheet->getColumnDimension('D')->setWidth(12);
            $worksheet->getColumnDimension('E')->setWidth(15);
            $worksheet->getColumnDimension('F')->setWidth(25);
            $worksheet->getColumnDimension('G')->setWidth(15);
            $worksheet->getColumnDimension('H')->setWidth(12);
            $worksheet->getColumnDimension('I')->setWidth(30);

            // 输出文件
            $filename = '人员数据_' . date('YmdHis') . '.xlsx';

            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: max-age=0');

            $writer = \PhpOffice\PhpSpreadsheet\Writer\IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save('php://output');
            exit;
        } catch (\Exception $e) {
            return Result::error('导出失败：' . $e->getMessage(), 500);
        }
    }
}
