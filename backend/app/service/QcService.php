<?php

namespace app\service;

use think\facade\Db;

/**
 * 质检中心服务
 *
 * 数据全部落在 repair 库（服务小程序回收业务）：
 * - 质检单关联 orders（回收单），定级结果 graded_condition 与小程序 device_condition 同语义
 * - 成色标准带价格系数，定级时联动回收估价建议
 * - 标准版本：发布即快照，历史版本只读可追溯
 *
 * 首次访问自动建表（幂等）。
 */
class QcService
{
    /** 建表（幂等） */
    public function ensureTables(): void
    {
        static $done = false;
        if ($done) {
            return;
        }
        $db = Db::connect('repair');
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_templates` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
                `device_type_id` INT NULL DEFAULT NULL COMMENT '适用设备类型(device_types.id)，空=通用',
                `description` VARCHAR(255) NULL DEFAULT NULL,
                `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检模板'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_items` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `template_id` INT NOT NULL,
                `name` VARCHAR(100) NOT NULL COMMENT '质检项名称，如：屏幕显示',
                `category` VARCHAR(50) NULL DEFAULT NULL COMMENT '分类：外观/屏幕/功能/电池等',
                `check_method` VARCHAR(50) NULL DEFAULT NULL COMMENT '检查方式：目测/功能测试/仪器检测',
                `scoring_type` VARCHAR(20) NOT NULL DEFAULT 'pass_fail' COMMENT '评分方式：pass_fail/score',
                `fault_options` JSON NULL COMMENT '可选故障标签(JSON数组)',
                `required` TINYINT NOT NULL DEFAULT 1 COMMENT '是否必检',
                `sort_order` INT NOT NULL DEFAULT 0,
                `status` TINYINT NOT NULL DEFAULT 1,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_items_template` (`template_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检项'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_grade_rules` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `template_id` INT NOT NULL,
                `grade_key` VARCHAR(20) NOT NULL COMMENT '成色键：good/normal/fair/poor(与小程序device_condition一致)',
                `grade_name` VARCHAR(50) NOT NULL COMMENT '成色名称，如：优',
                `min_score` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '分数区间下限(0-100)',
                `max_score` DECIMAL(5,2) NOT NULL DEFAULT 100 COMMENT '分数区间上限',
                `price_coefficient` DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT '回收价系数(0-1.5)',
                `fault_standard` VARCHAR(500) NULL DEFAULT NULL COMMENT '故障/成色判定标准描述',
                `sort_order` INT NOT NULL DEFAULT 0,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_grades_template` (`template_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成色/故障定级标准'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_standards` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `template_id` INT NOT NULL,
                `version_no` VARCHAR(20) NOT NULL COMMENT '版本号 V1/V2...',
                `snapshot` JSON NOT NULL COMMENT '标准快照(items+grades)',
                `changelog` VARCHAR(500) NULL DEFAULT NULL,
                `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active生效/archived归档',
                `published_at` DATETIME NULL DEFAULT NULL,
                `publisher_id` INT NULL DEFAULT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_standards_template` (`template_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检标准版本'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_orders` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `qc_no` VARCHAR(32) NOT NULL COMMENT '质检单号 QC+日期+序号',
                `order_id` INT NOT NULL COMMENT '关联 orders.id(回收单)',
                `template_id` INT NOT NULL,
                `standard_id` INT NULL DEFAULT NULL COMMENT '使用的标准版本快照',
                `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending待质检/in_progress质检中/graded已定级/review复核中/disputed争议中/completed已完成',
                `inspector_id` INT NULL DEFAULT NULL COMMENT '质检员(repair.users.id)',
                `grade_score` DECIMAL(5,2) NULL DEFAULT NULL COMMENT '总分(0-100)',
                `graded_condition` VARCHAR(20) NULL DEFAULT NULL COMMENT '定级成色 good/normal/fair/poor',
                `final_price` DECIMAL(10,2) NULL DEFAULT NULL COMMENT '质检后建议回收价',
                `grade_note` VARCHAR(500) NULL DEFAULT NULL COMMENT '定级说明',
                `started_at` DATETIME NULL DEFAULT NULL,
                `graded_at` DATETIME NULL DEFAULT NULL,
                `completed_at` DATETIME NULL DEFAULT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_qc_no` (`qc_no`),
                KEY `idx_qc_orders_order` (`order_id`),
                KEY `idx_qc_orders_status` (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检单'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_results` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `qc_order_id` INT NOT NULL,
                `qc_item_id` INT NOT NULL,
                `item_name` VARCHAR(100) NOT NULL COMMENT '质检项名称快照',
                `result` VARCHAR(20) NOT NULL COMMENT 'pass/fail 或分值',
                `fault_tag` VARCHAR(100) NULL DEFAULT NULL COMMENT '命中的故障标签',
                `fault_note` VARCHAR(500) NULL DEFAULT NULL COMMENT '故障描述',
                `deduction` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '扣分',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_results_order` (`qc_order_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检项结果'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_media` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `qc_order_id` INT NOT NULL,
                `type` VARCHAR(10) NOT NULL DEFAULT 'image' COMMENT 'image/video',
                `url` VARCHAR(500) NOT NULL,
                `note` VARCHAR(255) NULL DEFAULT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_media_order` (`qc_order_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检图片/视频'"
        );
        $db->execute(
            "CREATE TABLE IF NOT EXISTS `qc_reviews` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `qc_order_id` INT NOT NULL,
                `type` VARCHAR(20) NOT NULL DEFAULT 'review' COMMENT 'review复核/dispute争议',
                `reason` VARCHAR(500) NOT NULL COMMENT '发起原因(争议描述)',
                `status` VARCHAR(20) NOT NULL DEFAULT 'open' COMMENT 'open待处理/agreed同意/resolved已解决/rejected驳回',
                `handler_remark` VARCHAR(500) NULL DEFAULT NULL COMMENT '处理意见',
                `resolved_at` DATETIME NULL DEFAULT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_qc_reviews_order` (`qc_order_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检复核/争议'"
        );
        $done = true;
    }

    // ================================================================ 模板 / 质检项 / 成色标准

    public function templateList(array $params): array
    {
        $this->ensureTables();
        $page = max(1, (int)($params['page'] ?? 1));
        $limit = min(100, max(1, (int)($params['page_size'] ?? 15)));

        $query = Db::connect('repair')->name('qc_templates');
        $keyword = trim((string)($params['keyword'] ?? ''));
        if ($keyword !== '') {
            $query->whereLike('name', '%' . $keyword . '%');
        }
        if (isset($params['status']) && $params['status'] !== '') {
            $query->where('status', (int)$params['status']);
        }

        $total = (clone $query)->count();
        $list = $query->order('id', 'desc')->page($page, $limit)->select()->toArray();

        // 附加统计与当前生效版本
        foreach ($list as &$row) {
            $row['item_count'] = Db::connect('repair')->name('qc_items')
                ->where('template_id', $row['id'])->where('status', 1)->count();
            $row['grade_count'] = Db::connect('repair')->name('qc_grade_rules')
                ->where('template_id', $row['id'])->count();
            $row['current_version'] = Db::connect('repair')->name('qc_standards')
                ->where('template_id', $row['id'])->where('status', 'active')
                ->order('id', 'desc')->find();
            $row['order_count'] = Db::connect('repair')->name('qc_orders')
                ->where('template_id', $row['id'])->count();
        }

        return ['list' => $list, 'total' => $total, 'page' => $page, 'page_size' => $limit];
    }

    public function templateSave(array $data): array
    {
        $this->ensureTables();
        $name = trim((string)($data['name'] ?? ''));
        if ($name === '') {
            throw new \Exception('模板名称不能为空');
        }
        $id = Db::connect('repair')->name('qc_templates')->insertGetId([
            'name' => $name,
            'device_type_id' => !empty($data['device_type_id']) ? (int)$data['device_type_id'] : null,
            'description' => trim((string)($data['description'] ?? '')) ?: null,
            'status' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->templateDetail($id);
    }

    public function templateUpdate(int $id, array $data): array
    {
        $this->ensureTables();
        $tpl = Db::connect('repair')->name('qc_templates')->find($id);
        if (!$tpl) {
            throw new \Exception('模板不存在');
        }
        $update = ['updated_at' => date('Y-m-d H:i:s')];
        if (isset($data['name']) && trim((string)$data['name']) !== '') {
            $update['name'] = trim((string)$data['name']);
        }
        if (array_key_exists('device_type_id', $data)) {
            $update['device_type_id'] = !empty($data['device_type_id']) ? (int)$data['device_type_id'] : null;
        }
        if (array_key_exists('description', $data)) {
            $update['description'] = trim((string)$data['description']) ?: null;
        }
        if (isset($data['status'])) {
            $update['status'] = (int)$data['status'] ? 1 : 0;
        }
        Db::connect('repair')->name('qc_templates')->where('id', $id)->update($update);
        return $this->templateDetail($id);
    }

    public function templateDelete(int $id): void
    {
        $this->ensureTables();
        $used = Db::connect('repair')->name('qc_orders')->where('template_id', $id)->count();
        if ($used > 0) {
            throw new \Exception('该模板已有质检单使用，只能停用不能删除');
        }
        Db::connect('repair')->name('qc_templates')->delete($id);
        Db::connect('repair')->name('qc_items')->where('template_id', $id)->delete();
        Db::connect('repair')->name('qc_grade_rules')->where('template_id', $id)->delete();
    }

    /** 模板详情：含质检项、成色标准、版本历史 */
    public function templateDetail(int $id): array
    {
        $this->ensureTables();
        $tpl = Db::connect('repair')->name('qc_templates')->find($id);
        if (!$tpl) {
            throw new \Exception('模板不存在');
        }
        $tpl['items'] = Db::connect('repair')->name('qc_items')
            ->where('template_id', $id)->order('sort_order', 'asc')->order('id', 'asc')->select()->toArray();
        $tpl['grades'] = Db::connect('repair')->name('qc_grade_rules')
            ->where('template_id', $id)->order('sort_order', 'asc')->select()->toArray();
        $tpl['versions'] = Db::connect('repair')->name('qc_standards')
            ->where('template_id', $id)->order('id', 'desc')->select()->toArray();
        foreach ($tpl['items'] as &$item) {
            $item['fault_options'] = $this->decodeJsonArray($item['fault_options'] ?? null);
        }
        return $tpl;
    }

    public function itemSave(int $templateId, array $data): array
    {
        $this->ensureTables();
        $name = trim((string)($data['name'] ?? ''));
        if ($name === '') {
            throw new \Exception('质检项名称不能为空');
        }
        $id = Db::connect('repair')->name('qc_items')->insertGetId([
            'template_id' => $templateId,
            'name' => $name,
            'category' => trim((string)($data['category'] ?? '')) ?: null,
            'check_method' => trim((string)($data['check_method'] ?? '')) ?: null,
            'scoring_type' => in_array($data['scoring_type'] ?? 'pass_fail', ['pass_fail', 'score'], true) ? $data['scoring_type'] : 'pass_fail',
            'fault_options' => !empty($data['fault_options']) && is_array($data['fault_options'])
                ? json_encode(array_values($data['fault_options']), JSON_UNESCAPED_UNICODE) : null,
            'required' => !empty($data['required']) ? 1 : 0,
            'sort_order' => (int)($data['sort_order'] ?? 0),
            'status' => 1,
        ]);
        return Db::connect('repair')->name('qc_items')->find($id);
    }

    public function itemUpdate(int $id, array $data): array
    {
        $this->ensureTables();
        $item = Db::connect('repair')->name('qc_items')->find($id);
        if (!$item) {
            throw new \Exception('质检项不存在');
        }
        $update = [];
        foreach (['name', 'category', 'check_method'] as $field) {
            if (array_key_exists($field, $data)) {
                $update[$field] = trim((string)$data[$field]) ?: null;
            }
        }
        if (isset($data['scoring_type'])) {
            $update['scoring_type'] = in_array($data['scoring_type'], ['pass_fail', 'score'], true) ? $data['scoring_type'] : 'pass_fail';
        }
        if (array_key_exists('fault_options', $data)) {
            $update['fault_options'] = !empty($data['fault_options']) && is_array($data['fault_options'])
                ? json_encode(array_values($data['fault_options']), JSON_UNESCAPED_UNICODE) : null;
        }
        if (array_key_exists('required', $data)) {
            $update['required'] = !empty($data['required']) ? 1 : 0;
        }
        if (array_key_exists('sort_order', $data)) {
            $update['sort_order'] = (int)$data['sort_order'];
        }
        if (isset($data['status'])) {
            $update['status'] = (int)$data['status'] ? 1 : 0;
        }
        if ($update) {
            Db::connect('repair')->name('qc_items')->where('id', $id)->update($update);
        }
        return Db::connect('repair')->name('qc_items')->find($id);
    }

    public function itemDelete(int $id): void
    {
        $this->ensureTables();
        Db::connect('repair')->name('qc_items')->delete($id);
    }

    public function gradeSave(int $templateId, array $data): array
    {
        $this->ensureTables();
        $gradeKeys = ['good', 'normal', 'fair', 'poor'];
        $gradeKey = (string)($data['grade_key'] ?? '');
        if (!in_array($gradeKey, $gradeKeys, true)) {
            throw new \Exception('成色键必须为 good/normal/fair/poor');
        }
        $id = Db::connect('repair')->name('qc_grade_rules')->insertGetId([
            'template_id' => $templateId,
            'grade_key' => $gradeKey,
            'grade_name' => trim((string)($data['grade_name'] ?? $gradeKey)),
            'min_score' => (float)($data['min_score'] ?? 0),
            'max_score' => (float)($data['max_score'] ?? 100),
            'price_coefficient' => min(1.5, max(0, (float)($data['price_coefficient'] ?? 1))),
            'fault_standard' => trim((string)($data['fault_standard'] ?? '')) ?: null,
            'sort_order' => (int)($data['sort_order'] ?? 0),
        ]);
        return Db::connect('repair')->name('qc_grade_rules')->find($id);
    }

    public function gradeUpdate(int $id, array $data): array
    {
        $this->ensureTables();
        $rule = Db::connect('repair')->name('qc_grade_rules')->find($id);
        if (!$rule) {
            throw new \Exception('成色标准不存在');
        }
        $update = [];
        if (isset($data['grade_name'])) {
            $update['grade_name'] = trim((string)$data['grade_name']);
        }
        if (array_key_exists('min_score', $data)) {
            $update['min_score'] = (float)$data['min_score'];
        }
        if (array_key_exists('max_score', $data)) {
            $update['max_score'] = (float)$data['max_score'];
        }
        if (array_key_exists('price_coefficient', $data)) {
            $update['price_coefficient'] = min(1.5, max(0, (float)$data['price_coefficient']));
        }
        if (array_key_exists('fault_standard', $data)) {
            $update['fault_standard'] = trim((string)$data['fault_standard']) ?: null;
        }
        if (array_key_exists('sort_order', $data)) {
            $update['sort_order'] = (int)$data['sort_order'];
        }
        if ($update) {
            Db::connect('repair')->name('qc_grade_rules')->where('id', $id)->update($update);
        }
        return Db::connect('repair')->name('qc_grade_rules')->find($id);
    }

    public function gradeDelete(int $id): void
    {
        $this->ensureTables();
        Db::connect('repair')->name('qc_grade_rules')->delete($id);
    }

    /** 发布新版本：快照当前 items+grades，旧版本归档 */
    public function publishVersion(int $templateId, string $changelog, ?int $publisherId): array
    {
        $this->ensureTables();
        $tpl = Db::connect('repair')->name('qc_templates')->find($templateId);
        if (!$tpl) {
            throw new \Exception('模板不存在');
        }
        $items = Db::connect('repair')->name('qc_items')
            ->where('template_id', $templateId)->where('status', 1)
            ->order('sort_order', 'asc')->select()->toArray();
        $grades = Db::connect('repair')->name('qc_grade_rules')
            ->where('template_id', $templateId)->order('sort_order', 'asc')->select()->toArray();
        if (empty($items) || empty($grades)) {
            throw new \Exception('模板缺少质检项或成色标准，无法发布');
        }

        $count = Db::connect('repair')->name('qc_standards')->where('template_id', $templateId)->count();
        $versionNo = 'V' . ($count + 1);

        Db::connect('repair')->name('qc_standards')->where('template_id', $templateId)
            ->where('status', 'active')->update(['status' => 'archived']);

        $snapshot = [
            'template_name' => $tpl['name'],
            'items' => $items,
            'grades' => $grades,
        ];
        $id = Db::connect('repair')->name('qc_standards')->insertGetId([
            'template_id' => $templateId,
            'version_no' => $versionNo,
            'snapshot' => json_encode($snapshot, JSON_UNESCAPED_UNICODE),
            'changelog' => $changelog ?: null,
            'status' => 'active',
            'published_at' => date('Y-m-d H:i:s'),
            'publisher_id' => $publisherId,
        ]);
        return Db::connect('repair')->name('qc_standards')->find($id);
    }

    // ================================================================ 质检单

    public function orderList(array $params): array
    {
        $this->ensureTables();
        $page = max(1, (int)($params['page'] ?? 1));
        $limit = min(100, max(1, (int)($params['page_size'] ?? 15)));

        $query = Db::connect('repair')
            ->name('qc_orders')->alias('q')
            ->leftJoin('orders o', 'q.order_id = o.id')
            ->leftJoin('users u', 'o.user_id = u.id')
            ->leftJoin('qc_templates t', 'q.template_id = t.id')
            ->field('q.*, o.order_id AS order_no, o.order_type, o.device_model, o.device_condition,
                o.estimated_price, o.actual_price, o.status AS biz_order_status,
                u.nickname AS user_name, u.phone AS user_phone, t.name AS template_name');

        $keyword = trim((string)($params['keyword'] ?? ''));
        if ($keyword !== '') {
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('q.qc_no', '%' . $keyword . '%')
                    ->whereOr('o.order_id', 'like', '%' . $keyword . '%')
                    ->whereOr('o.device_model', 'like', '%' . $keyword . '%');
            });
        }
        if (!empty($params['status'])) {
            $query->where('q.status', (string)$params['status']);
        }
        if (!empty($params['graded_condition'])) {
            $query->where('q.graded_condition', (string)$params['graded_condition']);
        }
        if (!empty($params['start_date'])) {
            $query->where('q.created_at', '>=', $params['start_date']);
        }
        if (!empty($params['end_date'])) {
            $query->where('q.created_at', '<=', $params['end_date'] . ' 23:59:59');
        }

        $total = (clone $query)->count();
        $list = $query->order('q.id', 'desc')->page($page, $limit)->select()->toArray();

        $summary = [
            'pending' => Db::connect('repair')->name('qc_orders')->where('status', 'pending')->count(),
            'in_progress' => Db::connect('repair')->name('qc_orders')->where('status', 'in_progress')->count(),
            'graded' => Db::connect('repair')->name('qc_orders')->where('status', 'in_progress')->count(),
            'review' => Db::connect('repair')->name('qc_orders')->where('status', 'review')->count(),
            'disputed' => Db::connect('repair')->name('qc_orders')->where('status', 'disputed')->count(),
        ];

        return ['list' => $list, 'total' => $total, 'page' => $page, 'page_size' => $limit, 'summary' => $summary];
    }

    /** 创建质检单：从（回收）订单发起 */
    public function orderCreate(array $data, ?int $userId): array
    {
        $this->ensureTables();
        $orderId = (int)($data['order_id'] ?? 0);
        $templateId = (int)($data['template_id'] ?? 0);
        if ($orderId <= 0 || $templateId <= 0) {
            throw new \Exception('订单和质检模板不能为空');
        }
        $order = Db::connect('repair')->name('orders')->find($orderId);
        if (!$order) {
            throw new \Exception('订单不存在');
        }
        $tpl = Db::connect('repair')->name('qc_templates')->where('id', $templateId)->where('status', 1)->find();
        if (!$tpl) {
            throw new \Exception('质检模板不存在或已停用');
        }
        $exists = Db::connect('repair')->name('qc_orders')
            ->where('order_id', $orderId)
            ->whereNotIn('status', ['completed', 'disputed'])
            ->count();
        if ($exists > 0) {
            throw new \Exception('该订单已有进行中的质检单');
        }
        $standard = Db::connect('repair')->name('qc_standards')
            ->where('template_id', $templateId)->where('status', 'active')
            ->order('id', 'desc')->find();

        $qcNo = 'QC' . date('YmdHis') . sprintf('%03d', random_int(1, 999));
        $id = Db::connect('repair')->name('qc_orders')->insertGetId([
            'qc_no' => $qcNo,
            'order_id' => $orderId,
            'template_id' => $templateId,
            'standard_id' => $standard['id'] ?? null,
            'status' => 'pending',
            'inspector_id' => $userId,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->orderDetail($id);
    }

    /** 详情：标准快照 + 逐项结果 + 媒体 + 复核记录 */
    public function orderDetail(int $id): array
    {
        $this->ensureTables();
        $qc = Db::connect('repair')
            ->name('qc_orders')->alias('q')
            ->leftJoin('orders o', 'q.order_id = o.id')
            ->leftJoin('users u', 'o.user_id = u.id')
            ->leftJoin('qc_templates t', 'q.template_id = t.id')
            ->leftJoin('users iu', 'q.inspector_id = iu.id')
            ->field('q.*, o.order_id AS order_no, o.order_type, o.device_model, o.brand_name,
                o.device_condition, o.problem_description, o.images AS order_images,
                o.estimated_price, o.actual_price, o.status AS biz_order_status,
                u.nickname AS user_name, u.phone AS user_phone,
                t.name AS template_name, iu.nickname AS inspector_name')
            ->where('q.id', $id)
            ->find();
        if (!$qc) {
            throw new \Exception('质检单不存在');
        }

        $standard = null;
        if (!empty($qc['standard_id'])) {
            $std = Db::connect('repair')->name('qc_standards')->find($qc['standard_id']);
            if ($std) {
                $snapshot = json_decode((string)$std['snapshot'], true) ?: [];
                $standard = [
                    'id' => $std['id'],
                    'version_no' => $std['version_no'],
                    'published_at' => $std['published_at'],
                    'items' => $snapshot['items'] ?? [],
                    'grades' => $snapshot['grades'] ?? [],
                ];
            }
        }

        $results = Db::connect('repair')->name('qc_results')->where('qc_order_id', $id)->select()->toArray();
        $media = Db::connect('repair')->name('qc_media')->where('qc_order_id', $id)->order('id', 'desc')->select()->toArray();
        $reviews = Db::connect('repair')->name('qc_reviews')->where('qc_order_id', $id)->order('id', 'desc')->select()->toArray();

        return [
            'qc' => $qc,
            'standard' => $standard,
            'results' => $results,
            'media' => $media,
            'reviews' => $reviews,
        ];
    }

    public function orderStart(int $id): array
    {
        $this->ensureTables();
        $qc = $this->mustFindQc($id);
        if (!in_array($qc['status'], ['pending'], true)) {
            throw new \Exception('仅待质检状态可开始');
        }
        Db::connect('repair')->name('qc_orders')->where('id', $id)->update([
            'status' => 'in_progress',
            'started_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->orderDetail($id);
    }

    /**
     * 提交定级：逐项结果 + 总分 + 成色 + 建议回收价
     * 返回值含价格建议（基准价 × 成色系数）供前端预填
     */
    public function orderGrade(int $id, array $data): array
    {
        $this->ensureTables();
        $qc = $this->mustFindQc($id);
        if (!in_array($qc['status'], ['in_progress', 'graded', 'review', 'disputed'], true)) {
            throw new \Exception('请先开始质检再定级');
        }

        $results = $data['results'] ?? [];
        if (!is_array($results) || empty($results)) {
            throw new \Exception('质检项结果不能为空');
        }

        $gradedCondition = (string)($data['graded_condition'] ?? '');
        if (!in_array($gradedCondition, ['good', 'normal', 'fair', 'poor'], true)) {
            throw new \Exception('定级成色必须为 good/normal/fair/poor');
        }

        Db::connect('repair')->startTrans();
        try {
            Db::connect('repair')->name('qc_results')->where('qc_order_id', $id)->delete();
            foreach ($results as $r) {
                $itemId = (int)($r['qc_item_id'] ?? 0);
                $itemName = trim((string)($r['item_name'] ?? ''));
                if ($itemId <= 0 || $itemName === '') {
                    continue;
                }
                Db::connect('repair')->name('qc_results')->insert([
                    'qc_order_id' => $id,
                    'qc_item_id' => $itemId,
                    'item_name' => $itemName,
                    'result' => (string)($r['result'] ?? ''),
                    'fault_tag' => trim((string)($r['fault_tag'] ?? '')) ?: null,
                    'fault_note' => trim((string)($r['fault_note'] ?? '')) ?: null,
                    'deduction' => (float)($r['deduction'] ?? 0),
                ]);
            }

            Db::connect('repair')->name('qc_orders')->where('id', $id)->update([
                'status' => 'graded',
                'grade_score' => min(100, max(0, (float)($data['grade_score'] ?? 0))),
                'graded_condition' => $gradedCondition,
                'final_price' => !empty($data['final_price']) ? round((float)$data['final_price'], 2) : null,
                'grade_note' => trim((string)($data['grade_note'] ?? '')) ?: null,
                'graded_at' => date('Y-m-d H:i:s'),
            ]);
            Db::connect('repair')->commit();
        } catch (\Exception $e) {
            Db::connect('repair')->rollback();
            throw $e;
        }
        return $this->orderDetail($id);
    }

    /** 价格建议：基准价(订单预估/实际价) × 成色系数 */
    public function priceSuggestion(int $id, string $gradeKey): array
    {
        $this->ensureTables();
        $qc = $this->mustFindQc($id);
        $rule = null;
        if (!empty($qc['standard_id'])) {
            $std = Db::connect('repair')->name('qc_standards')->find($qc['standard_id']);
            $snapshot = json_decode((string)($std['snapshot'] ?? ''), true) ?: [];
            foreach ($snapshot['grades'] ?? [] as $g) {
                if ($g['grade_key'] === $gradeKey) {
                    $rule = $g;
                    break;
                }
            }
        }
        if (!$rule) {
            throw new \Exception('当前标准里没有该成色档位');
        }
        $order = Db::connect('repair')->name('orders')->find($qc['order_id']);
        $basePrice = (float)($order['actual_price'] ?: $order['estimated_price'] ?: 0);
        return [
            'base_price' => $basePrice,
            'coefficient' => (float)$rule['price_coefficient'],
            'suggested_price' => round($basePrice * (float)$rule['price_coefficient'], 2),
            'grade_name' => $rule['grade_name'],
        ];
    }

    public function orderComplete(int $id): array
    {
        $this->ensureTables();
        $qc = $this->mustFindQc($id);
        if ($qc['status'] !== 'graded' && $qc['status'] !== 'review') {
            throw new \Exception('仅已定级/复核完成的质检单可完结');
        }
        Db::connect('repair')->name('qc_orders')->where('id', $id)->update([
            'status' => 'completed',
            'completed_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->orderDetail($id);
    }

    // ================================================================ 媒体 / 复核 / 报告

    public function mediaSave(int $qcOrderId, array $data): array
    {
        $this->ensureTables();
        $this->mustFindQc($qcOrderId);
        $url = trim((string)($data['url'] ?? ''));
        if ($url === '') {
            throw new \Exception('媒体地址不能为空');
        }
        $id = Db::connect('repair')->name('qc_media')->insertGetId([
            'qc_order_id' => $qcOrderId,
            'type' => ($data['type'] ?? 'image') === 'video' ? 'video' : 'image',
            'url' => $url,
            'note' => trim((string)($data['note'] ?? '')) ?: null,
        ]);
        return Db::connect('repair')->name('qc_media')->find($id);
    }

    public function mediaDelete(int $mediaId): void
    {
        $this->ensureTables();
        Db::connect('repair')->name('qc_media')->delete($mediaId);
    }

    /** 发起复核/争议：质检单进入 review/disputed */
    public function reviewSave(int $qcOrderId, array $data): array
    {
        $this->ensureTables();
        $qc = $this->mustFindQc($qcOrderId);
        if (!in_array($qc['status'], ['graded', 'review', 'disputed'], true)) {
            throw new \Exception('仅已定级的质检单可发起复核/争议');
        }
        $type = ($data['type'] ?? 'review') === 'dispute' ? 'dispute' : 'review';
        $reason = trim((string)($data['reason'] ?? ''));
        if ($reason === '') {
            throw new \Exception('请填写发起原因');
        }
        $id = Db::connect('repair')->name('qc_reviews')->insertGetId([
            'qc_order_id' => $qcOrderId,
            'type' => $type,
            'reason' => $reason,
            'status' => 'open',
        ]);
        Db::connect('repair')->name('qc_orders')->where('id', $qcOrderId)->update([
            'status' => $type === 'dispute' ? 'disputed' : 'review',
        ]);
        return Db::connect('repair')->name('qc_reviews')->find($id);
    }

    /** 处理复核/争议：同意则回 graded（可重新定级），驳回维持 */
    public function reviewResolve(int $reviewId, array $data): array
    {
        $this->ensureTables();
        $review = Db::connect('repair')->name('qc_reviews')->find($reviewId);
        if (!$review) {
            throw new \Exception('复核记录不存在');
        }
        if ($review['status'] !== 'open') {
            throw new \Exception('该记录已处理');
        }
        $status = (string)($data['status'] ?? '');
        if (!in_array($status, ['agreed', 'rejected', 'resolved'], true)) {
            throw new \Exception('处理结果必须为 agreed/rejected/resolved');
        }
        Db::connect('repair')->name('qc_reviews')->where('id', $reviewId)->update([
            'status' => $status,
            'handler_remark' => trim((string)($data['handler_remark'] ?? '')) ?: null,
            'resolved_at' => date('Y-m-d H:i:s'),
        ]);
        // 同意复核 → 质检单回到已定级可重新提交；争议解决 → completed
        if ($status === 'agreed') {
            Db::connect('repair')->name('qc_orders')->where('id', $review['qc_order_id'])->update(['status' => 'graded']);
        } elseif ($status === 'resolved') {
            Db::connect('repair')->name('qc_orders')->where('id', $review['qc_order_id'])->update([
                'status' => 'completed',
                'completed_at' => date('Y-m-d H:i:s'),
            ]);
        }
        return $this->orderDetail($review['qc_order_id']);
    }

    /** 质检报告：聚合数据（前端详情页直接渲染/打印） */
    public function report(int $id): array
    {
        $detail = $this->orderDetail($id);
        $detail['report_no'] = 'QR-' . $detail['qc']['qc_no'];
        $detail['generated_at'] = date('Y-m-d H:i:s');
        return $detail;
    }

    // ================================================================ 内部

    private function mustFindQc(int $id): array
    {
        $qc = Db::connect('repair')->name('qc_orders')->find($id);
        if (!$qc) {
            throw new \Exception('质检单不存在');
        }
        return $qc;
    }

    private function decodeJsonArray($raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }
        $decoded = json_decode((string)$raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
