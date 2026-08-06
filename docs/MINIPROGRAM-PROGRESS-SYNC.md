# 小程序维修进度同步功能使用文档

## 功能概述

本功能实现了电子维修2.0小程序的维修进度、照片、视频与CMMS后台管理系统的数据同步。

## 数据架构

### 1. 数据库表结构

#### 小程序订单关联表 (miniprogram_order_mapping)
```sql
CREATE TABLE `miniprogram_order_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `miniprogram_order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `miniprogram_order_no` varchar(50) NOT NULL COMMENT '小程序订单号',
  `cmms_order_id` int(11) DEFAULT NULL COMMENT 'CMMS后台订单ID',
  `sync_status` enum('not_synced','synced','sync_failed') DEFAULT 'not_synced',
  `last_synced_at` datetime DEFAULT NULL,
  `sync_error` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mp_order_id` (`miniprogram_order_id`)
);
```

#### 小程序进度同步记录表 (miniprogram_progress_sync)
```sql
CREATE TABLE `miniprogram_progress_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `miniprogram_order_id` int(11) NOT NULL,
  `progress` int(11) NOT NULL DEFAULT 0 COMMENT '进度百分比(0-100)',
  `status` varchar(20) DEFAULT NULL COMMENT '订单状态',
  `synced_to_cmms` tinyint(1) DEFAULT 0,
  `synced_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

#### 小程序进度照片同步记录表 (miniprogram_progress_photo_sync)
```sql
CREATE TABLE `miniprogram_progress_photo_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `miniprogram_order_id` int(11) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `images` json DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_by_name` varchar(50) DEFAULT NULL,
  `synced_to_cmms` tinyint(1) DEFAULT 0,
  `cmms_progress_photo_id` int(11) DEFAULT NULL,
  `synced_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

#### 小程序进度视频同步记录表 (miniprogram_progress_video_sync)
```sql
CREATE TABLE `miniprogram_progress_video_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `miniprogram_order_id` int(11) NOT NULL,
  `video_title` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) NOT NULL,
  `cover_url` varchar(500) DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `file_size` bigint(20) DEFAULT 0,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_by_name` varchar(50) DEFAULT NULL,
  `synced_to_cmms` tinyint(1) DEFAULT 0,
  `cmms_progress_video_id` int(11) DEFAULT NULL,
  `synced_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

## API 接口说明

### 1. 同步维修进度到CMMS

**接口**: `POST /api/miniprogram-progress/sync`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "miniprogram_order_id": 1,
  "progress": 50,
  "status": "processing"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "进度同步成功",
  "data": {
    "miniprogram_order_id": 1,
    "cmms_order_id": 100,
    "progress": 50,
    "synced_at": "2026-05-22 10:30:00"
  }
}
```

### 2. 上传进度照片并同步到CMMS

**接口**: `POST /api/miniprogram-upload/photo`

**请求类型**: `multipart/form-data`

**请求参数**:
- `order_id`: 小程序订单ID (必填)
- `description`: 照片说明
- `images`: 图片文件 (支持多个)

**响应请求**:
```json
{
  "code": 200,
  "message": "照片上传并同步成功",
  "data": {
    "uploaded_urls": ["/uploads/miniprogram/progress_photos/xxx.jpg"],
    "sync_result": {...}
  }
}
```

### 3. 上传进度视频并同步到CMMS

**接口**: `POST /api/miniprogram-upload/video`

**请求类型**: `multipart/form-data`

**请求参数**:
- `order_id`: 小程序订单ID (必填)
- `video_title`: 视频标题 (必填)
- `description`: 视频说明
- `video`: 视频文件 (必填)
- `cover`: 封面图片 (可选)

**响应示例**:
```json
{
  "code": 200,
  "message": "视频上传并同步成功",
  "data": {
    "video_url": "/uploads/miniprogram/progress_videos/xxx.mp4",
    "cover_url": "/uploads/miniprogram/video_covers/xxx.jpg",
    "duration": 180,
    "file_size": 52428800,
    "sync_result": {...}
  }
}
```

### 4. 获取小程序订单的同步数据

**接口**: `GET /api/miniprogram-progress/{orderId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "miniprogram_order_id": 1,
    "cmms_order_id": 100,
    "progress": [...],
    "photos": [...],
    "videos": [...]
  }
}
```

## 小程序端集成

### 1. 引入工具文件

在小程序页面的JS文件中引入同步工具：

```javascript
const progressSync = require('../../utils/progressSync.js');
```

### 2. 同步维修进度

```javascript
// 当维修进度更新时，同步到CMMS
async function updateOrderProgress(orderId, progress, status) {
  try {
    const result = await progressSync.syncProgress(orderId, progress, status);
    console.log('进度同步成功', result);
    wx.showToast({ title: '进度同步成功', icon: 'success' });
  } catch (error) {
    console.error('进度同步失败', error);
    wx.showToast({ title: '同步失败', icon: 'none' });
  }
}

// 使用示例
updateOrderProgress(1, 75, 'processing');
```

### 3. 上传进度照片

```javascript
// 选择并上传照片
async function uploadProgressPhotos(orderId) {
  try {
    const result = await progressSync.chooseAndUploadPhotos(
      orderId,
      '维修进度照片',
      9  // 最多选择9张
    );
    console.log('照片上传成功', result);
    wx.showToast({ title: '照片上传成功', icon: 'success' });
  } catch (error) {
    console.error('照片上传失败', error);
    wx.showToast({ title: '上传失败', icon: 'none' });
  }
}

// 使用示例
uploadProgressPhotos(1);
```

### 4. 上传进度视频

```javascript
// 选择并上传视频
async function uploadProgressVideo(orderId) {
  try {
    const result = await progressSync.chooseAndUploadVideo(
      orderId,
      '维修过程视频',
      '记录维修全过程',
      60  // 最多60秒
    );
    console.log('视频上传成功', result);
    wx.showToast({ title: '视频上传成功', icon: 'success' });
  } catch (error) {
    console.error('视频上传失败', error);
    wx.showToast({ title: '上传失败', icon: 'none' });
  }
}

// 使用示例
uploadProgressVideo(1);
```

## 后台管理系统集成

### 1. 查看同步数据

在后台管理系统中，可以查看小程序同步的维修进度、照片和视频。

访问路径：
1. 在路由配置中添加新页面：`/repair/miniprogram-progress-sync`
2. 在菜单中添加入口

### 2. 组件使用

在前端Vue组件中使用：

```vue
<template>
  <div>
    <MiniprogramProgressSync />
  </div>
</template>

<script setup>
import MiniprogramProgressSync from '@/views/repair/MiniprogramProgressSync.vue';
</script>
```

## 部署步骤

### 1. 数据库迁移

执行迁移脚本创建同步表：

```bash
cd backend
mysql -u root -p cmms_db < database/migrations/017_miniprogram_progress_sync.sql
```

### 2. 配置更新

确保`backend/.env`文件中的数据库连接配置正确：

```env
DATABASE_DEFAULT=mysql
DATABASE_HOSTNAME=localhost
DATABASE_DATABASE=cmms_db
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
```

### 3. 后端部署

1. 将新增的Controller文件复制到 `backend/app/controller/`
2. 更新路由配置文件 `backend/route/app.php`
3. 重启后端服务

### 4. 小程序部署

1. 将工具文件 `progressSync.js` 复制到小程序的 `utils/` 目录
2. 在需要同步的页面中引入并使用
3. 重新编译发布小程序

### 5. 前端部署

1. 将Vue组件文件 `MiniprogramProgressSync.vue` 复制到前端 `src/views/repair/` 目录
2. 在路由配置中添加新路由
3. 重新构建前端项目

## 注意事项

1. **认证要求**: 所有同步接口都需要JWT Token认证
2. **文件大小限制**: 
   - 单张图片最大5MB
   - 视频文件最大50MB
3. **支持格式**:
   - 图片: JPEG, PNG, GIF, WebP
   - 视频: MP4, MOV
4. **跨域配置**: 接口已配置CORS，支持跨域访问
5. **错误处理**: 同步失败时会返回详细错误信息，建议记录日志

## 故障排查

### 1. 同步失败

检查项：
- Token是否有效
- 网络连接是否正常
- 订单ID是否正确
- 数据库连接是否正常

### 2. 文件上传失败

检查项：
- 文件大小是否超限
- 文件格式是否支持
- 服务器磁盘空间是否充足
- 上传目录是否有写入权限

### 3. 进度未显示

检查项：
- 同步是否成功完成
- 前端是否正确调用获取接口
- 数据是否成功写入数据库

## 扩展功能

可以根据需求扩展以下功能：

1. **实时推送**: 使用WebSocket实时推送进度更新
2. **批量同步**: 支持批量同步多个订单的进度
3. **进度通知**: 进度更新时发送通知给管理员
4. **进度审批**: 对进度更新进行审批流程
5. **数据统计**: 统计同步成功率、频率等指标

## 联系支持

如有问题或建议，请联系技术支持团队。
