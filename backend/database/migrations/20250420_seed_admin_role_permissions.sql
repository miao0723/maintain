-- 管理员角色权限配置
-- 假设管理员角色ID为1（超级管理员），拥有所有权限

-- 删除管理员现有的权限配置
DELETE FROM `role_permissions` WHERE `role_id` = 1;

-- 为管理员分配所有权限，默认拥有完整的 view/edit/delete 权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`, `permissions`, `created_at`)
SELECT
    1 AS role_id,
    p.id AS permission_id,
    CASE
        WHEN p.type = 'menu' THEN JSON_OBJECT('canView', true, 'canEdit', false, 'canDelete', false)
        ELSE JSON_OBJECT('canView', true, 'canEdit', true, 'canDelete', true)
    END AS permissions,
    NOW() AS created_at
FROM `permissions` p
WHERE p.`status` = 1
ORDER BY p.id;
