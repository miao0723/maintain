-- MySQL 容器首次启动时自动执行（仅在数据卷为空时生效）
-- 创建后台管理系统与小程序两套业务库，并统一授权

CREATE DATABASE IF NOT EXISTS `cmms_db`
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `repair`
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 应用账号可访问两个库
GRANT ALL PRIVILEGES ON `cmms_db`.* TO 'cmms_user'@'%';
GRANT ALL PRIVILEGES ON `repair`.*  TO 'cmms_user'@'%';

FLUSH PRIVILEGES;
