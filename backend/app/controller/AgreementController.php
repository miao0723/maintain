<?php

namespace app\controller;

use app\model\Agreement;
use app\common\Result;
use think\facade\Db;

/**
 * 免责协议管理控制器
 */
class AgreementController
{
    protected function ensureAgreementsTable()
    {
        try {
            Db::query('SELECT 1 FROM `agreements` LIMIT 1');
            return;
        } catch (\Exception $e) {
        }

        Db::execute("CREATE TABLE IF NOT EXISTS `agreements` (
            `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
            `title` varchar(200) NOT NULL COMMENT '协议标题',
            `code` varchar(50) NOT NULL COMMENT '协议编码',
            `content` text COMMENT '协议内容 (HTML)',
            `version` varchar(20) DEFAULT '1.0' COMMENT '版本号',
            `status` tinyint(1) DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
            `effective_date` date DEFAULT NULL COMMENT '生效日期',
            `remark` text COMMENT '备注',
            `created_by` int(11) DEFAULT NULL COMMENT '创建人 ID',
            `updated_by` int(11) DEFAULT NULL COMMENT '更新人 ID',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
            PRIMARY KEY (`id`),
            UNIQUE KEY `uk_code` (`code`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='免责协议表';");

        Db::execute("INSERT INTO `agreements` (`title`, `code`, `content`, `version`, `status`, `effective_date`, `remark`)
            VALUES ('设备维修服务免责协议', 'repair_disclaimer',
            '<h2>设备维修服务免责协议</h2><h3>一、服务范围</h3><p>1. 本协议适用于本公司提供的所有设备维修服务。</p><p>2. 服务范围包括但不限于故障诊断、维修、保养、更换配件等。</p><h3>二、免责条款</h3><p>1. 因不可抗力因素（如自然灾害、战争、政府行为等）导致的设备损坏，本公司不承担责任。</p><p>2. 客户未按设备使用说明书操作导致的损坏，本公司不承担责任。</p><p>3. 维修过程中因设备自身老化、磨损等原因导致的二次损坏，本公司不承担责任。</p><h3>三、维修保证</h3><p>1. 本公司对维修部位提供 30 天的质量保证期。</p><p>2. 质量保证期内，因维修质量问题导致的故障，本公司免费重新维修。</p><h3>四、其他</h3><p>1. 本协议自客户签字确认之日起生效。</p><p>2. 本协议的最终解释权归本公司所有。</p>',
            '1.0', 1, '2024-01-01', '设备维修服务标准免责协议')
            ON DUPLICATE KEY UPDATE title=VALUES(title);");
    }

    /**
     * 获取协议信息
     * GET /business/agreement
     */
    public function index()
    {
        try {
            $this->ensureAgreementsTable();
            // 获取启用的协议
            $agreement = Agreement::where('status', 1)->order('id', 'desc')->find();

            if (!$agreement) {
                // 如果没有启用的协议，返回最新的协议
                $agreement = Agreement::order('id', 'desc')->find();
            }

            if (!$agreement) {
                return Result::success([
                    'title' => '设备维修服务免责协议',
                    'content' => '',
                    'version' => '1.0',
                    'status' => 0,
                    'effective_date' => null,
                    'updated_at' => null
                ]);
            }

            return Result::success([
                'id' => $agreement->id,
                'title' => $agreement->title,
                'code' => $agreement->code,
                'content' => $agreement->content,
                'version' => $agreement->version,
                'status' => $agreement->status,
                'effective_date' => $agreement->effective_date,
                'updated_at' => $agreement->updated_at,
                'updater' => $this->getUpdaterName($agreement->updated_by)
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取协议详情
     * GET /business/agreement/:id
     */
    public function read($id)
    {
        try {
            $this->ensureAgreementsTable();
            $agreement = Agreement::find($id);

            if (!$agreement) {
                return Result::error('协议不存在', 404);
            }

            return Result::success([
                'id' => $agreement->id,
                'title' => $agreement->title,
                'code' => $agreement->code,
                'content' => $agreement->content,
                'version' => $agreement->version,
                'status' => $agreement->status,
                'effective_date' => $agreement->effective_date,
                'remark' => $agreement->remark,
                'created_at' => $agreement->created_at,
                'updated_at' => $agreement->updated_at,
                'updater' => $this->getUpdaterName($agreement->updated_by)
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 保存协议
     * POST /business/agreement
     */
    public function save()
    {
        $data = request()->post();

        try {
            $this->ensureAgreementsTable();
            // 验证
            validate([
                'title' => 'require|max:200',
                'code' => 'require|max:50',
                'content' => 'require'
            ])->check($data);

            // 检查编码是否已存在
            $exists = Agreement::where('code', $data['code'])->find();
            if ($exists) {
                return Result::error('协议编码已存在', 422);
            }

            $agreement = Agreement::create([
                'title' => $data['title'],
                'code' => $data['code'],
                'content' => $data['content'],
                'version' => $data['version'] ?? '1.0',
                'status' => $data['status'] ?? 1,
                'effective_date' => $data['effective_date'] ?? null,
                'remark' => $data['remark'] ?? null,
                'created_by' => $this->getCurrentUserId(),
                'updated_by' => $this->getCurrentUserId()
            ]);

            return Result::success($agreement, '协议创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新协议
     * PUT /business/agreement/:id
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $this->ensureAgreementsTable();
            $agreement = Agreement::find($id);

            if (!$agreement) {
                return Result::error('协议不存在', 404);
            }

            // 验证
            validate([
                'title' => 'require|max:200',
                'content' => 'require'
            ])->check($data);

            $agreement->save([
                'title' => $data['title'] ?? $agreement->title,
                'content' => $data['content'] ?? $agreement->content,
                'version' => $data['version'] ?? $agreement->version,
                'status' => $data['status'] ?? $agreement->status,
                'effective_date' => $data['effective_date'] ?? $agreement->effective_date,
                'remark' => $data['remark'] ?? $agreement->remark,
                'updated_by' => $this->getCurrentUserId()
            ]);

            return Result::success($agreement, '协议更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 预览协议
     * GET /business/agreement/:id/preview
     */
    public function preview($id)
    {
        try {
            $this->ensureAgreementsTable();
            $agreement = Agreement::find($id);

            if (!$agreement) {
                return Result::error('协议不存在', 404);
            }

            return Result::success([
                'title' => $agreement->title,
                'content' => $agreement->content,
                'version' => $agreement->version,
                'effective_date' => $agreement->effective_date
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取当前用户 ID
     */
    protected function getCurrentUserId()
    {
        $user = request()->user ?? null;
        return $user ? $user['id'] : 1;
    }

    /**
     * 获取更新人名称
     */
    protected function getUpdaterName($userId)
    {
        if (!$userId) {
            return '';
        }

        $user = \app\model\User::find($userId);
        return $user ? ($user->real_name ?: $user->username) : '';
    }
}
