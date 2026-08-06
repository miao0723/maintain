# 小程序维修进度上传功能使用文档

## 功能概述

本功能实现了电子维修2.0小程序中维修人员上传进度照片和视频的功能，并自动同步到CMMS后台管理系统。

## 数据库架构

### 小程序数据库

#### 维修进度照片表 (order_progress_photos)
```sql
CREATE TABLE `order_progress_photos` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `description` varchar(500) DEFAULT NULL COMMENT '照片说明',
  `images` json DEFAULT NULL COMMENT '图片JSON数组',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度照片表';
```

#### 维修进度视频表 (order_progress_videos)
```sql
CREATE TABLE `order_progress_videos` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `video_title` varchar(100) NOT NULL COMMENT '视频标题',
  `description` varchar(500) DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) DEFAULT NULL COMMENT '封面URL',
  `duration` int(11) DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint(20) DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度视频表';
```

#### CMMS同步日志表 (cmms_sync_log)
```sql
CREATE TABLE `cmms_sync_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `sync_type` enum('progress','photo','video') DEFAULT 'progress',
  `cmms_order_id` int(11) DEFAULT NULL COMMENT 'CMMS订单ID',
  `sync_status` enum('success','failed') DEFAULT 'success',
  `sync_error` text COMMENT '同步错误信息',
  `synced_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CMMS同步日志表';
```

## API 接口说明

### 小程序后端接口

#### 1. 上传进度照片
**接口**: `POST /api/progress/photos/upload`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
- `order_id`: 订单ID (必填)
- `description`: 照片说明 (可选)
- `images`: 图片文件 (必填，最多9张)

**响应示例**:
```json
{
  "success": true,
  "message": "进度照片上传成功",
  "data": {
    "id": 1,
123    "photos": ["/uploads/progress/xxx.jpg", "/uploads/progress/yyy.jpg"]
  }
}
```

#### 2. 上传进度视频
**接口**: `POST /api/progress/videos/upload`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
- `order_id`: 订单ID (必填)
- `video_title`: 视频标题 (必填)
- `description`: 视频说明 (可选)
- `video`: 视频文件 (必填，MP4格式)
- `cover`: 封面图片 (可选)

**响应示例**:
```json
{
  "success": true,
  "message": "进度视频上传成功",
  "data": {
    "id": 1,
    "videoUrl": "/uploads/progress/xxx.mp4",
    "coverUrl": "/uploads/progress/yyy.jpg",
    "duration": 180
  }
}
```

#### 3. 获取订单进度照片
**接口**: `GET /api/progress/photos/:orderId`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "description": "维修进度照片",
      "images": ["/uploads/progress/xxx.jpg"],
      "uploaded_by_name": "张工",
      "created_at": "2026-05-22 10:00:00"
    }
  ]
}
```

#### 4. 获取订单进度视频
**接口**: `GET /api/progress/videos/:orderId`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "video_title": "维修过程视频",
      "video_url": "/uploads/progress/xxx.mp4",
      "cover_url": "/uploads/progress/yyy.jpg",
      "duration": 180,
      "uploaded_by_name": "张工",
      "created_at": "2026-05-22 10:00:00"
    }
  ]
}
```

## 小程序端使用

### 1. 引入工具文件

在小程序页面的JS文件中引入上传工具：

```javascript
const progressUpload = require('../../utils/progressUpload.js');
```

### 2. 上传进度照片

#### 方式一：使用完整流程
```javascript
// 上传进度照片（显示选择菜单）
async function uploadProgressPhotos(orderId) {
  try {
    const result = await progressUpload.chooseAndUploadPhotos(
      orderId,
      '维修进度照片'
    );
    console.log('照片上传成功', result);
    // 重新加载照片列表
    loadProgressPhotos(orderId);
  } catch (error) {
    console.error('照片上传失败', error);
    wx.showToast({
      title: error.message || '上传失败',
      icon: 'none'
    });
  }
}

// 使用示例
uploadProgressPhotos(1);
```

#### 方式二：使用快捷方式（拍照）
```javascript
async function uploadPhotosByCamera(orderId) {
  try {
    const result = await progressUpload.uploadProgressPhotos(
      orderId,
      '维修进度照片',
        9  // 最多9张
    );
    console.log('照片上传成功', result);
  } catch (error) {
    console.error('照片上传失败', error);
  }
}
```

### 3. 上传进度视频

#### 方式一：使用完整流程
```javascript
// 上传进度视频（显示选择菜单）
async function uploadProgressVideo(orderId) {
  try {
    const result = await progressUpload.chooseAndUploadVideo(
      orderId,
      '维修过程视频',
      '记录维修全过程'
    );
    console.log('视频上传成功', result);
    // 重新加载视频列表
    loadProgressVideos(orderId);
  } catch (error) {
    console.error('视频上传失败', error);
    wx.showToast({
      title: error.message || '上传失败',
      icon: 'none'
    });
  }
}

// 使用示例
uploadProgressVideo(1);
```

#### 方式二：拍摄视频
```javascript
async function uploadVideoByCamera(orderId) {
  try {
    const result = await progressUpload.uploadProgressVideo(
      orderId,
      '维修过程视频',
      '记录维修全过程',
        60  // 最多60秒
    );
    console.log('视频上传成功', result);
  } catch (error) {
    console.error('视频上传失败', error);
  }
}
```

### 4. 获取并显示进度照片

```javascript
async function loadProgressPhotos(orderId) {
  try {
    const photos = await progressUpload.getOrderProgressPhotos(orderId);
    
    // 渲染照片列表
    this.setData({
      progressPhotos: photos.map(photo => ({
        ...photo,
        images: photo.images || []
      }))
    });
  } catch (error) {
    console.error('获取进度照片失败', error);
  }
}
```

### 5. 获取并显示进度视频

```javascript
async function loadProgressVideos(orderId) {
  try {
    const videos = await progressUpload.getOrderProgressVideos(orderId);
    
    // 渲染视频列表
    this.setData({
      progressVideos: videos
    });
  } catch (error) {
    console.error('获取进度视频失败', error);
  }
}
```

## 完整页面示例

### 维修进度上传页面 (progress-upload.js)

```javascript
const app = getApp();
const progressUpload = require('../../utils/progressUpload.js');

Page({
  data: {
    orderId: null,
    loading: false,
    progressPhotos: [],
    progressVideos: []
  },

  onLoad(options) {
    const orderId = options.orderId || options.id;
    if (orderId) {
      this.setData({ orderId: parseInt(orderId) });
      this.loadProgressData();
    }
  },

  onShow() {
    if (this.data.orderId) {
      this.loadProgressData();
    }
  },

  // 加载进度数据
  async loadProgressData() {
    const { orderId } = this.data;
    if (!orderId) return;

    this.setData({ loading: true });

    try {
      const [photos, videos] = await Promise.all([
        progressUpload.getOrderProgressPhotos(orderId),
        progressUpload.getOrderProgressVideos(orderId)
      ]);

      this.setData({
        progressPhotos: photos.map(photo => ({
          ...photo,
          images: photo.images || []
        })),
        progressVideos: videos,
        loading: false
      });
    } catch (error) {
      console.error('加载进度数据失败', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 上传照片
  async uploadPhotos() {
    const { orderId } = this.data;
    if (!orderId) return;

    try {
      await progressUpload.chooseAndUploadPhotos(orderId, '维修进度照片');
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      this.loadProgressData();
    } catch (error) {
      console.error('上传照片失败', error);
      wx.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      });
    }
  },

  // 上传视频
  async uploadVideo() {
    const { orderId } = this.data;
    if (!orderId) return;

    try {
      await progressUpload.chooseAndUploadVideo(orderId, '维修过程视频', '记录维修过程');
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      this.loadProgressData();
    } catch (error) {
      console.error('上传视频失败', error);
      wx.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      });
    }
  },

  // 预览照片
  previewPhoto(e) {
    const current = e.currentTarget.dataset.current;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({ current, urls });
  },

  // 播放视频
  playVideo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: `/pages/video-player/video-player?url=${encodeURIComponent(url)}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadProgressData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
```

### 维修进度上传页面 (progress-upload.wxml)

```xml
<view class="container">
  <!-- 上传按钮 -->
  <view class="action-bar">
    <button 
      type="primary" 
      bindtap="uploadPhotos"
      disabled="{{loading}}"
    >
      <text class="icon">📷</text>
      <text>上传照片</text>
    </button>
    <button 
      type="primary" 
      bindtap="uploadVideo"
      disabled="{{loading}}"
    >
      <text class="icon">🎥</text>
      <text>上传视频</text>
    </button>
  </view>

  <!-- 进度照片 -->
  <view class="section" wx:if="{{progressPhotos.length > 0}}">
    <view class="section-title">
      <text>📷 进度照片</text>
      <text class="count">({progressPhotos.length}})</text>
    </view>
    <view class="photo-list">
      <view 
        class="photo-item" 
        wx:for="{{item in progressPhotos}}" 
        wx:key="{{item.id}}"
      >
        <view class="photo-info">
          <text class="description">{{item.description || '无说明'}}</text>
          <text class="time">{{item.uploaded_by_name}} · {{item.created_at}}</text>
        </view>
        <view class="photo-preview">
          <image 
            wx:for="{{img in item.images}}" 
            wx:key="{{img}}"
            src="{{img}}" 
            mode="aspectFill"
            bindtap="previewPhoto"
            data-current="{{img}}"
            data-urls="{{item.images}}"
            class="photo-img"
          />
        </view>
      </view>
    </view>
  </view>

  <!-- 进度视频 -->
  <view class="section" wx:if="{{progressVideos.length > 0}}">
    <view class="section-title">
      <text>🎥 进度视频</text>
      <text class="count">({progressVideos.length}})</text>
    </viewview>
    <view class="video-list">
      <view 
        class="video-item" 
        wx:for="{{item in progressVideos}}" 
        wx:key="{{item.id}}"
      >
        <view class="video-cover" bindtap="playVideo" data-url="{{item.video_url}}">
          <image src="{{item.cover_url}}" mode="aspectFill" />
        </view>
        <view class="video-info">
          <text class="title">{{item.video_title}}</text>
          <text class="description">{{item.description || ''}}</text>
          <text class="meta">
            <text>时长: {{item.duration}}秒</text>
            <text>{{item.uploaded_by_name}}</text>
            <text>{{item.created_at}}</text>
          </text>
        </view>
      </view>
    </view>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" wx:if="{{progressPhotos.length === 0 && progressVideos.length === 0 && !loading}}">
    <text>暂无进度记录</text>
    <text>点击上方按钮上传维修进度</text>
  </view>

  <!-- 加载状态 -->
  <view class="loading-state" wx:if="{{loading}}">
    <text>加载中...</text>
  </view>
</view>
```

```css
/* progress-upload.wxss */
.container {
  padding: 20px;
  min-height: 100vh;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.action-bar button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
}

.action-bar .icon {
  font-size: 20px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e5e5;
}

.section-title .count {
  font-size: 14px;
  font-weight: 400;
  color: #999;
}

.photo-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.photo-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.photo-info {
  margin-bottom: 12px;
}

.photo-info .description {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.photo-info .time {
  font-size: 12px;
  color: #999;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-img {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  gap: 12px;
}

.video-cover {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.video-cover image {
  width: 100%;
  height: 100%;
}

.video-info {
  flex: 1;
}

.video-info .title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.video-info .description {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.video-info .meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state text {
  margin: 4px 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
```

## 部署步骤

### 1. 小程序数据库迁移

在小程序数据库中执行迁移脚本：

```bash
# 连接到小程序数据库
mysql -u root -p repair

# 执行迁移脚本
source 电子维修2.0/backend/database/migrations/011_add_order_progress_tables.sql
```

或在Navicat中：
1. 连接到 `repair` 数据库
2. 新建查询
3. 复制 `011_add_order_progress_tables.sql` 文件内容
4. 点击"运行"按钮

### 2. 小程序后端部署

1. 将路由文件复制到 `电子维修2.0/backend/routes/progressRoutes.js`
2. 在主应用文件中注册路由：

```javascript
// 在电子维修2.0/backend/server.js 中
const progressRoutes = require('./routes/progressRoutes');
app.use('/api/progress', progressRoutes);
```

3. 确保multer已安装：

```bash
cd 电子维修2.0/backend
npm install multer
```

4. 重启小程序后端服务

### 3. 小程序前端部署

1. 将工具文件复制到 `电子维修2.0/utils/progressUpload.js`
2. 在app.js中配置基础URL：

```javascript
// 在电子维修2.0/app.js 中
App({
  globalData: {
    baseUrl: 'http://localhost:3000',  // 小程序后端地址
    // ...其他配置
  }
})
```

3. 添加进度上传页面路由：

```json
// 在project.config.json或app.json的pages中
{
  "pages": [
    // ...其他页面
    "pages/progress-upload/progress-upload"
  ]
}
```

### 4. CMMS后台部署

CMMS后台已有相关的同步接口，无需额外部署。只需确保：

1. API路由已配置 (`backend/route/app.php`)
2. 控制器文件已部署 (`backend/app/controller/MiniprogramProgressSyncController.php`)
3. 控制器文件已部署 (`backend/app/controller/MiniprogramProgressUploadController.php`)

### 5. 环境变量配置

在小程序后端 `.env` 文件中配置CMMS连接信息：

```env
# CMMS API地址
MMS_API_URL=http://localhost:8000/api

# CMMS API Token (用于同步）
MMS_API_TOKEN=your_sync_token_here
```

## CMMS后台查看同步数据

### 访问方式

1. 登录CMMS后台管理系统
2. 导航到"维修管理" → "小程序进度同步"
3. 选择小程序订单查看同步的进度、照片、视频

### 数据展示

CMMS后台会展示：
- 订单信息（小程序订单ID和CMMS订单ID映射）
- 维修进度记录（带时间线）
- 进度照片（网格展示，支持预览）
- 进度视频（视频播放器，显示元信息）

## 注意事项

### 权限控制
- 只有订单所有者或分配的维修人员可以上传进度照片和视频
- 小程序后端会验证上传权限

### 文件限制
- 单张图片最大5MB
- 视频文件最大50MB
- 支持的图片格式：JPEG, PNG, GIF, WebP
- 支持的视频格式：MP4, MOV

### 同步机制
- 上传成功后，数据会自动同步到CMMS后台
- 同步采用异步方式，不会影响上传响应
- 同步失败会记录到日志表，不影响本地数据

### 错误处理
- 所有API返回标准格式：`{ success: boolean, message: string, data: any }`
- 错误信息会通过Toast提示用户
- 同步错误会记录到数据库，不影响用户体验

## 测试建议

### 功能测试

1. **上传照片测试**
   - 测试单张照片上传
   - 测试多张照片上传
   - 测试拍照上传
   - 测试相册选择上传
   - 测试超过5MB的图片

2. **上传视频测试**
   - 测试MP4视频上传
   - 测试带封面的视频上传
   - 测试视频时长计算
   - 测试超过50MB的视频

3. **权限测试**
   - 测试订单所有者上传
   - 测试维修人员上传
   - 测试其他用户上传（应该被拒绝）

4. **同步测试**
   - 验证数据同步到CMMS后台
   - 检查同步日志记录
   - 测试同步失败后的日志记录

### 性能测试

1. 使用小程序开发工具的"性能"面板监控
2. 关注图片/视频上传的网络耗时
3. 关注数据同步的API响应时间
4. 优化大文件上传的进度提示

## 扩展功能建议

可以根据需求扩展以下功能：

1. **进度条显示**
   - 显示文件上传进度
   - 提供上传取消功能

2. **图片编辑**
   - 上传前支持图片裁剪
   - 添加图片标注功能

3. **视频编辑**
   - 添加视频剪辑功能
   - 添加视频滤镜效果

4. **实时预览**
   - 上传后立即显示预览
   - 支持全屏查看

5. **批量操作**
   - 批量删除上传记录
   - 批量重新同步失败记录

## 故障排查

### 上传失败

检查项：
- Token是否有效
- 网络连接是否正常
- 文件大小是否超限
- 文件格式是否支持
- 服务器磁盘空间是否充足
- 上传目录是否有写入权限

### 同步失败

检查项：
- CMMS API地址是否正确
- CMMS API Token是否有效
- CMMS后台服务是否正常运行
- 数据库连接是否正常
- 网络防火墙设置

### 查看错误日志

小程序后端日志：
```bash
cd 电子维修2.0/backend
tail -f logs/error.log
```

CMMS后台日志：
```bash
cd backend
tail -f runtime/log/$(date +%Y%m%d).log
```

## 联系支持

如有问题或建议，请联系技术支持团队。
