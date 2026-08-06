# 小程序数据同步使用文档

## 功能概述

本功能实现了小程序数据库与CMMS后台管理系统之间的数据同步，将小程序的维修进度、进度照片、进度视频自动同步到CMMS后台。

## 数据库表结构

### 小程序数据库 (repair)

#### 订单表 (orders)
```sql
orders 表字段:
- id: 订单ID
- order_id: 订单号
- progress: 维修进度 (0-100)
- status: 订单状态 (pending/processing/completed/review/cancelled)
- assigned_to: 分配的维修人员ID
- assigned_at: 分配时间
- problem_description: 问题描述
```

#### 进度照片表 (order_progress_photos)
```sql
order_progress_photos 表字段:
- id: 主键ID
- order_id: 订单ID
- description: 照片说明
- images: 图片JSON数组
- uploaded_by: 上传人ID
- uploaded_by_name: 上传人姓名
- created_at: 创建时间
- updated_at: 更新时间
```

#### 进度视频表 (order_progress_videos)
```sql
order_progress_videos 表字段:
- id: 主键ID
- order_id: 订单ID
- video_title: 视频标题
- description: 视频说明
- video_url: 视频URL
- cover_url: 封面URL
- duration: 视频时长(秒)
- file_size: 文件大小(字节)
- uploaded_by: 上传人ID
- uploaded_by_name: 上传人姓名
- created_at: 创建时间
- updated_at: 更新时间
```

### CMMS后台数据库 (cmms_db)

#### 维修进度表 (repair_progress)
```sql
repair_progress 表字段:
- id: 主键ID
- order_id: CMMS订单ID
- stage: 阶段标识
- stage_name: 阶段名称
- status: 状态 (pending/incompleted/completed)
- progress: 进度百分比
- description: 阶段描述
- handler_id: 处理人ID
- handler_name: 处理人姓名
- start_time: 开始时间
- end_time: 结束时间
- attachments: 附件(JSON)
- images: 图片(JSON)
- remark: 备注
- source: 数据来源 (miniprogram/cmms)
- created_at: 创建时间
- updated_at: 更新时间
```

#### 进度照片表 (progress_photo)
```sql
progress_photo 表字段:
- id: 主键ID
- order_id: CMMS订单ID
- description: 照片说明
- images: 图片JSON数组
- uploaded_by: 上传人ID
- uploaded_by_name: 上传人姓名
- created_at: 创建时间
- updated_at: 更新时间
```

#### 进度视频表 (progress_video)
```sql
progress_video 表字段:
- id: 主键ID
- order_id: CMMS订单ID
- video_title: 视频标题
- description: 视频说明
- video_url: 视频URL
- cover_url: 封面URL
- duration: 视频时长(秒)
- file_size: 文件大小(字节)
- uploaded_by: 上传人ID
- uploaded_by_name: 上传人姓名
- created_at: 创建时间
- updated_at: 更新时间
```

#### 订单映射表 (miniprogram_order_mapping)
```sql
miniprogram_order_mapping 表字段:
- id: 主键ID
- miniprogram_order_id: 小程序订单ID
- miniprogram_order_no: 小程序订单号
- cmms_order_id: CMMS订单ID
- sync_status: 同步状态
- last_synced_at: 最后同步时间
- created_at: 创建时间
- updated_at: 更新时间
```

## 同步控制器

### 控制器类

**文件路径**: `backend/app/controller/MiniprogramDataSyncController.php`

**功能方法**:

1. `syncProgress()` - 同步维修进度
   - 从小程序数据库获取有进度的订单
   - 根据进度值确定阶段和状态
   - 创建或更新CMMS维修进度记录

2. `syncProgressPhotos()` - 同步进度照片
   - 从小程序数据库获取所有进度照片
   - 同步到CMMS进度照片表
   - 保留原始上传人和时间信息

3. `syncProgressVideos()` - 同步进度视频
   - 从小程序数据库获取所有进度视频
   - 同步到CMMS进度视频表
   - 保留原始元数据信息

4. `syncAll()` - 同步所有数据
   - 依次调用上述三个方法
   - 返回汇总结果

### API路由

**路由前缀**: `/api/miniprogram-sync`

**可用路由**:

- `POST /api/miniprogram-sync/progress` - 同步维修进度
- `POST /api/miniprogram-sync/photos` - 同步进度照片
- `POST /api/miniprogram-sync/videos` - 同步进度视频
- `POST /api/miniprogram-sync/all` - 同步所有数据

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**响应示例**:
```json
{
  "code": 200,
  "message": "同步完成：成功 10 条，失败 0 条",
  "data": {
    "total": 10,
    "synced": 10,
    "failed": 0,
    "errors": []
  }
}
```

## 命令行同步脚本

### 脚本位置

**文件路径**: `backend/scripts/sync_miniprogram_data.php`

### 使用方法

#### 1. 同步所有数据
```bash
cd backend
php scripts/sync_miniprogram_data.php
```

#### 2. 只同步维修进度
```bash
php scripts/sync_miniprogram_data.php --type=progress
```

#### 3. 只同步进度照片
```bash
php scripts/sync_miniprogram_data.php --type=photos
```

#### 4. 只同步进度视频
```bash
php scripts/sync_miniprogram_data.php --type=videos
```

#### 5. 显示帮助信息
```bash
php scripts/sync_miniprogram_data.php --help
```

### 脚本输出示例

```
========================================
小程序数据同步
同步类型: ALL
开始时间: 2026-05-22 14:30:00
========================================

[1/3] 开始同步维修进度...
  ✓ 订单 WX123456789 进度 50% 同步成功
  ✓ 订单 WX123456790 进度 80% 同步成功
维修进度同步完成

[2/3] 开始同步进度照片...
  ✓ 照片 ID 1 同步成功
  ✓ 照片 ID 2 同步成功
进度照片同步完成

[3/3] 开始同步进度视频...
  ✓ 视频 ID 1 同步成功
进度视频同步完成

========================================
同步完成！
结束时间: 2026-05-22 14:30:05
========================================

PROGRESS 同步结果:
  总记录数: 2
  成功: 2
  失败: 0

PHOTOS 同步结果:
  总记录数: 2
  成功: 2
  失败: 0

VIDEOS 同步结果:
  总记录数: 2
  成功: 1
  失败: 0
```

## 前端同步界面

### 访问路径

1. 登录CMMS后台管理系统
2. 导航到"维修业务" → "维修进度" → "数据同步"
3. 或直接访问: `http://your-domain/#/repair/progress/sync`

### 功能操作

1. **同步维修进度** - 仅同步订单进度信息
2. **同步进度照片** - 仅同步进度照片数据
3. **同步进度视频** - 仅同步进度视频数据
4. **同步全部数据** - 同步所有上述数据

### 同步统计

界面会显示每种数据类型的同步统计:
- 总记录数
- 成功数量
- 失败数量
- 错误详情

### 同步日志

实时显示同步日志，包括:
- 操作时间
- 操作类型（成功/错误/信息）
- 操作消息
- 详细错误信息（如有）

## 进度阶段映射

小程序进度值会自动映射到CMMS进度阶段：

| 小程序进度值 | CMMS阶段 | 状态 |
|------------|----------|------|
| 0%         | 接单确认 | pending |
| 1-19%      | 接单确认 | in_progress |
| 20-39%     | 故障诊断 | in_progress |
| 40-59%     | 配件准备 | in_progress |
| 60-79%     | 维修实施 | in_progress |
| 80-99%     | 测试验收 | in_progress |
| 100%        | 维修完成 | completed |

## 数据处理逻辑

### 1. 订单映射创建

- 自动在小程序订单和CMMS订单之间创建映射关系
- 如果CMMS订单不存在，会自动创建虚拟订单
- 映射存储在 `miniprogram_order_mapping` 表表

### 2. 去重处理

- 维修进度：按订单ID和阶段去重
- 进度照片：按上传人ID和创建时间去重
- 进度视频：按视频URL去重

### 3. 数据保留

- 保留原始的创建时间
- 保留原始的上传人信息
- 保留原始的图片/视频URL
- 只更新有变化的字段

## 部署说明

### 1. 后端部署

1. 确保控制器文件已部署:
   ```
   backend/app/controller/MiniprogramDataSyncController.php
   ```

2. 确保路由已注册:
   ```
   backend/route/app.php
   ```

3. 确保同步脚本可执行:
   ```bash
   chmod +x backend/scripts/sync_miniprogram_data.php
   ```

### 2. 前端部署

1. 确保数据同步页面已部署:
   ```
   frontend-web/src/views/repair/DataSync.vue
   ```

2. 确保路由已配置:
   ```
   frontend-web/src/router/index.js
   ```

3. 重新编译前端:
   ```bash
   cd frontend-web
   npm run build
   ```

## 定时同步设置

### 方法一：使用Cron定时任务

编辑crontab:
```bash
crontab -e
```

添加定时任务（每小时同步一次）:
```cron
0 * * * * cd /path/to/maintain/backend && php scripts/sync_miniprogram_data.php >> /var/log/miniprogram-sync.log 2>&1
```

### 方法二：使用系统计划任务（Windows）

创建批处理文件 `sync_miniprogram.bat`:
```batch
@echo off
cd /d D:\maintain\backend
php scripts/sync_miniprogram_data.php >> D:\maintain\logs\miniprogram-sync.log 2>&1
```

在任务计划程序中设置定时执行。

## 错误处理

### 常见错误

1. **数据库连接错误**
   - 检查 `backend/config/database.php` 中的数据库配置
   - 确认小程序数据库连接 `repair` 可用

2. **订单映射不存在**
   - 系统会自动创建映射
   - 检查 `miniprogram_order_mapping` 表表是否存在

3. **权限错误**
   - 确认用户有访问API的权限
   - 检查JWT Token是否有效

4. **字段不存在**
   - 检查小程序和CMMS数据库表结构是否正确
   - 执行相应的数据库迁移脚本

### 日志查看

**后端日志**:
```bash
tail -f backend/runtime/log/$(date +%Y%m%d).log
```

**同步脚本日志**:
```bash
tail -f /var/log/miniprogram-sync.log
```

## 性能优化建议

1. **批量处理**
   - 对于大量数据，可以分批次同步
   - 每次同步100-500条记录

2. **索引优化**
   - 确保相关表有适当的索引
   - 特别是订单ID映射表的索引

3. **异步处理**
   - 对于前端API调用，考虑使用队列异步处理
   - 避免长时间阻塞用户界面

## 安全建议

1. **API权限控制**
   - 同步API需要有效的JWT Token
   - 建议添加管理员权限验证

2. **数据验证**
   - 同步前验证数据完整性
   - 检查图片/视频URL是否可访问

3. **日志记录**
   - 记录所有同步操作
   - 包含操作人、时间、结果等信息

## 注意事项

1. **数据一致性**
   - 同步操作是幂等的，可以重复执行
   - 已存在的记录会被更新而不是重复插入

2. **时间同步**
   - 保留小程序的原始创建时间
   - 不要使用CMMS的当前时间覆盖

3. **文件路径**
   - 确保小程序和CMMS系统可以访问相同的文件存储
   - 或者使用CDN/云存储统一访问

## 联系支持

如有问题或建议，请联系技术支持团队。
