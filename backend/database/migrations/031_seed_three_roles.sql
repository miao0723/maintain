-- ============================================================
-- 三角色 + 权限授权种子
--  boss     老板：全部数据与系统配置权限（等同超管，直接放行）
--  repairer 维修人员：维修相关业务模块读写
--  staff    其他人员：仅登录 + 无关只读，禁止人事/维修/配置
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) 三角色（code 唯一，幂等）
INSERT INTO roles (name, code, description, status) VALUES
('老板', 'boss', '全部数据与系统配置权限', 1),
('维修人员', 'repairer', '维修相关业务模块读写权限', 1),
('其他人员', 'staff', '仅可登录并访问无关只读页面，禁止访问人事/维修/配置类功能', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), status = 1;

-- 2) 通配权限码（供角色授权引用；code 唯一，幂等）
INSERT INTO permissions (parent_id, name, code, type, sort, status) VALUES
(NULL, '维修业务全部', 'repair.*', 'button', 100, 1),
(NULL, '进销存全部', 'inventory.*', 'button', 101, 1),
(NULL, '统计全部', 'statistics.*', 'button', 102, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 1;

-- 3) 维修人员授权：维修 + 进销存 + 统计（读写）
SET @repairer = (SELECT id FROM roles WHERE code = 'repairer');
DELETE FROM role_permissions WHERE role_id = @repairer;
INSERT INTO role_permissions (role_id, permission_id, permissions, created_at)
SELECT @repairer, p.id, JSON_OBJECT('canView', true, 'canEdit', true, 'canDelete', true), NOW()
FROM permissions p WHERE p.code IN ('repair.*', 'inventory.*', 'statistics.*');

-- 4) 老板授权：全量（虽然后端 bypass，仍落库便于菜单/审计）
SET @boss = (SELECT id FROM roles WHERE code = 'boss');
DELETE FROM role_permissions WHERE role_id = @boss;
INSERT INTO role_permissions (role_id, permission_id, permissions, created_at)
SELECT @boss, p.id, JSON_OBJECT('canView', true, 'canEdit', true, 'canDelete', true), NOW()
FROM permissions p WHERE p.status = 1;

-- 5) 其他人员：不授予任何敏感权限（默认规则已允许其读未映射资源）
SET @staff = (SELECT id FROM roles WHERE code = 'staff');
DELETE FROM role_permissions WHERE role_id = @staff;

-- 6) 用户角色绑定（role_id 主角色）
--    admin(id=2) -> boss；wanggang(id=6, 维修工人) -> repairer
UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 'boss') WHERE id IN (1, 2);
UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 'repairer') WHERE id = 6;

SET FOREIGN_KEY_CHECKS = 1;
