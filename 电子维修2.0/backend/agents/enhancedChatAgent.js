const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/auth');
const db = require('../database');

// 加载环境变量
dotenv.config({ path: require('path').join(__dirname, '../.env') });

// Deepseek API配置
const DEEPSEEK_API_KEY = process.env.Deepseek_api_key || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class EnhancedChatAgent {
  constructor() {
    // 业务范围定义：明确业务内的设备类型和品牌
    this.businessScope = {
      // 常规业务内设备（有标准定价）
      standardDevices: {
        deviceTypes: [
          // 手机类
          '手机', 'iPhone', '安卓手机', '智能手机', '功能手机', '折叠屏手机',
          // 电脑类
          '平板', 'iPad', '安卓平板', '电脑', '笔记本', 'MacBook', '台式机', '一体机', '超极本', '游戏本', '商务本',
          // 穿戴设备
          '智能手表', 'Apple Watch', '运动手表', '手环', '智能手环', '智能戒指',
          // 音频设备
          '耳机', '蓝牙耳机', '有线耳机', 'AirPods', '入耳式耳机', '头戴式耳机', '无线耳机', '降噪耳机', '骨传导耳机',
          // 显示器类
          '显示器', '液晶显示器', 'OLED显示器', '曲面屏', '电竞显示器'
        ],
        deviceBrands: [
          '苹果', 'Apple', 'iPhone', 'iPad', 'MacBook', 'Mac', 'iMac', 'Mac Pro', 'Mac mini', 'iPod', 'Apple Watch', 'AirPods',
          '华为', '荣耀', 'Honor', 'Mate', 'P系列', 'Nova',
          '小米', '红米', 'Redmi',
          'OPPO', '一加', 'OnePlus', 'realme',
          'vivo', 'iQOO',
          '三星', 'Samsung', 'Galaxy',
          'Sony', '索尼',
          'LG', 'HTC', '诺基亚', '中兴',
          '联想', 'ThinkPad', 'Lenovo', '拯救者', '小新',
          '戴尔', 'Dell', 'XPS', 'Alienware',
          '惠普', 'HP', 'Pavilion', 'EliteBook',
          '华硕', 'ASUS', 'ROG',
          '宏碁', 'Acer', '掠夺者',
          '微星', 'MSI',
          '神舟', '雷神', '机械革命',
          'Surface', '微软', 'Microsoft'
        ]
      },
      // 业务内但需要专业评估的设备
      specialDevices: {
        deviceTypes: [
          // 摄影器材
          '相机', '单反', '微单', '运动相机', '数码相机', '拍立得', '镜头', '闪光灯', '云台', '稳定器',
          // 无人机/航拍
          '无人机', '航拍无人机', '航拍机', '多旋翼', '固定翼', '直升机', '多轴飞行器',
          // 游戏设备
          '游戏机', '主机', '掌机', 'PS5', 'PS4', 'PS3', 'Xbox', 'Series X', 'Series S', 'Xbox One', 'Switch', '任天堂',
          // VR/AR设备
          'VR', '虚拟现实', 'AR', '增强现实', 'MR', '混合现实', 'VR头显', 'VR头盔', 'VR眼镜', 'Quest', 'Oculus', 'Vive', 'Pico',
          // 网络设备
          '路由器', '交换机', '调制解调器', 'Mesh', '网关',
          // 智能家居
          '智能音箱', '智能门锁', '智能摄像头', '智能家电', '扫地机器人', '智能灯泡', '智能插座',
          // 办公设备
          '打印机', '扫描仪', '投影仪', '投影机', '复印机', '传真机',
          // 专业设备
          '示波器', '万用表', '电烙铁', '热风枪', '焊台'
        ],
        deviceBrands: [
          '佳能', 'Canon', '尼康', 'Nikon', '富士', 'Fujifilm', '奥林巴斯', 'Olympus',
          '松下', 'Panasonic', '宾得', 'Pentax', '理光', 'Ricoh', '哈苏', 'Hasselblad',
          '飞思', 'Phase One', '莱卡', 'Leica', '蔡司', 'Zeiss',
          'GoPro', 'Insta360', '影石',
          '大疆', 'DJI', 'Mavic', 'Phantom', 'Mini', 'Inspire', 'Spark', 'Osmo', 'Ronin', 'Zenmuse',
          '任天堂', 'Nintendo', 'Switch',
          'PlayStation', 'PS',
          '微软', 'Xbox',
          'Meta', 'Quest', 'Oculus',
          'HTC', 'Vive', 'Pico',
          'TP-Link', '华硕', '网件', '领势', 'Ubiquiti',
          '小米', '华为', '天猫精灵', '小度', '小爱', '小蚁', '360',
          '爱普生', 'Epson', '惠普', 'HP', '兄弟', 'Brother',
          '极米', '坚果', '当贝', '明基', 'BenQ'
        ]
      }
    };

    // 标准设备的参考价格范围（用于给出大概估价）
    this.pricingReference = {
      // 手机类
      手机: {
        屏幕维修: { min: 200, max: 2500, note: 'OLED屏比LCD贵，折叠屏最贵' },
        电池更换: { min: 80, max: 400, note: '官方原装电池价格较高，第三方电池更便宜' },
        主板维修: { min: 300, max: 2000, note: '根据损坏程度报价，进水腐蚀较贵' },
        摄像头维修: { min: 150, max: 1000, note: '后置摄像头较前置摄像头贵，多摄更贵' },
        充电接口: { min: 80, max: 300, note: '需要拆机焊接，Type-C比Lightning贵' },
        听筒扬声器: { min: 50, max: 200, note: '包括听筒、扬声器、麦克风' },
        进水维修: { min: 100, max: 800, note: '视进水程度和腐蚀情况定价' },
        数据恢复: { min: 200, max: 2000, note: '根据数据量和难度定价' },
        信号故障: { min: 100, max: 500, note: '包括基带、天线、射频维修' },
        面容指纹: { min: 200, max: 800, note: 'Face ID比指纹识别贵' }
      },
      // 平板类
      平板: {
        屏幕维修: { min: 300, max: 3000, note: 'iPad Pro系列最高，外屏比内屏便宜' },
        电池更换: { min: 150, max: 600, note: '需要专业拆机，大容量电池较贵' },
        主板维修: { min: 400, max: 3000, note: '根据损坏程度报价' },
        触摸屏失灵: { min: 200, max: 1500, note: '触摸层更换或排线维修' },
        充电故障: { min: 80, max: 300, note: '接口或充电IC维修' },
        WiFi故障: { min: 100, max: 500, note: 'WiFi模块或天线维修' }
      },
      // 电脑类
      电脑: {
        屏幕维修: { min: 400, max: 4000, note: '4K/OLED屏较贵，笔记本比台式显示器贵' },
        电池更换: { min: 200, max: 1000, note: '笔记本电池，大容量较贵' },
        主板维修: { min: 500, max: 5000, note: '根据损坏程度和型号，高端游戏本更贵' },
        显卡维修: { min: 300, max: 3000, note: '独立显卡维修，高端显卡更贵' },
        键盘更换: { min: 150, max: 800, note: '笔记本键盘，背光键盘较贵' },
        硬盘数据恢复: { min: 300, max: 3000, note: 'SSD数据恢复比机械硬盘贵' },
        散热系统: { min: 100, max: 600, note: '风扇更换、散热膏、散热管维修' },
        系统重装: { min: 50, max: 200, note: '含驱动安装和基础软件配置' },
        蓝屏死机: { min: 100, max: 800, note: '根据故障原因定价' },
        接口维修: { min: 80, max: 500, note: 'USB/HDMI/Type-C等接口维修' }
      },
      // 耳机类
      耳机: {
        电池更换: { min: 50, max: 200, note: '左右耳均更换' },
        音频单元: { min: 100, max: 500, note: '根据型号和品质报价' },
        充电盒维修: { min: 80, max: 350, note: '包括充电接口、电池、电路板' },
        蓝牙故障: { min: 80, max: 300, note: '蓝牙模块维修或更换' },
        降噪功能: { min: 100, max: 400, note: 'ANC降噪模块维修' },
        线缆断裂: { min: 30, max: 150, note: '有线耳机线缆更换' },
        头梁耳垫: { min: 50, max: 300, note: '头戴式耳机的头梁和耳垫更换' }
      },
      // 手表类
      手表: {
        屏幕维修: { min: 300, max: 2000, note: 'Apple Watch Ultra最高，AMOLED屏较贵' },
        电池更换: { min: 150, max: 500, note: '含防水处理和密封' },
        表带更换: { min: 50, max: 500, note: '原装表带价格较高' },
        防水失效: { min: 100, max: 400, note: '重新密封和防水测试' },
        传感器故障: { min: 200, max: 600, note: '心率/血氧/GPS传感器维修' },
        充电故障: { min: 80, max: 300, note: '充电线圈或接口维修' }
      },
      // 相机类
      相机: {
        镜头维修: { min: 300, max: 5000, note: '根据镜头类型和损坏程度，变焦镜头较贵' },
        传感器清洁: { min: 100, max: 300, note: '专业清洁CMOS/CCD传感器' },
        快门故障: { min: 200, max: 1500, note: '快门组件更换或维修' },
        主板维修: { min: 500, max: 3000, note: '根据型号和损坏程度' },
        取景器故障: { min: 200, max: 800, note: 'EVF/OVF取景器维修' },
        防抖维修: { min: 200, max: 1000, note: '光学防抖/OIS模块维修' },
        进水维修: { min: 200, max: 2000, note: '视进水程度和腐蚀情况' }
      },
      // 无人机类
      无人机: {
        云台维修: { min: 300, max: 3000, note: '三轴云台校准或更换' },
        电机更换: { min: 100, max: 800, note: '单个电机价格，4个全部更换较贵' },
        螺旋桨更换: { min: 30, max: 200, note: '整套螺旋桨更换' },
        电池维修: { min: 200, max: 1500, note: '智能电池维修或更换' },
        主板维修: { min: 500, max: 3000, note: '飞控主板维修' },
        GPS模块: { min: 100, max: 500, note: 'GPS定位模块维修' },
        遥控器维修: { min: 200, max: 1000, note: '遥控器屏幕、摇杆、按键维修' },
        图传故障: { min: 200, max: 1500, note: '图传模块维修或更换' }
      },
      // 游戏机类
      游戏机: {
        光驱故障: { min: 200, max: 800, note: '光盘驱动器维修或更换' },
        散热维修: { min: 100, max: 500, note: '风扇、散热膏、散热管维修' },
        HDMI接口: { min: 100, max: 400, note: 'HDMI端口更换' },
        手柄维修: { min: 50, max: 300, note: '摇杆漂移、按键失灵等' },
        硬盘更换: { min: 200, max: 800, note: 'SSD升级或更换' },
        主板维修: { min: 300, max: 2000, note: '根据损坏程度报价' },
        电源故障: { min: 100, max: 500, note: '电源模块维修或更换' }
      },
      // 显示器类
      显示器: {
        屏幕面板: { min: 500, max: 5000, note: '面板更换，4K/OLED最贵' },
        背光维修: { min: 200, max: 1000, note: 'LED背光条更换' },
        驱动板维修: { min: 150, max: 800, note: '逻辑板/驱动板维修' },
        电源板维修: { min: 100, max: 500, note: '电源板维修或更换' },
        接口维修: { min: 80, max: 300, note: 'HDMI/DP/Type-C接口更换' }
      },
      // 打印机类
      打印机: {
        喷头清洗: { min: 50, max: 200, note: '喷墨打印机喷头清洗' },
        喷头更换: { min: 200, max: 1000, note: '喷头组件更换' },
        走纸故障: { min: 100, max: 500, note: '搓纸轮、传感器维修' },
        主板维修: { min: 200, max: 800, note: '打印机主板维修' },
        墨路系统: { min: 100, max: 600, note: '连续供墨系统维修' }
      },
      // 家用电器类（常见可修小家电）
      小家电: {
        电饭煲维修: { min: 50, max: 300, note: '电饭煲常见故障维修' },
        电磁炉维修: { min: 30, max: 200, note: '电磁炉主板/线圈维修' },
        微波炉维修: { min: 80, max: 400, note: '微波炉常见故障' },
        电风扇维修: { min: 30, max: 150, note: '电风扇电机/电路板维修' },
        吸尘器维修: { min: 50, max: 300, note: '吸尘器常见故障维修' }
      },
      // 音频/卡拉OK设备
      音频设备: {
        音响维修: { min: 100, max: 1500, note: '音响功放/扬声器维修' },
        功放维修: { min: 150, max: 2000, note: '功放机维修' },
        效果器维修: { min: 100, max: 800, note: '效果器/调音台维修' },
        话筒维修: { min: 50, max: 500, note: '话筒/麦克风维修' },
        KTV设备: { min: 200, max: 3000, note: 'KTV点歌机/专业音响维修' }
      }
    };

    // 设备回收估价参考（根据设备类型和成色）
    this.recyclePricingReference = {
      手机: {
        近新: { rate: '60%-85%', note: '无划痕无维修无进水，电池健康90%以上' },
        良好: { rate: '40%-60%', note: '轻微使用痕迹，功能正常' },
        一般: { rate: '25%-40%', note: '有明显使用痕迹，电池需更换' },
        较差: { rate: '10%-25%', note: '有故障或明显损坏' }
      },
      电脑: {
        近新: { rate: '50%-75%', note: '外观完好，配置较新，无维修史' },
        良好: { rate: '35%-50%', note: '正常使用痕迹，功能完好' },
        一般: { rate: '20%-35%', note: '有明显磨损，配置老旧' },
        较差: { rate: '5%-20%', note: '有故障或硬件损坏' }
      },
      平板: {
        近新: { rate: '55%-75%', note: '外观完好，无维修无划痕' },
        良好: { rate: '35%-55%', note: '轻微划痕，功能正常' },
        一般: { rate: '20%-35%', note: '有磕碰或电池老化' },
        较差: { rate: '8%-20%', note: '屏幕有破损或硬件故障' }
      },
      手表: {
        近新: { rate: '50%-70%', note: '外观完好，电池正常，无划痕' },
        良好: { rate: '30%-50%', note: '轻微使用痕迹，表带微磨损' },
        一般: { rate: '15%-30%', note: '有明显使用痕迹或划痕' },
        较差: { rate: '5%-15%', note: '屏幕有破损或功能异常' }
      },
      相机: {
        近新: { rate: '50%-70%', note: '快门数少，外观完好，镜头无霉' },
        良好: { rate: '35%-50%', note: '正常使用，功能完好' },
        一般: { rate: '20%-35%', note: '快门数高，有使用痕迹' },
        较差: { rate: '8%-20%', note: '有故障或明显损坏' }
      },
      无人机: {
        近新: { rate: '45%-65%', note: '无明显磕碰，正常飞行，电池循环少' },
        良好: { rate: '25%-45%', note: '轻微磕碰，正常功能' },
        一般: { rate: '10%-25%', note: '有过维修或电池老化' },
        较差: { rate: '3%-15%', note: '需要维修才能正常使用' }
      }
    };

    // 意图识别正则 - 精简版，避免过度匹配
    this.intents = {
      // 数据恢复优先判断（因为"数据"这个词容易匹配到repair）
      data_recovery: /(数据恢复|数据丢失|恢复数据|误删|格式化|清空数据|找回数据|找回照片|找回文件|照片丢失|文件丢失|聊天记录丢失|通讯录丢失|恢复照片|恢复文件|恢复聊天记录|硬盘数据|U盘数据|SD卡数据)/,
      // 进度查询优先判断
      progress: /(进度|状态|好了吗|完成|订单|维修到哪了|什么时候好|还要多久|发货|物流|快递|到了|收到|签收|已修|待修|维修中|检测中|待检测|待报价|报价中|待付款|待发货|待收货|已签收|已评价|已取消|已关闭)/,
      // 价格咨询
      pricing: /(价格|费用|多少钱|贵|便宜|报价|收费|价位|预算|怎么收费|什么价|贵不贵|收费标准|维修费|检测费|人工费|配件费)/,
      // 保修售后
      warranty: /(保修|质保|延保|三包|退换|退款|赔偿|差评|保修期|保修卡)/,
      // 预约咨询
      appointment: /(预约|时间|几点|安排|上门|取件|送修|到店|门店|营业时间|上班时间)/,
      // 配件咨询
      parts: /(配件|零件|原装|真伪|正品|行货|水货|翻新|二手)/,
      // 维修咨询 - 最核心的意图，涵盖所有维修相关关键词
      repair: /(修|坏|故障|不能用|不工作|碎屏|碎了|裂了|屏幕|电池|充电|开机|死机|无法|重启|蓝屏|黑屏|花屏|进水|摔|烫|卡顿|闪退|连不上|没信号|无信号|扬声器|听筒|麦克风|摄像|按键|主板|芯片|漏电|短路|烧|炸机|坠机|失控|漂移|摇杆|手柄|光驱|镜头|快门|对焦|变焦|防抖|云台|电机|桨叶|飞控|图传|喷头|卡纸|投影|降噪|蓝牙|WiFi|无线|网络|信号|触摸|指纹|面容|识别|充电口|充电器|耳机|手表|手环|相机|无人机|游戏机|打印机|显示器|路由器|交换机|扫地机|门锁|音箱|投影仪|扫描仪|VR|AR|稳定器|闪关灯|能修|可以修|想修|怎么修|维修|维修吗|能修吗)/,
      // 回收咨询 - 设备回收、翻新、二手评估
      recycle: /(回收|折价|卖掉|二手|估价|置换|以旧换新|买新|值多少钱|能卖多少|还值多少|回收价|换新|翻新|抵价|old.*new|trade.*in|sell.*device)/,
      general: /.*/
    };
  }

  // 判断设备是否在业务范围内
  isInBusinessScope(deviceType, deviceBrand) {
    if (!deviceType && !deviceBrand) return false;

    // 检查标准设备
    const { standardDevices, specialDevices } = this.businessScope;

    // 检查设备类型
    if (deviceType) {
      const inStandard = standardDevices.deviceTypes.some(type =>
        deviceType.toLowerCase().includes(type.toLowerCase()) ||
        type.toLowerCase().includes(deviceType.toLowerCase())
      );

      const inSpecial = specialDevices.deviceTypes.some(type =>
        deviceType.toLowerCase().includes(type.toLowerCase()) ||
        type.toLowerCase().includes(deviceType.toLowerCase())
      );

      if (inStandard || inSpecial) return inStandard ? 'standard' : 'special';
    }

    // 检查设备品牌
    if (deviceBrand) {
      const inStandard = standardDevices.deviceBrands.some(brand =>
        deviceBrand.toLowerCase().includes(brand.toLowerCase()) ||
        brand.toLowerCase().includes(deviceBrand.toLowerCase())
      );

      const inSpecial = specialDevices.deviceBrands.some(brand =>
        deviceBrand.toLowerCase().includes(brand.toLowerCase()) ||
        brand.toLowerCase().includes(deviceBrand.toLowerCase())
      );

      if (inStandard || inSpecial) return inStandard ? 'standard' : 'special';
    }

    return false;
  }

  // 获取设备回收估价范围
  getRecycleEstimate(deviceType) {
    if (!deviceType) return null;

    let matchedCategory = null;
    for (const category of Object.keys(this.recyclePricingReference)) {
      if (deviceType.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(deviceType.toLowerCase())) {
        matchedCategory = category;
        break;
      }
    }

    if (!matchedCategory) return null;
    return { category: matchedCategory, ...this.recyclePricingReference[matchedCategory] };
  }

  // 获取大概估价
  getEstimatedPrice(deviceType, problemDescription) {
    if (!deviceType) return null;

    // 找到匹配的设备类别
    let matchedCategory = null;
    for (const [category, prices] of Object.entries(this.pricingReference)) {
      if (deviceType.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(deviceType.toLowerCase())) {
        matchedCategory = category;
        break;
      }
    }

    if (!matchedCategory) return null;

    // 根据问题描述找到对应的价格范围
    if (problemDescription) {
      const prices = this.pricingReference[matchedCategory];
      for (const [issue, priceInfo] of Object.entries(prices)) {
        if (problemDescription.toLowerCase().includes(issue.toLowerCase()) ||
            issue.toLowerCase().includes(problemDescription.toLowerCase().split(' ')[0])) {
          return { issue, ...priceInfo };
        }
      }
    }

    // 如果没有匹配到具体问题，返回第一个价格项作为参考
    const prices = this.pricingReference[matchedCategory];
    const firstIssue = Object.keys(prices)[0];
    return { issue: firstIssue, ...prices[firstIssue] };
  }

  // 清理Markdown格式符号
  cleanMarkdown(text) {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/- \[ \]/g, '')
      .replace(/- \[x\]/g, '')
      .replace(/\|[^|]*/g, '')
      .replace(/---/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  getHelpSuggestions() {
    return [
      { type: 'quick_reply', text: '查询订单进度' },
      { type: 'quick_reply', text: '手机屏幕维修价格' },
      { type: 'quick_reply', text: '设备回收估价' },
      { type: 'quick_reply', text: '营业时间和客服电话' },
      { type: 'quick_reply', text: '系统版本和配置' }
    ];
  }

  getNoResultGuideReply(message) {
    return `暂时没有查到和"${message}"直接对应的数据。您还可以继续问我这些内容：订单进度、维修报价、设备回收、配件信息、营业时间、客服电话、上门服务、质保政策、系统版本、系统配置。也可以直接告诉我订单号、设备型号或想查询的配置项，我会继续帮您查。`;
  }

  isSystemConfigQuery(message) {
    return /(系统配置|配置项|参数|系统参数|版本|app|客服电话|联系电话|营业时间|服务时间|上班时间|下班时间)/i.test(message);
  }

  isKnowledgeQuery(message, intent) {
    return ['appointment', 'warranty', 'parts', 'pricing', 'recycle'].includes(intent) ||
      /(质保|保修|上门|到店|预约|营业时间|服务时间|价格说明|收费|配件|原装|数据安全|维修流程|回收|估价|成色|置换)/.test(message);
  }

  isAnalyticsQuery(message) {
    return /(最多|最少|排名|排行|统计|分析|top|谁.*最多|哪个人.*最多|订单最多|接单最多|完成最多|报价最多|维修人员.*多少单|工程师.*多少单|技师.*多少单)/i.test(message);
  }

  shouldUseDbQuery(message, intent, entities) {
    return Boolean(
      (intent === 'progress' && entities.orderId) ||
      this.isAnalyticsQuery(message) ||
      this.isSystemConfigQuery(message) ||
      this.isKnowledgeQuery(message, intent) ||
      ((intent === 'pricing' || intent === 'repair' || intent === 'parts' || intent === 'recycle') && (entities.deviceType || entities.deviceBrand))
    );
  }

  async tableExists(schemaName, tableName) {
    try {
      const rows = await db.query(
        `SELECT 1
         FROM information_schema.tables
         WHERE table_schema = ? AND table_name = ?
         LIMIT 1`,
        [schemaName, tableName]
      );
      return rows.length > 0;
    } catch (error) {
      console.error(`检查表是否存在失败 ${schemaName}.${tableName}:`, error.message);
      return false;
    }
  }

  async queryWithSchemaFallback(tableName, sqlBuilder) {
    const schemas = ['repair', 'cmms_db'];

    for (const schema of schemas) {
      const exists = await this.tableExists(schema, tableName);
      if (!exists) {
        continue;
      }

      try {
        const { sql, params = [] } = sqlBuilder(schema);
        const rows = await db.query(sql, params);
        if (Array.isArray(rows) && rows.length > 0) {
          return { rows, schema };
        }
      } catch (error) {
        console.error(`查询 ${schema}.${tableName} 失败:`, error.message);
      }
    }

    return { rows: [], schema: null };
  }

  async queryOrderProgress(orderId, userId = null) {
    return this.queryWithSchemaFallback('orders', (schema) => {
      let sql = `
        SELECT
          id,
          order_id AS order_no,
          device_model,
          problem_description,
          status,
          progress,
          progress_updated_at,
          updated_at
        FROM ${schema}.orders
        WHERE (order_id = ? OR id = ?)
      `;
      const params = [orderId, /^\d+$/.test(String(orderId)) ? Number(orderId) : -1];

      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }

      sql += ' ORDER BY updated_at DESC LIMIT 1';
      return { sql, params };
    });
  }

  async queryProductInfo(entities, message) {
    const keyword = entities.deviceBrand || entities.deviceType || message;
    return this.queryWithSchemaFallback('products', (schema) => ({
      sql: `
        SELECT name, brand, model, category, price_range, repair_types, common_issues
        FROM ${schema}.products
        WHERE name LIKE ? OR brand LIKE ? OR model LIKE ? OR category LIKE ?
        ORDER BY id DESC
        LIMIT 3
      `,
      params: [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    }));
  }

  async queryKnowledge(message, intent) {
    const categoryMap = {
      warranty: ['质保政策'],
      appointment: ['上门服务', '服务时间', '维修流程'],
      parts: ['配件质量'],
      pricing: ['价格说明'],
      general: ['服务时间', '维修流程', '价格说明']
    };

    const categories = categoryMap[intent] || [];

    return this.queryWithSchemaFallback('knowledge_base', (schema) => {
      let sql = `
        SELECT category, title, content
        FROM ${schema}.knowledge_base
        WHERE (title LIKE ? OR content LIKE ? OR category LIKE ?)
      `;
      const params = [`%${message}%`, `%${message}%`, `%${message}%`];

      if (categories.length > 0) {
        sql += ` OR category IN (${categories.map(() => '?').join(', ')})`;
        params.push(...categories);
      }

      sql += ' ORDER BY id DESC LIMIT 3';
      return { sql, params };
    });
  }

  async querySystemConfig(message) {
    const keyword = message.replace(/\s+/g, '');
    return this.queryWithSchemaFallback('system_config', (schema) => ({
      sql: `
        SELECT config_key, config_value, description
        FROM ${schema}.system_config
        WHERE config_key LIKE ? OR description LIKE ?
        ORDER BY id ASC
        LIMIT 10
      `,
      params: [`%${keyword}%`, `%${keyword}%`]
    }));
  }

  async queryTechnicianWorkload(message) {
    const wantsCompleted = /(完成|已完成|修好|完工)/.test(message);
    const wantsQuoted = /(报价|quoted|quote)/i.test(message);
    const wantsPending = /(待处理|待接单|未完成|处理中|processing)/.test(message);
    const wantsTop = !/(最少|倒数)/.test(message);
    const aggregateField = wantsQuoted ? 'quote_created_by' : 'assigned_to';

    let extraWhere = '';
    if (wantsCompleted) {
      extraWhere = ` AND o.status = 'completed' `;
    } else if (wantsQuoted) {
      extraWhere = ` AND o.quote_created_by IS NOT NULL `;
    } else if (wantsPending) {
      extraWhere = ` AND o.status IN ('pending', 'quoted', 'confirmed', 'processing') `;
    } else {
      extraWhere = ` AND o.order_type = 'repair' `;
    }

    return this.queryWithSchemaFallback('orders', (schema) => ({
      sql: `
        SELECT
          o.${aggregateField} AS user_id,
          COALESCE(u.real_name, u.nickname, u.username, CONCAT('用户#', o.${aggregateField})) AS technician_name,
          COUNT(*) AS order_count,
          SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
          SUM(CASE WHEN o.status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
          SUM(CASE WHEN o.status = 'quoted' THEN 1 ELSE 0 END) AS quoted_count
        FROM ${schema}.orders o
        LEFT JOIN ${schema}.users u ON u.id = o.${aggregateField}
        WHERE o.${aggregateField} IS NOT NULL
          AND o.${aggregateField} <> 0
          ${extraWhere}
        GROUP BY o.${aggregateField}, technician_name
        ORDER BY order_count ${wantsTop ? 'DESC' : 'ASC'}, user_id ASC
        LIMIT 5
      `,
      params: []
    }));
  }

  formatOrderProgressReply(row, schema) {
    const updatedTime = row.progress_updated_at || row.updated_at || '暂无更新时间';
    const progressText = row.progress !== null && row.progress !== undefined ? `${row.progress}%` : '暂无';
    return `已为您查到订单信息，数据来源：${schema}。订单号：${row.order_no || row.id}，当前状态：${row.status || '未知'}，当前进度：${progressText}，设备型号：${row.device_model || '未填写'}，故障描述：${row.problem_description || '未填写'}，最后更新时间：${updatedTime}。`;
  }

  formatProductReply(rows, schema) {
    const top = rows[0];
    let repairTypes = [];
    try {
      repairTypes = top.repair_types ? JSON.parse(top.repair_types) : [];
    } catch (error) {
      repairTypes = [];
    }

    const repairTypeText = repairTypes.length > 0 ? repairTypes.slice(0, 4).join('、') : '常规检测、报价和维修';
    return `已查到相关产品信息，数据来源：${schema}。${top.name}${top.model ? `（${top.model}）` : ''}，品牌：${top.brand || '未标注'}，分类：${top.category || '未标注'}，参考展示价：${top.price_range || '以检测报价为准'}。常见可维修项目包括：${repairTypeText}。如果您要进一步确认故障或报价，可以直接告诉我具体故障现象。`;
  }

  formatKnowledgeReply(rows, schema) {
    const top = rows[0];
    return `已查到相关说明，数据来源：${schema}。${top.title || top.category}：${top.content}`;
  }

  formatSystemConfigReply(rows, schema) {
    const topRows = rows.slice(0, 4).map(item => `${item.description || item.config_key}：${item.config_value}`);
    return `已查到系统配置，数据来源：${schema}。${topRows.join('；')}。如果您要查具体配置项，也可以直接说配置键名。`;
  }

  formatTechnicianAnalyticsReply(rows, schema, message) {
    const top = rows[0];
    const askCompleted = /(完成|已完成|修好|完工)/.test(message);
    const askQuoted = /(报价|quoted|quote)/i.test(message);
    const metricLabel = askQuoted ? '报价单量' : (askCompleted ? '完成单量' : '订单量');
    const tail = rows.slice(0, 3).map(item => `${item.technician_name}${metricLabel}${item.order_count}单`).join('，');

    return `已完成统计，数据来源：${schema}。当前${metricLabel}最多的是 ${top.technician_name}，共 ${top.order_count} 单。补充参考：${tail}。如果您需要，我还可以继续统计维修人员接单排行、完成排行、处理中排行、报价排行。`;
  }

  async tryStructuredReply(message, intent, entities, userId = null) {
    try {
      if (this.isAnalyticsQuery(message)) {
        const { rows, schema } = await this.queryTechnicianWorkload(message);
        if (rows.length > 0) {
          return {
            handled: true,
            reply: this.formatTechnicianAnalyticsReply(rows, schema, message),
            suggestedActions: [
              { type: 'quick_reply', text: '维修人员接单排行' },
              { type: 'quick_reply', text: '维修人员完成排行' },
              { type: 'quick_reply', text: '报价最多的人是谁' }
            ]
          };
        }

        return {
          handled: true,
          reply: this.getNoResultGuideReply(message),
          suggestedActions: this.getHelpSuggestions()
        };
      }

      if (intent === 'progress' && entities.orderId) {
        const { rows, schema } = await this.queryOrderProgress(entities.orderId, userId);
        if (rows.length > 0) {
          return {
            handled: true,
            reply: this.formatOrderProgressReply(rows[0], schema),
            suggestedActions: [
              { type: 'quick_reply', text: '这个订单什么时候修好' },
              { type: 'quick_reply', text: '这个订单报价是多少' },
              { type: 'button', text: '查看我的订单', action: 'query_order' }
            ]
          };
        }

        return {
          handled: true,
          reply: this.getNoResultGuideReply(message),
          suggestedActions: this.getHelpSuggestions()
        };
      }

      if (this.isSystemConfigQuery(message)) {
        const { rows, schema } = await this.querySystemConfig(message);
        if (rows.length > 0) {
          return {
            handled: true,
            reply: this.formatSystemConfigReply(rows, schema),
            suggestedActions: [
              { type: 'quick_reply', text: '营业时间' },
              { type: 'quick_reply', text: '客服电话' },
              { type: 'quick_reply', text: '系统版本' }
            ]
          };
        }

        return {
          handled: true,
          reply: this.getNoResultGuideReply(message),
          suggestedActions: this.getHelpSuggestions()
        };
      }

      if ((intent === 'pricing' || intent === 'repair' || intent === 'parts') && (entities.deviceType || entities.deviceBrand)) {
        const { rows, schema } = await this.queryProductInfo(entities, message);
        if (rows.length > 0) {
          return {
            handled: true,
            reply: this.formatProductReply(rows, schema),
            suggestedActions: [
              { type: 'quick_reply', text: '这个设备常见故障有哪些' },
              { type: 'quick_reply', text: '维修大概多少钱' },
              { type: 'button', text: '提交维修订单', action: 'submit_order' }
            ]
          };
        }
      }

      if ((intent === 'recycle') && (entities.deviceType || entities.deviceBrand)) {
        const { rows, schema } = await this.queryProductInfo(entities, message);
        const recycleEstimate = this.getRecycleEstimate(entities.deviceType);

        if (rows.length > 0 || recycleEstimate) {
          let reply = `可以回收！`;
          if (rows.length > 0) {
            const top = rows[0];
            reply += `已查到${entities.deviceType ? entities.deviceType : ''}${entities.deviceBrand ? entities.deviceBrand : ''}${top.model ? `（${top.model}）` : ''}的回收信息，`;
          }
          if (recycleEstimate) {
            const grades = Object.entries(recycleEstimate).filter(([k]) => k !== 'category');
            reply += `参考回收估价：${grades.map(([grade, info]) => `${grade}品约${info.rate}`).join('，')}。`;
          }
          reply += `具体价格需要您提交设备到回收页面，由专业人员根据实际成色、配件完整度和市场行情进行最终评估。`;
          return {
            handled: true,
            reply,
            suggestedActions: [
              { type: 'quick_reply', text: '提交回收申请怎么操作？' },
              { type: 'quick_reply', text: '设备成色标准是什么？' },
              { type: 'button', text: '前往回收评估', action: 'submit_recycle' }
            ]
          };
        }
      }

      if (this.isKnowledgeQuery(message, intent)) {
        const { rows, schema } = await this.queryKnowledge(message, intent);
        if (rows.length > 0) {
          return {
            handled: true,
            reply: this.formatKnowledgeReply(rows, schema),
            suggestedActions: [
              { type: 'quick_reply', text: '维修流程' },
              { type: 'quick_reply', text: '保修多久' },
              { type: 'quick_reply', text: '支持上门吗' }
            ]
          };
        }
      }

      return { handled: false };
    } catch (error) {
      console.error('结构化查询回复失败:', error);
      return { handled: false };
    }
  }

  // 强制清洗回复中的违规措辞 - 最后一道防线
  sanitizeReply(reply, entities) {
    // 违规措辞及其替换规则
    const forbiddenPatterns = [
      // 建议去别处维修的各种说法
      { pattern: /建议您[^。？！]*去专业维修店[^。？！]*/g, replacement: '我们就是专业维修团队，完全有能力处理' },
      { pattern: /建议您[^。？！]*到专业维修中心[^。？！]*/g, replacement: '我们就是专业维修团队，完全有能力处理' },
      { pattern: /建议[^。？！]*咨询其他维修中心[^。？！]*/g, replacement: '我们就是专业维修团队，完全有能力处理' },
      { pattern: /建议您[^。？！]*携带设备去[^。？！]*/g, replacement: '您可以直接在我们这里提交订单' },
      { pattern: /建议您[^。？！]*前往[^。？！]*维修[^。？！]*/g, replacement: '您可以直接在我们这里提交订单' },
      { pattern: /建议[^。？！]*联系其他[^。？！]*/g, replacement: '您可以直接联系我们' },
      { pattern: /建议[^。？！]*咨询其他[^。？！]*/g, replacement: '您可以直接咨询我们' },
      // "如果问题复杂"类
      { pattern: /如果问题复杂[^。？！]*建议[^。？！]*/g, replacement: '我们团队有丰富的经验，完全有能力处理' },
      { pattern: /如果故障复杂[^。？！]*建议[^。？！]*/g, replacement: '我们团队有丰富的经验，完全有能力处理' },
      // 拒绝性语言
      { pattern: /不在[^。？！]*服务范围[^。？！]*/g, replacement: '在我们的服务范围内' },
      { pattern: /超出[^。？！]*业务范围[^。？！]*/g, replacement: '在我们的业务范围内' },
      { pattern: /不在[^。？！]*业务范围[^。？！]*/g, replacement: '在我们的业务范围内' },
      { pattern: /无法维修/g, replacement: '可以维修' },
      { pattern: /不能维修/g, replacement: '可以维修' },
      { pattern: /不提供[^。？！]*维修/g, replacement: '提供专业维修服务' },
      { pattern: /不维修/g, replacement: '可以维修' },
      // 拒绝回收相关措辞
      { pattern: /不在[^。？！]*回收[^。？！]*/g, replacement: '在我们的回收范围内' },
      { pattern: /无法回收/g, replacement: '可以回收' },
      { pattern: /不能回收/g, replacement: '可以回收' },
      { pattern: /不回收/g, replacement: '可以回收' },
      { pattern: /暂不支持回收/g, replacement: '支持回收' },
    ];

    let sanitized = reply;
    for (const { pattern, replacement } of forbiddenPatterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    // 最终兜底：如果回复中完全没有"可以维修"且没有"可以回收"，在开头补充
    if (!sanitized.includes('可以维修') && !sanitized.includes('可以回收')) {
      sanitized = '可以维修！' + sanitized;
    }

    return sanitized;
  }

  // 意图识别节点
  async intentRecognition(message) {
    try {
      // 首先使用规则匹配快速识别
      const lowerMsg = message.toLowerCase();
      for (const [intent, pattern] of Object.entries(this.intents)) {
        if (pattern.test(lowerMsg)) {
          return { intent, confidence: intent === 'general' ? 0.6 : 0.85 };
        }
      }

      // 如果规则匹配不确定，使用大模型进行意图识别
      if (DEEPSEEK_API_KEY) {
        const deepseekIntent = await this.deepseekIntentRecognition(message);
        if (deepseekIntent.confidence > 0.7) {
          return deepseekIntent;
        }
      }

      return { intent: 'general', confidence: 0.5 };
    } catch (error) {
      console.error('意图识别失败:', error);
      return { intent: 'general', confidence: 0.5 };
    }
  }

  // 使用Deepseek进行意图识别
  async deepseekIntentRecognition(message) {
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个专业的电子维修客服助手。请分析用户消息的意图，返回JSON格式。重要原则：任何涉及维修、故障、损坏、不能用、数据丢失、恢复数据的咨询都应该被识别为repair意图。意图分类：repair(维修咨询)、progress(进度查询)、pricing(价格咨询)、parts(配件咨询)、appointment(预约咨询)、data_recovery(数据恢复)、warranty(保修售后)、general(其他)。返回格式：{\"intent\": \"repair|progress|pricing|parts|appointment|data_recovery|warranty|general\", \"confidence\": 0.0-1.0}"
            },
            {
              role: "user",
              content: `分析以下消息的意图：${message}`
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return {
        intent: result.intent || 'general',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
      };
    } catch (error) {
      console.error('Deepseek意图识别失败:', error);
      return { intent: 'general', confidence: 0.5 };
    }
  }

  // 实体提取节点
  entityExtraction(message, intent) {
    const entities = {};

    // 提取订单号（多种格式）
    const orderPatterns = [
      /(?:订单|单号)[：:]\s*(\w+)/i,
      /(\w{8,})/, // 8位以上字母数字组合
      /订单\s*(\w+)/i
    ];

    for (const pattern of orderPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        entities.orderId = match[1];
        break;
      }
    }

    // 提取设备类型和品牌
    // 注意：先合并再去重，按长度降序排列，优先匹配更具体的词（如"航拍无人机"优先于"无人机"）
    const allDeviceBrands = [...new Set([
      ...this.businessScope.standardDevices.deviceBrands,
      ...this.businessScope.specialDevices.deviceBrands,
      '大疆', 'DJI', 'Mavic', 'Phantom', 'Mini', 'Air', 'Inspire', 'Spark',
      'Osmo', 'Ronin', 'Zenmuse', 'Insta360', 'Ricoh', '理光', 'Theta',
      '极米', '坚果', '当贝', '明基', 'BenQ', '爱普生', 'Epson', '兄弟', 'Brother',
      '任天堂', 'Nintendo', 'Switch', 'Meta', 'Quest', 'Oculus'
    ])].sort((a, b) => b.length - a.length); // 长的优先匹配

    // 移除过于宽泛的词（"电子"、"设备"、"产品"、"硬件"、"数码"等），避免误匹配
    const allDeviceTypes = [...new Set([
      ...this.businessScope.standardDevices.deviceTypes,
      ...this.businessScope.specialDevices.deviceTypes,
      '航拍无人机', '航拍机', '多旋翼', '固定翼', '多轴飞行器',
      'PS5', 'PS4', 'PS3', 'Xbox', 'Series X', 'Series S', 'Xbox One',
      'VR头显', 'VR头盔', 'VR眼镜',
      'IoT设备', '智能硬件',
      '云台', '稳定器', '闪光灯', '扫地机器人', '智能门锁',
      '路由器', '交换机', '示波器', '万用表'
    ])].filter(t => !['电子', '设备', '产品', '硬件', '数码', '数码产品'].includes(t))
      .sort((a, b) => b.length - a.length); // 长的优先匹配

    // 品牌匹配：找最长的匹配项
    for (const brand of allDeviceBrands) {
      if (message.includes(brand)) {
        entities.deviceBrand = brand;
        break;
      }
    }

    // 设备类型匹配：找最长的匹配项
    for (const type of allDeviceTypes) {
      if (message.includes(type)) {
        entities.deviceType = type;
        break;
      }
    }

    // 提取故障描述
    if (intent === 'repair' || intent === 'data_recovery' || intent === 'warranty') {
      entities.problemDescription = message;
    }

    // 提取具体故障类型
    const faultTypes = [
      { keywords: ['碎屏', '屏幕碎', '裂屏', '屏幕裂', '花屏', '黑屏', '白屏', '闪屏', '亮屏', '横纹', '竖纹', '漏液'], type: '屏幕故障' },
      { keywords: ['充不上', '充不进', '充电慢', '充电发烫', '充电接触不良', '充电口松'], type: '充电故障' },
      { keywords: ['开不了机', '无法开机', '不开机', '自动关机', '重启', '死机'], type: '开机故障' },
      { keywords: ['进水', '进液', '泡水', '淋水', '受潮', '水浸'], type: '进水故障' },
      { keywords: ['没信号', '无信号', '信号差', '搜索不到', '无服务'], type: '信号故障' },
      { keywords: ['连不上', 'WiFi故障', '蓝牙故障', '无法连接', '断连', '频繁断开'], type: '连接故障' },
      { keywords: ['电池不耐用', '耗电快', '电池鼓包', '电池发烫', '掉电快'], type: '电池故障' },
      { keywords: ['摄像头模糊', '对不了焦', '黑斑', '摄像头打不开'], type: '摄像头故障' },
      { keywords: ['听筒没声', '扬声器没声', '杂音', '声音小', '没声音'], type: '音频故障' },
      { keywords: ['炸机', '坠机', '失控', '飞丢', '掉高', '翻滚', '偏航'], type: '无人机事故' },
      { keywords: ['云台卡顿', '云台抖动', '云台歪', '云台不转', '云台故障'], type: '云台故障' },
      { keywords: ['图传故障', '图传断', '图传卡', '画面卡顿', '画面延迟'], type: '图传故障' },
      { keywords: ['摇杆漂移', '按键失灵', '手柄漂移'], type: '手柄故障' },
      { keywords: ['镜头故障', '对焦故障', '变焦故障', '快门故障', '光圈故障'], type: '相机镜头故障' },
      { keywords: ['数据丢失', '误删', '格式化', '恢复', '找回', '照片丢失', '文件丢失'], type: '数据恢复' },
      { keywords: ['打印异常', '卡纸', '墨水', '喷头堵塞', '色偏'], type: '打印机故障' }
    ];

    for (const fault of faultTypes) {
      if (fault.keywords.some(kw => message.includes(kw))) {
        entities.faultType = fault.type;
        break;
      }
    }

    // 提取时间信息（用于预约）
    if (intent === 'appointment') {
      const timeMatch = message.match(/(\d{1,2}[:：]\d{2}|\d{1,2}点|\d{1,2}:\d{2})/);
      if (timeMatch) {
        entities.preferredTime = timeMatch[1];
      }
    }

    return entities;
  }

  // 使用Deepseek生成智能响应
  async generateSmartResponse(message, intent, conversationHistory, entities) {
    try {
      if (!DEEPSEEK_API_KEY) {
        return this.generateBaseResponse(intent, entities);
      }

      // 判断设备是否在业务范围内
      const scopeType = this.isInBusinessScope(entities.deviceType, entities.deviceBrand);

      // 构建对话历史上下文
      const historyContext = conversationHistory.slice(-3).map(msg =>
        `${msg.role === 'user' ? '用户' : '客服'}: ${msg.content}`
      ).join('\n');

      // 根据业务范围构建不同的系统提示
      let systemPrompt = '';
      let pricingInfo = null;

      // 三种场景共用的核心原则
      const corePrinciples = `
【绝对禁止的措辞 - 任何情况下都不允许出现】
1. "建议您去专业维修店" / "建议到专业维修中心" / "建议咨询其他维修中心"
2. "建议您携带设备去" / "建议您前往"
3. "不在我们服务范围" / "超出业务范围" / "不在业务范围"
4. "无法维修" / "不能维修" / "不提供维修"
5. "请联系其他" / "请前往其他" / "请咨询其他"
6. "如果问题复杂" + 任何外部推荐
7. 任何暗示用户需要去别处维修的表述

以上措辞一旦出现，必须立即替换为引导用户提交订单的话术！
我们的原则：我们是专业维修团队，任何电子设备都可以修！具体报价由维修人员检测后给出。`;

      if (scopeType === 'standard') {
        // 业务范围内设备，可以给出大概估价
        pricingInfo = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);

        systemPrompt = `你是一个专业的电子维修客服助手，名为"修小宝"。你是我们维修团队的一员，不是第三方推荐平台。

${corePrinciples}

【业务范围判断】
当前用户咨询的设备在我们的标准业务范围内，可以提供大概的估价参考。

【设备信息】
- 设备类型: ${entities.deviceType || '未知'}
- 设备品牌: ${entities.deviceBrand || '未知'}
- 故障类型: ${entities.faultType || '未分类'}
- 问题描述: ${entities.problemDescription || '未提供'}

${pricingInfo ? `【价格参考信息】
- 维修项目: ${pricingInfo.issue}
- 价格范围: ${pricingInfo.min}-${pricingInfo.max}元
- 说明: ${pricingInfo.note}` : '【价格说明】需要根据具体型号和故障程度进行精确报价'}

【回答要求】
1. 必须明确表示"可以维修"
2. 针对用户描述的具体故障给出专业的维修建议
3. 提供大概的价格范围参考
4. 说明这是参考价格，具体价格以检测后的报价为准
5. 引导用户到维修系统提交产品进行精确检测和报价
6. 严禁使用Markdown格式符号
7. 语气专业但亲切，像朋友一样
8. 简洁明了，2-3段即可`;

      } else if (scopeType === 'special') {
        // 专业设备（无人机、相机、游戏机等）- 我们就是专业团队！
        systemPrompt = `你是一个专业的电子维修客服助手，名为"修小宝"。你是我们专业维修团队的一员，我们团队拥有各类专业设备的维修能力。你代表的就是专业维修团队本身，所以绝不能推荐用户去别处！

${corePrinciples}

【特别强调 - 关于专业设备】
用户咨询的${entities.deviceType || '专业设备'}正是我们的专长领域！
我们就是专业维修店！用户不需要再去别的地方！
当用户提到"如果问题复杂"等疑虑时，要坚定地表示我们的团队完全有能力处理。

【业务范围判断】
当前用户咨询的设备在我们的专业业务范围内，我们是这方面的专业团队。

【设备信息】
- 设备类型: ${entities.deviceType || '未知'}
- 设备品牌: ${entities.deviceBrand || '未知'}
- 故障类型: ${entities.faultType || '未分类'}
- 问题描述: ${entities.problemDescription || '未提供'}

【我们的专业维修能力 - 可以自信地告诉用户】
- 无人机：大疆全系列维修，云台校准、电机更换、飞控维修、图传修复、炸机修复
- 游戏机：PS5/Xbox/Switch散热、光驱、手柄漂移、主板维修
- 相机：佳能/尼康/索尼镜头维修、传感器清洁、快门更换、防抖修复
- VR设备：Quest/Vive/Pico头显维修、手柄维修、定位故障
- 投影仪：光路清洁、灯泡更换、主板维修
- 打印机：喷头清洗/更换、走纸故障、墨路系统维修
- 智能家居：门锁、摄像头、音箱等各类IoT设备维修

【标准回答模板】
"可以维修！我们团队专门处理${entities.deviceType || '这类专业设备'}的维修，${entities.faultType ? entities.faultType + '是我们的常见维修项目' : '有丰富的维修经验'}。具体维修费用需要您提交订单后，由专业维修人员检测评估确定。提交订单只是获取报价，不会产生任何费用，报价后您可以自行决定是否维修。"

【回答要求】
1. 必须明确且自信地表示"可以维修"
2. 强调我们是专业团队，这就是我们的专长
3. 不给出具体价格，说明需要专业检测后报价
4. 引导用户提交订单获取报价，强调"提交订单只是获取报价，不产生费用"
5. 严禁使用Markdown格式符号
6. 语气专业、自信、热情
7. 简洁明了，2-3段即可`;

      } else if (intent === 'recycle') {
        // 回收咨询 - 使用专门的回收系统提示
        const recycleEstimate = this.getRecycleEstimate(entities.deviceType);

        systemPrompt = `你是一个专业的电子维修和回收服务客服助手，名为"修小宝"。我们团队同时提供专业电子设备回收服务。

【设备回收 - 核心信息】
当前用户咨询的是设备回收/折价问题。
- 设备类型: ${entities.deviceType || '未知'}
- 设备品牌: ${entities.deviceBrand || '未知'}

${recycleEstimate ? `【回收估价参考】
- 设备类别: ${recycleEstimate.category}
- 近新品: ${recycleEstimate.近新 ? recycleEstimate.近新.rate : '约60%-85%'}
- 良好品: ${recycleEstimate.良好 ? recycleEstimate.良好.rate : '约40%-60%'}
- 一般品: ${recycleEstimate.一般 ? recycleEstimate.一般.rate : '约20%-40%'}
- 较差品: ${recycleEstimate.较差 ? recycleEstimate.较差.rate : '约5%-20%'}` : '【无回收估价】设备类型未匹配到标准回收价格表'}

【回答要求】
1. 必须明确表示"可以回收"
2. 说明估价取决于设备品牌、型号、成色、配件完整度、维修史和市场行情
3. 给出参考估价范围（如果有的话）
4. 说明最终价格以实际检测和评估为准
5. 引导用户去回收页面提交设备获取准确估价
6. 严禁使用Markdown格式符号
7. 语气专业、热情
8. 简洁明了，2-3段即可`;

      } else {
        // 业务范围外的设备 - 永远不拒绝，引导提交订单等报价
        systemPrompt = `你是一个专业的电子维修客服助手，名为"修小宝"。你是我们维修团队的一员，不是第三方推荐平台。

${corePrinciples}

【核心原则 - 必须严格遵守】
1. 对于任何电子设备维修咨询，都必须回答"可以维修"！
2. 即使设备型号从未见过，也要表示可以维修，只是需要检测后才能报价！
3. 我们就是专业维修团队，不需要推荐用户去别处！

【设备信息】
- 设备类型: ${entities.deviceType || '未知'}
- 设备品牌: ${entities.deviceBrand || '未知'}
- 故障类型: ${entities.faultType || '未分类'}
- 问题描述: ${entities.problemDescription || '未提供'}

【标准回答模板】
"可以维修！我们的专业维修团队有能力处理各种类型的电子设备，包括您提到的${entities.deviceType || '设备'}。具体维修价格需要您提交订单后，由专业维修人员对设备进行检测评估才能确定。提交订单只是获取报价，不会产生任何费用，报价后您可以自行决定是否维修，没有任何强制消费。"

【回答要求】
1. 必须明确表示可以维修该设备
2. 不给出具体价格，但说明流程
3. 引导用户提交订单等待专业报价，强调"提交订单只是获取报价，不产生费用"
4. 让用户知道"报价后可以自己决定是否维修，没有强制消费"
5. 禁止任何形式的拒绝语言
6. 严禁使用Markdown格式符号
7. 语气积极、热情、专业
8. 简洁明了，2-3段即可`;

      }

      const userMessage = intent === 'recycle'
        ? `用户消息: "${message}"

【最高优先级指令 - 必须遵守】
1. 回复中必须明确包含"可以回收"这四个字
2. 严禁出现以下任何措辞：
   - "不在回收范围" / "不回收" / "无法回收"
   - 任何暗示我们不提供回收服务的表述
3. 我们是专业的电子设备回收服务团队！
4. 纯文本格式，严禁使用 Markdown 符号（** * # []() 等等）
5. 回复简洁明了，2-3段即可
6. 对于无法给出具体回收价格的设备，引导用户"提交回收评估获取准确报价"，并强调"提交评估不产生任何费用"
7. 最后以JSON格式提供建议操作（如果有的话），格式：
{"suggestedActions": [{"type": "quick_reply", "text": "快捷回复文本"}, {"type": "button", "text": "按钮文本", "action": "submit_recycle"}]}

如果不需要建议操作，只返回纯文本回复即可。`
        : `用户消息: "${message}"

【最高优先级指令 - 必须遵守】
1. 回复中必须明确包含"可以维修"这四个字
2. 严禁出现以下任何措辞：
   - "建议您去专业维修店" / "建议到专业维修中心" / "建议咨询其他"
   - "建议您携带设备去" / "建议您前往"
   - "不在服务范围" / "超出业务范围" / "无法维修"
   - "如果问题复杂" + 任何外部推荐
   - 任何暗示用户需要去别处维修的表述
3. 我们就是专业维修团队！不需要推荐用户去别处！
4. 纯文本格式，严禁使用 Markdown 符号（** * # []() 等等）
5. 回复简洁明了，2-3段即可
6. 对于无法给出具体价格的设备，引导用户"提交订单获取报价"，并强调"提交订单只是获取报价，不产生费用"
7. 最后以JSON格式提供建议操作（如果有的话），格式：
{"suggestedActions": [{"type": "quick_reply", "text": "快捷回复文本"}, {"type": "button", "text": "按钮文本", "action": "动作类型"}]}

如果不需要建议操作，只返回纯文本回复即可。`;

      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      let reply = response.data.choices[0].message.content.trim();
      let suggestedActions = [];

      // 尝试解析JSON建议操作
      try {
        const jsonMatch = reply.match(/\{.*\}/s);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          if (parsed.suggestedActions) {
            suggestedActions = parsed.suggestedActions;
            // 移除回复中的JSON部分
            reply = reply.replace(jsonMatch[0], '').trim();
          }
        }
      } catch (parseError) {
        // JSON解析失败，使用纯文本回复
      }

      // 清理Markdown格式符号
      reply = this.cleanMarkdown(reply);

      // 关键：强制清洗违规措辞（即使 DeepSeek 无视了 system prompt）
      reply = this.sanitizeReply(reply, entities);

      return { reply, suggestedActions };
    } catch (error) {
      console.error('Deepseek响应生成失败:', error);
      return this.generateBaseResponse(intent, entities);
    }
  }

  // 基础响应生成（fallback）
  generateBaseResponse(intent, entities) {
    // 判断业务范围
    const scopeType = this.isInBusinessScope(entities.deviceType, entities.deviceBrand);

    let reply = '';
    let suggestedActions = [];

    if (intent === 'repair') {
      if (scopeType === 'standard') {
        // 标准设备，给出大概估价
        const pricingInfo = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);
        if (pricingInfo) {
          reply = `可以维修，我们专业维修${entities.deviceType || '此类设备'}。参考价格大约${pricingInfo.min}-${pricingInfo.max}元，${pricingInfo.note}。具体价格以专业检测后的报价为准。您可以在维修系统中提交您的设备，专业维修人员会进行详细检测并给出准确的维修报价和方案。`;
        } else {
          reply = `可以维修，我们专业维修各类电子设备。您可以在我们的维修系统中提交您的设备，专业维修人员会对设备进行检测并给出准确估价和维修方案。`;
        }
        suggestedActions = [
          { type: 'quick_reply', text: 'iPhone屏幕碎了' },
          { type: 'quick_reply', text: '电脑无法开机' },
          { type: 'quick_reply', text: '无人机炸机了' },
          { type: 'button', text: '查看服务类型', action: 'show_services' }
        ];
      } else if (scopeType === 'special') {
        // 特殊设备，需要专业检测
        reply = `可以维修，我们有专业的维修团队，可以处理各种类型的电子设备，包括${entities.deviceType || '此类特殊设备'}。此类设备需要专业检测后才能给出准确报价，您可以在维修系统中提交您的设备，我们的专业技术人员会进行检测并根据实际情况提供准确的维修报价和方案。`;
        suggestedActions = [
          { type: 'quick_reply', text: '相机镜头故障' },
          { type: 'quick_reply', text: 'PS5光驱问题' },
          { type: 'button', text: '提交维修订单', action: 'submit_order' }
        ];
      } else {
        // 业务范围外设备 - 永远不拒绝，引导提交订单等报价
        reply = `可以维修，我们的专业维修团队有能力处理各种类型的电子设备，包括您提到的${entities.deviceType || '设备'}。具体维修价格需要您提交订单后，由专业维修人员对设备进行检测评估才能确定。提交订单不会产生费用，只是获取报价，报价后您可以自己决定是否维修，没有任何强制消费。`;
        suggestedActions = [
          { type: 'button', text: '提交维修订单', action: 'submit_order' },
          { type: 'quick_reply', text: '维修有保修吗' },
          { type: 'quick_reply', text: '多久能修好' }
        ];
      }
    } else if (intent === 'data_recovery') {
      reply = `可以帮您恢复数据，我们有专业的数据恢复团队，可以处理各种设备的数据丢失问题，包括误删、格式化、系统崩溃、硬件故障等情况。数据恢复的成功率取决于数据丢失的原因和存储介质的损坏程度，建议您尽快提交设备，越早处理恢复概率越高。您可以在维修系统中提交您的设备，我们会安排专业人员进行数据恢复评估。`;
      suggestedActions = [
        { type: 'quick_reply', text: '手机照片能恢复吗' },
        { type: 'quick_reply', text: '硬盘数据恢复' },
        { type: 'button', text: '提交数据恢复', action: 'submit_order' }
      ];
    } else if (intent === 'recycle') {
      reply = `可以回收！我们支持多种电子设备的回收和折价评估服务，包括手机、电脑、平板、手表、相机、无人机等。估价主要根据设备品牌、型号、成色、是否有维修史和市场行情来综合判断。您可以描述一下设备的品牌型号和成色情况，或者直接到回收页面提交评估，我们会尽快给出准确的回收报价。`;
      suggestedActions = [
        { type: 'quick_reply', text: '手机回收价大概多少' },
        { type: 'quick_reply', text: '电脑怎么回收估价' },
        { type: 'button', text: '提交回收评估', action: 'submit_recycle' }
      ];
    } else if (intent === 'warranty') {
      reply = `我们为所有维修项目提供质保服务。维修后同一故障享有质保期，质保期内出现相同问题可免费返修。具体质保时长根据维修项目不同有所区别，一般屏幕维修质保3个月，电池更换质保6个月，主板维修质保1年。如果您对已维修的设备有任何问题，欢迎随时联系我们，我们会积极为您处理。`;
      suggestedActions = [
        { type: 'quick_reply', text: '维修后还有问题怎么办' },
        { type: 'quick_reply', text: '保修期多久' },
        { type: 'button', text: '联系售后', action: 'contact_after_sale' }
      ];
    } else if (intent === 'progress') {
      reply = '请提供您的订单号，我可以帮您查询当前的维修进度和状态。您也可以在"我的订单"页面查看最新状态。';
      suggestedActions = [
        { type: 'button', text: '查询订单', action: 'query_order' }
      ];
    } else if (intent === 'pricing') {
      if (scopeType === 'standard') {
        const pricingInfo = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);
        if (pricingInfo) {
          reply = `关于${entities.deviceType || '设备'}维修，参考价格大约${pricingInfo.min}-${pricingInfo.max}元，${pricingInfo.note}。具体价格需要专业维修人员检测后才能确定，您可以在维修系统中提交产品获取准确报价。`;
        } else {
          reply = '维修费用需要专业维修人员对设备进行检测后才能准确评估。您可以在维修系统中提交产品，维修人员会进行专业检测，然后给出准确的估价。';
        }
      } else {
        reply = `维修费用需要专业维修人员对设备进行检测后才能准确评估。您可以提交维修订单，我们的维修人员会对设备进行专业检测，然后给出准确的估价。提交订单只是获取报价，不会产生费用，报价后您可以自己决定是否维修。`;
      }
      suggestedActions = [
        { type: 'quick_reply', text: '手机维修价格' },
        { type: 'quick_reply', text: '电脑维修价格' },
        { type: 'quick_reply', text: '无人机维修价格' },
        { type: 'quick_reply', text: '相机维修价格' }
      ];
    } else if (intent === 'parts') {
      reply = `我们提供原装和优质第三方配件，所有配件均经过质量检测。原装配件价格较高但品质有保障，第三方配件性价比更高。您可以在维修系统中提交需求，我们会根据您的设备型号和需求推荐最合适的配件方案。`;
      suggestedActions = [
        { type: 'quick_reply', text: '原装屏幕多少钱' },
        { type: 'quick_reply', text: '电池是原装的吗' }
      ];
    } else if (intent === 'appointment') {
      reply = `我们支持上门取件和到店送修两种方式。上门取件服务覆盖主要城区，您可以在维修系统中预约上门时间。到店送修可即到即修，无需等待。营业时间为周一至周日 9:00-21:00，节假日正常营业。`;
      suggestedActions = [
        { type: 'quick_reply', text: '上门取件怎么预约' },
        { type: 'quick_reply', text: '门店地址在哪' }
      ];
    } else {
      reply = '您好，我是修小宝，专业的电子维修客服助手。我可以为您解答各种设备维修问题，包括手机、电脑、平板、相机、无人机、游戏机等。您可以在我们的维修系统中提交产品，维修人员会对设备进行专业检测并给出准确估价和维修方案。';
      suggestedActions = [
        { type: 'quick_reply', text: '手机屏幕碎了' },
        { type: 'quick_reply', text: '电脑开不了机' },
        { type: 'quick_reply', text: '相机镜头故障' },
        { type: 'quick_reply', text: '无人机炸机' }
      ];
    }

    return { reply, suggestedActions };
  }

  generateDeterministicResponse(message, intent, entities) {
    const base = this.generateBaseResponse(intent, entities);

    if (intent === 'general') {
      return {
        reply: '您好，我是修小宝。除了常见的维修咨询，我还可以帮您查询订单进度、维修流程、保修政策、上门服务、营业时间、客服电话、系统版本和系统配置。您可以直接告诉我订单号、设备型号，或者说出想查的配置项。',
        suggestedActions: this.getHelpSuggestions()
      };
    }

    if (!base.reply || /请问还有什么可以帮您/.test(base.reply)) {
      return {
        reply: this.getNoResultGuideReply(message),
        suggestedActions: this.getHelpSuggestions()
      };
    }

    return base;
  }

  // 智能人工转接决策
  humanTransfer(message, conversationHistory, agentResponse) {
    const transferConditions = [
      // 用户明确要求转人工
      /(人工|真人|客服|专员|转接|活人|真人客服)/.test(message),
      // 敏感话题
      /(投诉|退款|赔偿|法律|起诉|不满意|差评|不好|垃圾)/.test(message),
      // 负面情绪检测
      /(生气|愤怒|失望|无语|烦|讨厌|差劲)/.test(message)
    ];

    // 基于大模型响应质量
    if (agentResponse && agentResponse.confidence < 0.3) {
      transferConditions.push(true);
    }

    // 对话轮次过多也可能需要转人工
    if (conversationHistory.length > 8) {
      transferConditions.push(true);
    }

    return transferConditions.some(condition => condition);
  }

  // 主要处理流程
  async processMessage(message, conversationHistory = [], userId = null) {
    try {
      // 1. 意图识别
      const { intent, confidence } = await this.intentRecognition(message);

      // 2. 实体提取
      const entities = this.entityExtraction(message, intent);

      // 2.5 涉及表查询的问题，优先按 repair -> cmms_db 查询
      if (this.shouldUseDbQuery(message, intent, entities)) {
        const structuredReply = await this.tryStructuredReply(message, intent, entities, userId);
        if (structuredReply.handled) {
          const requiresHuman = this.humanTransfer(message, conversationHistory, { confidence, reply: structuredReply.reply });
          return {
            reply: structuredReply.reply,
            suggestedActions: structuredReply.suggestedActions || [],
            requiresHuman,
            confidence,
            intent,
            entities,
            scopeType: this.isInBusinessScope(entities.deviceType, entities.deviceBrand)
          };
        }
      }

      // 3. 检查是否需要转人工（提前判断）
      const requiresHumanEarly = this.humanTransfer(message, conversationHistory, { confidence });
      if (requiresHumanEarly) {
        return {
          reply: '正在为您转接人工客服，请稍候...',
          suggestedActions: [],
          requiresHuman: true,
          confidence: 0.0,
          intent: 'human_transfer',
          entities
        };
      }

      // 4. 非表类问题优先返回固定输出，避免无结果时回复过空
      const { reply, suggestedActions } = this.generateDeterministicResponse(
        message,
        intent,
        entities
      );

      // 5. 最终人工转接判断
      const requiresHuman = this.humanTransfer(message, conversationHistory, { confidence, reply });

      // 6. 判断业务范围
      const scopeType = this.isInBusinessScope(entities.deviceType, entities.deviceBrand);

      return {
        reply,
        suggestedActions,
        requiresHuman,
        confidence,
        intent,
        entities,
        scopeType
      };
    } catch (error) {
      console.error('增强版智能体处理失败:', error);
      return {
        reply: '抱歉，我暂时无法处理您的请求，请稍后重试或联系人工客服。',
        suggestedActions: [],
        requiresHuman: true,
        confidence: 0.0,
        intent: 'error',
        entities: {},
        scopeType: null
      };
    }
  }
}

// 创建全局增强智能体实例
const enhancedChatAgent = new EnhancedChatAgent();

/**
 * 处理AI客服消息（集成增强版LangGraph智能体 + Deepseek）
 */
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId, context = {} } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取对话历史（实际项目中从数据库查询）
    const conversationHistory = []; // 简化处理，实际应从DB获取

    // 使用增强版智能体处理消息
    const agentResponse = await enhancedChatAgent.processMessage(
      message.trim(),
      conversationHistory,
      userId
    );

    res.json({
      success: true,
      data: {
        messageId: Date.now().toString(),
        reply: agentResponse.reply,
        suggestedActions: agentResponse.suggestedActions,
        requiresHuman: agentResponse.requiresHuman,
        confidence: agentResponse.confidence,
        intent: agentResponse.intent,
        entities: agentResponse.entities,
        scopeType: agentResponse.scopeType
      }
    });
  } catch (error) {
    console.error('AI客服处理失败:', error);
    res.status(500).json({
      success: false,
      message: '客服系统暂时不可用'
    });
  }
});

module.exports = router;
