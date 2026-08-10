const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 店铺实际产品目录（设备类型 → 品牌 → 型号），用于把识别结果关联到真实可维修产品
const SHOP_CATALOG = require('../../utils/deviceData.js');

// Qwen-VL Vision API 配置（通义千问视觉模型，支持图片识别）
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.VOICE_API_BASE_URL 
  ? `${process.env.VOICE_API_BASE_URL}/chat/completions`
  : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const VISION_MODEL = 'qwen-vl-max';  // 通义千问视觉模型

// Multer 配置（存储到内存，方便 base64 转换）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 jpg/png/gif/webp/bmp 格式的图片'));
    }
  }
});

/**
 * 将图片 buffer 转为 base64 data URL
 */
function bufferToBase64Url(buffer, mimeType) {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 后处理：规范化 AI 返回的类型归属
 * 如果 AI 返回的类型不在我们支持的类型列表中，标记为自定义
 */
const SUPPORTED_TYPES = [
  '手机', '电脑/笔记本', '平板', '手表/手环', '耳机/音响',
  '相机/摄像机', '游戏机', '传感器/仪器', '无人机/航拍', '智能家居', '打印机/办公设备',
  '服务器', '路由器/网络设备', '显卡/电脑硬件'
];

// ============================================================
// 设备视觉特征匹配规则引擎
// 根据 AI 识别到的品牌+摄像头+屏幕等特征，精准匹配具体型号/系列
// ============================================================

/**
 * 设备匹配规则库
 * 每条规则: { conditions: { brand, cameras, camLayout, screen, shape, color... }, result: { name, series, type, confidence, tips } }
 * 
 * 匹配优先级：特征越多越精确的规则排在前面；
 * 同品牌内按摄像头数量/屏幕特征区分代际
 */
// 每条规则的 result 中新增 brand 字段，用于关联店铺真实产品目录(deviceData.js)
const DEVICE_RULES = [
  // ==================== iPhone 手机 (苹果) ====================
  { conditions: { brand: 'apple|苹果', cameras: '3', camLayout: '左上竖排|左上三角', screen: '灵动岛', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone Pro 系列 (14 Pro / 15 Pro / 16 Pro)', series: 'iPhone Pro', type: '手机', modelHint: '灵动岛=14Pro及以上', confidence: 0.62 } },
  { conditions: { brand: 'apple|苹果', cameras: '3', camLayout: '左上竖排|左上三角', screen: '刘海', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone 13 / 14 / 15 / 16 标准版', series: 'iPhone', type: '手机', modelHint: '三摄刘海=13~16标准版', confidence: 0.55 } },
  { conditions: { brand: 'apple|苹果', cameras: '3', camLayout: '左上竖排|左上三角', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone 13 / 14 / 15 / 16 系列', series: 'iPhone', type: '手机', modelHint: '三摄左上竖排', confidence: 0.52 } },
  { conditions: { brand: 'apple|苹果', cameras: '2', camLayout: '左上矩阵|左上竖排', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone 11 / 12 系列', series: 'iPhone', type: '手机', modelHint: '双摄=11/12', confidence: 0.55 } },
  { conditions: { brand: 'apple|苹果', cameras: '1', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone SE 系列', series: 'iPhone SE', type: '手机', modelHint: '单摄=SE', confidence: 0.50 } },
  { conditions: { brand: 'apple|苹果', screen: '灵动岛', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone Pro 系列 (14 Pro / 15 Pro / 16 Pro)', series: 'iPhone Pro', type: '手机', modelHint: '灵动岛=14Pro+', confidence: 0.58 } },
  { conditions: { brand: 'apple|苹果', shape: '直板|直板手机|手机' },
    result: { brand: '苹果', name: 'iPhone', series: 'iPhone', type: '手机', confidence: 0.42 } },

  // ==================== 华为手机 ====================
  { conditions: { brand: '华为|huawei', camLayout: '圆形|圆环|圆心矩阵|圆心', shape: '直板|直板手机|手机' },
    result: { brand: '华为', name: '华为 Mate 系列', series: 'Mate', type: '手机', modelHint: '圆形模组=Mate', confidence: 0.58 } },
  { conditions: { brand: '华为|huawei', camLayout: '左上竖排|左上矩阵', cameras: '3|更多', screen: '挖孔', shape: '直板|直板手机|手机' },
    result: { brand: '华为', name: '华为 P / Pura 系列', series: 'Pura', type: '手机', modelHint: '多摄挖孔=Pura', confidence: 0.55 } },
  { conditions: { brand: '华为|huawei', shape: '折叠屏|折叠屏手机' },
    result: { brand: '华为', name: '华为 Mate X 折叠屏', series: 'Mate X', type: '手机', modelHint: '折叠屏', confidence: 0.60 } },
  { conditions: { brand: '华为|huawei', shape: '直板|直板手机|手机' },
    result: { brand: '华为', name: '华为手机', series: '华为', type: '手机', confidence: 0.42 } },

  // ==================== 小米手机 ====================
  { conditions: { brand: '小米|xiaomi', camLayout: '左上矩阵|左上竖排', cameras: '3|更多', shape: '直板|直板手机|手机' },
    result: { brand: '小米', name: '小米数字系列 / Ultra', series: '小米', type: '手机', modelHint: '多摄矩阵', confidence: 0.52 } },
  { conditions: { brand: '小米|xiaomi', shape: '直板|直板手机|手机' },
    result: { brand: '小米', name: '小米手机', series: '小米', type: '手机', confidence: 0.42 } },

  // ==================== OPPO 手机 ====================
  { conditions: { brand: 'oppo', camLayout: '左上竖排|左上矩阵|圆形', cameras: '3|更多', shape: '直板|直板手机|手机' },
    result: { brand: 'OPPO', name: 'OPPO Find / Reno 系列', series: 'OPPO', type: '手机', confidence: 0.50 } },
  { conditions: { brand: 'oppo', shape: '直板|直板手机|手机' },
    result: { brand: 'OPPO', name: 'OPPO 手机', series: 'OPPO', type: '手机', confidence: 0.40 } },

  // ==================== vivo 手机 ====================
  { conditions: { brand: 'vivo', camLayout: '左上竖排|左上矩阵|圆形', cameras: '3|更多', shape: '直板|直板手机|手机' },
    result: { brand: 'vivo', name: 'vivo X / iQOO 系列', series: 'vivo', type: '手机', confidence: 0.50 } },
  { conditions: { brand: 'vivo', shape: '直板|直板手机|手机' },
    result: { brand: 'vivo', name: 'vivo 手机', series: 'vivo', type: '手机', confidence: 0.40 } },

  // ==================== 三星手机 ====================
  { conditions: { brand: '三星|samsung', camLayout: '中间竖排|圆心矩阵|中间矩阵', cameras: '3|更多', shape: '直板|直板手机|手机' },
    result: { brand: '三星', name: 'Samsung Galaxy S 系列', series: 'Galaxy S', type: '手机', modelHint: '矩阵三摄', confidence: 0.55 } },
  { conditions: { brand: '三星|samsung', shape: '折叠屏|折叠屏手机' },
    result: { brand: '三星', name: 'Samsung Galaxy Z Fold / Flip', series: 'Galaxy Z', type: '手机', modelHint: '折叠屏', confidence: 0.60 } },
  { conditions: { brand: '三星|samsung', shape: '直板|直板手机|手机' },
    result: { brand: '三星', name: 'Samsung Galaxy', series: 'Galaxy', type: '手机', confidence: 0.42 } },

  // ==================== 荣耀手机 ====================
  { conditions: { brand: '荣耀|honor', camLayout: '圆形|圆环', shape: '直板|直板手机|手机' },
    result: { brand: '荣耀', name: '荣耀 Magic 系列', series: 'Magic', type: '手机', modelHint: '圆形模组=Magic', confidence: 0.55 } },
  { conditions: { brand: '荣耀|honor', shape: '直板|直板手机|手机' },
    result: { brand: '荣耀', name: '荣耀手机', series: '荣耀', type: '手机', confidence: 0.40 } },

  // ==================== 一加/真我 手机 ====================
  { conditions: { brand: '一加|真我|oneplus|realme|oppo', camLayout: '左上竖排|左上矩阵|圆形', cameras: '3|更多', shape: '直板|直板手机|手机' },
    result: { brand: '一加/真我', name: '一加 / 真我 手机', series: '一加/真我', type: '手机', confidence: 0.50 } },
  { conditions: { brand: '一加|真我|oneplus|realme', shape: '直板|直板手机|手机' },
    result: { brand: '一加/真我', name: '一加 / 真我 手机', series: '一加/真我', type: '手机', confidence: 0.40 } },

  // ==================== 苹果 平板/电脑/手表/耳机 ====================
  { conditions: { brand: 'apple|苹果', shape: '平板|tablet|pad' },
    result: { brand: '苹果', name: 'iPad', series: 'iPad', type: '平板', confidence: 0.55 } },
  { conditions: { brand: 'apple|苹果', shape: '笔记本|笔记本电脑|laptop|notebook' },
    result: { brand: '苹果', name: 'MacBook', series: 'MacBook', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: 'apple|苹果', shape: '电脑|一体机|台式|desktop' },
    result: { brand: '苹果', name: 'iMac / Mac', series: 'Mac', type: '电脑/笔记本', confidence: 0.50 } },
  { conditions: { brand: 'apple|苹果', shape: '手表|智能手表|watch|手环' },
    result: { brand: '苹果', name: 'Apple Watch', series: 'Apple Watch', type: '手表/手环', confidence: 0.58 } },
  { conditions: { brand: 'apple|苹果', shape: 'tws|耳机|耳塞|入耳|headphone|earphone|earbud|airpod' },
    result: { brand: '苹果', name: 'AirPods', series: 'AirPods', type: '耳机/音响', confidence: 0.58 } },

  // ==================== 华为 平板/电脑/手表/耳机 ====================
  { conditions: { brand: '华为|huawei', shape: '平板|tablet|pad' },
    result: { brand: '华为', name: '华为 MatePad', series: 'MatePad', type: '平板', confidence: 0.55 } },
  { conditions: { brand: '华为|huawei', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '华为', name: '华为 MateBook', series: 'MateBook', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: '华为|huawei', shape: '手表|智能手表|watch|手环' },
    result: { brand: '华为', name: '华为 WATCH / 手环', series: '华为穿戴', type: '手表/手环', confidence: 0.55 } },
  { conditions: { brand: '华为|huawei', shape: '耳机|tws|earphone|earbud|音响|音箱' },
    result: { brand: '华为', name: '华为 FreeBuds / Sound', series: '华为音频', type: '耳机/音响', confidence: 0.55 } },

  // ==================== 小米 平板/电脑/手表/智能家居 ====================
  { conditions: { brand: '小米|xiaomi', shape: '平板|tablet|pad' },
    result: { brand: '小米', name: '小米平板', series: '小米平板', type: '平板', confidence: 0.52 } },
  { conditions: { brand: '小米|xiaomi', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '小米', name: '小米 / Redmi 笔记本', series: '小米电脑', type: '电脑/笔记本', confidence: 0.52 } },
  { conditions: { brand: '小米|xiaomi', shape: '手表|智能手表|watch|手环' },
    result: { brand: '小米', name: '小米手表/手环', series: '小米穿戴', type: '手表/手环', confidence: 0.52 } },
  { conditions: { brand: '小米|xiaomi|米家', shape: '智能|家居|音箱|门锁|扫地|摄像头|传感器|网关' },
    result: { brand: '小米/米家', name: '小米/米家智能设备', series: '米家', type: '智能家居', confidence: 0.50 } },

  // ==================== 三星 平板/手表/耳机 ====================
  { conditions: { brand: '三星|samsung', shape: '平板|tablet|pad' },
    result: { brand: '三星', name: 'Samsung Galaxy Tab', series: 'Galaxy Tab', type: '平板', confidence: 0.55 } },
  { conditions: { brand: '三星|samsung', shape: '手表|智能手表|watch|手环' },
    result: { brand: '三星', name: 'Samsung Galaxy Watch', series: 'Galaxy Watch', type: '手表/手环', confidence: 0.55 } },
  { conditions: { brand: '三星|samsung', shape: '耳机|tws|earphone|earbud' },
    result: { brand: '三星', name: 'Samsung Galaxy Buds', series: 'Galaxy Buds', type: '耳机/音响', confidence: 0.55 } },

  // ==================== OPPO/vivo 手表 ====================
  { conditions: { brand: 'oppo|vivo', shape: '手表|智能手表|watch|手环' },
    result: { brand: 'OPPO/vivo', name: 'OPPO Watch / vivo Watch', series: 'OPPO/vivo 穿戴', type: '手表/手环', confidence: 0.52 } },

  // ==================== 微软 电脑(Surface) ====================
  { conditions: { brand: '微软|microsoft', shape: '平板|tablet|pad|笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '微软', name: 'Microsoft Surface', series: 'Surface', type: '电脑/笔记本', confidence: 0.55 } },

  // ==================== 联想 电脑/平板 ====================
  { conditions: { brand: '联想|lenovo', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '联想', name: '联想笔记本', series: '联想', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: '联想|lenovo', shape: '平板|tablet|pad' },
    result: { brand: '联想', name: '联想 小新Pad', series: '小新Pad', type: '平板', confidence: 0.52 } },

  // ==================== 戴尔 / 惠普 / 华硕 / 宏碁 电脑 ====================
  { conditions: { brand: '戴尔|dell', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '戴尔', name: 'Dell 笔记本', series: 'Dell', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: '惠普|hp', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '惠普', name: 'HP 笔记本', series: 'HP', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: '华硕|asus', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '华硕', name: '华硕笔记本', series: '华硕', type: '电脑/笔记本', confidence: 0.55 } },
  { conditions: { brand: '宏碁|acer', shape: '笔记本|笔记本电脑|laptop|notebook|电脑' },
    result: { brand: '宏碁', name: '宏碁笔记本', series: '宏碁', type: '电脑/笔记本', confidence: 0.55 } },

  // ==================== 大疆 无人机/手持 ====================
  { conditions: { brand: '大疆|dji', shape: '无人机|drone' },
    result: { brand: '大疆', name: '大疆无人机', series: 'DJI', type: '无人机/航拍', confidence: 0.58 } },
  { conditions: { brand: '大疆|dji', shape: '相机|摄像机|云台|手持|稳定器' },
    result: { brand: '大疆', name: '大疆 Pocket / 稳定器', series: 'DJI 手持', type: '相机/摄像机', confidence: 0.55 } },

  // ==================== 道通 无人机 ====================
  { conditions: { brand: '道通|autel', shape: '无人机|drone' },
    result: { brand: '道通', name: '道通无人机', series: 'Autel', type: '无人机/航拍', confidence: 0.55 } },

  // ==================== 任天堂 游戏机 ====================
  { conditions: { brand: '任天堂|nintendo', shape: '游戏机|掌机|switch|game' },
    result: { brand: '任天堂', name: 'Nintendo Switch', series: 'Switch', type: '游戏机', confidence: 0.58 } },

  // ==================== 索尼 游戏机/相机/耳机 ====================
  { conditions: { brand: '索尼|sony', shape: '游戏机|掌机|game|playstation|ps' },
    result: { brand: '索尼', name: 'PlayStation', series: 'PlayStation', type: '游戏机', confidence: 0.55 } },
  { conditions: { brand: '索尼|sony', shape: '相机|摄像机|camera' },
    result: { brand: '索尼', name: '索尼相机 / 摄像机', series: 'Sony', type: '相机/摄像机', confidence: 0.55 } },
  { conditions: { brand: '索尼|sony', shape: '耳机|音响|headphone|earphone|speaker|音箱' },
    result: { brand: '索尼', name: '索尼耳机 / 音响', series: 'Sony 音频', type: '耳机/音响', confidence: 0.55 } },

  // ==================== 微软 游戏机 ====================
  { conditions: { brand: '微软|microsoft', shape: '游戏机|掌机|game|xbox' },
    result: { brand: '微软', name: 'Xbox', series: 'Xbox', type: '游戏机', confidence: 0.55 } },

  // ==================== 其他掌机 (Steam Deck / ROG Ally) ====================
  { conditions: { brand: 'steam|rog|ally|deck', shape: '游戏机|掌机|game|switch' },
    result: { brand: '其他掌机', name: 'Steam Deck / ROG Ally', series: '掌机', type: '游戏机', confidence: 0.50 } },

  // ==================== 佳能/尼康/富士/运动相机 ====================
  { conditions: { brand: '佳能|canon', shape: '相机|摄像机|单反|camera' },
    result: { brand: '佳能', name: '佳能相机', series: 'Canon', type: '相机/摄像机', confidence: 0.58 } },
  { conditions: { brand: '尼康|nikon', shape: '相机|摄像机|单反|camera' },
    result: { brand: '尼康', name: '尼康相机', series: 'Nikon', type: '相机/摄像机', confidence: 0.58 } },
  { conditions: { brand: '富士|fuji', shape: '相机|摄像机|单反|camera' },
    result: { brand: '富士', name: '富士相机', series: 'Fujifilm', type: '相机/摄像机', confidence: 0.58 } },
  { conditions: { brand: 'gopro|运动相机|osmo', shape: '相机|摄像机|camera|运动|action' },
    result: { brand: 'GoPro/运动相机', name: 'GoPro / 运动相机', series: '运动相机', type: '相机/摄像机', confidence: 0.55 } },

  // ==================== 耳机/音响 品牌 ====================
  { conditions: { brand: 'bose', shape: '耳机|音响|headphone|earphone|speaker|音箱' },
    result: { brand: 'Bose', name: 'Bose 耳机 / 音响', series: 'Bose', type: '耳机/音响', confidence: 0.55 } },
  { conditions: { brand: '森海塞尔|sennheiser', shape: '耳机|音响|headphone|earphone|speaker|音箱' },
    result: { brand: '森海塞尔', name: '森海塞尔耳机', series: '森海塞尔', type: '耳机/音响', confidence: 0.55 } },
  { conditions: { brand: 'jbl|marshall', shape: '耳机|音响|headphone|earphone|speaker|音箱' },
    result: { brand: 'JBL/Marshall', name: 'JBL / Marshall 音响', series: 'JBL/Marshall', type: '耳机/音响', confidence: 0.55 } },

  // ==================== 手表 Amazfit/Garmin ====================
  { conditions: { brand: 'amazfit|garmin', shape: '手表|智能手表|watch|手环' },
    result: { brand: 'Amazfit/Garmin', name: 'Amazfit / Garmin', series: 'Amazfit/Garmin', type: '手表/手环', confidence: 0.55 } },

  // ==================== 传感器/仪器 品牌 ====================
  { conditions: { brand: '西门子|siemens', shape: '传感器|仪器|工业|plc|hmi|触摸屏' },
    result: { brand: '西门子', name: '西门子工业设备', series: '西门子', type: '传感器/仪器', confidence: 0.55 } },
  { conditions: { brand: '欧姆龙|omron', shape: '传感器|仪器|工业|温控|plc' },
    result: { brand: '欧姆龙', name: '欧姆龙传感器/PLC', series: '欧姆龙', type: '传感器/仪器', confidence: 0.55 } },
  { conditions: { brand: '霍尼韦尔|honeywell', shape: '传感器|仪器|探测器|变送' },
    result: { brand: '霍尼韦尔', name: '霍尼韦尔传感器', series: '霍尼韦尔', type: '传感器/仪器', confidence: 0.55 } },
  { conditions: { brand: '是德|keysight', shape: '仪器|示波|频谱|信号|万用|校准' },
    result: { brand: '是德科技', name: '是德科技仪器', series: '是德科技', type: '传感器/仪器', confidence: 0.55 } },
  { conditions: { brand: '福禄克|fluke', shape: '仪器|万用|热像|校准' },
    result: { brand: '福禄克', name: '福禄克仪器', series: '福禄克', type: '传感器/仪器', confidence: 0.55 } },
  { conditions: { brand: '横河|基恩士|keyence|yokogawa', shape: '仪器|记录|采集|视觉|传感' },
    result: { brand: '横河/基恩士', name: '横河/基恩士仪器', series: '横河/基恩士', type: '传感器/仪器', confidence: 0.55 } },

  // ==================== 智能家居 品牌 ====================
  { conditions: { brand: '萤石|海康|hikvision|ezviz', shape: '智能|家居|摄像头|门铃|猫眼|录像' },
    result: { brand: '萤石/海康', name: '萤石/海康智能监控', series: '萤石/海康', type: '智能家居', confidence: 0.52 } },
  { conditions: { brand: '石头|追觅|roborock|dreame', shape: '智能|家居|扫地|机器人' },
    result: { brand: '石头/追觅', name: '石头/追觅扫地机', series: '石头/追觅', type: '智能家居', confidence: 0.52 } },

  // ==================== 打印机/办公设备 品牌 ====================
  { conditions: { brand: '惠普|hp', shape: '打印|打印机|办公|复印|扫描|激光|喷墨' },
    result: { brand: '惠普', name: 'HP 打印机', series: 'HP 打印', type: '打印机/办公设备', confidence: 0.55 } },
  { conditions: { brand: '佳能|canon', shape: '打印|打印机|办公|复印|扫描|喷墨|激光' },
    result: { brand: '佳能', name: '佳能打印机', series: '佳能打印', type: '打印机/办公设备', confidence: 0.55 } },
  { conditions: { brand: '爱普生|epson', shape: '打印|打印机|办公|复印|扫描|投影|喷墨|墨仓' },
    result: { brand: '爱普生', name: '爱普生打印机/投影', series: '爱普生', type: '打印机/办公设备', confidence: 0.55 } },
  { conditions: { brand: '兄弟|brother', shape: '打印|打印机|办公|复印|扫描|标签' },
    result: { brand: '兄弟', name: '兄弟打印机', series: '兄弟', type: '打印机/办公设备', confidence: 0.55 } },
  { conditions: { brand: '奔图|联想|pentax|lenovo', shape: '打印|打印机|办公|复印|扫描|激光' },
    result: { brand: '奔图/联想', name: '奔图/联想打印机', series: '奔图/联想', type: '打印机/办公设备', confidence: 0.55 } },

  // ==================== 服务器 (品牌需与 deviceData.js deviceBrands[12] 一致) ====================
  { conditions: { brand: '戴尔|dell', shape: '服务器|机架|塔式|server|rack|poweredge' },
    result: { brand: '戴尔', name: '戴尔 PowerEdge 服务器', series: 'PowerEdge', type: '服务器', confidence: 0.55 } },
  { conditions: { brand: '惠普|hp|hpe', shape: '服务器|机架|塔式|server|rack|proliant' },
    result: { brand: '惠普HPE', name: '惠普 ProLiant 服务器', series: 'ProLiant', type: '服务器', confidence: 0.55 } },
  { conditions: { brand: '联想|lenovo', shape: '服务器|机架|塔式|server|rack|thinksystem' },
    result: { brand: '联想', name: '联想 ThinkSystem 服务器', series: 'ThinkSystem', type: '服务器', confidence: 0.55 } },
  { conditions: { brand: '华为|huawei', shape: '服务器|机架|塔式|server|rack|fusion|taishan' },
    result: { brand: '华为', name: '华为 FusionServer/TaiShan', series: '华为服务器', type: '服务器', confidence: 0.55 } },
  { conditions: { brand: '浪潮|inspur', shape: '服务器|机架|塔式|server|rack' },
    result: { brand: '浪潮', name: '浪潮 NF 系列服务器', series: '浪潮服务器', type: '服务器', confidence: 0.55 } },
  { conditions: { brand: '新华三|华三|h3c', shape: '服务器|机架|塔式|server|rack|uniserver' },
    result: { brand: '新华三H3C', name: '新华三 UniServer 服务器', series: 'UniServer', type: '服务器', confidence: 0.55 } },

  // ==================== 路由器 / 网络设备 (品牌需与 deviceData.js deviceBrands[13] 一致) ====================
  { conditions: { brand: '小米|xiaomi|redmi|红米|米家' },
    result: { brand: '小米', name: '小米路由器', series: '小米路由', type: '路由器/网络设备', confidence: 0.50 } },
  { conditions: { brand: '华为|huawei' },
    result: { brand: '华为', name: '华为路由器 / 网络设备', series: '华为网络', type: '路由器/网络设备', confidence: 0.50 } },
  { conditions: { brand: '新华三|华三|h3c' },
    result: { brand: '华三H3C', name: '华三 H3C 网络设备', series: 'H3C', type: '路由器/网络设备', confidence: 0.50 } },
  { conditions: { brand: 'tp-?link|普联' },
    result: { brand: 'TP-LINK', name: 'TP-LINK 路由器', series: 'TP-LINK', type: '路由器/网络设备', confidence: 0.50 } },
  { conditions: { brand: '网件|netgear' },
    result: { brand: '网件Netgear', name: '网件 Netgear 路由器', series: 'Netgear', type: '路由器/网络设备', confidence: 0.50 } },
  { conditions: { brand: '思科|cisco' },
    result: { brand: '思科Cisco', name: '思科 Cisco 网络设备', series: 'Cisco', type: '路由器/网络设备', confidence: 0.50 } },

  // ==================== 显卡 / 电脑硬件 (品牌需与 deviceData.js deviceBrands[14] 一致) ====================
  { conditions: { brand: 'nvidia|英伟达|geforce|rtx|gtx' },
    result: { brand: 'NVIDIA', name: 'NVIDIA GeForce RTX 显卡', series: 'GeForce RTX', type: '显卡/电脑硬件', confidence: 0.52 } },
  { conditions: { brand: 'amd|radeon|超微' },
    result: { brand: 'AMD', name: 'AMD Radeon RX 显卡', series: 'Radeon RX', type: '显卡/电脑硬件', confidence: 0.52 } },
  { conditions: { brand: '英特尔|intel|arc' },
    result: { brand: '英特尔', name: '英特尔 Arc 显卡', series: 'Intel Arc', type: '显卡/电脑硬件', confidence: 0.52 } },
];

/**
 * 从店铺产品目录(deviceData.js)构建 "设备类型|品牌" → 型号列表 的映射
 * 用于把识别到的系列关联到店铺真实可维修的具体型号
 */
const SHOP_PRODUCT_MAP = (() => {
  const map = {};
  const dtNameById = {};
  (SHOP_CATALOG.deviceTypes || []).forEach(dt => { dtNameById[dt.id] = dt.name; });
  const brands = SHOP_CATALOG.deviceBrands || {};
  Object.keys(brands).forEach(typeId => {
    const typeName = dtNameById[typeId];
    if (!typeName) return;
    brands[typeId].forEach(b => {
      const models = (b.models || []).map(m => m.name);
      map[`${typeName}__${b.name}`] = models;
    });
  });
  return map;
})();

/**
 * 解析店铺真实型号：根据识别出的设备类型与品牌，返回店铺可维修的具体型号列表
 * @param {string} typeName 设备类型(如 '手机')
 * @param {string} brandName 品牌(需与 deviceData 中品牌名一致)
 * @returns {string[]} 具体型号名称数组
 */
function resolveShopModels(typeName, brandName) {
  if (!typeName || !brandName) return [];
  const direct = SHOP_PRODUCT_MAP[`${typeName}__${brandName}`];
  if (direct && direct.length) return direct;
  // 品牌别名兜底（如 "OPPO" 也匹配 "OPPO/vivo" 手表类；"小米" 匹配 "小米/米家" 智能家居）
  const aliasMap = {
    'OPPO': ['OPPO/vivo'], 'vivo': ['OPPO/vivo'],
    '小米': ['小米/米家'], '米家': ['小米/米家'],
    '联想': ['奔图/联想'], '奔图': ['奔图/联想'],
  };
  for (const alias of (aliasMap[brandName] || [])) {
    const m = SHOP_PRODUCT_MAP[`${typeName}__${alias}`];
    if (m && m.length) return m;
  }
  return [];
}

/**
 * 特征权重：用于计算"匹配度"。
 * 品牌和外形最关键（决定大类别），摄像头数量/布局、屏幕特征用于在同品牌内区分系列，颜色权重最低。
 */
const FEATURE_WEIGHTS = {
  brand: 0.40,
  shape: 0.24,
  cameras: 0.12,
  camLayout: 0.12,
  screen: 0.08,
  color: 0.04
};

/**
 * 单条规则匹配度评分
 * 不再要求"所有条件都必须命中"（AND），而是按命中的特征加权累加，得到 0~1 的匹配度。
 * 同时返回命中条件数，用于在匹配度相同时做次级排序。
 * @param {Object} features - 从 AI 提取的特征 { brand, cameras, camLayout, screen, shape, color }
 * @param {Object} conditions - 规则中的条件
 * @returns {{score:number, matchedCount:number}}
 */
function scoreRule(features, conditions) {
  let score = 0;
  let matchedCount = 0;
  for (const [key, pattern] of Object.entries(conditions)) {
    if (pattern === undefined || pattern === null) continue;
    const featureValue = features[key] || '';
    if (!featureValue) continue;
    // 支持正则或 | 分隔的多值匹配
    if (new RegExp(pattern, 'i').test(featureValue)) {
      score += FEATURE_WEIGHTS[key] || 0.05;
      matchedCount += 1;
    }
  }
  return { score, matchedCount };
}

/**
 * 认定为"有效匹配"的最低匹配度阈值（低于此值视为无法归类，回退到 AI 原始结果）
 */
const MIN_MATCH_SCORE = 0.3;

/**
 * 判定"大方向"（设备大类）。
 * 服务器/路由器·网络设备/显卡 这三类有很强的专属特征关键词，一旦命中就应锁定大类，
 * 避免"只识别到品牌(如小米/华为)就被误判成手机"的问题。
 * @param {string} blob - 汇总的文本(类型/名称/型号/描述/外形)
 * @returns {string|null} 命中则返回 SUPPORTED_TYPES 中的类型名，否则 null
 */
function detectHardCategory(blob) {
  const text = (blob || '').toLowerCase();
  if (!text) return null;
  // 路由器 / 网络设备：天线、网口、路由、交换机、mesh、wifi 盒子
  if (/路由器|路由|router|交换机|网关|中继器|中继|mesh|无线ap|外置天线|多天线|\d\s*天线|天线设计/.test(text)) {
    return '路由器/网络设备';
  }
  // 服务器：机架/塔式、poweredge/proliant/thinksystem、机架式
  if (/服务器|server|机架式|机架|塔式服务器|刀片服务器|刀片|poweredge|proliant|thinksystem|fusionserver|taishan|uniserver/.test(text)) {
    return '服务器';
  }
  // 显卡：显存、显卡、gpu、rtx/gtx/radeon/arc、pcie 板卡
  if (/显卡|显示卡|显存|gpu|graphics\s*card|geforce|\brtx\b|\bgtx\b|radeon|\barc\b|独立显卡|独显/.test(text)) {
    return '显卡/电脑硬件';
  }
  return null;
}

/**
 * 核心函数：根据 AI 识别结果 + 规则库进行精准匹配
 * @param {Object} aiResult - AI 返回的原始结果 { name, type, brand, color, description, confidence, features }
 * @returns {Object} 增强后的结果 { name, type, brand, model, matchedSeries, confidence, ruleMatched }
 */
function matchDeviceByRules(aiResult) {
  // 从 AI 结果中提取特征
  // 优先使用 AI 结构化返回的 features 字段，否则从 description/text 中提取
  let features = {
    brand: aiResult.brand || '',
    cameras: '',
    camLayout: '',
    screen: '',
    shape: '',
    color: aiResult.color || ''
  };

  // 如果 AI 返回了结构化特征（从新 prompt 中获取）
  if (aiResult.features) {
    features.cameras = String(aiResult.features.cameraCount || '');
    features.camLayout = aiResult.features.cameraLayout || '';
    features.screen = aiResult.features.screenFeature || '';
    features.shape = aiResult.features.shape || aiResult.type || '';
  }

  // 否则从描述文本中提取特征
  const desc = (aiResult.description || '') + (aiResult._rawText || '');
  if (!features.camLayout && desc) {
    // 提取摄像头布局
    const camLayoutMatch = desc.match(/摄像头.*?排列.*?(?:：|:)?\s*(左上竖排|左上矩阵|左上三角|中间横排|中间竖排|中间矩阵|圆心矩阵|圆形|圆环)/);
    if (camLayoutMatch) features.camLayout = camLayoutMatch[1];
  }
  if (!features.cameras && desc) {
    const camCountMatch = desc.match(/摄像头.*?个数\s*[\(（]?\s*(\d+)/);
    if (camCountMatch) features.cameras = camCountMatch[1];
  }
  if (!features.screen && desc) {
    const screenMatch = desc.match(/顶部特征.*?(?:：|:)?\s*(刘海|挖孔|灵动岛|水滴)/);
    if (screenMatch) features.screen = screenMatch[1];
  }
  if (!features.shape && desc) {
    const shapeMatch = desc.match(/【外形】(?:[：:]\s*)?(.+?)(?:\n|$)/);
    if (shapeMatch) features.shape = shapeMatch[1].trim();
  }
  if (!features.shape && aiResult.type) {
    features.shape = aiResult.type;
  }

  // 先判定"大方向"（设备大类）：汇总所有文本，命中服务器/网络设备/显卡的强特征即锁定大类
  const categoryBlob = [
    aiResult.type, aiResult.name, aiResult.model, aiResult.description,
    aiResult._rawText, features.shape, features.brand
  ].filter(Boolean).join(' ');
  const hardCategory = detectHardCategory(categoryBlob);
  if (hardCategory) {
    console.log('[Scan] 命中大类强特征，锁定设备大类:', hardCategory);
  }

  console.log('[Scan] 规则匹配 - 提取的特征:', JSON.stringify(features));

  // 遍历规则库，对每条规则做加权评分，再按匹配度从高到低排序
  const scored = [];
  for (const rule of DEVICE_RULES) {
    // 若已锁定大类，则只考虑同大类规则，避免"品牌命中就误判成手机"
    if (hardCategory && rule.result.type !== hardCategory) continue;
    const { score, matchedCount } = scoreRule(features, rule.conditions);
    if (matchedCount > 0) {
      scored.push({ rule, score, matchedCount });
    }
  }
  scored.sort((a, b) => b.score - a.score || b.matchedCount - a.matchedCount);

  // 取匹配度最高的设备作为最终归类结果（需达到最低阈值）
  const best = scored.find(s => s.score >= MIN_MATCH_SCORE) || null;

  if (best) {
    const bestMatch = best.rule;
    console.log(`[Scan] 特征匹配成功! name=${bestMatch.result.name}, 匹配度=${best.score.toFixed(3)}, confidence=${bestMatch.result.confidence}, ` +
      `hint=${bestMatch.result.modelHint || 'N/A'}`);
    
    // 合并 AI 置信度和规则置信度（取较高值）
    const aiConfidence = typeof aiResult.confidence === 'number' ? aiResult.confidence : 0;
    const ruleConfidence = bestMatch.result.confidence;
    const finalConfidence = Math.max(aiConfidence, ruleConfidence);

    // 关联店铺真实产品：根据识别出的品牌+类型，取出店铺可维修的具体型号
    const shopBrand = bestMatch.result.brand || '';
    const shopType = bestMatch.result.type || '';
    const shopModels = resolveShopModels(shopType, shopBrand);

    // 候选设备类型：优先用店铺真实型号；若 AI 直接识别到具体型号且不在目录中，则置顶补充
    let candidates = shopModels.slice();
    const aiModel = (aiResult.model || '').trim();
    if (aiModel && aiModel.length > 3 && !candidates.includes(aiModel)) {
      candidates = [aiModel, ...candidates];
    }
    // 建议型号：优先用店铺真实型号，否则退回规则提示
    const suggestedModels = shopModels.length
      ? shopModels
      : (bestMatch.result.modelHint ? [bestMatch.result.modelHint] : []);

    // 结合颜色等特征，给出更具体的设备类型描述
    const colorHint = aiResult.color ? `颜色(${aiResult.color})` : '';
    const featureHint = bestMatch.result.modelHint || '';
    const specificDesc = [featureHint, colorHint]
      .filter(Boolean)
      .join(' + ') || bestMatch.result.name;

    // 匹配度最高的前几条候选（供前端展示"可能是什么设备"）
    const matchCandidates = scored.slice(0, 5).map(s => ({
      name: s.rule.result.name,
      type: s.rule.result.type,
      brand: s.rule.result.brand,
      series: s.rule.result.series,
      matchScore: Number(s.score.toFixed(3)),
      confidence: s.rule.result.confidence
    }));

    return {
      ...aiResult,
      name: bestMatch.result.name,
      type: bestMatch.result.type || aiResult.type,
      series: bestMatch.result.series,
      brand: shopBrand || aiResult.brand || '',
      model: aiResult.model || '',  // 保留 AI 可能识别到的具体型号
      modelHint: bestMatch.result.modelHint || '',
      suggestedModels: suggestedModels,
      shopModels: shopModels,        // 店铺真实可维修的具体型号
      candidates: candidates,        // 供用户点选确认的候选设备类型
      shopBrand: shopBrand,
      shopType: shopType,
      confidence: Math.min(finalConfidence, 0.7), // 规则匹配置信度上限 0.7
      ruleMatched: true,
      matchedSeries: bestMatch.result.series,
      // 新增：特征匹配度与候选排序（按匹配度从高到低）
      matchScore: Number(best.score.toFixed(3)),
      matchCandidates: matchCandidates,
      description: aiResult.description ||
        `基于特征匹配: ${specificDesc}`,
    };
  }

  // 命中了大类但没有匹配到具体品牌规则（如无品牌/未知品牌的路由器、服务器、显卡）
  // → 至少把"大方向"定对，并尽量关联店铺型号，避免误判成手机
  if (hardCategory) {
    const shopBrand = aiResult.brand || '';
    const shopModels = resolveShopModels(hardCategory, shopBrand);
    console.log(`[Scan] 大类锁定但无品牌规则匹配 → type=${hardCategory}, brand=${shopBrand || '未知'}, 店铺型号数=${shopModels.length}`);
    return {
      ...aiResult,
      type: hardCategory,
      brand: shopBrand,
      shopType: hardCategory,
      shopBrand: shopBrand,
      shopModels: shopModels,
      suggestedModels: shopModels,
      candidates: shopModels.slice(),
      ruleMatched: false,
      matchedSeries: null,
    };
  }

  // 没有规则匹配 → 使用 AI 的原始结果，但尝试推断类型
  console.log('[Scan] 无规则匹配，使用 AI 原始结果');
  return {
    ...aiResult,
    ruleMatched: false,
    matchedSeries: null,
  };
}

function normalizeDeviceType(rawType) {
  if (!rawType) return null;
  const t = rawType.trim();
  // 精确匹配
  if (SUPPORTED_TYPES.includes(t)) return t;
  // 模糊匹配
  const lower = t.toLowerCase();
  if (lower.includes('手机') || /\b(iphone|smartphone|mobilephone|phone)\b/.test(lower)) return '手机';
  if (lower.includes('电脑') || lower.includes('笔记本') || lower.includes('laptop') || lower.includes('computer')) return '电脑/笔记本';
  if (lower.includes('平板') || lower.includes('pad') || lower.includes('tablet') || lower.includes('ipad')) return '平板';
  if (lower.includes('手表') || lower.includes('手环') || lower.includes('watch') || lower.includes('band')) return '手表/手环';
  if (lower.includes('耳机') || lower.includes('音响') || lower.includes('音箱') || lower.includes('headphone') || lower.includes('speaker') || lower.includes('earbud')) return '耳机/音响';
  if (lower.includes('相机') || lower.includes('摄像') || lower.includes('camera')) return '相机/摄像机';
  if (lower.includes('游戏') || lower.includes('game') || lower.includes('switch') || lower.includes('playstation') || lower.includes('ps5') || lower.includes('ps4') || lower.includes('xbox')) return '游戏机';
  if (lower.includes('传感器') || lower.includes('仪器') || lower.includes('仪表') || lower.includes('sensor') || lower.includes('检测')) return '传感器/仪器';
  if (lower.includes('无人机') || lower.includes('航拍') || lower.includes('drone')) return '无人机/航拍';
  if (lower.includes('智能') || lower.includes('家居') || lower.includes('音箱') || lower.includes('门锁') || lower.includes('扫地') || lower.includes('摄像头') || lower.includes('smart') || lower.includes('home')) return '智能家居';
  if (lower.includes('打印') || lower.includes('投影') || lower.includes('办公') || lower.includes('printer') || lower.includes('projector')) return '打印机/办公设备';
  if (lower.includes('服务器') || lower.includes('server') || lower.includes('机架') || lower.includes('rack') || lower.includes('poweredge') || lower.includes('proliant') || lower.includes('thinksystem')) return '服务器';
  if (lower.includes('路由') || lower.includes('router') || lower.includes('交换机') || lower.includes('switch') || lower.includes('网络') || lower.includes('wifi') || lower.includes('ap') || lower.includes('网关')) return '路由器/网络设备';
  if (lower.includes('显卡') || lower.includes('gpu') || lower.includes('graphics') || lower.includes('rtx') || lower.includes('radeon') || lower.includes('arc') || lower.includes('硬件')) return '显卡/电脑硬件';
  return null; // 不匹配任何已知类型 → 返回 null，前端会标记为自定义
}

/**
 * 从 AI 返回的混合文本中提取 JSON
 * Qwen-VL 经常返回"分析文字 + JSON"，需要鲁棒的提取逻辑
 */
function extractJSON(text) {
  // 策略1：找 ```json ... ``` 代码块
  const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (blockMatch) {
    try { return JSON.parse(blockMatch[1].trim()); } catch (e) {}
  }

  // 策略2：找所有可能的 { ... } JSON 块（从最后一个开始，因为 JSON 通常在末尾）
  const braces = [];
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        braces.push({ start, end: i + 1, jsonStr: text.substring(start, i + 1) });
        start = -1;
      }
    }
  }

  // 从后往前尝试解析，选第一个完整的 JSON（通常也是最后一个）
  for (let i = braces.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(braces[i].jsonStr);
      // 验证是我们需要的设备信息（至少要有 name 或 type）
      if (obj && (obj.name || obj.type)) {
        console.log(`[Scan] 从位置 ${braces[i].start} 提取到 JSON`);
        return obj;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

/**
 * 从 AI 分析文本中提取设备特征（JSON 解析失败时的兜底方案）
 */
function extractFromText(text) {
  const result = {
    name: '',
    type: '',
    brand: '',
    model: '',
    color: '',
    confidence: 0.35,
    description: '',
    features: {
      shape: '',
      cameraCount: 0,
      cameraLayout: '',
      screenFeature: '',
      logoVisible: false
    },
    _rawText: text   // 保留原始文本供规则匹配使用
  };

  // 提取外形/形状
  const shapeMatch = text.match(/【外形】(?:[：:]\s*)?(.+?)(?:\n|$)/);
  if (shapeMatch) {
    result.features.shape = shapeMatch[1].trim();
    result.type = result.features.shape;
  }

  // 提取摄像头个数
  const camCountMatch = text.match(/【摄像头】(?:[：:]\s*)?.*?个数\s*[\(（]?\s*(\d+)/);
  if (camCountMatch) {
    result.features.cameraCount = parseInt(camCountMatch[1]) || 0;
  }

  // 提取摄像头排列方式
  const camLayoutMatch = text.match(/排列方式\s*[\(（]?\s*(.+?)[\)）]?/);
  if (camLayoutMatch) {
    result.features.cameraLayout = camLayoutMatch[1].trim();
  }

  // 提取屏幕特征
  const screenMatch = text.match(/顶部特征.*?(?:[：:]\s*)?(刘海|挖孔|灵动岛|水滴)(?:\)|\s|$)/);
  if (screenMatch) {
    result.features.screenFeature = screenMatch[1].trim();
  }

  // 提取品牌
  const brandPatterns = [
    { pattern: /苹果|Apple/i, name: 'Apple' },
    { pattern: /华为|Huawei/i, name: '华为' },
    { pattern: /三星|Samsung/i, name: 'Samsung' },
    { pattern: /小米|Xiaomi/i, name: '小米' },
    { pattern: /OPPO/i, name: 'OPPO' },
    { pattern: /vivo/i, name: 'vivo' },
    { pattern: /荣耀|Honor/i, name: '荣耀' },
    { pattern: /联想|Lenovo/i, name: '联想' },
    { pattern: /戴尔|Dell/i, name: 'Dell' },
    { pattern: /惠普|HP/i, name: 'HP' },
    { pattern: /华硕|ASUS/i, name: '华硕' },
    { pattern: /索尼|Sony/i, name: '索尼' },
    { pattern: /大疆|DJI/i, name: '大疆' },
    { pattern: /任天堂|Nintendo/i, name: '任天堂' },
    { pattern: /佳能|Canon/i, name: 'Canon' },
    { pattern: /尼康|Nikon/i, name: 'Nikon' },
    { pattern: /富士|Fujifilm|Fuji/i, name: '富士' },
  ];
  
  const logoMatch = text.match(/【logo】(?:[：:]\s*)?(.+?)(?:\n|$)/);
  const logoText = logoMatch ? logoMatch[1] : text;
  for (const bp of brandPatterns) {
    if (bp.pattern.test(logoText)) {
      result.brand = bp.name;
      result.features.logoVisible = true;
      break;
    }
  }

  // 提取颜色
  const colorMatch = text.match(/【颜色】(?:[：:]\s*)?(.+?)(?:\n|$)/);
  if (colorMatch) {
    const raw = colorMatch[1].trim();
    result.color = raw.replace(/[（(].*?[）)]/g, '').trim() || raw;
  }

  // 构建名称：去除"直板手机"等形状描述，转为品牌+系列
  let cleanType = result.type || '';
  cleanType = cleanType.replace(/^(直板|折叠屏|翻盖|触屏)\s*/g, '');
  
  if (result.brand) {
    const brandMap = {
      'Apple': 'iPhone',
      '苹果': 'iPhone',
      '华为': '华为手机',
      'Samsung': 'Samsung Galaxy',
      '三星': 'Samsung Galaxy',
      '小米': '小米手机',
    };
    const mapped = brandMap[result.brand];
    if (mapped) {
      result.name = mapped;
    } else {
      result.name = cleanType ? `${result.brand} ${cleanType}` : result.brand;
    }
  }
  if (!result.name) result.name = cleanType || '未知设备';

  // 截取前200字作为描述
  result.description = text.substring(0, 200).replace(/\n/g, ' ');

  console.log('[Scan] 从文本提取:', result);
  return result;
}

/**
 * 调用 Qwen-VL 视觉模型识别设备
 */
async function identifyDeviceWithAI(imageBase64Url) {
  const systemPrompt = `你是电子设备视觉识别器。只输出一个 JSON 对象，不要输出任何分析文字、解释或 markdown。

=== 任务 ===
观察图片中的电子设备，按以下格式输出 JSON：

{
  "brand": "品牌名称(中文优先，如苹果/华为/三星/小米/OPPO/vivo/索尼/大疆/联想/戴尔/惠普/华硕/佳能/尼康/任天堂。找不到就留空)",
  "type": "设备类型(从下面选一项: 手机/电脑/笔记本/平板/手表/手环/耳机/音箱/相机/摄像机/游戏机/无人机/传感器/智能家居/打印机/服务器/路由器/交换机/网络设备/显卡)",
  "color": "颜色(如黑/白/金/灰/银/蓝/红/深灰。多色选主色)  ",
  "model": "如果图片中有可见的型号文字才填，否则留空",
  "confidence": 0.5,
  "description": "简短描述(20字以内)",
  "features": {
    "shape": "外形: 直板手机/折叠屏手机/笔记本电脑/平板/手表/手环/TWS耳机/头戴耳机/音箱/相机/游戏机/无人机/服务器/机架服务器/塔式服务器/路由器/交换机/显卡/其他",
    "cameraCount": 摄像头个数(数字: 0/1/2/3/4/5),
    "cameraLayout": "摄像头排列: 左上竖排/左上矩阵/左上三角/中间横排/中间竖排/中间矩阵/圆形/圆环/无/其他",
    "screenFeature": "屏幕特征: 刘海/挖孔/灵动岛/水滴/无/不可见",
    "logoVisible": true或false
  }
}

=== 判断要点 ===
- 手机三摄左上竖排 + 刘海 → 可能是 iPhone 13~16 标准版
- 手机三摄左上竖排 + 灵动岛 → 可能是 iPhone 14 Pro/15 Pro/16 Pro
- 圆形或圆环摄像头模组 → 很可能是 华为 Mate 系列 或 荣耀 Magic 系列
- 手机三摄圆心竖排 → 很可能是 Samsung Galaxy S 系列
- 【重要】带外置天线的方形/扁平盒子、有网口(RJ45)、无屏幕 → 是"路由器"或"交换机"，绝不是手机！(如小米/华为/TP-LINK 路由器常见2~8根天线)
- 【重要】机架式(1U/2U，很宽很扁)或塔式、正面有很多硬盘位和散热孔、多网口 → 是"服务器"(戴尔/惠普/联想/华为/浪潮/新华三)
- 【重要】带风扇和金属散热片的独立电路板卡、有金手指和PCIe接口 → 是"显卡"(NVIDIA/AMD/英特尔)
- logo 是判断品牌的核心依据；看不到 logo 则 logoVisible=false、brand 留空
- confidence: logo清晰=0.55, 有型号文字=0.80+, 无logo仅凭外形=0.35

只输出上面格式的 JSON，不要添加任何其他文字！`; 

  const userMessage = [
    { type: 'text', text: '识别这张图片中的电子设备，必须输出包含 features 字段的 JSON。' },
    { type: 'image_url', image_url: { url: imageBase64Url } }
  ];

  console.log('[Scan] 调用 Qwen-VL 视觉分类...');

  const response = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.05,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Scan] Qwen-VL API 错误:', response.status, errorText);
    throw new Error(`视觉识别服务异常 (${response.status})`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    console.error('[Scan] 异常响应结构:', JSON.stringify(data).substring(0, 300));
    throw new Error('AI 返回格式异常');
  }

  const rawContent = data.choices[0].message.content.trim();
  console.log('[Scan] Qwen-VL 回复 (前300字):', rawContent.substring(0, 300));

  // 提取 JSON
  let result = extractJSON(rawContent);

  // 兜底：从纯文本提取
  if (!result) {
    console.log('[Scan] JSON 提取失败，尝试从文本中提取特征...');
    result = extractFromText(rawContent);
  }

  if (!result.name && !result.type) {
    throw new Error('AI 未识别到设备信息');
  }

  // === 应用规则引擎进行精准匹配 ===
  const matchedResult = matchDeviceByRules(result);

  // --- 后处理：规范化类型归属 ---
  const normalizedType = normalizeDeviceType(matchedResult.type);
  if (!normalizedType) {
    matchedResult.type = matchedResult.type || '自定义';
    matchedResult._isCustom = true;
    console.log('[Scan] 设备类型不在支持列表中，标记为自定义:', matchedResult.type);
  } else {
    matchedResult.type = normalizedType;
    matchedResult._isCustom = false;
  }

  // 压低高置信度的异常值
  if (typeof matchedResult.confidence === 'number' && matchedResult.confidence > 0.7 && !matchedResult.model) {
    matchedResult.confidence = Math.min(matchedResult.confidence, 0.65);
    console.log('[Scan] 无型号信息，压低置信度至:', matchedResult.confidence);
  }

  return { success: true, device: matchedResult };
}

/**
 * 本地 fallback 识别（AI 不可用时基于文件特征）
 */
function fallbackIdentify(file) {
  const mimeType = file.mimetype || 'image/jpeg';
  const size = file.size;
  
  return {
    success: true,
    device: {
      name: '未知设备',
      type: '',
      brand: '',
      model: '',
      color: '',
      confidence: 0.3,
      description: `图片大小: ${(size / 1024).toFixed(1)}KB，类型: ${mimeType}。AI 服务暂不可用，无法自动识别设备型号，建议手动添加设备信息。`
    }
  };
}

/**
 * POST /api/scan/identify
 * 拍照识别设备 — 上传图片，AI 返回设备信息
 */
router.post('/identify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传设备图片'
      });
    }

    const file = req.file;
    const mimeType = file.mimetype || 'image/jpeg';
    
    console.log('[Scan] 收到图片:', file.originalname, `(${(file.size / 1024).toFixed(1)}KB)`);

    // 图片压缩：如果超过 2MB，使用 sharp 压缩
    let imageBuffer = file.buffer;
    let finalMimeType = mimeType;

    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      
      // 限制最大尺寸为 1024px 宽
      if (metadata.width > 1024 || imageBuffer.length > 2 * 1024 * 1024) {
        imageBuffer = await sharp(imageBuffer)
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        finalMimeType = 'image/jpeg';
        console.log('[Scan] 图片已压缩:', 
          `原始: ${(file.size / 1024).toFixed(1)}KB`, 
          `→ 压缩后: ${(imageBuffer.length / 1024).toFixed(1)}KB`
        );
      }
    } catch (sharpError) {
      console.warn('[Scan] sharp 不可用，使用原始图片:', sharpError.message);
    }

    // 转 base64
    const imageBase64Url = bufferToBase64Url(imageBuffer, finalMimeType);

    // 调用 AI 识别
    let result;
    try {
      result = await identifyDeviceWithAI(imageBase64Url);
    } catch (aiError) {
      console.error('[Scan] AI 识别失败，使用 fallback:', aiError.message);
      result = fallbackIdentify(file);
    }

    // 确保返回格式统一
    if (!result.device) {
      result = { success: true, device: result };
    }

    // 将上传的原图保存一份到 uploads 目录，供后续使用
    let imageUrl = '';
    try {
      const uploadDir = path.join(__dirname, '../uploads/scans');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
      const filePath = path.join(uploadDir, filename);
      
      // 保存压缩后的图片
      fs.writeFileSync(filePath, imageBuffer);
      imageUrl = `/uploads/scans/${filename}`;
    } catch (saveError) {
      console.warn('[Scan] 保存图片失败:', saveError.message);
    }

    res.json({
      success: true,
      data: {
        ...result.device,
        imageUrl: imageUrl || null,
        identifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Scan] 识别失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '设备识别失败，请稍后重试'
    });
  }
});

module.exports = router;
