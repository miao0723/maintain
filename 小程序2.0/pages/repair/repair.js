// pages/repair/repair.js
const deviceData = require('../../utils/deviceData.js');

Page({
  data: {
    currentTab: 'repair', // repair 或 recycle
    isInternal: false, // 是否为公司内部人员（免付款申请）
    repairSubmitting: false,
    recycleSubmitting: false,
    repairStepIndex: 0,
    repairStepDisplayIndex: 1,
    repairStepPercent: '20%',
    repairStepCanNext: false,
    repairStepCanPrev: false,
    repairStepIsLast: false,
    repairStepSubmitReady: false,
    repairSteps: [
      { id: 0, stepNo: '1', title: '选择设备', hint: '先选设备大类，找不到就用自定义' },
      { id: 1, stepNo: '2', title: '品牌型号', hint: '已知就选，不清楚也可以先跳过部分信息' },
      { id: 2, stepNo: '3', title: '故障描述', hint: '问题越具体，报价和判断会越准确' },
      { id: 3, stepNo: '4', title: '服务安排', hint: '确认到店或上门取件，再补充联系信息' },
      { id: 4, stepNo: '5', title: '确认提交', hint: '提交后先检测，再报价，确认后才会开修' }
    ],
    currentRepairStep: { id: 0, stepNo: '1', title: '选择设备', hint: '先选设备大类，找不到就用自定义' },

    // 维修相关数据
    selectedDevice: null,
    prefillUserDeviceId: null,
    prefillIsWarranty: false,
    prefillOriginalOrderId: null,
    selectedBrand: null, // 选中的品牌
    selectedModel: null, // 选中的型号
    selectedProblem: null,
    customDescription: '',
    imageList: [],
    serviceType: 'shop', // shop(到店) 或 home(上门)
    selectedAddress: null, // 选中的地址（上门服务时使用）
    addressList: [], // 用户地址列表
    showAddressSelector: false, // 是否显示地址选择器

    // 单位相关数据
    selectedUnit: null, // 选中的单位
    unitList: [], // 用户单位列表
    showUnitSelector: false, // 是否显示单位选择器

    estimatedPrice: 0,
    formattedEstimatedPrice: '0', // 格式化后的预估价格（整数，避免假精度）
    priceRange: { min: 0, max: 0 }, // 预估维修价格合理浮动区间
    canSubmit: false, // 是否可以提交维修订单
    canSubmitRecycle: false, // 是否可以提交回收订单

    // 自定义相关
    isCustomDevice: false, // 是否选择自定义设备
    isCustomBrand: false, // 是否选择自定义品牌
    isCustomModel: false, // 是否选择自定义型号
    isCustomProblem: false, // 是否选择自定义故障
    isWaitingPrice: false, // 是否等待报价
    customIconUrl: 'https://img.icons8.com/color/144/edit--v1.png', // 自定义设备图标

    customDeviceType: '', // 自定义设备类型
    customBrand: '', // 自定义品牌
    customModel: '', // 自定义型号
    customProblemDesc: '', // 自定义故障描述
    extraDescription: '', // 额外描述

    // 显示用的计算属性
    deviceTypeDisplay: '',
    brandDisplay: '',
    modelDisplay: '',
    problemDisplay: '',

    // 型号选择器相关数据
    currentBrands: [], // 当前设备类型的品牌列表
    currentModels: [], // 当前品牌的型号列表
    selectedBrandName: '', // 选中的品牌名称
    selectedModelName: '', // 选中的型号名称
    selectedModelPriceRate: 1.0, // 选中的型号价格倍率
    selectedDeviceName: '', // 选中的设备类型名称
    showModelDrawer: true,
    showProblemDrawer: true,

    deviceTypes: deviceData.deviceTypes,
    deviceBrands: deviceData.deviceBrands,
    repairProblems: deviceData.repairProblems,

    commonProblems: [],

    // 故障问题及基础价格（按设备类型分类）
    allProblems: {
      1: [ // 手机
        { id: 1, icon: '🖥️', name: '屏幕破损/碎屏/显示异常', basePrice: 399 },
        { id: 2, icon: '🔋', name: '电池续航/充电问题', basePrice: 149 },
        { id: 3, icon: '⚡', name: '无法开机/死机/重启', basePrice: 249 },
        { id: 4, icon: '💿', name: '系统/软件故障', basePrice: 149 },
        { id: 5, icon: '📷', name: '摄像头/拍照问题', basePrice: 249 },
        { id: 6, icon: '📶', name: '信号/WiFi/蓝牙问题', basePrice: 149 },
        { id: 7, icon: '🔊', name: '声音/扬声器/听筒问题', basePrice: 129 },
        { id: 8, icon: '🔌', name: '按键/接口/卡槽损坏', basePrice: 129 },
        { id: 9, icon: '💧', name: '进水/受潮', basePrice: 349 },
        { id: 10, icon: '🔧', name: '主板/芯片故障', basePrice: 599 },
        { id: 11, icon: '📦', name: '外壳/中框/后盖损坏', basePrice: 199 },
        { id: 12, icon: '👆', name: '面容/指纹识别故障', basePrice: 199 }
      ],
      2: [ // 电脑/笔记本
        { id: 1, icon: '⚡', name: '无法开机/蓝屏/死机', basePrice: 299 },
        { id: 2, icon: '🖥️', name: '屏幕破损/花屏/闪屏', basePrice: 449 },
        { id: 3, icon: '🔋', name: '电池/电源/充电问题', basePrice: 199 },
        { id: 4, icon: '💿', name: '系统崩溃/重装系统', basePrice: 149 },
        { id: 5, icon: '🌡️', name: '散热/风扇噪音/过热', basePrice: 149 },
        { id: 6, icon: '⌨️', name: '键盘/触摸板故障', basePrice: 179 },
        { id: 7, icon: '💾', name: '硬盘/存储故障', basePrice: 299 },
        { id: 8, icon: '🎮', name: '显卡/GPU故障', basePrice: 449 },
        { id: 9, icon: '🔌', name: '接口/USB/HDMI损坏', basePrice: 149 },
        { id: 10, icon: '💧', name: '进水/液体损坏', basePrice: 499 },
        { id: 11, icon: '🔧', name: '主板/芯片级维修', basePrice: 699 },
        { id: 12, icon: '📶', name: 'WiFi/蓝牙/网络问题', basePrice: 129 }
      ],
      3: [ // 平板
        { id: 1, icon: '🖥️', name: '屏幕碎/触摸失灵', basePrice: 349 },
        { id: 2, icon: '🔋', name: '电池/充电问题', basePrice: 149 },
        { id: 3, icon: '⚡', name: '无法开机/死机', basePrice: 249 },
        { id: 4, icon: '💿', name: '系统卡顿/软件问题', basePrice: 129 },
        { id: 5, icon: '🔌', name: '充电口/接口损坏', basePrice: 129 },
        { id: 6, icon: '📶', name: 'WiFi/蓝牙故障', basePrice: 129 },
        { id: 7, icon: '📷', name: '摄像头故障', basePrice: 179 },
        { id: 8, icon: '📦', name: '外壳/边框变形', basePrice: 149 },
        { id: 9, icon: '💧', name: '进水/受潮', basePrice: 349 }
      ],
      4: [ // 手表/手环
        { id: 1, icon: '🖥️', name: '屏幕碎/显示异常', basePrice: 249 },
        { id: 2, icon: '🔋', name: '电池/续航问题', basePrice: 99 },
        { id: 3, icon: '⚡', name: '无法开机/死机', basePrice: 149 },
        { id: 4, icon: '🔌', name: '充电/触点问题', basePrice: 79 },
        { id: 5, icon: '⌚', name: '表带/表壳损坏', basePrice: 99 },
        { id: 6, icon: '❤️', name: '传感器(心率等)故障', basePrice: 179 },
        { id: 7, icon: '💧', name: '进水/防水失效', basePrice: 249 },
        { id: 8, icon: '📶', name: '蓝牙连接/同步问题', basePrice: 99 }
      ],
      5: [ // 耳机/音响
        { id: 1, icon: '🔊', name: '单边无声/声音小', basePrice: 99 },
        { id: 2, icon: '🔇', name: '完全无声/不工作', basePrice: 149 },
        { id: 3, icon: '🔋', name: '充电/电池问题', basePrice: 79 },
        { id: 4, icon: '📶', name: '蓝牙连接不稳定', basePrice: 99 },
        { id: 5, icon: '🔕', name: '降噪功能失效', basePrice: 149 },
        { id: 6, icon: '📦', name: '充电盒故障', basePrice: 99 },
        { id: 7, icon: '🎤', name: '麦克风问题', basePrice: 99 },
        { id: 8, icon: '🔌', name: '线材/接口破损', basePrice: 59 }
      ],
      6: [ // 相机/摄像机
        { id: 1, icon: '📸', name: 'CMOS/传感器故障', basePrice: 499 },
        { id: 2, icon: '🔍', name: '镜头/对焦故障', basePrice: 399 },
        { id: 3, icon: '📷', name: '快门/反光板问题', basePrice: 299 },
        { id: 4, icon: '🖥️', name: '屏幕/取景器故障', basePrice: 249 },
        { id: 5, icon: '🔋', name: '电池/电源问题', basePrice: 149 },
        { id: 6, icon: '💾', name: '卡槽/存储故障', basePrice: 99 },
        { id: 7, icon: '⚡', name: '无法开机', basePrice: 299 },
        { id: 8, icon: '🎥', name: '防抖/稳定器故障', basePrice: 299 },
        { id: 9, icon: '💧', name: '进水/受潮/发霉', basePrice: 499 }
      ],
      7: [ // 游戏机
        { id: 1, icon: '⚡', name: '无法开机/蓝灯/三红', basePrice: 299 },
        { id: 2, icon: '🎮', name: '手柄/控制器故障', basePrice: 149 },
        { id: 3, icon: '🖥️', name: '屏幕碎(掌机)', basePrice: 249 },
        { id: 4, icon: '💿', name: '卡带/光驱读取故障', basePrice: 179 },
        { id: 5, icon: '🌡️', name: '散热/风扇噪音', basePrice: 149 },
        { id: 6, icon: '🔌', name: 'HDMI/视频输出问题', basePrice: 129 },
        { id: 7, icon: '📶', name: 'WiFi/蓝牙连接故障', basePrice: 129 },
        { id: 8, icon: '🔋', name: '电池/充电问题(掌机)', basePrice: 99 }
      ],
      8: [ // 传感器/仪器
        { id: 1, icon: '📏', name: '测量不准/偏差大', basePrice: 349 },
        { id: 2, icon: '⚡', name: '无输出/无响应', basePrice: 299 },
        { id: 3, icon: '🔋', name: '电源/供电故障', basePrice: 199 },
        { id: 4, icon: '🖥️', name: '显示屏/面板故障', basePrice: 249 },
        { id: 5, icon: '🔌', name: '通信/接口故障', basePrice: 149 },
        { id: 6, icon: '🔬', name: '传感器探头损坏', basePrice: 349 },
        { id: 7, icon: '⚙️', name: '校准/标定问题', basePrice: 249 }
      ],
      9: [ // 无人机/航拍
        { id: 1, icon: '🚁', name: '无法起飞/电机故障', basePrice: 349 },
        { id: 2, icon: '📶', name: '图传/信号丢失', basePrice: 249 },
        { id: 3, icon: '📷', name: '云台/相机故障', basePrice: 349 },
        { id: 4, icon: '🔋', name: '电池/电源问题', basePrice: 249 },
        { id: 5, icon: '🔩', name: '桨叶/机身损坏', basePrice: 199 },
        { id: 6, icon: '📍', name: 'GPS/定位问题', basePrice: 199 },
        { id: 7, icon: '🎮', name: '遥控器故障', basePrice: 179 },
        { id: 8, icon: '💥', name: '炸机/进水严重损坏', basePrice: 599 }
      ],
      10: [ // 智能家居
        { id: 1, icon: '📶', name: '无法联网/配对失败', basePrice: 99 },
        { id: 2, icon: '⚡', name: '设备离线/无响应', basePrice: 129 },
        { id: 3, icon: '🔬', name: '传感器失灵', basePrice: 129 },
        { id: 4, icon: '🔋', name: '电源/电池问题', basePrice: 79 },
        { id: 5, icon: '🎤', name: '语音/控制失效', basePrice: 99 },
        { id: 6, icon: '📷', name: '摄像头/监控故障', basePrice: 179 },
        { id: 7, icon: '🔒', name: '门锁/电机故障', basePrice: 199 }
      ],
      11: [ // 打印机/办公设备
        { id: 1, icon: '📄', name: '卡纸/进纸故障', basePrice: 99 },
        { id: 2, icon: '🖨️', name: '打印模糊/条纹/缺色', basePrice: 149 },
        { id: 3, icon: '⚡', name: '无法打印/不响应', basePrice: 149 },
        { id: 4, icon: '💧', name: '墨盒/硒鼓/喷头问题', basePrice: 129 },
        { id: 5, icon: '🔌', name: 'USB/网络连接故障', basePrice: 99 },
        { id: 6, icon: '📋', name: '扫描/复印故障', basePrice: 129 },
        { id: 7, icon: '🔧', name: '主板/电源板故障', basePrice: 349 }
      ],
      12: [ // 服务器
        { id: 1, icon: '⚡', name: '无法开机/电源故障', basePrice: 699 },
        { id: 2, icon: '💾', name: '硬盘/阵列(RAID)故障', basePrice: 499 },
        { id: 3, icon: '🔧', name: '内存/主板故障', basePrice: 799 },
        { id: 4, icon: '🌡️', name: '风扇/散热异常', basePrice: 299 },
        { id: 5, icon: '⚙️', name: '系统/RAID配置', basePrice: 399 },
        { id: 6, icon: '📶', name: '网络/网卡故障', basePrice: 299 },
        { id: 7, icon: '🔧', name: '主板/芯片级维修', basePrice: 1299 }
      ],
      13: [ // 路由器/网络设备
        { id: 1, icon: '⚡', name: '无法开机/电源故障', basePrice: 129 },
        { id: 2, icon: '📶', name: 'WiFi信号弱/断流', basePrice: 99 },
        { id: 3, icon: '🔌', name: '网口/接口损坏', basePrice: 99 },
        { id: 4, icon: '💿', name: '固件/配置问题', basePrice: 79 },
        { id: 5, icon: '🔁', name: '频繁掉线/死机', basePrice: 99 },
        { id: 6, icon: '🌡️', name: '散热/过热', basePrice: 79 }
      ],
      14: [ // 显卡/电脑硬件
        { id: 1, icon: '⚡', name: '无法点亮/黑屏', basePrice: 399 },
        { id: 2, icon: '🖥️', name: '花屏/显示异常', basePrice: 349 },
        { id: 3, icon: '🌡️', name: '风扇/散热故障', basePrice: 199 },
        { id: 4, icon: '🔌', name: '供电/接口损坏', basePrice: 299 },
        { id: 5, icon: '📉', name: '性能下降/驱动故障', basePrice: 149 },
        { id: 6, icon: '💥', name: '进水/物理损坏', basePrice: 499 }
      ],
      15: [ // 投影仪/激光电视
        { id: 1, icon: '⚡', name: '无法开机/黑屏', basePrice: 199 },
        { id: 2, icon: '🔍', name: '画面模糊/对焦不准', basePrice: 149 },
        { id: 3, icon: '🌈', name: '色彩失真/偏色', basePrice: 199 },
        { id: 4, icon: '💡', name: '灯泡/光源衰减', basePrice: 299 },
        { id: 5, icon: '🌡️', name: '风扇/散热噪音', basePrice: 129 },
        { id: 6, icon: '🔌', name: 'HDMI/接口故障', basePrice: 129 },
        { id: 7, icon: '💿', name: '系统卡顿/无法升级', basePrice: 99 },
        { id: 8, icon: '🔊', name: '扬声器/声音问题', basePrice: 99 }
      ],
      16: [ // VR/AR设备
        { id: 1, icon: '⚡', name: '无法开机/黑屏', basePrice: 199 },
        { id: 2, icon: '🖥️', name: '屏幕/显示异常', basePrice: 249 },
        { id: 3, icon: '🎮', name: '手柄/控制器故障', basePrice: 149 },
        { id: 4, icon: '🪞', name: '头显/佩戴部件损坏', basePrice: 149 },
        { id: 5, icon: '📍', name: '追踪/定位失灵', basePrice: 199 },
        { id: 6, icon: '🔋', name: '电池/充电问题', basePrice: 99 },
        { id: 7, icon: '🔗', name: '连接/串流故障', basePrice: 149 }
      ],
      17: [ // 监控/安防设备
        { id: 1, icon: '⚡', name: '无法开机/离线', basePrice: 99 },
        { id: 2, icon: '📷', name: '画面模糊/夜视差', basePrice: 99 },
        { id: 3, icon: '📶', name: '无法联网/配对失败', basePrice: 99 },
        { id: 4, icon: '💾', name: '存储/录像故障', basePrice: 99 },
        { id: 5, icon: '💧', name: '进水/外壳损坏', basePrice: 99 },
        { id: 6, icon: '🔌', name: '供电/电源问题', basePrice: 79 }
      ],
      18: [ // 充电宝/移动电源
        { id: 1, icon: '🔌', name: '无法充电/充不进', basePrice: 59 },
        { id: 2, icon: '🔋', name: '电量虚标/掉电快', basePrice: 49 },
        { id: 3, icon: '🔧', name: '接口/线材损坏', basePrice: 39 },
        { id: 4, icon: '💡', name: '指示灯/按键失灵', basePrice: 39 },
        { id: 5, icon: '🔥', name: '鼓包/发热异常', basePrice: 59 }
      ],
      19: [ // 电子书阅读器
        { id: 1, icon: '⚡', name: '无法开机/黑屏', basePrice: 129 },
        { id: 2, icon: '🖥️', name: '屏幕碎/显示异常', basePrice: 199 },
        { id: 3, icon: '👆', name: '触控失灵', basePrice: 99 },
        { id: 4, icon: '🔋', name: '电池/续航问题', basePrice: 99 },
        { id: 5, icon: '🔌', name: '充电/接口故障', basePrice: 79 },
        { id: 6, icon: '💿', name: '系统卡顿/无法升级', basePrice: 79 }
      ],
      20: [ // 车载/汽车电子
        { id: 1, icon: '⚡', name: '无法开机/黑屏', basePrice: 129 },
        { id: 2, icon: '📷', name: '画面模糊/镜头脏损', basePrice: 99 },
        { id: 3, icon: '💾', name: '无法录像/存储故障', basePrice: 99 },
        { id: 4, icon: '📍', name: 'GPS/定位问题', basePrice: 99 },
        { id: 5, icon: '🔌', name: '供电/电源线故障', basePrice: 69 },
        { id: 6, icon: '📶', name: 'WiFi/连接问题', basePrice: 69 }
      ]
    },

    // 回收相关数据
    recycleType: null,
    selectedRecycleBrand: null,
    deviceModel: '',
    deviceCondition: '',
    recyclablePrice: 0,
    recyclePriceRange: { min: 0, max: 0 },
    isRecycleWaitingPrice: false,

    // 自定义回收相关
    isCustomRecycleType: false,
    isCustomRecycleBrand: false,
    customRecycleType: '',
    customRecycleBrand: '',

    // 回收相关
    recycleDescription: '',
    recycleImageList: [],

    showRecycleTypeDrawer: true,
    showRecycleBrandDrawer: true,
    showRecycleModelDrawer: true,
    showRecycleConditionDrawer: true,

    recycleTypes: [
      { id: 101, categoryId: 1, icon: '📱', name: '手机回收', price: '最高8000元', summary: '苹果 / 华为 / 小米 / 三星等' },
      { id: 102, categoryId: 2, icon: '💻', name: '笔记本回收', price: '最高12000元', summary: 'MacBook / ThinkPad / ROG等' },
      { id: 103, categoryId: 3, icon: '📟', name: '平板回收', price: '最高6000元', summary: 'iPad / MatePad / Galaxy Tab等' },
      { id: 104, categoryId: 4, icon: '⌚', name: '手表回收', price: '最高5000元', summary: 'Apple Watch / Garmin / 华为等' },
      { id: 105, categoryId: 5, icon: '🎧', name: '耳机/音响回收', price: '最高3000元', summary: 'AirPods / Bose / 索尼等' },
      { id: 106, categoryId: 6, icon: '📷', name: '相机回收', price: '最高15000元', summary: '索尼 / 佳能 / 尼康 / 富士等' },
      { id: 107, categoryId: 7, icon: '🎮', name: '游戏机回收', price: '最高4000元', summary: 'PS5 / Switch / Xbox等' },
      { id: 108, categoryId: 9, icon: '✈️', name: '无人机回收', price: '最高10000元', summary: '大疆 / 道通等' },
      { id: 112, categoryId: 12, icon: '🖥️', name: '服务器回收', price: '最高16000元', summary: '戴尔 / 惠普 / 联想 / 华为' },
      { id: 113, categoryId: 13, icon: '📡', name: '网络设备回收', price: '最高2000元', summary: '华为 / 华三 / TP-LINK / 思科' },
      { id: 114, categoryId: 14, icon: '🎛️', name: '显卡回收', price: '最高12000元', summary: 'NVIDIA / AMD / 英特尔' }
    ],

    recycleBrands: [], // 根据回收类型动态加载的品牌列表
    recycleModels: [],
    selectedRecycleModel: null,
    recycleModelRate: 0,
    isCustomRecycleModel: false,

    models: [],
    conditions: [
      { id: 1, name: '全新未使用', rate: 1.0 },
      { id: 2, name: '九成新', rate: 0.9 },
      { id: 3, name: '八成新', rate: 0.8 },
      { id: 4, name: '七成新', rate: 0.7 },
      { id: 5, name: '六成新及以下', rate: 0.6 }
    ],

    // 地图相关
    markers: [],
    polyline: []
  },

  onLoad(options) {
    console.log('维修页面加载');
    this.updateRepairStepState(0);

    // 检查是否从tabBar点击进入
    if (options && options.from === 'tabbar') {
      this.setData({
        currentTab: 'repair'
      });
    }

    // 如果是从地址页面返回且选择了上门服务，需要刷新地址列表
    if (options && options.refreshAddress === 'true') {
      this.loadAddressList();
    }

    // 检测内部人员身份：公司内部人员发起维修/回收仅作为免付款申请，无需支付
    const userInfo = wx.getStorageSync('userInfo') || {};
    const fromInternalEntry = !!(options && options.internal === '1');
    const targetTab = options && options.tab === 'recycle' ? 'recycle' : this.data.currentTab;
    this.setData({
      isInternal: userInfo.role === 'internal',
      // 从内部申请入口进入时，按入口类型强制打开对应 tab
      currentTab: fromInternalEntry ? targetTab : this.data.currentTab
    });
  },

  onShow() {
    console.log('维修页面显示');
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 1 })
      tabBar.refreshBadge()
    }
    // 加载用户地址列表
    this.loadAddressList();
    // 加载用户单位列表
    this.loadUnitList();

    // 检查是否有从"设备管理"页面传入的预填数据
    this.checkPrefill();
    this.updateRepairStepState(this.data.repairStepIndex);
  },

  /**
   * 设备图标加载失败时，显示 emoji 兜底
   */
  onDeviceImgError(e) {
    const index = e.currentTarget.dataset.index;
    const deviceTypes = this.data.deviceTypes;
    if (deviceTypes && deviceTypes[index]) {
      const key = `deviceTypes[${index}].imageUrl`;
      this.setData({ [key]: '' });
    }
  },

  /**
   * 自定义设备图标加载失败时，显示 emoji 兜底
   */
  onCustomImgError() {
    this.setData({ customIconUrl: '' });
  },

  /**
   * 检查并处理从设备管理页面传入的预填数据
   */
  checkPrefill() {
    const app = getApp()
    const prefillData = app.globalData.prefillDeviceData
    if (!prefillData) return

    // 清除预填数据，防止重复触发
    delete app.globalData.prefillDeviceData

    if (prefillData.type === 'repair') {
      this.prefillRepair(prefillData)
    } else if (prefillData.type === 'recycle') {
      this.prefillRecycle(prefillData.device)
    }
  },

  /**
   * 根据已绑定设备预填维修表单
   */
  prefillRepair(prefill) {
    const device = prefill.device
    this.setData({
      prefillUserDeviceId: device.id,
      prefillIsWarranty: !!prefill.isWarranty,
      prefillOriginalOrderId: prefill.originalOrderId || null
    })
    // 自定义设备类型（device_type_id === 0），跳过预设类型匹配
    if (Number(device.device_type_id) === 0) {
      const brandName = (device.brand_name || '').trim()
      const modelName = (device.device_model || '').trim()
      const condition = (device.device_condition || '').trim()
      const nickname = (device.device_nickname || '').trim()
      const customTypeName = (device.device_type_name || '自定义设备').trim()
      const problemName = (device.problem_name || '').trim()
      const problemDescription = (device.problem_description || '').trim()
      const diagnoseSummary = (device.diagnose_summary || '').trim()
      const estimatedCost = (device.estimated_cost || '').trim()
      const customProblemDesc = problemName || problemDescription
      const extraDesc = this.buildPrefillExtraDescription({
        condition,
        nickname,
        details: problemName && problemDescription && problemDescription !== problemName ? problemDescription : '',
        diagnoseSummary,
        estimatedCost
      })

      this.setData({
        isCustomDevice: true,
        customDeviceType: customTypeName,
        selectedDevice: null,
        selectedBrand: null,
        isCustomBrand: !!brandName,
        customBrand: brandName || '',
        selectedModel: null,
        isCustomModel: true,
        customModel: modelName || '',
        selectedModelName: modelName || '',
        currentBrands: [],
        currentModels: [],
        showModelDrawer: false,
        showProblemDrawer: !customProblemDesc,
        selectedProblem: null,
        isCustomProblem: true,
        customProblemDesc: customProblemDesc || '',
        commonProblems: [],
        estimatedPrice: 0,
        formattedEstimatedPrice: '0.0',
        selectedModelPriceRate: 1.0,
        extraDescription: extraDesc || ''
      })

      this.updateDisplayValues()
      this.checkCanSubmit()
      this.setData({ currentTab: 'repair' })
      this.updateRepairStepState(this.inferRepairStepIndex())
      wx.showToast({ title: '设备信息已填入', icon: 'success', duration: 2000 })
      return
    }

    // 根据设备类型ID匹配，无效则默认手机(id=1)
    let deviceTypeId = Number(device.device_type_id) || 1
    const foundType = this.data.deviceTypes.find(d => d.id === deviceTypeId)
    if (!foundType) deviceTypeId = 1
    const brandName = (device.brand_name || '').trim()
    const modelName = (device.device_model || '').trim()
    const condition = (device.device_condition || '').trim()
    const nickname = (device.device_nickname || '').trim()
    const problemName = (device.problem_name || '').trim()
    const problemDescription = (device.problem_description || '').trim()
    const diagnoseSummary = (device.diagnose_summary || '').trim()
    const estimatedCost = (device.estimated_cost || '').trim()

    // 1. 找到设备类型对象
    const selectedDevice = this.data.deviceTypes.find(d => d.id === deviceTypeId)
    if (!selectedDevice) {
      console.warn('未找到设备类型:', deviceTypeId)
      return
    }

    // 2. 加载对应的品牌列表
    const currentBrands = this.data.deviceBrands[deviceTypeId] || []
    const commonProblems = (this.data.allProblems[deviceTypeId] || []).map(problem => ({
      ...problem,
      formattedPrice: problem.basePrice.toFixed(1)
    }))

    // 构建基础状态
    const baseState = {
      selectedDevice: selectedDevice,
      selectedBrand: null,
      selectedModel: null,
      isCustomDevice: false,
      selectedProblem: null,
      isCustomProblem: false,
      customProblemDesc: '',
      currentBrands: currentBrands,
      commonProblems: commonProblems,
      showModelDrawer: true,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0',
      selectedModelPriceRate: 1.0,
      extraDescription: ''
    }

    let activePriceRate = 1.0
    let activeProblems = commonProblems

    // 3. 尝试匹配品牌（使用 includes 模糊匹配，不区分大小写）
    const lowerBrand = brandName.toLowerCase()
    const matchedBrand = currentBrands.find(b =>
      b.name.toLowerCase().includes(lowerBrand) || lowerBrand.includes(b.name.toLowerCase())
    )

    if (matchedBrand) {
      // 找到了匹配的品牌
      const currentModels = matchedBrand.models || []

      // 4. 尝试匹配型号
      const lowerModel = modelName.toLowerCase()
      const matchedModel = currentModels.find(m =>
        m.name.toLowerCase().includes(lowerModel) || lowerModel.includes(m.name.toLowerCase())
      )

      if (matchedModel) {
        // 完全匹配 — 自动选择型号并更新问题价格
        const priceRate = matchedModel.priceRate || 1.0
        const updatedProblems = (this.data.allProblems[deviceTypeId] || []).map(problem => ({
          ...problem,
          formattedPrice: Math.round(problem.basePrice * priceRate)
        }))
        activePriceRate = priceRate
        activeProblems = updatedProblems

        this.setData({
          ...baseState,
          selectedBrand: matchedBrand,
          isCustomBrand: false,
          selectedModel: matchedModel,
          selectedModelName: matchedModel.name,
          selectedModelPriceRate: priceRate,
          currentModels: currentModels,
          isCustomModel: false,
          showModelDrawer: false,
          showProblemDrawer: true,
          commonProblems: updatedProblems
        })
      } else {
        // 品牌匹配但型号不匹配 — 型号设为自定义输入
        this.setData({
          ...baseState,
          selectedBrand: matchedBrand,
          isCustomBrand: false,
          currentModels: currentModels,
          selectedModel: null,
          isCustomModel: true,
          customModel: modelName || '',
          selectedModelName: modelName || '',
          showModelDrawer: false
        })
      }
    } else {
      // 品牌不匹配 — 品牌和型号都设为自定义
      this.setData({
        ...baseState,
        isCustomBrand: true,
        customBrand: brandName || '',
        selectedModel: null,
        isCustomModel: true,
        customModel: modelName || '',
        selectedModelName: '',
        currentModels: [],
        showModelDrawer: false
      })
    }

    const matchedProblem = this.findProblemMatch(deviceTypeId, [problemName, problemDescription].filter(Boolean).join(' '))
    if (matchedProblem) {
      const { estimatedPrice, formattedEstimatedPrice, priceRange } = this.computeRepairEstimate(matchedProblem.basePrice, activePriceRate)
      this.setData({
        selectedProblem: matchedProblem,
        isCustomProblem: false,
        customProblemDesc: '',
        estimatedPrice,
        formattedEstimatedPrice,
        priceRange,
        showProblemDrawer: false
      })
    } else if (problemName || problemDescription) {
      this.setData({
        selectedProblem: null,
        isCustomProblem: true,
        customProblemDesc: problemName || problemDescription,
        estimatedPrice: 0,
        formattedEstimatedPrice: '0.0',
        showProblemDrawer: false
      })
    }

    const extraDesc = this.buildPrefillExtraDescription({
      condition,
      nickname,
      details: matchedProblem
        ? problemDescription
        : (problemName && problemDescription && problemDescription !== problemName ? problemDescription : ''),
      diagnoseSummary,
      estimatedCost
    })
    if (extraDesc) {
      this.setData({ extraDescription: extraDesc })
    }

    // 6. 更新显示值并检查提交
    this.updateDisplayValues()
    this.checkCanSubmit()

    // 7. 切换到维修 Tab
    this.setData({ currentTab: 'repair' })
    this.updateRepairStepState(this.inferRepairStepIndex())

    wx.showToast({ title: '设备信息已填入', icon: 'success', duration: 2000 })
  },

  buildPrefillExtraDescription({
    condition = '',
    nickname = '',
    details = '',
    diagnoseSummary = '',
    estimatedCost = ''
  }) {
    const lines = []
    if (condition) lines.push(`设备现状：${condition}`)
    if (nickname) lines.push(`设备昵称：${nickname}`)
    if (details) lines.push(`补充描述：${details}`)
    if (diagnoseSummary) lines.push(`自检结论：${diagnoseSummary}`)
    if (estimatedCost) lines.push(`预估费用：${estimatedCost}`)
    return lines.join('；')
  },

  findProblemMatch(deviceTypeId, text = '') {
    const normalized = text.trim().toLowerCase()
    if (!normalized) return null

    const aliasGroups = [
      ['屏', '碎屏', '花屏', '黑屏', '显示', '触摸'],
      ['电池', '充电', '续航'],
      ['开机', '重启', '死机'],
      ['系统', '软件', '卡顿'],
      ['摄像头', '拍照', '镜头', '对焦'],
      ['wifi', '蓝牙', '信号', '网络'],
      ['声音', '扬声器', '听筒', '无声', '杂音'],
      ['按键', '接口', '充电口', '卡槽', 'usb', 'hdmi'],
      ['进水', '受潮'],
      ['主板', '芯片', '短路'],
      ['云台', '图传', '炸机', '电机'],
      ['卡纸', '进纸']
    ]

    const problems = this.data.allProblems[deviceTypeId] || []
    return problems.find(problem => {
      const name = (problem.name || '').toLowerCase()
      if (!name) return false
      if (name.includes(normalized) || normalized.includes(name)) return true

      const keywords = name
        .split(/[\/\s()（）,，·]+/)
        .map(item => item.trim())
        .filter(item => item.length >= 2)

      if (keywords.some(keyword => normalized.includes(keyword))) {
        return true
      }

      return aliasGroups.some(group => {
        const hitNormalized = group.some(keyword => normalized.includes(keyword.toLowerCase()))
        const hitName = group.some(keyword => name.includes(keyword.toLowerCase()))
        return hitNormalized && hitName
      })
    }) || null
  },

  /**
   * 根据已绑定设备预填回收表单
   */
  prefillRecycle(device) {
    const deviceTypeId = Number(device.device_type_id) || 0
    const brandName = (device.brand_name || '').trim()
    const modelName = (device.device_model || '').trim()
    const condition = (device.device_condition || '').trim()

    // 1. 根据 device_type_id 找到匹配的回收类型
    const matchedType = this.data.recycleTypes.find(t => t.categoryId === deviceTypeId)
    
    if (matchedType) {
      // 有匹配的预设回收类型
      const categoryId = matchedType.categoryId
      const recycleBrands = this.data.deviceBrands[categoryId] || []
      this._doPrefillRecycle(device, matchedType, recycleBrands, brandName, modelName, condition)
    } else {
      // 没有匹配的回收类型，使用自定义
      this.setData({
        currentTab: 'recycle',
        isCustomRecycleType: true,
        customRecycleType: (device.device_type_name || '').trim() || '',
        isCustomRecycleBrand: true,
        customRecycleBrand: brandName || '',
        deviceModel: modelName || '',
        isCustomRecycleModel: true,
        isRecycleWaitingPrice: true,
        showRecycleTypeDrawer: false,
        showRecycleBrandDrawer: false,
        showRecycleModelDrawer: true,
        showRecycleConditionDrawer: true
      })
      // 尝试匹配设备成色
      this._matchRecycleCondition(condition)
      this.checkCanSubmitRecycle()
      wx.showToast({ title: '设备信息已填入', icon: 'success', duration: 2000 })
    }
  },

  /**
   * 执行预设回收类型的预填逻辑
   */
  _doPrefillRecycle(device, recycleType, recycleBrands, brandName, modelName, condition) {
    const baseState = {
      recycleType: recycleType,
      isCustomRecycleType: false,
      customRecycleType: '',
      showRecycleTypeDrawer: false,
      showRecycleConditionDrawer: true,
      deviceModel: modelName || '',
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: true,
      recyclablePrice: 0,
      isRecycleWaitingPrice: true
    }

    // 2. 尝试匹配品牌
    const lowerBrand = brandName.toLowerCase()
    const matchedBrand = recycleBrands.find(b =>
      b.name.toLowerCase().includes(lowerBrand) || lowerBrand.includes(b.name.toLowerCase())
    )

    if (matchedBrand) {
      const recycleModels = matchedBrand.models || []

      // 3. 尝试匹配型号
      const lowerModel = modelName.toLowerCase()
      const matchedModel = recycleModels.find(m =>
        m.name.toLowerCase().includes(lowerModel) || lowerModel.includes(m.name.toLowerCase())
      )

      if (matchedModel) {
        this.setData({
          ...baseState,
          selectedRecycleBrand: matchedBrand,
          isCustomRecycleBrand: false,
          recycleModels: recycleModels,
          selectedRecycleModel: matchedModel,
          isCustomRecycleModel: false,
          deviceModel: matchedModel.name,
          recycleModelRate: Number(matchedModel.priceRate || 1),
          showRecycleModelDrawer: false
        })
      } else {
        this.setData({
          ...baseState,
          selectedRecycleBrand: matchedBrand,
          isCustomRecycleBrand: false,
          recycleModels: recycleModels,
          isCustomRecycleModel: true,
          deviceModel: modelName || '',
          showRecycleModelDrawer: true
        })
      }
    } else {
      // 品牌不匹配
      this.setData({
        ...baseState,
        selectedRecycleBrand: null,
        isCustomRecycleBrand: true,
        customRecycleBrand: brandName || '',
        recycleModels: [],
        isCustomRecycleModel: true,
        showRecycleBrandDrawer: true,
        showRecycleModelDrawer: true
      })
    }

    // 4. 匹配设备成色
    this._matchRecycleCondition(condition)
    if (condition) {
      this.setData({ recycleDescription: `设备状态：${condition}` })
    }

    // 5. 切换到回收 Tab
    this.setData({ currentTab: 'recycle' })

    // 6. 检查是否可提交并计算价格
    this.checkCanSubmitRecycle()
    if (!this.data.isCustomRecycleType && !this.data.isCustomRecycleBrand && this.data.deviceCondition) {
      this.calculateRecyclePrice()
    }

    wx.showToast({ title: '设备信息已填入', icon: 'success', duration: 2000 })
  },

  /**
   * 匹配设备成色（供预填回收使用）
   */
  _matchRecycleCondition(condition) {
    if (!condition) return
    const conditionLower = condition.toLowerCase()
    const matchedCondition = this.data.conditions.find(c => {
      const nameLower = c.name.toLowerCase()
      return conditionLower.includes(nameLower) || nameLower.includes(conditionLower)
    })

    if (matchedCondition) {
      this.setData({
        deviceCondition: matchedCondition.name,
        conditionRate: matchedCondition.rate,
        showRecycleConditionDrawer: false
      })
    } else {
      const defaultCondition = this.data.conditions[2] // 默认八成新
      this.setData({
        deviceCondition: defaultCondition.name,
        conditionRate: defaultCondition.rate,
        showRecycleConditionDrawer: false
      })
    }
  },

  onReady() {
    console.log('维修页面准备就绪');
    // 页面准备就绪时也加载单位列表，确保数据最新
    this.loadUnitList();
  },

  // 切换维修/回收标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'recycle') {
      // 跳转到新的回收页面
      wx.navigateTo({
        url: '/pages/recycle/recycle'
      });
      return;
    }
    this.setData({ currentTab: tab });
    if (tab === 'repair') {
      this.updateRepairStepState(this.data.repairStepIndex);
    }
  },

  canSubmitRepairNow() {
    return !!this.data.canSubmit && !(this.data.serviceType === 'home' && !this.data.selectedAddress)
  },

  canProceedRepairStep(stepIndex = this.data.repairStepIndex) {
    const hasDevice = this.data.isCustomDevice
      ? this.data.customDeviceType.trim() !== ''
      : !!this.data.selectedDevice
    const hasBrand = this.data.isCustomBrand
      ? this.data.customBrand.trim() !== ''
      : !!this.data.selectedBrand
    const hasModel = this.data.isCustomModel
      ? this.data.customModel.trim() !== ''
      : this.data.selectedModelName !== ''
    const hasProblem = this.data.isCustomProblem
      ? this.data.customProblemDesc.trim() !== ''
      : !!this.data.selectedProblem

    switch (stepIndex) {
      case 0:
        return hasDevice
      case 1:
        if (this.data.isCustomDevice) return true
        return hasBrand && hasModel
      case 2:
        return hasProblem
      case 3:
        return this.data.serviceType !== 'home' || !!this.data.selectedAddress
      default:
        return this.canSubmitRepairNow()
    }
  },

  getRepairStepValidationMessage(stepIndex = this.data.repairStepIndex) {
    switch (stepIndex) {
      case 0:
        return '请先选择设备类型'
      case 1:
        return this.data.isCustomDevice ? '可直接进入下一步' : '请先补充品牌和型号'
      case 2:
        return '请先描述设备故障'
      case 3:
        return this.data.serviceType === 'home' ? '请选择上门地址' : '请先确认服务安排'
      default:
        return '请完善维修订单信息'
    }
  },

  updateRepairStepState(nextIndex = this.data.repairStepIndex) {
    const maxIndex = this.data.repairSteps.length - 1
    const repairStepIndex = Math.max(0, Math.min(nextIndex, maxIndex))
    const currentRepairStep = this.data.repairSteps[repairStepIndex]
    const repairStepCanNext = repairStepIndex < maxIndex && this.canProceedRepairStep(repairStepIndex)
    const repairStepSubmitReady = repairStepIndex === maxIndex && this.canSubmitRepairNow()

    this.setData({
      repairStepIndex,
      repairStepDisplayIndex: repairStepIndex + 1,
      currentRepairStep,
      repairStepPercent: `${Math.round(((repairStepIndex + 1) / this.data.repairSteps.length) * 100)}%`,
      repairStepCanPrev: repairStepIndex > 0,
      repairStepCanNext,
      repairStepIsLast: repairStepIndex === maxIndex,
      repairStepSubmitReady
    })
  },

  inferRepairStepIndex() {
    if (!this.canProceedRepairStep(0)) return 0
    if (!this.canProceedRepairStep(1)) return 1
    if (!this.canProceedRepairStep(2)) return 2
    if (!this.canProceedRepairStep(3)) return 3
    return 4
  },

  goRepairPrevStep() {
    if (!this.data.repairStepCanPrev) return
    this.updateRepairStepState(this.data.repairStepIndex - 1)
  },

  goRepairNextStep() {
    if (this.data.repairStepIsLast) {
      if (!this.canSubmitRepairNow()) {
        wx.showToast({
          title: this.getRepairStepValidationMessage(this.data.repairStepIndex),
          icon: 'none'
        })
        return
      }
      this.submitRepairOrder()
      return
    }

    if (!this.canProceedRepairStep(this.data.repairStepIndex)) {
      wx.showToast({
        title: this.getRepairStepValidationMessage(this.data.repairStepIndex),
        icon: 'none'
      })
      return
    }

    this.updateRepairStepState(this.data.repairStepIndex + 1)
  },

  jumpToRepairStep(e) {
    const step = Number(e.currentTarget.dataset.step)
    if (Number.isNaN(step)) return
    this.updateRepairStepState(step)
  },

  maybeAutoAdvanceRepairStep(sourceStep) {
    if (this.data.currentTab !== 'repair') return
    if (this.data.repairStepIndex !== sourceStep) return
    if (!this.canProceedRepairStep(sourceStep)) return
    if (sourceStep >= this.data.repairSteps.length - 1) return
    if (sourceStep === 0 && this.data.isCustomDevice) return
    if (sourceStep === 1 && (this.data.isCustomDevice || this.data.isCustomBrand || this.data.isCustomModel)) return
    if (sourceStep === 2 && this.data.isCustomProblem) return
    this.updateRepairStepState(sourceStep + 1)
  },

  toggleModelDrawer() {
    this.setData({
      showModelDrawer: !this.data.showModelDrawer
    });
  },

  toggleProblemDrawer() {
    this.setData({
      showProblemDrawer: !this.data.showProblemDrawer
    });
  },

  toggleRecycleTypeDrawer() {
    this.setData({
      showRecycleTypeDrawer: !this.data.showRecycleTypeDrawer
    });
  },

  toggleRecycleBrandDrawer() {
    this.setData({
      showRecycleBrandDrawer: !this.data.showRecycleBrandDrawer
    });
  },

  toggleRecycleModelDrawer() {
    this.setData({
      showRecycleModelDrawer: !this.data.showRecycleModelDrawer
    });
  },

  toggleRecycleConditionDrawer() {
    this.setData({
      showRecycleConditionDrawer: !this.data.showRecycleConditionDrawer
    });
  },

  // 更新显示值
  updateDisplayValues() {
    const { selectedDevice, customDeviceType, isCustomDevice } = this.data;
    const { selectedBrand, customBrand, isCustomBrand } = this.data;
    const { selectedModelName, customModel, isCustomModel } = this.data;
    const { selectedProblem, isCustomProblem, customProblemDesc } = this.data;

    const deviceTypeDisplay = isCustomDevice ? customDeviceType : (selectedDevice ? selectedDevice.name : '');
    const brandDisplay = (isCustomBrand || isCustomDevice) ? customBrand : (selectedBrand ? selectedBrand.name : '');
    const modelDisplay = isCustomModel ? customModel : selectedModelName;
    const problemDisplay = isCustomProblem ? customProblemDesc : (selectedProblem ? selectedProblem.name : '');

    this.setData({
      deviceTypeDisplay,
      brandDisplay,
      modelDisplay,
      problemDisplay
    });

    if (this.data.currentTab === 'repair') {
      this.updateRepairStepState(this.data.repairStepIndex)
    }
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedDevice, isCustomDevice, customDeviceType } = this.data;
    const { selectedBrand, isCustomBrand, customBrand } = this.data;
    const { selectedModelName, isCustomModel, customModel } = this.data;
    const { selectedProblem, isCustomProblem, customProblemDesc } = this.data;

    // 检查设备类型
    const hasDevice = isCustomDevice ? customDeviceType.trim() !== '' : !!selectedDevice;
    if (!hasDevice) {
      this.setData({ canSubmit: false, isWaitingPrice: false });
      return;
    }

    // 检查品牌（如果不是自定义设备，需要品牌）
    if (!isCustomDevice) {
      const hasBrand = isCustomBrand ? customBrand.trim() !== '' : !!selectedBrand;
      if (!hasBrand) {
        this.setData({ canSubmit: false, isWaitingPrice: false });
        return;
      }
    }

    // 检查型号（如果是自定义设备，型号可选）
    if (!isCustomDevice) {
      const hasModel = isCustomModel ? customModel.trim() !== '' : selectedModelName !== '';
      if (!hasModel) {
        this.setData({ canSubmit: false, isWaitingPrice: false });
        return;
      }
    }

    // 检查故障描述
    const hasProblem = isCustomProblem ? customProblemDesc.trim() !== '' : !!selectedProblem;
    if (!hasProblem) {
      this.setData({ canSubmit: false, isWaitingPrice: false });
      return;
    }

    // 判断是否需要等待报价
    const isWaitingPrice = isCustomDevice || isCustomBrand || isCustomModel || isCustomProblem;

    this.setData({
      canSubmit: true,
      isWaitingPrice
    });

    if (this.data.currentTab === 'repair') {
      this.updateRepairStepState(this.data.repairStepIndex)
    }
  },

  // 选择自定义设备
  selectCustomDevice() {
    this.setData({
      selectedDevice: null,
      selectedBrand: null,
      selectedModel: null,
      selectedProblem: null,
      isCustomDevice: true,
      isCustomBrand: false,
      isCustomModel: false,
      isCustomProblem: true,
      customDeviceType: '',
      customBrand: '',
      customModel: '',
      customProblemDesc: '',
      currentBrands: [],
      currentModels: [],
      commonProblems: [],
      selectedBrandName: '',
      selectedModelName: '自定义设备', // 自定义设备时设置一个默认型号
      showModelDrawer: false,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
  },

  // 自定义设备输入
  onCustomDeviceInput(e) {
    this.setData({
      customDeviceType: e.detail.value
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(0);
  },

  // 选择自定义品牌
  selectCustomBrand() {
    this.setData({
      selectedBrand: null,
      selectedModel: null,
      selectedProblem: null,
      isCustomBrand: true,
      isCustomModel: false,
      isCustomProblem: true,
      customBrand: '',
      customModel: '',
      customProblemDesc: '',
      currentModels: [],
      selectedBrandName: '',
      selectedModelName: '',
      showModelDrawer: false,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
  },

  // 自定义品牌输入
  onCustomBrandInput(e) {
    this.setData({
      customBrand: e.detail.value
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
  },

  // 选择自定义型号
  selectCustomModel() {
    this.setData({
      selectedModel: null,
      selectedProblem: null,
      isCustomModel: true,
      isCustomProblem: true,
      customModel: '',
      customProblemDesc: '',
      selectedModelName: '',
      showModelDrawer: true,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
  },

  // 自定义型号输入
  onCustomModelInput(e) {
    this.setData({
      customModel: e.detail.value
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(1);
  },

  // 选择自定义故障
  selectCustomProblem() {
    this.setData({
      selectedProblem: null,
      isCustomProblem: true,
      customProblemDesc: '',
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
  },

  // 自定义故障输入
  onCustomProblemInput(e) {
    this.setData({
      customProblemDesc: e.detail.value
    });
    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(2);
  },

  // 额外描述输入
  onExtraDescInput(e) {
    this.setData({
      extraDescription: e.detail.value
    });
  },

  // 维修相关方法
  selectDevice(e) {
    const deviceId = e.currentTarget.dataset.id;
    console.log('选择设备类型ID:', deviceId);

    // 更新当前设备类型
    const selectedDevice = this.data.deviceTypes.find(d => d.id === deviceId);
    console.log('找到的设备:', selectedDevice);

    if (!selectedDevice) {
      console.error('未找到设备类型:', deviceId);
      return;
    }

    // 从deviceBrands中找到对应设备类型的品牌
    const currentBrands = this.data.deviceBrands[deviceId] || [];

    // 从allProblems中找到对应设备类型的故障问题
    const commonProblems = (this.data.allProblems[deviceId] || []).map(problem => ({
      ...problem,
      formattedPrice: Math.round(problem.basePrice) // 初始显示基础价格（整数）
    }));

    this.setData({
      selectedDevice: selectedDevice,
      selectedBrand: null,
      selectedModel: null,
      selectedProblem: null,
      isCustomDevice: false,
      isCustomBrand: false,
      isCustomModel: false,
      isCustomProblem: false,
      currentBrands: currentBrands,
      currentModels: [],
      commonProblems: commonProblems,
      selectedBrandName: '',
      selectedModelName: '',
      showModelDrawer: true,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });

    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(0);
  },

  // 设备图片加载失败时回退为 emoji
  onDeviceImgError(e) {
    const index = e.currentTarget.dataset.index;
    const deviceTypes = this.data.deviceTypes;
    if (deviceTypes && deviceTypes[index]) {
      const key = `deviceTypes[${index}].imageUrl`;
      this.setData({
        [key]: '' // 清空 imageUrl，让 image 显示为空，后续可用 CSS 伪元素显示 emoji
      });
    }
  },

  selectBrand(e) {
    const brandId = e.currentTarget.dataset.id;
    console.log('选择品牌ID:', brandId);

    const brand = this.data.currentBrands.find(b => b.id === brandId);
    if (!brand) {
      console.error('未找到品牌:', brandId);
      return;
    }

    console.log('选择品牌:', brand);
    console.log('品牌型号列表:', brand.models);

    this.setData({
      selectedBrand: brand,
      selectedModel: null,
      selectedProblem: null,
      isCustomBrand: false,
      isCustomModel: false,
      isCustomProblem: false,
      currentModels: brand.models || [],
      selectedBrandName: brand.name,
      selectedModelName: '',
      showModelDrawer: true,
      showProblemDrawer: false,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0'
    });

    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(1);
  },

  selectModel(e) {
    const modelId = e.currentTarget.dataset.id;
    console.log('选择型号ID:', modelId);

    const model = this.data.currentModels.find(m => m.id === modelId);
    if (!model) {
      console.error('未找到型号:', modelId);
      return;
    }

    console.log('选择型号:', model);

    const priceRate = model.priceRate || 1.0;

    // 重新计算每个故障问题的价格
    const commonProblems = (this.data.allProblems[this.data.selectedDevice.id] || []).map(problem => ({
      ...problem,
      formattedPrice: Math.round(problem.basePrice * priceRate)
    }));

    this.setData({
      selectedModel: model,
      selectedModelName: model.name,
      selectedModelPriceRate: priceRate,
      selectedProblem: null,
      isCustomModel: false,
      isCustomProblem: false,
      showModelDrawer: false,
      showProblemDrawer: true,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0',
      commonProblems: commonProblems
    });

    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(1);
  },

  // 根据故障基础价与机型倍率计算维修估价：
  // - 取整，避免 “638.4” 这类假精度小数
  // - 给出合理浮动区间（±15% 左右），贴近真实门店“看机报价”的浮动范围
  computeRepairEstimate(basePrice, priceRate) {
    const estimate = Math.round((basePrice || 0) * (priceRate || 1));
    if (!estimate) {
      return { estimatedPrice: 0, formattedEstimatedPrice: '0', priceRange: { min: 0, max: 0 } };
    }
    const range = {
      min: Math.round(estimate * 0.85),
      max: Math.round(estimate * 1.15)
    };
    return {
      estimatedPrice: estimate,
      formattedEstimatedPrice: String(estimate),
      priceRange: range
    };
  },

  selectProblem(e) {
    const problemId = e.currentTarget.dataset.id;
    console.log('选择故障问题ID:', problemId);

    // 从commonProblems中找到对应的问题
    const problem = this.data.commonProblems.find(p => p.id === problemId);
    if (!problem) {
      console.error('未找到故障问题:', problemId);
      return;
    }

    console.log('选择故障问题:', problem);

    const basePrice = problem.basePrice || 0;
    const priceRate = this.data.selectedModelPriceRate || 1.0;
    const { estimatedPrice, formattedEstimatedPrice, priceRange } = this.computeRepairEstimate(basePrice, priceRate);

    console.log('基础价格:', basePrice, '价格倍率:', priceRate, '估算价格:', estimatedPrice);

    this.setData({
      selectedProblem: problem,
      isCustomProblem: false,
      showProblemDrawer: false,
      estimatedPrice: estimatedPrice,
      formattedEstimatedPrice: formattedEstimatedPrice,
      priceRange: priceRange
    });

    this.updateDisplayValues();
    this.checkCanSubmit();
    this.maybeAutoAdvanceRepairStep(2);
  },

  onDescriptionInput(e) {
    this.setData({
      customDescription: e.detail.value
    });
  },

  selectServiceType(e) {
    const serviceType = e.currentTarget.dataset.type;
    this.setData({
      serviceType: serviceType
    });
    this.updateRepairStepState(this.data.repairStepIndex);
    if (serviceType === 'shop') {
      this.maybeAutoAdvanceRepairStep(3);
    }

    // 如果切换到上门取件，检查是否需要选择地址
    if (serviceType === 'home' && !this.data.selectedAddress) {
      // 延迟一点显示选择器，让用户先看到服务方式切换
      setTimeout(() => {
        this.showAddressSelector();
      }, 300);
    }
  },

  /**
   * 加载用户地址列表
   */
  loadAddressList() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    const { addressApi } = require('../../utils/api.js');
    addressApi.getAddressList()
      .then(addresses => {
        // 处理数据格式
        const addressList = (addresses || []).map(addr => ({
          id: addr.id || addr.address_id,
          contactName: addr.contact_name || addr.contactName,
          contactPhone: addr.contact_phone || addr.contactPhone,
          province: addr.province,
          city: addr.city,
          district: addr.district,
          detail: addr.detail_address || addr.detail,
          isDefault: addr.is_default || addr.isDefault || false
        }));

        this.setData({ addressList });
      })
      .catch(err => {
        console.error('加载地址列表失败:', err);
        // 回退到本地存储
        const addresses = wx.getStorageSync('addresses') || [];
        this.setData({ addressList: addresses });
      });
  },

  /**
   * 加载用户单位列表
   */
  loadUnitList() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    console.log('开始加载单位列表...');

    const { unitApi } = require('../../utils/api.js');
    unitApi.getUnitList()
      .then(units => {
        console.log('API返回单位数据:', units);

        // 处理数据格式
        const unitList = (units || []).map(unit => ({
          id: unit.id || unit.unit_id,
          name: unit.name || unit.unit_name,
          address: unit.address || unit.unit_address,
          contactName: unit.contact_name || unit.contactName,
          contactPhone: unit.contact_phone || unit.contactPhone,
          isDefault: unit.is_default || unit.isDefault || false
        }));

        console.log('处理后的单位列表:', unitList);

        // 设置默认单位（只有当当前没有选中单位时才自动设置）
        const defaultUnit = unitList.find(unit => unit.isDefault);
        console.log('找到默认单位:', defaultUnit, '当前选中单位:', this.data.selectedUnit);

        if (defaultUnit && !this.data.selectedUnit) {
          this.setData({ selectedUnit: defaultUnit });
        }

        this.setData({ unitList });
      })
      .catch(err => {
        console.error('加载单位列表失败:', err);
        // 回退到本地存储
        const units = wx.getStorageSync('units') || [];
        console.log('从本地存储加载单位:', units);

        const unitList = units.map(unit => ({
          ...unit,
          id: unit.id || unit.unit_id,
          name: unit.name || unit.unit_name,
          address: unit.address || unit.unit_address,
          contactName: unit.contact_name || unit.contactName,
          contactPhone: unit.contact_phone || unit.contactPhone,
          isDefault: unit.is_default || unit.isDefault || false
        }));

        const defaultUnit = unitList.find(unit => unit.isDefault);
        console.log('本地存储默认单位:', defaultUnit);

        if (defaultUnit && !this.data.selectedUnit) {
          this.setData({ selectedUnit: defaultUnit });
        }

        this.setData({ unitList });
      });
  },

  /**
   * 显示地址选择器
   */
  showAddressSelector() {
    if (this.data.addressList.length === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有添加地址，是否现在去添加？',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/address/address'
            });
          }
        }
      });
      return;
    }

    this.setData({ showAddressSelector: true });
  },

  /**
   * 隐藏地址选择器
   */
  hideAddressSelector() {
    this.setData({ showAddressSelector: false });
  },

  /**
   * 选择地址
   */
  selectAddress(e) {
    const addressId = e.currentTarget.dataset.id;
    const selectedAddress = this.data.addressList.find(addr => addr.id === addressId);

    if (selectedAddress) {
      this.setData({
        selectedAddress: selectedAddress,
        showAddressSelector: false
      });
      this.updateRepairStepState(this.data.repairStepIndex);
      this.maybeAutoAdvanceRepairStep(3);
    }
  },

  /**
   * 添加新地址
   */
  addNewAddress() {
    this.setData({ showAddressSelector: false });
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  /**
   * 显示单位选择器
   */
  showUnitSelector() {
    if (this.data.unitList.length === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有添加单位信息，是否现在去添加？',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/units/units'
            });
          }
        }
      });
      return;
    }

    this.setData({ showUnitSelector: true });
  },

  /**
   * 隐藏单位选择器
   */
  hideUnitSelector() {
    this.setData({ showUnitSelector: false });
  },

  /**
   * 选择单位
   */
  selectUnit(e) {
    const unitId = e.currentTarget.dataset.id;
    const selectedUnit = this.data.unitList.find(unit => unit.id === unitId);

    if (selectedUnit) {
      this.setData({
        selectedUnit: selectedUnit,
        showUnitSelector: false
      });
      this.updateRepairStepState(this.data.repairStepIndex);
    }
  },

  /**
   * 添加新单位
   */
  addNewUnit() {
    this.setData({ showUnitSelector: false });
    wx.navigateTo({
      url: '/pages/units/units'
    });
  },

  /**
   * 取消选择单位
   */
  cancelSelectUnit() {
    this.setData({ selectedUnit: null });
  },

  // 图片相关
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 5,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        const newImageList = that.data.imageList.concat(tempFilePaths);
        if (newImageList.length > 5) {
          wx.showToast({
            title: '最多上传5张图片',
            icon: 'none'
          });
          return;
        }
        that.setData({
          imageList: newImageList
        });
      }
    });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    imageList.splice(index, 1);
    this.setData({ imageList });
  },

  // 提交维修订单
  async submitRepairOrder() {
    if (this.data.repairSubmitting) {
      return;
    }

    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请完善维修信息',
        icon: 'none'
      });
      return;
    }

    // 如果是上门取件，必须选择地址
    if (this.data.serviceType === 'home' && !this.data.selectedAddress) {
      wx.showToast({
        title: '请选择上门取件地址',
        icon: 'none'
      });
      this.showAddressSelector();
      return;
    }

    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再提交订单',
        confirmText: '去登录',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    const {
      selectedDevice,
      selectedBrand,
      selectedModel,
      selectedProblem,
      isCustomDevice,
      isCustomBrand,
      isCustomModel,
      isCustomProblem,
      customDeviceType,
      customBrand,
      customModel,
      customProblemDesc,
      extraDescription,
      imageList
    } = this.data;

    const description = isCustomProblem
      ? [customProblemDesc, extraDescription ? `补充说明：${extraDescription}` : ''].filter(Boolean).join('\n\n')
      : extraDescription

    const orderData = {
      userId: userInfo.id,
      orderType: 'repair',
      deviceType: isCustomDevice ? customDeviceType : selectedDevice.name,
      deviceId: isCustomDevice ? 0 : selectedDevice.id,
      deviceTypeName: isCustomDevice ? customDeviceType : null,
      brand: isCustomBrand ? customBrand : (selectedBrand ? selectedBrand.name : ''),
      model: isCustomModel ? customModel : (selectedModel ? selectedModel.name : (isCustomDevice ? '自定义设备' : '')),
      problem: isCustomProblem ? (customProblemDesc || '自定义设备故障') : (selectedProblem ? selectedProblem.name : '其他问题'),
      description,
      images: imageList,
      serviceType: this.data.serviceType,
      isWaitingPrice: this.data.isWaitingPrice,
      estimatedPrice: this.data.isWaitingPrice ? 0 : this.data.estimatedPrice,
      userDeviceId: this.data.prefillUserDeviceId || null,
      isWarranty: this.data.prefillIsWarranty || false,
      originalOrderId: this.data.prefillOriginalOrderId || null
    };

    // 如果是上门取件，添加地址信息
    if (this.data.serviceType === 'home' && this.data.selectedAddress) {
      orderData.address = {
        contactName: this.data.selectedAddress.contactName,
        contactPhone: this.data.selectedAddress.contactPhone,
        province: this.data.selectedAddress.province,
        city: this.data.selectedAddress.city,
        district: this.data.selectedAddress.district,
        detail: this.data.selectedAddress.detail
      };
    }

    // 如果选择了单位，添加单位信息
    if (this.data.selectedUnit) {
      orderData.unit = {
        id: this.data.selectedUnit.id,
        name: this.data.selectedUnit.name,
        address: this.data.selectedUnit.address,
        contactName: this.data.selectedUnit.contactName,
        contactPhone: this.data.selectedUnit.contactPhone
      };
    }

    console.log('提交维修订单:', orderData);

    // 内部人员：免付款申请，无需核对金额，仅确认提交
    if (this.data.isInternal) {
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '提交内部维修申请',
          content: '您是公司内部人员，本次提交仅作为免付款维修申请，无需支付。提交后由管理员确认并安排维修。是否提交？',
          confirmText: '确认提交',
          confirmColor: '#4f6b84',
          cancelText: '再看看',
          success: (r) => resolve(!!r.confirm)
        });
      });
      if (!confirmed) return;
    } else {
      // 金额确认弹窗：核对维修报价/待报价是否合理后再提交
      const confirmed = await new Promise((resolve) => {
        const isWaiting = this.data.isWaitingPrice;
        const priceText = isWaiting
          ? '待报价（提交后由维修管理员评估报价）'
          : '¥' + (Number(this.data.estimatedPrice) || 0) + (this.data.priceRange && this.data.priceRange.max ? `（参考区间 ¥${this.data.priceRange.min} ~ ¥${this.data.priceRange.max}）` : '');
        const content = isWaiting
          ? '您选择"等待报价"。提交后维修管理员会先评估故障并给出报价，确认后再维修。是否提交？'
          : `维修预估金额：${priceText}\n（最终以维修管理员报价为准）\n请确认金额是否合理。`;
        wx.showModal({
          title: '确认维修金额',
          content,
          confirmText: '确认提交',
          confirmColor: '#4f6b84',
          cancelText: '再看看',
          success: (r) => resolve(!!r.confirm)
        });
      });
      if (!confirmed) return;
    }

    // 先上传图片，获取永久URL
    this.setData({ repairSubmitting: true });
    this.uploadImages(imageList).then(uploadedUrls => {
      if (uploadedUrls.length > 0) {
        orderData.images = uploadedUrls;
      }

      wx.showLoading({ title: '提交中...' });

      const { orderApi } = require('../../utils/api.js');
      orderApi.createOrder(orderData)
      .then(res => {
        wx.hideLoading();
        console.log('订单创建响应:', res);
        if (res.success && res.data) {
          // 内部人员：免付款申请，提示待管理员确认
          if (this.data.isInternal) {
            wx.showModal({
              title: '内部申请已提交',
              content: '您的免付款维修申请已提交，等待管理员确认后将安排维修。',
              showCancel: false,
              confirmText: '查看申请',
              success: () => {
                this.resetRepairForm();
                setTimeout(() => {
                  wx.switchTab({
                    url: '/pages/mine/mine'
                  });
                }, 100);
              }
            });
          } else if (this.data.isWaitingPrice) {
            // 普通用户：等待报价的订单
            wx.showModal({
              title: '订单提交成功',
              content: '您的订单已提交，维修管理员会尽快为您报价。报价完成后会通知您。',
              showCancel: false,
              confirmText: '查看订单',
              success: () => {
                this.resetRepairForm();
                setTimeout(() => {
                  wx.switchTab({
                    url: '/pages/mine/mine'
                  });
                }, 100);
              }
            });
          } else {
            wx.showToast({
              title: '订单提交成功',
              icon: 'success'
            });
            this.resetRepairForm();
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/mine/mine'
              });
            }, 1500);
          }
        } else {
          wx.showToast({
            title: res.message || '订单提交失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('订单提交失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ repairSubmitting: false });
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('图片上传失败:', err);
      wx.showToast({
        title: '图片上传失败，请重试',
        icon: 'none'
      });
      this.setData({ repairSubmitting: false });
    });
  },

  /**
   * 上传故障图片到服务器，返回永久URL
   */
  uploadImages(tempFilePaths) {
    if (!tempFilePaths || tempFilePaths.length === 0) {
      return Promise.resolve([]);
    }

    const app = getApp();
    const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl;
    // 网关 /mp-api 已映射到后端 /api；路径不再重复写 /api，否则会变成 /mp-api/api/... 而 404
    const uploadUrl = baseUrl + '/upload/image';
    const token = wx.getStorageSync('token') || '';

    wx.showLoading({ title: '上传图片中...' });

    const uploadOne = (filePath) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: uploadUrl,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success && data.data) {
                resolve(data.data.url);
              } else {
                reject(new Error(data.message || '上传失败'));
              }
            } catch (error) {
              reject(error);
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    };

    // 逐个上传所有图片
    const uploadTasks = tempFilePaths.map(filePath => uploadOne(filePath));
    return Promise.all(uploadTasks).then(urls => {
      wx.hideLoading();
      console.log('图片上传完成:', urls);
      return urls;
    }).catch(err => {
      wx.hideLoading();
      console.error('图片上传失败:', err);
      throw err;
    });
  },

  // 重置维修表单
  resetRepairForm() {
    this.setData({
      selectedDevice: null,
      selectedBrand: null,
      selectedModel: null,
      selectedProblem: null,
      customDescription: '',
      imageList: [],
      serviceType: 'shop',
      selectedAddress: null,
      estimatedPrice: 0,
      formattedEstimatedPrice: '0.0',
      canSubmit: false,
      isCustomDevice: false,
      isCustomBrand: false,
      isCustomModel: false,
      isCustomProblem: false,
      isWaitingPrice: false,
      customDeviceType: '',
      customBrand: '',
      customModel: '',
      customProblemDesc: '',
      extraDescription: '',
      currentBrands: [],
      currentModels: [],
      commonProblems: [],
      selectedBrandName: '',
      selectedModelName: '',
      prefillUserDeviceId: null,
      prefillIsWarranty: false,
      prefillOriginalOrderId: null,
      showModelDrawer: true,
      showProblemDrawer: true
    });
    this.updateDisplayValues();
    this.updateRepairStepState(0);
  },

  // 回收相关方法

  // 选择自定义回收类型
  selectCustomRecycleType() {
    this.setData({
      recycleType: null,
      selectedRecycleBrand: null,
      isCustomRecycleType: true,
      isCustomRecycleBrand: false,
      isRecycleWaitingPrice: true,
      customRecycleType: '',
      customRecycleBrand: '',
      deviceModel: '',
      deviceCondition: '',
      recyclablePrice: 0,
      canSubmitRecycle: false,
      recycleBrands: [],
      recycleModels: [],
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: true,
      showRecycleTypeDrawer: false,
      showRecycleBrandDrawer: true,
      showRecycleModelDrawer: true,
      showRecycleConditionDrawer: true
    });
  },

  // 自定义回收类型输入
  onCustomRecycleTypeInput(e) {
    this.setData({
      customRecycleType: e.detail.value
    });
    this.checkCanSubmitRecycle();
  },

  selectRecycleType(e) {
    const typeId = parseInt(e.currentTarget.dataset.id);
    const recycleType = this.data.recycleTypes.find(t => t.id === typeId);
    const categoryId = recycleType ? recycleType.categoryId : 1;

    // 根据回收类型从 deviceBrands 加载对应的品牌列表
    const recycleBrands = this.data.deviceBrands[categoryId] || [];

    this.setData({
      recycleType: recycleType,
      selectedRecycleBrand: null,
      isCustomRecycleType: false,
      isCustomRecycleBrand: false,
      customRecycleType: '',
      customRecycleBrand: '',
      deviceModel: '',
      deviceCondition: '',
      recycleDescription: '',
      recycleImageList: [],
      recyclablePrice: 0,
      isRecycleWaitingPrice: false,
      canSubmitRecycle: false,
      recycleBrands: recycleBrands,
      recycleModels: [],
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: false,
      showRecycleTypeDrawer: false,
      showRecycleBrandDrawer: true,
      showRecycleModelDrawer: true,
      showRecycleConditionDrawer: true
    });

    console.log('选择回收类型:', recycleType, '品牌列表:', recycleBrands);
  },

  // 选择自定义回收品牌
  selectCustomRecycleBrand() {
    this.setData({
      selectedRecycleBrand: null,
      isCustomRecycleBrand: true,
      isRecycleWaitingPrice: true,
      customRecycleBrand: '',
      deviceModel: '',
      recyclablePrice: 0,
      recycleModels: [],
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: true,
      showRecycleBrandDrawer: false,
      showRecycleModelDrawer: true,
      showRecycleConditionDrawer: true
    });
  },

  // 自定义回收品牌输入
  onCustomRecycleBrandInput(e) {
    this.setData({
      customRecycleBrand: e.detail.value
    });
  },

  selectRecycleBrand(e) {
    const brandId = parseInt(e.currentTarget.dataset.id);
    const brand = this.data.recycleBrands.find(b => b.id === brandId);
    const recycleModels = brand && Array.isArray(brand.models) ? brand.models : [];

    this.setData({
      selectedRecycleBrand: brand,
      isCustomRecycleBrand: false,
      customRecycleBrand: '',
      deviceModel: '',
      recyclablePrice: 0,
      recycleModels: recycleModels,
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: false,
      showRecycleBrandDrawer: false,
      showRecycleModelDrawer: true,
      showRecycleConditionDrawer: true
    });

    console.log('选择回收品牌:', brand);
  },

  selectRecycleModel(e) {
    const modelId = parseInt(e.currentTarget.dataset.id);
    const model = this.data.recycleModels.find(item => item.id === modelId);
    if (!model) return;

    this.setData({
      selectedRecycleModel: model,
      isCustomRecycleModel: false,
      deviceModel: model.name,
      recycleModelRate: Number(model.priceRate || 1),
      showRecycleModelDrawer: false
    });

    this.checkCanSubmitRecycle();
    if (!this.data.isCustomRecycleType && !this.data.isCustomRecycleBrand && this.data.deviceCondition) {
      this.calculateRecyclePrice();
    }
  },

  selectCustomRecycleModel() {
    this.setData({
      selectedRecycleModel: null,
      isCustomRecycleModel: true,
      deviceModel: '',
      recycleModelRate: 0,
      recyclablePrice: 0,
      isRecycleWaitingPrice: true
    });
    this.checkCanSubmitRecycle();
  },

  // 检查是否可以提交回收订单
  checkCanSubmitRecycle() {
    const { recycleType, isCustomRecycleType, customRecycleType } = this.data;
    const { selectedRecycleBrand, isCustomRecycleBrand, customRecycleBrand } = this.data;
    const { deviceModel, deviceCondition } = this.data;

    // 检查回收类型
    const hasType = isCustomRecycleType ? customRecycleType.trim() !== '' : !!recycleType;
    if (!hasType) {
      this.setData({ canSubmitRecycle: false });
      return;
    }

    // 检查品牌
    const hasBrand = isCustomRecycleBrand ? customRecycleBrand.trim() !== '' : !!selectedRecycleBrand;
    if (!hasBrand) {
      this.setData({ canSubmitRecycle: false });
      return;
    }

    // 检查型号
    if (!deviceModel || deviceModel.trim() === '') {
      this.setData({ canSubmitRecycle: false });
      return;
    }

    // 检查成色
    if (!deviceCondition) {
      this.setData({ canSubmitRecycle: false });
      return;
    }

    // 内部人员：免付款申请，永不进入报价流程
    const isRecycleWaitingPrice = this.data.isInternal
      ? false
      : (isCustomRecycleType || isCustomRecycleBrand || !this.data.selectedRecycleModel);

    this.setData({
      canSubmitRecycle: true,
      isRecycleWaitingPrice
    });
  },

  onRecycleModelInput(e) {
    this.setData({
      deviceModel: e.detail.value,
      selectedRecycleModel: null,
      isCustomRecycleModel: true,
      recycleModelRate: 0,
      isRecycleWaitingPrice: true
    });
    this.checkCanSubmitRecycle();
  },

  onRecycleDescriptionInput(e) {
    this.setData({
      recycleDescription: e.detail.value
    });
  },

  selectRecycleCondition(e) {
    const conditionId = parseInt(e.currentTarget.dataset.id);
    const condition = this.data.conditions.find(c => c.id === conditionId);

    this.setData({
      deviceCondition: condition.name,
      conditionRate: condition.rate,
      showRecycleConditionDrawer: false
    });

    this.checkCanSubmitRecycle();
    if (!this.data.isCustomRecycleType && !this.data.isCustomRecycleBrand) {
      this.calculateRecyclePrice();
    }
  },

  calculateRecyclePrice() {
    // 内部人员：免付款申请，不计算任何价格，避免出现金额提示
    if (this.data.isInternal) {
      this.setData({ recyclablePrice: 0, isRecycleWaitingPrice: false });
      return;
    }

    if (!this.data.recycleType || !this.data.selectedRecycleBrand || !this.data.deviceModel || !this.data.deviceCondition) {
      this.setData({ recyclablePrice: 0, canSubmitRecycle: false });
      return;
    }

    // 根据回收类型设定参考基准价（贴近该类目真实二手市场均价，非虚高）
    const basePriceMap = {
      1: 4000,  // 手机
      2: 5000,  // 笔记本
      3: 2500,  // 平板
      4: 1500,  // 手表
      5: 800,   // 耳机/音响
      6: 4000,  // 相机
      7: 2000,  // 游戏机
      9: 3500,  // 无人机
      12: 6000,  // 服务器
      13: 400,   // 网络设备
      14: 4000   // 显卡
    }
    const categoryId = this.data.recycleType.categoryId || 1
    const basePrice = basePriceMap[categoryId] || 2500

    const rate = this.data.conditionRate || 0.6;
    const modelRate = Number(this.data.recycleModelRate || 0);
    if (!modelRate) {
      this.setData({ recyclablePrice: 0, isRecycleWaitingPrice: true });
      return;
    }

    // 叠加二手回收基准系数（0.9），即使是“全新”也不等于 100% 参考价
    const RECYCLE_BASE_FACTOR = 0.9;
    const price = Math.round(basePrice * modelRate * rate * RECYCLE_BASE_FACTOR);
    const priceRange = {
      min: Math.round(price * 0.9),
      max: Math.round(price * 1.05)
    };

    this.setData({
      recyclablePrice: price,
      recyclePriceRange: priceRange,
      isRecycleWaitingPrice: false
    });

    console.log('计算回收价格:', { categoryId, basePrice, modelRate, rate, price, priceRange });
  },

  // 回收图片上传
  chooseRecycleImage() {
    const that = this;
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        const newImageList = that.data.recycleImageList.concat(tempFilePaths);
        if (newImageList.length > 3) {
          wx.showToast({
            title: '最多上传3张图片',
            icon: 'none'
          });
          return;
        }
        that.setData({
          recycleImageList: newImageList
        });
      }
    });
  },

  previewRecycleImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.recycleImageList[index],
      urls: this.data.recycleImageList
    });
  },

  deleteRecycleImage(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.recycleImageList;
    imageList.splice(index, 1);
    this.setData({ recycleImageList: imageList });
  },

  submitRecycleOrder() {
    if (this.data.recycleSubmitting) {
      return;
    }

    // 内部人员：未经过确认弹窗时，先走内部免付款确认流程
    if (this.data.isInternal && !this.data._internalRecycleConfirmed) {
      this.showRecycleConfirm();
      return;
    }
    // 重置确认标志，避免影响下次提交
    if (this.data._internalRecycleConfirmed) {
      this.setData({ _internalRecycleConfirmed: false });
    }

    // 验证回收类型
    const hasType = this.data.isCustomRecycleType
      ? this.data.customRecycleType.trim() !== ''
      : !!this.data.recycleType;

    if (!hasType) {
      wx.showToast({
        title: '请选择回收类型',
        icon: 'none'
      });
      return;
    }

    // 验证品牌
    const hasBrand = this.data.isCustomRecycleBrand
      ? this.data.customRecycleBrand.trim() !== ''
      : !!this.data.selectedRecycleBrand;

    if (!hasBrand) {
      wx.showToast({
        title: '请选择设备品牌',
        icon: 'none'
      });
      return;
    }

    if (!this.data.deviceModel || this.data.deviceModel.trim() === '') {
      wx.showToast({
        title: '请输入设备型号',
        icon: 'none'
      });
      return;
    }

    if (!this.data.deviceCondition) {
      wx.showToast({
        title: '请选择设备成色',
        icon: 'none'
      });
      return;
    }

    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再提交回收订单',
        confirmText: '去登录',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    // 构建完整的描述信息
    const typeDisplay = this.data.isCustomRecycleType ? this.data.customRecycleType : (this.data.recycleType ? this.data.recycleType.name : '');
    const brandDisplay = this.data.isCustomRecycleBrand ? this.data.customRecycleBrand : (this.data.selectedRecycleBrand ? this.data.selectedRecycleBrand.name : '');
    let fullDescription = `回收类型：${typeDisplay}，品牌：${brandDisplay}，型号：${this.data.deviceModel}，成色：${this.data.deviceCondition}`;
    if (this.data.recycleDescription && this.data.recycleDescription.trim() !== '') {
      fullDescription += `。备注：${this.data.recycleDescription}`;
    }

    // 确保 deviceType 有一个有效的值
    let deviceTypeValue = this.data.recycleType ? this.data.recycleType.categoryId : 0
    if (this.data.isCustomRecycleType) {
      deviceTypeValue = 0 // 自定义类型用0标识
    }

    const recycleData = {
      userId: userInfo.id,
      orderType: 'recycle',
      deviceId: deviceTypeValue,
      deviceType: deviceTypeValue,
      deviceTypeName: typeDisplay,
      problem: typeDisplay || '设备回收', // 确保 problem 有值
      description: fullDescription || '设备回收订单', // 确保 description 有值
      images: this.data.recycleImageList,
      serviceType: 'shop',
      brand: brandDisplay,
      model: this.data.deviceModel,
      deviceCondition: this.data.deviceCondition,
      condition: this.data.deviceCondition,
      estimatedPrice: this.data.isRecycleWaitingPrice ? 0 : this.data.recyclablePrice,
      isWaitingPrice: this.data.isRecycleWaitingPrice,
      // 内部人员：标记为免付款内部订单，由后端走 internal_pending 流程
      isInternal: this.data.isInternal,
      is_internal: this.data.isInternal ? 1 : 0,
      paymentStatus: this.data.isInternal ? 'waived' : 'unpaid'
    };

    console.log('提交回收订单数据:', recycleData);

    // 先上传图片，获取永久URL
    this.setData({ recycleSubmitting: true });
    this.uploadImages(this.data.recycleImageList).then(uploadedUrls => {
      if (uploadedUrls.length > 0) {
        recycleData.images = uploadedUrls;
      }

      wx.showLoading({
        title: '提交中...',
        mask: true
      });

      const { orderApi } = require('../../utils/api.js');
      orderApi.createOrder(recycleData)
      .then(res => {
        wx.hideLoading();
        console.log('回收订单创建响应:', res);

        if (res.success && res.data) {
          // 内部人员：免付款申请，提示待管理员确认
          if (this.data.isInternal) {
            wx.showModal({
              title: '内部回收申请已提交',
              content: '您的免付款回收申请已提交，等待管理员确认后将安排回收。',
              showCancel: false,
              confirmText: '查看申请',
              success: () => {
                this.resetRecycleForm();
                setTimeout(() => {
                  wx.switchTab({
                    url: '/pages/mine/mine'
                  });
                }, 100);
              }
            });
            return;
          }

          // 显示成功动画
          wx.showToast({
            title: '回收申请提交成功',
            icon: 'success',
            duration: 1500
          });

          // 延迟显示订单详情弹窗
          setTimeout(() => {
            if (this.data.isRecycleWaitingPrice) {
              wx.showModal({
                title: '订单提交成功',
                content: '您的自定义回收订单已提交，回收管理员会尽快为您报价。报价完成后会通知您。',
                showCancel: false,
                confirmText: '查看订单',
                success: () => {
                  this.resetRecycleForm();
                  wx.switchTab({
                    url: '/pages/mine/mine'
                  });
                }
              });
            } else {
              wx.showModal({
                title: '订单创建成功',
                content: `订单号：${res.data.order_id}\n预估价：¥${res.data.estimated_price}\n\n我们会尽快安排人员人员联系您`,
                confirmText: '查看订单',
                cancelText: '继续回收',
                success: (modalRes) => {
                  this.resetRecycleForm();
                  if (modalRes.confirm) {
                    wx.switchTab({
                      url: '/pages/mine/mine'
                    });
                  }
                }
              });
            }
          }, 1600);
        } else {
          wx.showModal({
            title: '提交失败',
            content: res.message || '回收申请提交失败，请重试',
            showCancel: false
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('回收订单提交失败:', err);

        // 显示详细的错误信息
        let errorMessage = '网络错误，请重试';
        if (err && err.message) {
          if (err.message.includes('500')) {
            errorMessage = '服务器错误，请稍后重试';
          } else if (err.message.includes('timeout')) {
            errorMessage = '请求超时，请检查网络';
          } else if (err.message.includes('fail')) {
            errorMessage = '网络连接失败，请检查网络';
          }
        }

        wx.showModal({
          title: '提交失败',
          content: errorMessage,
          showCancel: false
        });
      })
      .finally(() => {
        this.setData({ recycleSubmitting: false });
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('图片上传失败:', err);
      wx.showToast({
        title: '图片上传失败，请重试',
        icon: 'none'
      });
      this.setData({ recycleSubmitting: false });
    });
  },

  // 重置回收表单
  resetRecycleForm() {
    this.setData({
      recycleType: null,
      selectedRecycleBrand: null,
      isCustomRecycleType: false,
      isCustomRecycleBrand: false,
      isRecycleWaitingPrice: false,
      customRecycleType: '',
      customRecycleBrand: '',
      deviceModel: '',
      deviceCondition: '',
      recycleDescription: '',
      recycleImageList: [],
      recyclablePrice: 0,
      canSubmitRecycle: false,
      recycleBrands: [],
      recycleModels: [],
      selectedRecycleModel: null,
      recycleModelRate: 0,
      isCustomRecycleModel: false,
      showRecycleTypeDrawer: true,
      showRecycleBrandDrawer: true,
      showRecycleModelDrawer: true,
      showRecycleConditionDrawer: true
    });
  },

  /**
   * 创建回收订单（独立方法）
   */
  createRecycleOrder() {
    // 复用submitRecycleOrder的逻辑
    this.submitRecycleOrder();
  },

  /**
   * 显示回收订单确认弹窗
   */
  showRecycleConfirm() {
    const { recycleType, isCustomRecycleType, customRecycleType, selectedRecycleBrand, isCustomRecycleBrand, customRecycleBrand, deviceModel, deviceCondition, recyclablePrice, recycleDescription, recycleImageList, isRecycleWaitingPrice } = this.data;

    const typeDisplay = isCustomRecycleType ? customRecycleType : (recycleType ? recycleType.name : '');
    const brandDisplay = isCustomRecycleBrand ? customRecycleBrand : (selectedRecycleBrand ? selectedRecycleBrand.name : '');

    // 内部人员：免付款申请，无需核对金额，仅确认提交
    if (this.data.isInternal) {
      const internalContent = `
回收类型：${typeDisplay}
设备品牌：${brandDisplay}
设备型号：${deviceModel}
设备成色：${deviceCondition}
${recycleDescription ? '\n设备描述：' + recycleDescription : ''}
${recycleImageList.length > 0 ? '\n已上传' + recycleImageList.length + '张照片' : ''}

您是公司内部人员，本次提交仅作为免付款回收申请，无需支付。提交后由管理员确认并安排回收。是否提交？
      `;
      wx.showModal({
        title: '提交内部回收申请',
        content: internalContent.trim(),
        confirmText: '确认提交',
        cancelText: '再看看',
        confirmColor: '#4f6b84',
        success: (res) => {
          if (res.confirm) {
            // 标记已确认，避免 submitRecycleOrder 再次弹窗
            this.setData({ _internalRecycleConfirmed: true });
            this.submitRecycleOrder();
          }
        }
      });
      return;
    }

    const confirmContent = `
回收类型：${typeDisplay}
设备品牌：${brandDisplay}
设备型号：${deviceModel}
设备成色：${deviceCondition}
${isRecycleWaitingPrice ? '等待管理员报价' : '预估回收价：¥' + recyclablePrice}
${recycleDescription ? '\n设备描述：' + recycleDescription : ''}
${recycleImageList.length > 0 ? '\n已上传' + recycleImageList.length + '张照片' : ''}
    `;

    wx.showModal({
      title: '确认回收订单信息',
      content: confirmContent.trim(),
      confirmText: '确认提交',
      cancelText: '返回修改',
      success: (res) => {
        if (res.confirm) {
          // 用户确认，提交订单
          this.submitRecycleOrder();
        }
      }
    });
  }
});
