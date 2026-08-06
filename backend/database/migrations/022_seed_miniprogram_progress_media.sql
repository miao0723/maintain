-- =============================================
-- 插入小程序进度照片和视频测试数据
-- =============================================

USE repair;

-- =============================================
-- 确保有测试订单数据
-- =============================================

-- 检查并插入测试用户（如果没有）
INSERT IGNORE INTO users (id, nickname) VALUES (10, '测试维修员1');
INSERT IGNORE INTO users (id, nickname) VALUES (11, '测试维修员2');
INSERT IGNORE INTO users (id, nickname) VALUES (1, '测试客户');

-- 获取或创建测试订单
-- 注意：这里假设 orders 表已存在且有测试数据
-- 如果没有，请先创建测试订单

-- =============================================
-- 插入进度照片测试数据
-- =============================================

-- 订单号 202601220001 的进度照片
INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '设备开箱检查，确认设备型号和外观',
'["/uploads/progress/1-1.jpg","/uploads/progress/1-2.jpg","/uploads/progress/1-3.jpg"]',
10, '张工', '2026-01-22 10:30:00');

INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '拆卸机箱，清理灰尘',
'["/uploads/progress/1-4.jpg","/uploads/progress/1-5.jpg"]',
10, '张工', '2026-01-22 11:15:00');

INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '更换电池，测试电池性能',
'["/uploads/progress/1-6.jpg","/uploads/progress/1-7.jpg","/uploads/progress/1-8.jpg"]',
10, '张工', '2026-01-22 14:20:00');

INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '重新组装设备，完成维修',
'["/uploads/progress/1-9.jpg","/uploads/progress/1-10.jpg"]',
11, '李工', '2026-01-22 16:30:00');

-- 订单号 202601220002 的进度照片
INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(2, '接单确认，准备维修工具',
'["/uploads/progress/2-1.jpg"]',
11, '李工', '2026-01-22 09:00:00');

INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(2, '屏幕拆卸中',
'["/uploads/progress/2-2.jpg","/uploads/progress/2-3.jpg"]',
11, '李工', '2026-01-22 10:30:00');

INSERT INTO order_progress_photos (order_id, description, images, uploaded_by, uploaded_by_name, created_at)
VALUES
(2, '更换新屏幕',
'["/uploads/progress/2-4.jpg","/uploads/progress/2-5.jpg","/uploads/progress/2-6.jpg"]',
11, '李工', '2026-01-22 13:45:00');

-- =============================================
-- 插入进度视频测试数据
-- =============================================

-- 订单号 202601220001 的进度视频
INSERT INTO order_progress_videos (order_id, video_title, description, video_url, cover_url, duration, file_size, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '设备开箱检查过程', '记录设备开箱检查的完整过程，确认设备型号和外观状况',
'/uploads/progress/video1.mp4', '/uploads/progress/cover1.jpg', 120, 15728640, 10, '张工', '2026-01-22 10:35:00');

INSERT INTO order_progress_videos (order_id, video_title, description, video_url, cover_url, duration, file_size, uploaded_by, uploaded_by_name, created_at)
VALUES
(1, '电池更换演示', '演示如何安全地拆卸和更换电池，以及更换后的测试过程',
'/uploads/progress/video2.mp4', '/uploads/progress/cover2.jpg', 300, 41943040, 10, '张工', '2026-01-22 14:25:00');

-- 订单号 202601220002 的进度视频
INSERT INTO order_progress_videos (order_id, video_title, description, video_url, cover_url, duration, file_size, uploaded_by, uploaded_by_name, created_at)
VALUES
(2, '屏幕更换操作', '详细记录屏幕更换的每一个步骤，包括拆卸、清理、安装新屏、测试等',
'/uploads/progress/video3.mp4', '/uploads/progress/cover3.jpg', 480, 62914560, 11, '李工', '2026-01-22 13:50:00');

-- =============================================
-- 插入同步日志（可选）
-- =============================================

INSERT INTO cmms_sync_log (order_id, sync_type, cmms_order_id, sync_status, synced_at)
VALUES
(1, 'photo', 1, 'success', '2026-01-22 10:35:00'),
(1, 'photo', 1, 'success', '2026-01-22 11:20:00'),
(1, 'photo', 1, 'success', '2026-01-22 14:25:00'),
(1, 'photo', 1, 'success', '2026-01-22 16:35:00'),
(1, 'video', 1, 'success', '2026-01-22 10:40:00'),
(1, 'video', 1, 'success', '2026-01-22 14:30:00'),
(2, 'photo', 2, 'success', '2026-01-22 09:05:00'),
(2, 'photo', 2, 'success', '2026-01-22 10:35:00'),
(2, 'photo', 2, 'success', '2026-01-22 13:50:00'),
(2, 'video', 2, 'success', '2026-01-22 13:55:00');

-- =============================================
-- 查看插入结果
-- =============================================

SELECT '进度照片数据插入完成！' AS message;
SELECT COUNT(*) as photo_count FROM order_progress_photos;

SELECT '进度视频数据插入完成！' AS message;
SELECT COUNT(*) as video_count FROM order_progress_videos;

SELECT '同步日志数据插入完成！' AS message;
SELECT COUNT(*) as sync_log_count FROM cmms_sync_log;

-- =============================================
-- 显示每张订单的进度统计
-- =============================================

SELECT
    o.id as order_id,
    o.order_id as order_no,
    o.device_model,
    o.status,
    (SELECT COUNT(*) FROM order_progress_photos WHERE order_id = o.id) as photo_count,
    (SELECT COUNT(*) FROM order_progress_videos WHERE order_id = o.id) as video_count
FROM orders o
WHERE o.id IN (1, 2)
ORDER BY o.id;
