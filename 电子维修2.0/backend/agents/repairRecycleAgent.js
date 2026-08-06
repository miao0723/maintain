'use strict';

/**
 * 客服 Agent 1 —— 维修 / 回收专业回答型智能体
 * ------------------------------------------------------------
 * 职责：当用户咨询「设备怎么修、多少钱、能不能修、回不回收、保修政策、
 *       配件、预约、保养建议」等维修 / 回收类知识问题时，由本 Agent 以
 *       专业、友好的人设（修小宝）进行回答。
 *
 * 能力：
 *   - 业务范围判断（标准设备 / 专业设备 / 范围外）—— 永远不拒绝维修
 *   - 维修 / 回收估价参考（内置 pricingReference / recyclePricingReference）
 *   - 知识库检索（质保政策 / 上门服务 / 价格说明 等）
 *   - 系统配置查询（营业时间 / 客服电话）
 *   - 维修人员工作量统计（运营类问答）
 *   - DeepSeek 大模型生成专业话术 + 违规措辞清洗
 *
 * 注意：订单进度 / 我的设备 / 在保状态 / 维修履历等"查数据"类问题由
 *       Agent 2（queryAgent）负责，本 Agent 不处理数据查询。
 */

const axios = require('axios');
const dotenv = require('dotenv');
const db = require('../database');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const DEEPSEEK_API_KEY = process.env.Deepseek_api_key || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

class RepairRecycleAgent {
  constructor() {
    // 业务范围定义
    this.businessScope = {
      standardDevices: {
        deviceTypes: [
          '手机', 'iPhone', '安卓手机', '智能手机', '功能手机', '折叠屏手机',
          '平板', 'iPad', '安卓平板', '电脑', '笔记本', 'MacBook', '台式机', '一体机', '超极本', '游戏本', '商务本',
          '智能手表', 'Apple Watch', '运动手表', '手环', '智能手环', '智能戒指',
          '耳机', '蓝牙耳机', '有线耳机', 'AirPods', '入耳式耳机', '头戴式耳机', '无线耳机', '降噪耳机', '骨传导耳机',
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
      specialDevices: {
        deviceTypes: [
          '相机', '单反', '微单', '运动相机', '数码相机', '拍立得', '镜头', '闪光灯', '云台', '稳定器',
          '无人机', '航拍无人机', '航拍机', '多旋翼', '固定翼', '直升机', '多轴飞行器',
          '游戏机', '主机', '掌机', 'PS5', 'PS4', 'PS3', 'Xbox', 'Series X', 'Series S', 'Xbox One', 'Switch', '任天堂',
          'VR', '虚拟现实', 'AR', '增强现实', 'MR', '混合现实', 'VR头显', 'VR头盔', 'VR眼镜', 'Quest', 'Oculus', 'Vive', 'Pico',
          '路由器', '交换机', '调制解调器', 'Mesh', '网关',
          '智能音箱', '智能门锁', '智能摄像头', '智能家电', '扫地机器人', '智能灯泡', '智能插座',
          '打印机', '扫描仪', '投影仪', '投影机', '复印机', '传真机',
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

    this.pricingReference = {
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
      平板: {
        屏幕维修: { min: 300, max: 3000, note: 'iPad Pro系列最高，外屏比内屏便宜' },
        电池更换: { min: 150, max: 600, note: '需要专业拆机，大容量电池较贵' },
        主板维修: { min: 400, max: 3000, note: '根据损坏程度报价' },
        触摸屏失灵: { min: 200, max: 1500, note: '触摸层更换或排线维修' },
        充电故障: { min: 80, max: 300, note: '接口或充电IC维修' },
        WiFi故障: { min: 100, max: 500, note: 'WiFi模块或天线维修' }
      },
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
      耳机: {
        电池更换: { min: 50, max: 200, note: '左右耳均更换' },
        音频单元: { min: 100, max: 500, note: '根据型号和品质报价' },
        充电盒维修: { min: 80, max: 350, note: '包括充电接口、电池、电路板' },
        蓝牙故障: { min: 80, max: 300, note: '蓝牙模块维修或更换' },
        降噪功能: { min: 100, max: 400, note: 'ANC降噪模块维修' },
        线缆断裂: { min: 30, max: 150, note: '有线耳机线缆更换' },
        头梁耳垫: { min: 50, max: 300, note: '头戴式耳机的头梁和耳垫更换' }
      },
      手表: {
        屏幕维修: { min: 300, max: 2000, note: 'Apple Watch Ultra最高，AMOLED屏较贵' },
        电池更换: { min: 150, max: 500, note: '含防水处理和密封' },
        表带更换: { min: 50, max: 500, note: '原装表带价格较高' },
        防水失效: { min: 100, max: 400, note: '重新密封和防水测试' },
        传感器故障: { min: 200, max: 600, note: '心率/血氧/GPS传感器维修' },
        充电故障: { min: 80, max: 300, note: '充电线圈或接口维修' }
      },
      相机: {
        镜头维修: { min: 300, max: 5000, note: '根据镜头类型和损坏程度，变焦镜头较贵' },
        传感器清洁: { min: 100, max: 300, note: '专业清洁CMOS/CCD传感器' },
        快门故障: { min: 200, max: 1500, note: '快门组件更换或维修' },
        主板维修: { min: 500, max: 3000, note: '根据型号和损坏程度' },
        取景器故障: { min: 200, max: 800, note: 'EVF/OVF取景器维修' },
        防抖维修: { min: 200, max: 1000, note: '光学防抖/OIS模块维修' },
        进水维修: { min: 200, max: 2000, note: '视进水程度和腐蚀情况' }
      },
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
      游戏机: {
        光驱故障: { min: 200, max: 800, note: '光盘驱动器维修或更换' },
        散热维修: { min: 100, max: 500, note: '风扇、散热膏、散热管维修' },
        HDMI接口: { min: 100, max: 400, note: 'HDMI端口更换' },
        手柄维修: { min: 50, max: 300, note: '摇杆漂移、按键失灵等' },
        硬盘更换: { min: 200, max: 800, note: 'SSD升级或更换' },
        主板维修: { min: 300, max: 2000, note: '根据损坏程度报价' },
        电源故障: { min: 100, max: 500, note: '电源模块维修或更换' }
      },
      显示器: {
        屏幕面板: { min: 500, max: 5000, note: '面板更换，4K/OLED最贵' },
        背光维修: { min: 200, max: 1000, note: 'LED背光条更换' },
        驱动板维修: { min: 150, max: 800, note: '逻辑板/驱动板维修' },
        电源板维修: { min: 100, max: 500, note: '电源板维修或更换' },
        接口维修: { min: 80, max: 300, note: 'HDMI/DP/Type-C接口更换' }
      },
      打印机: {
        喷头清洗: { min: 50, max: 200, note: '喷墨打印机喷头清洗' },
        喷头更换: { min: 200, max: 1000, note: '喷头组件更换' },
        走纸故障: { min: 100, max: 500, note: '搓纸轮、传感器维修' },
        主板维修: { min: 200, max: 800, note: '打印机主板维修' },
        墨路系统: { min: 100, max: 600, note: '连续供墨系统维修' }
      },
      小家电: {
        电饭煲维修: { min: 50, max: 300, note: '电饭煲常见故障维修' },
        电磁炉维修: { min: 30, max: 200, note: '电磁炉主板/线圈维修' },
        微波炉维修: { min: 80, max: 400, note: '微波炉常见故障' },
        电风扇维修: { min: 30, max: 150, note: '电风扇电机/电路板维修' },
        吸尘器维修: { min: 50, max: 300, note: '吸尘器常见故障维修' }
      },
      音频设备: {
        音响维修: { min: 100, max: 1500, note: '音响功放/扬声器维修' },
        功放维修: { min: 150, max: 2000, note: '功放机维修' },
        效果器维修: { min: 100, max: 800, note: '效果器/调音台维修' },
        话筒维修: { min: 50, max: 500, note: '话筒/麦克风维修' },
        KTV设备: { min: 200, max: 3000, note: 'KTV点歌机/专业音响维修' }
      }
    };

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

    this.intents = {
      data_recovery: /(数据恢复|数据丢失|恢复数据|误删|格式化|清空数据|找回数据|找回照片|找回文件|照片丢失|文件丢失|聊天记录丢失|通讯录丢失|恢复照片|恢复文件|恢复聊天记录|硬盘数据|U盘数据|SD卡数据)/,
      pricing: /(价格|费用|多少钱|贵|便宜|报价|收费|价位|预算|怎么收费|什么价|贵不贵|收费标准|维修费|检测费|人工费|配件费)/,
      warranty: /(保修|质保|延保|三包|退换|退款|赔偿|差评|保修期|保修卡)/,
      appointment: /(预约|时间|几点|安排|上门|取件|送修|到店|门店|营业时间|上班时间)/,
      parts: /(配件|零件|原装|真伪|正品|行货|水货|翻新|二手)/,
      repair: /(修|坏|故障|不能用|不工作|碎屏|碎了|裂了|屏幕|电池|充电|开机|死机|无法|重启|蓝屏|黑屏|花屏|进水|摔|烫|卡顿|闪退|连不上|没信号|无信号|扬声器|听筒|麦克风|摄像|按键|主板|芯片|漏电|短路|烧|炸机|坠机|失控|漂移|摇杆|手柄|光驱|镜头|快门|对焦|变焦|防抖|云台|电机|桨叶|飞控|图传|喷头|卡纸|投影|降噪|蓝牙|WiFi|无线|网络|信号|触摸|指纹|面容|识别|充电口|充电器|耳机|手表|手环|相机|无人机|游戏机|打印机|显示器|路由器|交换机|扫地机|门锁|音箱|投影仪|扫描仪|VR|AR|稳定器|闪关灯|能修|可以修|想修|怎么修|维修|维修吗|能修吗)/,
      recycle: /(回收|折价|卖掉|二手|估价|置换|以旧换新|买新|值多少钱|能卖多少|还值多少|回收价|换新|翻新|抵价|old.*new|trade.*in|sell.*device)/,
      general: /.*/
    };
  }

  isInBusinessScope(deviceType, deviceBrand) {
    if (!deviceType && !deviceBrand) return false;
    const { standardDevices, specialDevices } = this.businessScope;
    if (deviceType) {
      const inStandard = standardDevices.deviceTypes.some(t =>
        deviceType.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(deviceType.toLowerCase()));
      const inSpecial = specialDevices.deviceTypes.some(t =>
        deviceType.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(deviceType.toLowerCase()));
      if (inStandard || inSpecial) return inStandard ? 'standard' : 'special';
    }
    if (deviceBrand) {
      const inStandard = standardDevices.deviceBrands.some(b =>
        deviceBrand.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(deviceBrand.toLowerCase()));
      const inSpecial = specialDevices.deviceBrands.some(b =>
        deviceBrand.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(deviceBrand.toLowerCase()));
      if (inStandard || inSpecial) return inStandard ? 'standard' : 'special';
    }
    return false;
  }

  getRecycleEstimate(deviceType) {
    if (!deviceType) return null;
    let matched = null;
    for (const category of Object.keys(this.recyclePricingReference)) {
      if (deviceType.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(deviceType.toLowerCase())) {
        matched = category; break;
      }
    }
    if (!matched) return null;
    return { category: matched, ...this.recyclePricingReference[matched] };
  }

  getEstimatedPrice(deviceType, problemDescription) {
    if (!deviceType) return null;
    let matched = null;
    for (const [category] of Object.entries(this.pricingReference)) {
      if (deviceType.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(deviceType.toLowerCase())) {
        matched = category; break;
      }
    }
    if (!matched) return null;
    if (problemDescription) {
      const prices = this.pricingReference[matched];
      for (const [issue, info] of Object.entries(prices)) {
        if (problemDescription.toLowerCase().includes(issue.toLowerCase()) ||
            issue.toLowerCase().includes(problemDescription.toLowerCase().split(' ')[0])) {
          return { issue, ...info };
        }
      }
    }
    const prices = this.pricingReference[matched];
    const firstIssue = Object.keys(prices)[0];
    return { issue: firstIssue, ...prices[firstIssue] };
  }

  cleanMarkdown(text) {
    return text
      .replace(/\*\*/g, '').replace(/\*/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/- \[ \]/g, '').replace(/- \[x\]/g, '')
      .replace(/\|[^|]*/g, '').replace(/---/g, '')
      .replace(/\n\s*\n/g, '\n\n').trim();
  }

  getHelpSuggestions() {
    return [
      { type: 'quick_reply', text: '查询订单进度' },
      { type: 'quick_reply', text: '手机屏幕维修价格' },
      { type: 'quick_reply', text: '设备回收估价' },
      { type: 'quick_reply', text: '营业时间和客服电话' }
    ];
  }

  getNoResultGuideReply(message) {
    return `暂时没有查到和"${message}"直接对应的资料。您还可以问我：维修报价、设备回收、配件质量、上门服务、营业时间、客服电话、质保政策、保养建议等。也可以直接告诉我设备型号或故障现象，我会继续帮您判断。`;
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

  async tableExists(schemaName, tableName) {
    try {
      const rows = await db.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1`,
        [schemaName, tableName]
      );
      return rows.length > 0;
    } catch (error) { return false; }
  }

  async queryWithSchemaFallback(tableName, sqlBuilder) {
    for (const schema of ['repair', 'cmms_db']) {
      if (!(await this.tableExists(schema, tableName))) continue;
      try {
        const { sql, params = [] } = sqlBuilder(schema);
        const rows = await db.query(sql, params);
        if (Array.isArray(rows) && rows.length > 0) return { rows, schema };
      } catch (error) { console.error(`查询 ${schema}.${tableName} 失败:`, error.message); }
    }
    return { rows: [], schema: null };
  }

  async queryProductInfo(entities, message) {
    const keyword = entities.deviceBrand || entities.deviceType || message;
    return this.queryWithSchemaFallback('products', (schema) => ({
      sql: `SELECT name, brand, model, category, price_range, repair_types, common_issues
            FROM ${schema}.products
            WHERE name LIKE ? OR brand LIKE ? OR model LIKE ? OR category LIKE ?
            ORDER BY id DESC LIMIT 3`,
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
      let sql = `SELECT category, title, content FROM ${schema}.knowledge_base
                 WHERE (title LIKE ? OR content LIKE ? OR category LIKE ?)`;
      const params = [`%${message}%`, `%${message}%`, `%${message}%`];
      if (categories.length) {
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
      sql: `SELECT config_key, config_value, description FROM ${schema}.system_config
            WHERE config_key LIKE ? OR description LIKE ? ORDER BY id ASC LIMIT 10`,
      params: [`%${keyword}%`, `%${keyword}%`]
    }));
  }

  async queryTechnicianWorkload(message) {
    const wantsCompleted = /(完成|已完成|修好|完工)/.test(message);
    const wantsQuoted = /(报价|quoted|quote)/i.test(message);
    const wantsPending = /(待处理|待接单|未完成|处理中|processing)/.test(message);
    const wantsTop = !/(最少|倒数)/.test(message);
    const aggregateField = wantsQuoted ? 'quote_created_by' : 'assigned_to';
    let extraWhere = wantsCompleted ? ` AND o.status = 'completed' `
      : wantsQuoted ? ` AND o.quote_created_by IS NOT NULL `
      : wantsPending ? ` AND o.status IN ('pending','quoted','confirmed','processing') `
      : ` AND o.order_type = 'repair' `;
    return this.queryWithSchemaFallback('orders', (schema) => ({
      sql: `SELECT o.${aggregateField} AS user_id,
                   COALESCE(u.real_name,u.nickname,u.username,CONCAT('用户#',o.${aggregateField})) AS technician_name,
                   COUNT(*) AS order_count,
                   SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END) AS completed_count
            FROM ${schema}.orders o
            LEFT JOIN ${schema}.users u ON u.id = o.${aggregateField}
            WHERE o.${aggregateField} IS NOT NULL AND o.${aggregateField} <> 0 ${extraWhere}
            GROUP BY o.${aggregateField}, technician_name
            ORDER BY order_count ${wantsTop ? 'DESC' : 'ASC'}, user_id ASC LIMIT 5`,
      params: []
    }));
  }

  formatProductReply(rows) {
    const top = rows[0];
    let repairTypes = [];
    try { repairTypes = top.repair_types ? JSON.parse(top.repair_types) : []; } catch (e) { repairTypes = []; }
    const repairTypeText = repairTypes.length ? repairTypes.slice(0, 4).join('、') : '常规检测、报价和维修';
    return `已查到相关产品信息：${top.name}${top.model ? `（${top.model}）` : ''}，品牌 ${top.brand || '未标注'}，分类 ${top.category || '未标注'}，参考展示价 ${top.price_range || '以检测报价为准'}。常见可维修项目：${repairTypeText}。如需确认故障或报价，可直接告诉我具体故障现象。`;
  }

  formatKnowledgeReply(rows) {
    const top = rows[0];
    return `相关说明：${top.title || top.category}：${top.content}`;
  }

  formatSystemConfigReply(rows) {
    const topRows = rows.slice(0, 4).map(i => `${i.description || i.config_key}：${i.config_value}`);
    return `已查到系统配置：${topRows.join('；')}。`;
  }

  formatTechnicianAnalyticsReply(rows, message) {
    const top = rows[0];
    const askCompleted = /(完成|已完成|修好|完工)/.test(message);
    const askQuoted = /(报价|quoted|quote)/i.test(message);
    const metricLabel = askQuoted ? '报价单量' : (askCompleted ? '完成单量' : '订单量');
    const tail = rows.slice(0, 3).map(i => `${i.technician_name}${metricLabel}${i.order_count}单`).join('，');
    return `统计结果：当前${metricLabel}最多的是 ${top.technician_name}，共 ${top.order_count} 单。补充：${tail}。`;
  }

  // 违规措辞清洗（最后防线）
  sanitizeReply(reply) {
    const forbidden = [
      { p: /建议您[^。？！]*去专业维修店[^。？！]*/g, r: '我们就是专业维修团队，完全有能力处理' },
      { p: /建议您[^。？！]*到专业维修中心[^。？！]*/g, r: '我们就是专业维修团队，完全有能力处理' },
      { p: /建议[^。？！]*咨询其他维修中心[^。？！]*/g, r: '我们就是专业维修团队，完全有能力处理' },
      { p: /建议您[^。？！]*携带设备去[^。？！]*/g, r: '您可以直接在我们这里提交订单' },
      { p: /建议您[^。？！]*前往[^。？！]*维修[^。？！]*/g, r: '您可以直接在我们这里提交订单' },
      { p: /建议[^。？！]*联系其他[^。？！]*/g, r: '您可以直接联系我们' },
      { p: /建议[^。？！]*咨询其他[^。？！]*/g, r: '您可以直接咨询我们' },
      { p: /如果问题复杂[^。？！]*建议[^。？！]*/g, r: '我们团队有丰富的经验，完全有能力处理' },
      { p: /如果故障复杂[^。？！]*建议[^。？！]*/g, r: '我们团队有丰富的经验，完全有能力处理' },
      { p: /不在[^。？！]*服务范围[^。？！]*/g, r: '在我们的服务范围内' },
      { p: /超出[^。？！]*业务范围[^。？！]*/g, r: '在我们的业务范围内' },
      { p: /不在[^。？！]*业务范围[^。？！]*/g, r: '在我们的业务范围内' },
      { p: /无法维修/g, r: '可以维修' },
      { p: /不能维修/g, r: '可以维修' },
      { p: /不提供[^。？！]*维修/g, r: '提供专业维修服务' },
      { p: /不维修/g, r: '可以维修' },
      { p: /不在[^。？！]*回收[^。？！]*/g, r: '在我们的回收范围内' },
      { p: /无法回收/g, r: '可以回收' },
      { p: /不能回收/g, r: '可以回收' },
      { p: /不回收/g, r: '可以回收' },
      { p: /暂不支持回收/g, r: '支持回收' }
    ];
    let s = reply;
    for (const { p, r } of forbidden) s = s.replace(p, r);
    if (!s.includes('可以维修') && !s.includes('可以回收')) s = '可以维修！' + s;
    return s;
  }

  async intentRecognition(message) {
    try {
      const lowerMsg = message.toLowerCase();
      for (const [intent, pattern] of Object.entries(this.intents)) {
        if (pattern.test(lowerMsg)) return { intent, confidence: intent === 'general' ? 0.6 : 0.85 };
      }
      if (DEEPSEEK_API_KEY) {
        const deep = await this.deepseekIntentRecognition(message);
        if (deep.confidence > 0.7) return deep;
      }
      return { intent: 'general', confidence: 0.5 };
    } catch (e) {
      return { intent: 'general', confidence: 0.5 };
    }
  }

  async deepseekIntentRecognition(message) {
    try {
      const response = await axios.post(DEEPSEEK_API_URL, {
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: '你是一个专业的电子维修客服助手。请分析用户消息意图，返回JSON。意图分类：repair(维修咨询)、progress(进度查询)、pricing(价格咨询)、parts(配件咨询)、appointment(预约咨询)、data_recovery(数据恢复)、warranty(保修售后)、recycle(回收咨询)、general(其他)。返回格式：{"intent":"...","confidence":0.0-1.0}'
        }, { role: 'user', content: `分析以下消息的意图：${message}` }],
        temperature: 0.3, max_tokens: 100
      }, { headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 10000 });
      const result = JSON.parse(response.data.choices[0].message.content);
      return { intent: result.intent || 'general', confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1) };
    } catch (e) {
      return { intent: 'general', confidence: 0.5 };
    }
  }

  entityExtraction(message, intent) {
    const entities = {};
    const orderPatterns = [/(?:订单|单号)[：:]\s*(\w+)/i, /(\w{8,})/, /订单\s*(\w+)/i];
    for (const p of orderPatterns) {
      const m = message.match(p);
      if (m && m[1]) { entities.orderId = m[1]; break; }
    }
    const allBrands = [...new Set([
      ...this.businessScope.standardDevices.deviceBrands,
      ...this.businessScope.specialDevices.deviceBrands,
      '大疆', 'DJI', 'Mavic', 'Phantom', 'Mini', 'Air', 'Inspire', 'Spark', 'Osmo', 'Ronin', 'Zenmuse',
      'Insta360', 'Ricoh', '理光', 'Theta', '极米', '坚果', '当贝', '明基', 'BenQ', '爱普生', 'Epson', '兄弟', 'Brother',
      '任天堂', 'Nintendo', 'Switch', 'Meta', 'Quest', 'Oculus'
    ])].sort((a, b) => b.length - a.length);
    const allTypes = [...new Set([
      ...this.businessScope.standardDevices.deviceTypes,
      ...this.businessScope.specialDevices.deviceTypes,
      '航拍无人机', '航拍机', '多旋翼', '固定翼', '多轴飞行器', 'PS5', 'PS4', 'PS3', 'Xbox', 'Series X', 'Series S', 'Xbox One',
      'VR头显', 'VR头盔', 'VR眼镜', 'IoT设备', '智能硬件', '云台', '稳定器', '闪光灯', '扫地机器人', '智能门锁',
      '路由器', '交换机', '示波器', '万用表'
    ])].filter(t => !['电子', '设备', '产品', '硬件', '数码', '数码产品'].includes(t)).sort((a, b) => b.length - a.length);
    for (const b of allBrands) { if (message.includes(b)) { entities.deviceBrand = b; break; } }
    for (const t of allTypes) { if (message.includes(t)) { entities.deviceType = t; break; } }
    if (['repair', 'data_recovery', 'warranty'].includes(intent)) entities.problemDescription = message;
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
    for (const f of faultTypes) {
      if (f.keywords.some(k => message.includes(k))) { entities.faultType = f.type; break; }
    }
    return entities;
  }

  async generateSmartResponse(message, intent, conversationHistory, entities) {
    try {
      if (!DEEPSEEK_API_KEY) return this.generateBaseResponse(intent, entities);
      const scopeType = this.isInBusinessScope(entities.deviceType, entities.deviceBrand);
      const historyContext = conversationHistory.slice(-3).map(m => `${m.role === 'user' ? '用户' : '客服'}: ${m.content}`).join('\n');
      const corePrinciples = `
【绝对禁止的措辞】
1. "建议您去专业维修店" / "建议到专业维修中心" / "建议咨询其他维修中心"
2. "建议您携带设备去" / "建议您前往"
3. "不在我们服务范围" / "超出业务范围" / "不在业务范围"
4. "无法维修" / "不能维修" / "不提供维修"
5. "请联系其他" / "请前往其他" / "请咨询其他"
6. 任何暗示用户需要去别处维修的表述
以上措辞一旦出现，必须立即替换为引导用户提交订单的话术！我们是专业维修团队，任何电子设备都可以修！`;
      let systemPrompt = '';
      let pricingInfo = null;
      if (scopeType === 'standard') {
        pricingInfo = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);
        systemPrompt = `你是专业电子维修客服"修小宝"，是我们维修团队的一员。
${corePrinciples}
【业务范围】当前设备在我们的标准业务范围内，可提供大概估价参考。
【设备信息】类型:${entities.deviceType || '未知'} 品牌:${entities.deviceBrand || '未知'} 故障:${entities.faultType || '未分类'} 描述:${entities.problemDescription || '未提供'}
${pricingInfo ? `【价格参考】项目:${pricingInfo.issue} 范围:${pricingInfo.min}-${pricingInfo.max}元 说明:${pricingInfo.note}` : '【价格说明】需检测后精确报价'}
【回答要求】1.必须明确表示"可以维修" 2.针对故障给专业建议 3.给大概价格范围 4.说明以检测报价为准 5.引导提交订单 6.禁用Markdown 7.语气专业亲切 8.2-3段`;
      } else if (scopeType === 'special') {
        systemPrompt = `你是专业电子维修客服"修小宝"，我们团队拥有各类专业设备维修能力，你代表专业维修团队本身，绝不能推荐用户去别处！
${corePrinciples}
【特别强调】用户咨询的${entities.deviceType || '专业设备'}正是我们的专长！我们就是专业维修店！
【设备信息】类型:${entities.deviceType || '未知'} 品牌:${entities.deviceBrand || '未知'} 故障:${entities.faultType || '未分类'}
【能力】无人机/游戏机/相机/VR/投影仪/打印机/智能家居等均可维修。
【回答要求】1.自信表示"可以维修" 2.强调我们是专业团队 3.不给具体价，说明需检测报价 4.引导提交订单 5.禁用Markdown 6.2-3段`;
      } else if (intent === 'recycle') {
        const re = this.getRecycleEstimate(entities.deviceType);
        systemPrompt = `你是专业电子维修与回收客服"修小宝"。
【回收核心】设备类型:${entities.deviceType || '未知'} 品牌:${entities.deviceBrand || '未知'}
${re ? `【回收估价】类别:${re.category} 近新:${re.近新.rate} 良好:${re.良好.rate} 一般:${re.一般.rate} 较差:${re.较差.rate}` : '【无估价】未匹配标准回收价格表'}
【回答要求】1.必须明确表示"可以回收" 2.说明估价取决于品牌/型号/成色/配件/行情 3.给参考范围 4.引导去回收页提交评估 5.禁用Markdown 6.2-3段`;
      } else {
        systemPrompt = `你是专业电子维修客服"修小宝"，是我们维修团队的一员。
${corePrinciples}
【核心原则】1.对任何电子设备都必须回答"可以维修" 2.即使没见过也要表示可修，需检测报价 3.我们就是专业团队
【设备信息】类型:${entities.deviceType || '未知'} 品牌:${entities.deviceBrand || '未知'} 故障:${entities.faultType || '未分类'}
【回答要求】1.明确可维修 2.不给具体价但说明流程 3.引导提交订单等报价，强调不产生费用 4.禁用Markdown 5.2-3段`;
      }
      const userMessage = intent === 'recycle'
        ? `用户消息:"${message}"
【最高优先级】1.必须包含"可以回收" 2.严禁"不回收/无法回收" 3.纯文本禁Markdown 4.2-3段 5.最后可附JSON建议操作{"suggestedActions":[{"type":"quick_reply","text":"..."},{"type":"button","text":"...","action":"submit_recycle"}]}`
        : `用户消息:"${message}"
【最高优先级】1.必须包含"可以维修" 2.严禁"去别处维修/无法维修/不在范围" 3.我们就是专业团队 4.纯文本禁Markdown 5.2-3段 6.最后可附JSON建议操作{"suggestedActions":[{"type":"quick_reply","text":"..."},{"type":"button","text":"...","action":"动作类型"}]}`;
      const response = await axios.post(DEEPSEEK_API_URL, {
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        temperature: 0.7, max_tokens: 300
      }, { headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 });
      let reply = response.data.choices[0].message.content.trim();
      let suggestedActions = [];
      try {
        const jsonMatch = reply.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.suggestedActions) suggestedActions = parsed.suggestedActions;
          reply = reply.replace(jsonMatch[0], '').trim();
        }
      } catch (e) {}
      reply = this.cleanMarkdown(reply);
      reply = this.sanitizeReply(reply);
      return { reply, suggestedActions };
    } catch (e) {
      console.error('[RepairRecycleAgent] LLM生成失败:', e.message);
      return this.generateBaseResponse(intent, entities);
    }
  }

  generateBaseResponse(intent, entities) {
    const scopeType = this.isInBusinessScope(entities.deviceType, entities.deviceBrand);
    let reply = '';
    let suggestedActions = [];
    if (intent === 'repair') {
      if (scopeType === 'standard') {
        const p = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);
        reply = p
          ? `可以维修，我们专业维修${entities.deviceType || '此类设备'}。参考价格大约${p.min}-${p.max}元，${p.note}。具体以检测报价为准，您可在维修系统提交设备获取准确报价。`
          : `可以维修，我们专业维修各类电子设备，提交设备后由专业人员检测并给出准确估价和方案。`;
        suggestedActions = [{ type: 'quick_reply', text: 'iPhone屏幕碎了' }, { type: 'quick_reply', text: '电脑无法开机' }, { type: 'button', text: '查看服务类型', action: 'show_services' }];
      } else if (scopeType === 'special') {
        reply = `可以维修，我们有专业团队可处理${entities.deviceType || '此类特殊设备'}，需专业检测后报价，您可在维修系统提交设备。`;
        suggestedActions = [{ type: 'quick_reply', text: '相机镜头故障' }, { type: 'quick_reply', text: 'PS5光驱问题' }, { type: 'button', text: '提交维修订单', action: 'submit_order' }];
      } else {
        reply = `可以维修，我们的专业团队有能力处理${entities.deviceType || '设备'}，提交订单后由专业人员检测评估报价，提交不产生费用，报价后可自行决定是否维修。`;
        suggestedActions = [{ type: 'button', text: '提交维修订单', action: 'submit_order' }, { type: 'quick_reply', text: '维修有保修吗' }];
      }
    } else if (intent === 'data_recovery') {
      reply = '可以帮您恢复数据，我们有专业数据恢复团队，处理误删、格式化、系统崩溃、硬件故障等情况。建议尽快提交设备，越早恢复概率越高。';
      suggestedActions = [{ type: 'quick_reply', text: '手机照片能恢复吗' }, { type: 'button', text: '提交数据恢复', action: 'submit_order' }];
    } else if (intent === 'recycle') {
      reply = '可以回收！我们支持手机、电脑、平板、手表、相机、无人机等多种设备回收折价。估价根据品牌、型号、成色、维修史和行情综合判断，您可到回收页提交评估获取准确报价。';
      suggestedActions = [{ type: 'quick_reply', text: '手机回收价大概多少' }, { type: 'button', text: '提交回收评估', action: 'submit_recycle' }];
    } else if (intent === 'warranty') {
      reply = '我们为所有维修项目提供质保，同一故障质保期内可免费返修。屏幕维修质保3个月、电池6个月、主板1年。如对已维修设备有疑问，欢迎随时联系我们。';
      suggestedActions = [{ type: 'quick_reply', text: '维修后还有问题怎么办' }, { type: 'button', text: '联系售后', action: 'contact_after_sale' }];
    } else if (intent === 'pricing') {
      if (scopeType === 'standard') {
        const p = this.getEstimatedPrice(entities.deviceType, entities.problemDescription);
        reply = p ? `关于${entities.deviceType || '设备'}维修，参考价格大约${p.min}-${p.max}元，${p.note}。具体需检测后确定。` : '维修费用需专业人员检测后评估，您可提交产品获取准确报价。';
      } else {
        reply = '维修费用需专业人员检测后评估，提交订单只是获取报价，不产生费用，报价后可自行决定。';
      }
      suggestedActions = [{ type: 'quick_reply', text: '手机维修价格' }, { type: 'quick_reply', text: '电脑维修价格' }];
    } else if (intent === 'parts') {
      reply = '我们提供原装和优质第三方配件，均经过质量检测。原装品质有保障，第三方性价比更高，提交需求后按设备型号推荐合适方案。';
      suggestedActions = [{ type: 'quick_reply', text: '原装屏幕多少钱' }, { type: 'quick_reply', text: '电池是原装的吗' }];
    } else if (intent === 'appointment') {
      reply = '我们支持上门取件和到店送修，上门覆盖主要城区，营业时间周一至周日 9:00-21:00，节假日正常营业。';
      suggestedActions = [{ type: 'quick_reply', text: '上门取件怎么预约' }, { type: 'quick_reply', text: '门店地址在哪' }];
    } else {
      reply = '您好，我是修小宝，专业电子维修客服助手。可解答手机、电脑、平板、相机、无人机、游戏机等维修问题，也能帮您查订单进度。';
      suggestedActions = [{ type: 'quick_reply', text: '手机屏幕碎了' }, { type: 'quick_reply', text: '电脑开不了机' }, { type: 'quick_reply', text: '相机镜头故障' }];
    }
    return { reply, suggestedActions };
  }

  generateDeterministicResponse(message, intent, entities) {
    const base = this.generateBaseResponse(intent, entities);
    if (intent === 'general') {
      return { reply: '您好，我是修小宝。除维修咨询外，我还可以帮您查订单进度、维修流程、保修政策、上门服务、营业时间、客服电话等。直接告诉我订单号、设备型号或想查的配置项即可。', suggestedActions: this.getHelpSuggestions() };
    }
    if (!base.reply) return { reply: this.getNoResultGuideReply(message), suggestedActions: this.getHelpSuggestions() };
    return base;
  }

  humanTransfer(message, conversationHistory, agentResponse) {
    const conditions = [
      /(人工|真人|客服|专员|转接|活人|真人客服)/.test(message),
      /(投诉|退款|赔偿|法律|起诉|不满意|差评|不好|垃圾)/.test(message),
      /(生气|愤怒|失望|无语|烦|讨厌|差劲)/.test(message)
    ];
    if (agentResponse && agentResponse.confidence < 0.3) conditions.push(true);
    if (conversationHistory.length > 8) conditions.push(true);
    return conditions.some(c => c);
  }

  async processMessage(message, conversationHistory = [], userId = null) {
    try {
      const { intent, confidence } = await this.intentRecognition(message);
      const entities = this.entityExtraction(message, intent);

      // 结构化知识查询（属于本 Agent 的知识型查询）
      if (this.isAnalyticsQuery(message)) {
        const { rows, schema } = await this.queryTechnicianWorkload(message);
        if (rows.length) return this._wrap(this.formatTechnicianAnalyticsReply(rows, message, schema), intent, entities, confidence, []);
        return this._wrap(this.getNoResultGuideReply(message), intent, entities, confidence, this.getHelpSuggestions());
      }
      if (this.isSystemConfigQuery(message)) {
        const { rows, schema } = await this.querySystemConfig(message);
        if (rows.length) return this._wrap(this.formatSystemConfigReply(rows, schema), intent, entities, confidence, [{ type: 'quick_reply', text: '营业时间' }, { type: 'quick_reply', text: '客服电话' }]);
        return this._wrap(this.getNoResultGuideReply(message), intent, entities, confidence, this.getHelpSuggestions());
      }
      if ((intent === 'pricing' || intent === 'repair' || intent === 'parts') && (entities.deviceType || entities.deviceBrand)) {
        const { rows } = await this.queryProductInfo(entities, message);
        if (rows.length) {
          return this._wrap(this.formatProductReply(rows), intent, entities, confidence, [
            { type: 'quick_reply', text: '这个设备常见故障有哪些' },
            { type: 'button', text: '提交维修订单', action: 'submit_order' }
          ]);
        }
      }
      if (intent === 'recycle' && (entities.deviceType || entities.deviceBrand)) {
        const { rows } = await this.queryProductInfo(entities, message);
        const re = this.getRecycleEstimate(entities.deviceType);
        if (rows.length || re) {
          let reply = '可以回收！';
          if (rows.length) reply += `已查到${entities.deviceType || ''}回收信息，`;
          if (re) {
            const grades = Object.entries(re).filter(([k]) => k !== 'category');
            reply += `参考回收估价：${grades.map(([g, info]) => `${g}品约${info.rate}`).join('，')}。`;
          }
          reply += '具体价格需提交设备到回收页由专业人员评估。';
          return this._wrap(reply, intent, entities, confidence, [
            { type: 'quick_reply', text: '提交回收申请怎么操作？' },
            { type: 'button', text: '前往回收评估', action: 'submit_recycle' }
          ]);
        }
      }
      if (this.isKnowledgeQuery(message, intent)) {
        const { rows } = await this.queryKnowledge(message, intent);
        if (rows.length) return this._wrap(this.formatKnowledgeReply(rows), intent, entities, confidence, [
          { type: 'quick_reply', text: '维修流程' }, { type: 'quick_reply', text: '保修多久' }
        ]);
      }

      // 兜底：大模型专业话术 / 规则回复
      const { reply, suggestedActions } = await this.generateSmartResponse(message, intent, conversationHistory, entities);
      const requiresHuman = this.humanTransfer(message, conversationHistory, { confidence, reply });
      return this._wrap(reply, intent, entities, confidence, suggestedActions, requiresHuman);
    } catch (error) {
      console.error('[RepairRecycleAgent] 处理失败:', error.message);
      return this._wrap('抱歉，我暂时无法处理您的请求，请稍后重试或联系人工客服。', 'error', {}, 0.0, [], true);
    }
  }

  _wrap(reply, intent, entities, confidence, suggestedActions, requiresHuman = false) {
    return {
      reply,
      suggestedActions: suggestedActions || [],
      intent,
      entities: entities || {},
      confidence,
      requiresHuman,
      agent: 'repair_recycle',
      scopeType: this.isInBusinessScope((entities || {}).deviceType, (entities || {}).deviceBrand)
    };
  }
}

module.exports = { RepairRecycleAgent };
