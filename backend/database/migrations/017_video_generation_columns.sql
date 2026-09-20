-- 017: 视频生成切换阿里云百炼（通义万相）所需的字段
-- 说明：generate_config/workflow_result/edit_config 三列此前仅存在于线上库（无迁移脚本），
--      本迁移一次性补齐仓库定义并新增异步任务跟踪字段；应用启动生成时会幂等自检（ensureColumns）。
ALTER TABLE `marketing_douyin_content`
    ADD COLUMN `generate_config` TEXT NULL COMMENT '生成参数（provider/prompt/尺寸/时长等）',
    ADD COLUMN `workflow_result` TEXT NULL COMMENT '生成服务原始返回（DashScope 任务结果）',
    ADD COLUMN `edit_config` TEXT NULL COMMENT '二次优化参数',
    ADD COLUMN `gen_task_id` VARCHAR(64) NULL COMMENT 'DashScope 异步任务ID',
    ADD COLUMN `gen_status` VARCHAR(20) NULL DEFAULT 'none' COMMENT '生成状态 none/running/succeeded/failed',
    ADD COLUMN `gen_error` VARCHAR(500) NULL COMMENT '生成失败原因';
