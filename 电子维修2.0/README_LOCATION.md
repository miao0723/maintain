# 地图位置功能说明

## 功能概述

已实现的地址管理增强功能模块：

1. **IP定位**：新增地址时根据用户IP自动获取大致位置（省份、城市）
2. **地图选点**：用户可以在地图上选择精确位置，自动填充地址信息
3. **逆地理编码**：将经纬度转换为详细地址信息

## 后端实现

### 新增路由
- `backend/routes/locationRoutes.js` - 位置相关API接口

### API接口

1. **获取IP定位**
   - 路径: `GET /api/location/ip-location`
   - 功能: 根据IP获取大致位置信息
   - 返回: `{ success, data: { ip, country, province, city, latitude, longitude } }`

2. **地理编码** (需配置高德地图API)
   - 路径: `POST /api/location/geocode`
   - 功能: 将地址转换为经纬度
   - 参数: `{ address, city }`
   - 返回: `{ success, data: { longitude, latitude, formattedAddress } }`

3. **逆地理编码** (需配置高德地图API)
   - 路径: `POST /api/location/regeocode`
   - 功能: 将经纬度转换为地址
   - 参数: `{ longitude, latitude }`
   - 返回: `{ success, data: { province, city, district, formattedAddress } }`

## 前端实现

### 新增页面
- `pages/map-picker/map-picker` - 地图选择页面

### 修改文件
- `utils/api.js` - 添加 locationApi 接口
- `pages/address-edit/address-edit.js` - 集成IP定位和地图选择
- `pages/address-edit/address-edit.wxml` - 添加地图选择按钮
- `pages/address-edit/address-edit.wxss` - 地图选择按钮样式
- `app.json` - 注册地图选择页面

## 配置高德地图

### 方法1: 后端环境变量配置（推荐）

在 `backend/.env` 文件中添加：
```
AMAP_API_KEY=你的高德地图API密钥
```

### 方法2: MCP服务配置

在项目根目录的 `.claude/settings.local.json` 中配置高德地图MCP服务：

```json
{
  "mcpServers": {
    "amap-maps": {
      "args": [
        "-y",
        "@amap/amap-maps-mcp-server"
      ],
      "command": "npx",
      "env": {
        "AMAP_MAPS_API_KEY": "你的高德地图API密钥"
      }
    }
  }
}
```

### 获取高德地图API密钥

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 创建应用并选择 "Web服务"
4. 获取API Key

## 使用说明

### 新增地址时的IP定位

1. 用户进入地址编辑页面
2. 系统自动调用IP定位API获取用户大致位置
3. 自动填充省市区信息
4. 用户可修改或选择其他方式

### 地图选择位置

1. 在地址编辑页面点击 "地图选点" 按钮
2. 进入地图选择页面
3. 地图自动定位到当前IP位置
4. 用户可拖动地图或点击精确位置
5. 系统自动获取并显示该位置的详细地址
6. 点击 "确认选择" 返回地址编辑页面
7. 自动填充地址信息

## 注意事项

1. **IP定位精度**: IP定位通常只能精确到城市级别，无法获取精确位置
2. **高德地图API**: 地理编码和逆地理编码功能需要配置高德地图API Key
3. **网络要求**: 所有定位功能都需要网络连接
4. **权限要求**: 微信小程序地图功能需要配置服务器域名白名单

## 微信小程序配置

### 配置服务器域名

在小程序后台配置以下服务器域名：
- request域名: `http://ip-api.com` (IP定位服务)
- request域名: `https://restapi.amap.com` (高德地图API，如需使用)

### 配置地图组件权限

在 `app.json` 中确保已配置：
```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置功能"
    }
  }
}
```

## 功能流程图

```
新增地址流程:
用户进入编辑页 → IP定位获取大致位置 → 填充省市信息 → 用户填写详情 → 保存

地图选择流程:
点击地图选点 → 打开地图 → 自动定位或传入位置 → 用户选择位置 → 逆地理编码 → 返回地址信息 → 自动填充表单
```

## 技术栈

- **后端**: Node.js + Express
- **IP定位**: ip-api.com 免费服务
- **地图组件**: 微信小程序原生 map 组件
- **地理编码**: 高德地图Web服务API (可选)
