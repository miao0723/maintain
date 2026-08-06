-- =============================================
-- 合同模板表
-- =============================================

CREATE TABLE IF NOT EXISTS `contract_templates` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
    `name` varchar(200) NOT NULL COMMENT '模板名称',
    `type` varchar(50) NOT NULL DEFAULT 'repair_contract' COMMENT '模板类型：repair_contract维修合同 service_agreement服务协议 confidentiality保密协议',
    `description` varchar(500) DEFAULT NULL COMMENT '模板描述',
    `content` text NOT NULL COMMENT '模板内容（支持变量占位符）',
    `variables` json DEFAULT NULL COMMENT '可用变量列表',
    `custom_variables` json DEFAULT NULL COMMENT '自定义变量列表',
    `created_by` int(11) DEFAULT NULL COMMENT '创建人 ID',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_type` (`type`),
    KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同模板表';

-- 插入默认维修合同模板
INSERT INTO `contract_templates` (
    `name`,
    `type`,
    `description`,
    `content`,
    `variables`,
    `created_by`
) VALUES (
    '标准维修合同模板',
    'repair_contract',
    '标准维修服务合同模板，包含基本的服务条款',
    '维修服务合同

合同编号：{{contract_number}}
签订日期：{{sign_date}}

甲方（委托方）：{{customer_name}}
联系电话：{{customer_phone}}

乙方（服务方）：{{company_name}}
联系电话：{{company_phone}}
地址：{{company_address}}

一、服务内容
乙方为甲方提供以下维修服务：
{{service_content}}

机械类型：{{machine_type}}

二、服务期限
自 {{start_date}} 起至 {{end_date}} 止。

三、服务费用
合同总金额：人民币 {{annual_fee}} 元

四、服务承诺
1. 乙方承诺按照约定时间完成维修服务
2. 乙方保证维修质量，提供质保服务
3. 乙方承诺使用合格配件

五、违约责任
1. 甲方未按时支付费用的，应承担违约责任
2. 乙方未按时完成服务的，应承担相应责任

六、其他条款
本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（签字）：____________________
乙方（签字）：____________________

日期：{{sign_date}}',
    '[
        {"key": "contract_number", "label": "合同编号", "default": ""},
        {"key": "customer_name", "label": "客户名称", "default": ""},
        {"key": "customer_phone", "label": "客户电话", "default": ""},
        {"key": "machine_type", "label": "机械类型", "default": ""},
        {"key": "service_content", "label": "服务内容", "default": ""},
        {"key": "annual_fee", "label": "合同金额", "default": "0"},
        {"key": "start_date", "label": "开始日期", "default": ""},
        {"key": "end_date", "label": "结束日期", "default": ""},
        {"key": "sign_date", "label": "签订日期", "default": ""},
        {"key": "company_name", "label": "公司名称", "default": ""},
        {"key": "company_address", "label": "公司地址", "default": ""},
        {"key": "company_phone", "label": "公司电话", "default": ""}
    ]',
    1
) ON DUPLICATE KEY UPDATE name=VALUES(name);
