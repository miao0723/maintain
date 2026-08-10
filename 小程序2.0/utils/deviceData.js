// pages/repair/deviceData.js
// 设备品牌和型号数据（多设备类型，不含"其他"类，用户可用自定义）
module.exports = {
  deviceTypes: [
    { id: 1, icon: '📱', name: '手机', imageUrl: 'https://img.icons8.com/color/144/smartphone--v1.png' },
    { id: 2, icon: '💻', name: '电脑/笔记本', imageUrl: 'https://img.icons8.com/color/144/laptop--v1.png' },
    { id: 3, icon: '📟', name: '平板', imageUrl: 'https://img.icons8.com/color/144/ipad-pro--v1.png' },
    { id: 4, icon: '⌚', name: '手表/手环', imageUrl: 'https://img.icons8.com/color/144/smartwatch--v1.png' },
    { id: 5, icon: '🎧', name: '耳机/音响', imageUrl: 'https://img.icons8.com/color/144/headphones--v1.png' },
    { id: 6, icon: '📷', name: '相机/摄像机', imageUrl: 'https://img.icons8.com/color/144/camera--v1.png' },
    { id: 7, icon: '🎮', name: '游戏机', imageUrl: 'https://img.icons8.com/color/144/xbox-controller--v1.png' },
    { id: 8, icon: '🔬', name: '传感器/仪器', imageUrl: 'https://img.icons8.com/color/144/microchip--v1.png' },
    { id: 9, icon: '✈️', name: '无人机/航拍', imageUrl: 'https://img.icons8.com/color/144/drone--v1.png' },
    { id: 10, icon: '🏠', name: '智能家居', imageUrl: 'https://img.icons8.com/color/144/smart-home-automation--v1.png' },
    { id: 11, icon: '🖨️', name: '打印机/办公设备', imageUrl: 'https://img.icons8.com/color/144/printer--v1.png' },
    { id: 12, icon: '🖥️', name: '服务器', imageUrl: 'https://img.icons8.com/color/144/server.png' },
    { id: 13, icon: '📡', name: '路由器/网络设备', imageUrl: 'https://img.icons8.com/color/144/router.png' },
    { id: 14, icon: '🎛️', name: '显卡/电脑硬件', imageUrl: 'https://img.icons8.com/color/144/graphics-card.png' },
    { id: 15, icon: '📽️', name: '投影仪/激光电视', imageUrl: 'https://img.icons8.com/color/144/projector.png' },
    { id: 16, icon: '🕶️', name: 'VR/AR设备', imageUrl: 'https://img.icons8.com/color/144/virtual-reality.png' },
    { id: 17, icon: '🎥', name: '监控/安防设备', imageUrl: 'https://img.icons8.com/color/144/cctv-camera.png' },
    { id: 18, icon: '🔋', name: '充电宝/移动电源', imageUrl: 'https://img.icons8.com/color/144/power-bank.png' },
    { id: 19, icon: '📖', name: '电子书阅读器', imageUrl: 'https://img.icons8.com/color/144/ereader.png' },
    { id: 20, icon: '🚗', name: '车载/汽车电子', imageUrl: 'https://img.icons8.com/color/144/car.png' }
  ],

  // 设备品牌列表（按设备类型分类）
  deviceBrands: {
    // 手机
    1: [
      { id: 1, name: '苹果', models: [
        { id: 1, name: 'iPhone 17 Pro Max', priceRate: 1.6 },
        { id: 2, name: 'iPhone 17 Pro', priceRate: 1.5 },
        { id: 3, name: 'iPhone 16 Pro Max', priceRate: 1.5 },
        { id: 4, name: 'iPhone 16 Pro', priceRate: 1.4 },
        { id: 5, name: 'iPhone 16', priceRate: 1.3 },
        { id: 6, name: 'iPhone 15 Pro Max', priceRate: 1.4 },
        { id: 7, name: 'iPhone 15 Pro', priceRate: 1.35 },
        { id: 8, name: 'iPhone 15', priceRate: 1.3 },
        { id: 9, name: 'iPhone 14 Pro Max', priceRate: 1.3 },
        { id: 10, name: 'iPhone 14 Pro', priceRate: 1.25 },
        { id: 11, name: 'iPhone 14', priceRate: 1.2 },
        { id: 12, name: 'iPhone 13系列', priceRate: 1.1 },
        { id: 13, name: 'iPhone SE', priceRate: 0.8 }
      ]},
      { id: 2, name: '华为', models: [
        { id: 1, name: 'Mate 70 Pro', priceRate: 1.4 },
        { id: 2, name: 'Mate 60 Pro', priceRate: 1.35 },
        { id: 3, name: 'P70/Pura系列', priceRate: 1.3 },
        { id: 4, name: 'Nova系列', priceRate: 0.85 },
        { id: 5, name: 'Mate X折叠屏', priceRate: 1.5 }
      ]},
      { id: 3, name: '小米', models: [
        { id: 1, name: '小米15 Ultra', priceRate: 1.45 },
        { id: 2, name: '小米15', priceRate: 1.3 },
        { id: 3, name: '小米14系列', priceRate: 1.2 },
        { id: 4, name: '红米K系列', priceRate: 1.0 },
        { id: 5, name: '红米Note系列', priceRate: 0.8 }
      ]},
      { id: 4, name: 'OPPO', models: [
        { id: 1, name: 'Find X8 Ultra', priceRate: 1.4 },
        { id: 2, name: 'Find X8', priceRate: 1.3 },
        { id: 3, name: 'Reno系列', priceRate: 0.9 },
        { id: 4, name: 'A系列', priceRate: 0.75 }
      ]},
      { id: 5, name: 'vivo', models: [
        { id: 1, name: 'X200 Pro', priceRate: 1.35 },
        { id: 2, name: 'X200', priceRate: 1.25 },
        { id: 3, name: 'S系列', priceRate: 0.85 },
        { id: 4, name: 'iQOO数字系列', priceRate: 1.0 }
      ]},
      { id: 6, name: '三星', models: [
        { id: 1, name: 'Galaxy S25 Ultra', priceRate: 1.45 },
        { id: 2, name: 'Galaxy S25', priceRate: 1.25 },
        { id: 3, name: 'Galaxy Z Fold/Flip', priceRate: 1.4 }
      ]},
      { id: 7, name: '荣耀', models: [
        { id: 1, name: 'Magic7 Pro', priceRate: 1.3 },
        { id: 2, name: 'Magic系列', priceRate: 1.15 },
        { id: 3, name: '数字系列', priceRate: 0.95 },
        { id: 4, name: 'X系列', priceRate: 0.85 }
      ]},
      { id: 8, name: '一加/真我', models: [
        { id: 1, name: '一加13', priceRate: 1.25 },
        { id: 2, name: '一加Ace系列', priceRate: 0.95 },
        { id: 3, name: '真我GT系列', priceRate: 1.0 },
        { id: 4, name: '真我数字系列', priceRate: 0.85 }
      ]}
    ],

    // 电脑/笔记本
    2: [
      { id: 1, name: '苹果', models: [
        { id: 1, name: 'MacBook Pro 16"', priceRate: 1.4 },
        { id: 2, name: 'MacBook Pro 14"', priceRate: 1.3 },
        { id: 3, name: 'MacBook Air 15"', priceRate: 1.1 },
        { id: 4, name: 'MacBook Air 13"', priceRate: 1.0 },
        { id: 5, name: 'iMac', priceRate: 1.2 },
        { id: 6, name: 'Mac mini', priceRate: 0.9 },
        { id: 7, name: 'Mac Studio/Pro', priceRate: 1.5 }
      ]},
      { id: 2, name: '华为', models: [
        { id: 1, name: 'MateBook X Pro', priceRate: 1.2 },
        { id: 2, name: 'MateBook 14/16', priceRate: 0.95 },
        { id: 3, name: 'MateBook D系列', priceRate: 0.85 }
      ]},
      { id: 3, name: '小米', models: [
        { id: 1, name: 'RedmiBook Pro', priceRate: 0.95 },
        { id: 2, name: 'Xiaomi Book', priceRate: 0.9 }
      ]},
      { id: 4, name: '联想', models: [
        { id: 1, name: 'ThinkPad X1 Carbon', priceRate: 1.2 },
        { id: 2, name: 'ThinkPad T/P系列', priceRate: 1.0 },
        { id: 3, name: '拯救者Y9000P', priceRate: 1.1 },
        { id: 4, name: '拯救者Y7000', priceRate: 0.95 },
        { id: 5, name: '小新Pro', priceRate: 0.9 },
        { id: 6, name: 'YOGA系列', priceRate: 1.0 }
      ]},
      { id: 5, name: '戴尔', models: [
        { id: 1, name: 'XPS 16/14', priceRate: 1.2 },
        { id: 2, name: 'Alienware', priceRate: 1.3 },
        { id: 3, name: 'Inspiron灵越', priceRate: 0.85 },
        { id: 4, name: 'Latitude商用', priceRate: 0.95 }
      ]},
      { id: 6, name: '华硕', models: [
        { id: 1, name: 'ROG枪神/幻系列', priceRate: 1.25 },
        { id: 2, name: '天选系列', priceRate: 1.0 },
        { id: 3, name: '灵耀系列', priceRate: 0.95 },
        { id: 4, name: '无畏系列', priceRate: 0.85 }
      ]},
      { id: 7, name: '惠普', models: [
        { id: 1, name: '暗影精灵', priceRate: 1.0 },
        { id: 2, name: '战66/战99', priceRate: 0.85 },
        { id: 3, name: 'Spectre x360', priceRate: 1.1 },
        { id: 4, name: '星Book系列', priceRate: 0.8 }
      ]},
      { id: 8, name: '微软', models: [
        { id: 1, name: 'Surface Pro 11', priceRate: 1.15 },
        { id: 2, name: 'Surface Laptop 7', priceRate: 1.05 },
        { id: 3, name: 'Surface Book/Studio', priceRate: 1.2 }
      ]},
      { id: 9, name: '宏碁', models: [
        { id: 1, name: '掠夺者系列', priceRate: 1.05 },
        { id: 2, name: '非凡Go/Swift', priceRate: 0.85 }
      ]}
    ],

    // 平板
    3: [
      { id: 1, name: '苹果', models: [
        { id: 1, name: 'iPad Pro M4 13"', priceRate: 1.4 },
        { id: 2, name: 'iPad Pro M4 11"', priceRate: 1.3 },
        { id: 3, name: 'iPad Air M2', priceRate: 1.05 },
        { id: 4, name: 'iPad (第10代)', priceRate: 0.85 },
        { id: 5, name: 'iPad mini 6', priceRate: 0.9 }
      ]},
      { id: 2, name: '华为', models: [
        { id: 1, name: 'MatePad Pro 13.2', priceRate: 1.3 },
        { id: 2, name: 'MatePad Air', priceRate: 1.0 },
        { id: 3, name: 'MatePad SE/11', priceRate: 0.8 }
      ]},
      { id: 3, name: '小米', models: [
        { id: 1, name: '小米平板6S Pro', priceRate: 1.05 },
        { id: 2, name: '小米平板6', priceRate: 0.85 },
        { id: 3, name: '小米平板7系列', priceRate: 1.0 }
      ]},
      { id: 4, name: '三星', models: [
        { id: 1, name: 'Galaxy Tab S10 Ultra', priceRate: 1.35 },
        { id: 2, name: 'Galaxy Tab S10+', priceRate: 1.2 },
        { id: 3, name: 'Galaxy Tab S9 FE', priceRate: 0.85 }
      ]},
      { id: 5, name: '荣耀', models: [
        { id: 1, name: '荣耀平板MagicPad', priceRate: 0.95 },
        { id: 2, name: '荣耀平板9', priceRate: 0.75 }
      ]},
      { id: 6, name: '联想', models: [
        { id: 1, name: '小新Pad Pro', priceRate: 0.85 },
        { id: 2, name: '小新Pad', priceRate: 0.75 },
        { id: 3, name: '拯救者Y700', priceRate: 0.9 }
      ]}
    ],

    // 手表/手环
    4: [
      { id: 1, name: '苹果', models: [
        { id: 1, name: 'Apple Watch Ultra 2', priceRate: 1.4 },
        { id: 2, name: 'Apple Watch S10', priceRate: 1.2 },
        { id: 3, name: 'Apple Watch SE', priceRate: 0.85 }
      ]},
      { id: 2, name: '华为', models: [
        { id: 1, name: 'WATCH GT 5 Pro', priceRate: 1.1 },
        { id: 2, name: 'WATCH GT 5', priceRate: 0.95 },
        { id: 3, name: 'WATCH FIT 3', priceRate: 0.8 },
        { id: 4, name: '手环9', priceRate: 0.6 }
      ]},
      { id: 3, name: '小米', models: [
        { id: 1, name: 'Watch S4', priceRate: 0.9 },
        { id: 2, name: '手环9 Pro', priceRate: 0.65 },
        { id: 3, name: 'Redmi Watch', priceRate: 0.6 }
      ]},
      { id: 4, name: '三星', models: [
        { id: 1, name: 'Galaxy Watch Ultra', priceRate: 1.25 },
        { id: 2, name: 'Galaxy Watch7', priceRate: 1.0 },
        { id: 3, name: 'Galaxy Watch FE', priceRate: 0.8 }
      ]},
      { id: 5, name: 'OPPO/vivo', models: [
        { id: 1, name: 'OPPO Watch X', priceRate: 0.9 },
        { id: 2, name: 'vivo Watch GT', priceRate: 0.85 }
      ]},
      { id: 6, name: 'Amazfit/Garmin', models: [
        { id: 1, name: 'Amazfit T-Rex 3', priceRate: 0.75 },
        { id: 2, name: 'Garmin Fenix 8', priceRate: 1.2 },
        { id: 3, name: 'Garmin Venu 3', priceRate: 0.95 }
      ]}
    ],

    // 耳机/音响
    5: [
      { id: 1, name: '苹果', models: [
        { id: 1, name: 'AirPods Pro 2', priceRate: 1.1 },
        { id: 2, name: 'AirPods 4', priceRate: 0.95 },
        { id: 3, name: 'AirPods Max', priceRate: 1.2 },
        { id: 4, name: 'HomePod', priceRate: 1.0 }
      ]},
      { id: 2, name: '索尼', models: [
        { id: 1, name: 'WF-1000XM5', priceRate: 1.1 },
        { id: 2, name: 'WH-1000XM5', priceRate: 1.15 },
        { id: 3, name: 'LinkBuds系列', priceRate: 0.85 },
        { id: 4, name: 'SRS音响系列', priceRate: 0.9 }
      ]},
      { id: 3, name: '华为', models: [
        { id: 1, name: 'FreeBuds Pro 4', priceRate: 1.0 },
        { id: 2, name: 'FreeBuds 6i', priceRate: 0.85 },
        { id: 3, name: 'Sound Joy/Sound X', priceRate: 0.9 }
      ]},
      { id: 4, name: 'Bose', models: [
        { id: 1, name: 'QuietComfort Ultra', priceRate: 1.2 },
        { id: 2, name: 'QuietComfort Earbuds', priceRate: 1.05 },
        { id: 3, name: 'SoundLink系列', priceRate: 0.9 }
      ]},
      { id: 5, name: '森海塞尔', models: [
        { id: 1, name: 'Momentum True Wireless 4', priceRate: 1.1 },
        { id: 2, name: 'Momentum 4 头戴', priceRate: 1.15 },
        { id: 3, name: 'Accentum系列', priceRate: 0.85 }
      ]},
      { id: 6, name: '小米', models: [
        { id: 1, name: 'Buds 5 Pro', priceRate: 0.9 },
        { id: 2, name: 'Buds 5', priceRate: 0.75 },
        { id: 3, name: 'Sound系列音箱', priceRate: 0.8 }
      ]},
      { id: 7, name: 'JBL/Marshall', models: [
        { id: 1, name: 'JBL Flip/Charge', priceRate: 0.8 },
        { id: 2, name: 'JBL Tour系列', priceRate: 0.9 },
        { id: 3, name: 'Marshall音箱系列', priceRate: 1.0 }
      ]}
    ],

    // 相机/摄像机
    6: [
      { id: 1, name: '索尼', models: [
        { id: 1, name: 'A7R V', priceRate: 1.4 },
        { id: 2, name: 'A7 IV', priceRate: 1.3 },
        { id: 3, name: 'A7C II/R', priceRate: 1.2 },
        { id: 4, name: 'ZV-E系列', priceRate: 1.0 },
        { id: 5, name: 'FX系列摄像机', priceRate: 1.5 }
      ]},
      { id: 2, name: '佳能', models: [
        { id: 1, name: 'EOS R5 II', priceRate: 1.4 },
        { id: 2, name: 'EOS R6 II', priceRate: 1.2 },
        { id: 3, name: 'EOS R8/R10', priceRate: 1.0 },
        { id: 4, name: 'EOS R50/R100', priceRate: 0.85 }
      ]},
      { id: 3, name: '尼康', models: [
        { id: 1, name: 'Z8/Z9', priceRate: 1.4 },
        { id: 2, name: 'Z6 III', priceRate: 1.2 },
        { id: 3, name: 'Z5/Zf', priceRate: 1.0 }
      ]},
      { id: 4, name: '富士', models: [
        { id: 1, name: 'X-T5/X-T50', priceRate: 1.15 },
        { id: 2, name: 'X-S20', priceRate: 1.0 },
        { id: 3, name: 'X100VI', priceRate: 1.25 },
        { id: 4, name: 'GFX中画幅', priceRate: 1.5 }
      ]},
      { id: 5, name: 'GoPro/运动相机', models: [
        { id: 1, name: 'GoPro HERO13', priceRate: 1.1 },
        { id: 2, name: 'GoPro HERO12', priceRate: 1.0 },
        { id: 3, name: 'DJI Osmo Action 5', priceRate: 1.05 }
      ]},
      { id: 6, name: '大疆', models: [
        { id: 1, name: 'Pocket 3', priceRate: 1.0 },
        { id: 2, name: 'Ronin/RS系列', priceRate: 1.1 }
      ]}
    ],

    // 游戏机
    7: [
      { id: 1, name: '索尼', models: [
        { id: 1, name: 'PlayStation 5 Pro', priceRate: 1.4 },
        { id: 2, name: 'PlayStation 5 数字版', priceRate: 1.15 },
        { id: 3, name: 'PlayStation 4 Pro', priceRate: 0.85 },
        { id: 4, name: 'PS VR2', priceRate: 1.1 },
        { id: 5, name: 'PS Portal', priceRate: 0.9 }
      ]},
      { id: 2, name: '任天堂', models: [
        { id: 1, name: 'Switch OLED', priceRate: 1.1 },
        { id: 2, name: 'Switch', priceRate: 1.0 },
        { id: 3, name: 'Switch Lite', priceRate: 0.85 }
      ]},
      { id: 3, name: '微软', models: [
        { id: 1, name: 'Xbox Series X', priceRate: 1.2 },
        { id: 2, name: 'Xbox Series S', priceRate: 0.9 }
      ]},
      { id: 4, name: '其他掌机', models: [
        { id: 1, name: 'Steam Deck OLED', priceRate: 1.15 },
        { id: 2, name: 'ROG Ally X', priceRate: 1.1 }
      ]}
    ],

    // 传感器/仪器
    8: [
      { id: 1, name: '西门子', models: [
        { id: 1, name: 'PLC/S7系列', priceRate: 1.2 },
        { id: 2, name: '工业传感器', priceRate: 1.0 },
        { id: 3, name: '触摸屏/HMI', priceRate: 1.1 }
      ]},
      { id: 2, name: '欧姆龙', models: [
        { id: 1, name: '光电/接近传感器', priceRate: 0.85 },
        { id: 2, name: '温控器系列', priceRate: 0.8 },
        { id: 3, name: 'PLC CP系列', priceRate: 1.0 }
      ]},
      { id: 3, name: '霍尼韦尔', models: [
        { id: 1, name: '传感器/探测器', priceRate: 1.0 },
        { id: 2, name: '变送器系列', priceRate: 1.05 }
      ]},
      { id: 4, name: '是德科技', models: [
        { id: 1, name: '示波器系列', priceRate: 1.3 },
        { id: 2, name: '频谱/信号分析仪', priceRate: 1.35 },
        { id: 3, name: '万用表/源表', priceRate: 1.1 }
      ]},
      { id: 5, name: '福禄克', models: [
        { id: 1, name: '数字万用表', priceRate: 1.0 },
        { id: 2, name: '热像仪系列', priceRate: 1.2 },
        { id: 3, name: '过程校准仪', priceRate: 1.1 }
      ]},
      { id: 6, name: '横河/基恩士', models: [
        { id: 1, name: '记录仪/数据采集', priceRate: 1.1 },
        { id: 2, name: '视觉传感器', priceRate: 1.2 }
      ]}
    ],

    // 无人机/航拍
    9: [
      { id: 1, name: '大疆', models: [
        { id: 1, name: 'Mavic 3 Pro', priceRate: 1.4 },
        { id: 2, name: 'Air 3S', priceRate: 1.2 },
        { id: 3, name: 'Mini 4 Pro', priceRate: 1.1 },
        { id: 4, name: 'Avata 2', priceRate: 1.15 },
        { id: 5, name: 'Inspire 3', priceRate: 1.5 },
        { id: 6, name: 'DJI Neo', priceRate: 0.8 },
        { id: 7, name: 'DJI FPV', priceRate: 1.0 }
      ]},
      { id: 2, name: '道通', models: [
        { id: 1, name: 'EVO II Pro V3', priceRate: 1.1 },
        { id: 2, name: 'EVO Lite系列', priceRate: 0.9 }
      ]},
      { id: 3, name: '其他品牌', models: [
        { id: 1, name: 'FIMI/Hubsan等', priceRate: 0.75 },
        { id: 2, name: '穿越机/DIY', priceRate: 0.8 }
      ]}
    ],

    // 智能家居
    10: [
      { id: 1, name: '小米/米家', models: [
        { id: 1, name: '智能音箱/触屏音箱', priceRate: 0.8 },
        { id: 2, name: '智能门锁系列', priceRate: 1.0 },
        { id: 3, name: '智能摄像头', priceRate: 0.85 },
        { id: 4, name: '扫地机器人', priceRate: 1.0 },
        { id: 5, name: '网关/传感器套件', priceRate: 0.7 }
      ]},
      { id: 2, name: '华为', models: [
        { id: 1, name: '智慧屏/音箱', priceRate: 0.9 },
        { id: 2, name: '智能门锁/路由', priceRate: 0.95 }
      ]},
      { id: 3, name: '萤石/海康', models: [
        { id: 1, name: '智能摄像头系列', priceRate: 0.85 },
        { id: 2, name: '智能门铃/猫眼', priceRate: 0.8 },
        { id: 3, name: 'NVR录像机', priceRate: 0.9 }
      ]},
      { id: 4, name: '石头/追觅', models: [
        { id: 1, name: '石头G/S系列', priceRate: 1.05 },
        { id: 2, name: '追觅X/S系列', priceRate: 1.0 }
      ]}
    ],

    // 打印机/办公设备
    11: [
      { id: 1, name: '惠普', models: [
        { id: 1, name: 'LaserJet Pro', priceRate: 1.0 },
        { id: 2, name: 'Smart Tank系列', priceRate: 0.9 },
        { id: 3, name: 'OfficeJet系列', priceRate: 0.85 }
      ]},
      { id: 2, name: '佳能', models: [
        { id: 1, name: 'PIXMA喷墨系列', priceRate: 0.85 },
        { id: 2, name: 'imageCLASS激光系列', priceRate: 0.95 },
        { id: 3, name: 'MF/LBP系列', priceRate: 0.9 }
      ]},
      { id: 3, name: '爱普生', models: [
        { id: 1, name: 'L系列墨仓式', priceRate: 0.9 },
        { id: 2, name: '投影仪系列', priceRate: 1.1 },
        { id: 3, name: '标签/票据打印机', priceRate: 0.8 }
      ]},
      { id: 4, name: '兄弟', models: [
        { id: 1, name: 'DCP/LCD激光系列', priceRate: 0.85 },
        { id: 2, name: '标签打印机', priceRate: 0.7 }
      ]},
      { id: 5, name: '奔图/联想', models: [
        { id: 1, name: '奔图P/M系列', priceRate: 0.8 },
        { id: 2, name: '联想小新/领像', priceRate: 0.8 }
      ]}
    ],

    // 服务器
    12: [
      { id: 1, name: '戴尔', models: [
        { id: 1, name: 'PowerEdge R760', priceRate: 1.5 },
        { id: 2, name: 'PowerEdge R750', priceRate: 1.3 },
        { id: 3, name: 'PowerEdge R650', priceRate: 1.2 },
        { id: 4, name: 'PowerEdge T550', priceRate: 1.1 }
      ]},
      { id: 2, name: '惠普HPE', models: [
        { id: 1, name: 'ProLiant DL380 Gen11', priceRate: 1.4 },
        { id: 2, name: 'ProLiant DL360 Gen11', priceRate: 1.3 },
        { id: 3, name: 'ProLiant ML350', priceRate: 1.1 }
      ]},
      { id: 3, name: '联想', models: [
        { id: 1, name: 'ThinkSystem SR650', priceRate: 1.3 },
        { id: 2, name: 'ThinkSystem SR630', priceRate: 1.2 },
        { id: 3, name: 'ThinkSystem ST550', priceRate: 1.0 }
      ]},
      { id: 4, name: '华为', models: [
        { id: 1, name: 'FusionServer 2288H V6', priceRate: 1.3 },
        { id: 2, name: 'TaiShan 2280', priceRate: 1.2 }
      ]},
      { id: 5, name: '浪潮', models: [
        { id: 1, name: 'NF5280M7', priceRate: 1.2 },
        { id: 2, name: 'NF5260M6', priceRate: 1.0 }
      ]},
      { id: 6, name: '新华三H3C', models: [
        { id: 1, name: 'UniServer R4900 G6', priceRate: 1.25 },
        { id: 2, name: 'UniServer R4700 G6', priceRate: 1.1 }
      ]}
    ],

    // 路由器/网络设备
    13: [
      { id: 1, name: '华为', models: [
        { id: 1, name: 'AX3 Pro', priceRate: 0.85 },
        { id: 2, name: 'AX6', priceRate: 1.0 },
        { id: 3, name: 'BE3 Pro WiFi7', priceRate: 1.15 },
        { id: 4, name: '企业AR系列路由', priceRate: 1.3 }
      ]},
      { id: 2, name: '华三H3C', models: [
        { id: 1, name: 'Magic NX30 Pro', priceRate: 0.9 },
        { id: 2, name: '企业MSR路由器', priceRate: 1.2 },
        { id: 3, name: '交换机/Switch', priceRate: 1.1 }
      ]},
      { id: 3, name: 'TP-LINK', models: [
        { id: 1, name: 'XDR5480', priceRate: 1.0 },
        { id: 2, name: 'XDR6030', priceRate: 0.9 },
        { id: 3, name: '企业ER系列', priceRate: 1.1 }
      ]},
      { id: 4, name: '小米', models: [
        { id: 1, name: '路由器AX9000', priceRate: 1.05 },
        { id: 2, name: '路由器AX6000', priceRate: 0.95 },
        { id: 3, name: '路由器BE6500', priceRate: 1.1 }
      ]},
      { id: 5, name: '网件Netgear', models: [
        { id: 1, name: 'Nighthawk RAX200', priceRate: 1.2 },
        { id: 2, name: 'Orbi Mesh', priceRate: 1.3 }
      ]},
      { id: 6, name: '思科Cisco', models: [
        { id: 1, name: '企业路由器ISR', priceRate: 1.3 },
        { id: 2, name: 'Catalyst交换机', priceRate: 1.2 }
      ]}
    ],

    // 显卡/电脑硬件
    14: [
      { id: 1, name: 'NVIDIA', models: [
        { id: 1, name: 'RTX 4090', priceRate: 1.6 },
        { id: 2, name: 'RTX 4080 Super', priceRate: 1.4 },
        { id: 3, name: 'RTX 4070 Ti Super', priceRate: 1.3 },
        { id: 4, name: 'RTX 4060', priceRate: 1.0 },
        { id: 5, name: 'RTX 3090', priceRate: 1.2 }
      ]},
      { id: 2, name: 'AMD', models: [
        { id: 1, name: 'RX 7900 XTX', priceRate: 1.35 },
        { id: 2, name: 'RX 7800 XT', priceRate: 1.15 },
        { id: 3, name: 'RX 7600', priceRate: 0.9 }
      ]},
      { id: 3, name: '英特尔', models: [
        { id: 1, name: 'Arc A770', priceRate: 1.0 },
        { id: 2, name: 'Arc B580', priceRate: 1.05 }
      ]}
    ],

    // 投影仪/激光电视
    15: [
      { id: 1, name: '极米', models: [
        { id: 1, name: 'RS 10 Ultra', priceRate: 1.3 },
        { id: 2, name: 'Z7X', priceRate: 1.0 },
        { id: 3, name: 'H6', priceRate: 0.95 }
      ]},
      { id: 2, name: '当贝', models: [
        { id: 1, name: 'X5 Ultra', priceRate: 1.2 },
        { id: 2, name: 'F6', priceRate: 1.0 }
      ]},
      { id: 3, name: '坚果', models: [
        { id: 1, name: 'N1S Pro', priceRate: 1.1 },
        { id: 2, name: 'O2', priceRate: 0.9 }
      ]},
      { id: 4, name: '明基', models: [
        { id: 1, name: 'W系列家用', priceRate: 1.2 },
        { id: 2, name: 'E系列商务', priceRate: 1.0 }
      ]},
      { id: 5, name: '爱普生', models: [
        { id: 1, name: 'CH-TW系列', priceRate: 1.1 },
        { id: 2, name: 'EF系列', priceRate: 0.95 }
      ]},
      { id: 6, name: '峰米', models: [
        { id: 1, name: 'V10', priceRate: 1.0 },
        { id: 2, name: 'Cinema系列', priceRate: 0.95 }
      ]}
    ],

    // VR/AR设备
    16: [
      { id: 1, name: 'Meta', models: [
        { id: 1, name: 'Quest 3', priceRate: 1.2 },
        { id: 2, name: 'Quest Pro', priceRate: 1.3 }
      ]},
      { id: 2, name: 'PICO/字节', models: [
        { id: 1, name: 'PICO 4 Pro', priceRate: 1.1 },
        { id: 2, name: 'PICO Neo 3', priceRate: 0.95 }
      ]},
      { id: 3, name: '苹果', models: [
        { id: 1, name: 'Apple Vision Pro', priceRate: 1.6 }
      ]},
      { id: 4, name: '索尼', models: [
        { id: 1, name: 'PlayStation VR2', priceRate: 1.1 }
      ]},
      { id: 5, name: 'Rokid/INMO', models: [
        { id: 1, name: 'Rokid Max', priceRate: 1.0 },
        { id: 2, name: 'INMO Air2', priceRate: 0.95 }
      ]}
    ],

    // 监控/安防设备
    17: [
      { id: 1, name: '海康威视', models: [
        { id: 1, name: '萤石C系列', priceRate: 0.9 },
        { id: 2, name: 'NVR录像机', priceRate: 1.1 }
      ]},
      { id: 2, name: '大华', models: [
        { id: 1, name: '乐橙系列', priceRate: 0.9 },
        { id: 2, name: 'NVR系列', priceRate: 1.1 }
      ]},
      { id: 3, name: '小米/创米', models: [
        { id: 1, name: '智能摄像头云台版', priceRate: 0.85 },
        { id: 2, name: '室外摄像机', priceRate: 0.9 }
      ]},
      { id: 4, name: 'TP-LINK', models: [
        { id: 1, name: '物联摄像头', priceRate: 0.8 }
      ]},
      { id: 5, name: '华为', models: [
        { id: 1, name: '好望摄像头', priceRate: 1.0 }
      ]}
    ],

    // 充电宝/移动电源
    18: [
      { id: 1, name: '小米/紫米', models: [
        { id: 1, name: '20000mAh', priceRate: 0.9 },
        { id: 2, name: '15000mAh', priceRate: 0.8 }
      ]},
      { id: 2, name: '安克', models: [
        { id: 1, name: '充电宝能量棒', priceRate: 1.0 },
        { id: 2, name: '磁吸无线充', priceRate: 1.1 }
      ]},
      { id: 3, name: '罗马仕', models: [
        { id: 1, name: '20000mAh', priceRate: 0.8 }
      ]},
      { id: 4, name: '华为', models: [
        { id: 1, name: '超级快充移动电源', priceRate: 1.0 }
      ]},
      { id: 5, name: '品胜', models: [
        { id: 1, name: '通用充电宝', priceRate: 0.75 }
      ]}
    ],

    // 电子书阅读器
    19: [
      { id: 1, name: '亚马逊 Kindle', models: [
        { id: 1, name: 'Kindle Paperwhite', priceRate: 1.0 },
        { id: 2, name: 'Kindle Oasis', priceRate: 1.1 },
        { id: 3, name: 'Kindle 青春版', priceRate: 0.85 }
      ]},
      { id: 2, name: '掌阅 iReader', models: [
        { id: 1, name: 'iReader Smart', priceRate: 1.1 },
        { id: 2, name: 'iReader Light', priceRate: 0.9 }
      ]},
      { id: 3, name: '文石 BOOX', models: [
        { id: 1, name: 'Tab系列', priceRate: 1.2 },
        { id: 2, name: 'Poke系列', priceRate: 1.0 }
      ]},
      { id: 4, name: '小米/墨案', models: [
        { id: 1, name: '小米电子书', priceRate: 0.9 },
        { id: 2, name: '墨案系列', priceRate: 0.85 }
      ]}
    ],

    // 车载/汽车电子
    20: [
      { id: 1, name: '70迈', models: [
        { id: 1, name: '行车记录仪Pro', priceRate: 1.0 },
        { id: 2, name: '智能后视镜', priceRate: 1.1 }
      ]},
      { id: 2, name: '盯盯拍', models: [
        { id: 1, name: 'Mini系列', priceRate: 0.9 },
        { id: 2, name: 'Z系列', priceRate: 1.0 }
      ]},
      { id: 3, name: '小米/睿米', models: [
        { id: 1, name: '行车记录仪', priceRate: 0.9 }
      ]},
      { id: 4, name: '海康/萤石', models: [
        { id: 1, name: '行车记录仪', priceRate: 1.0 }
      ]},
      { id: 5, name: '纽曼/先科', models: [
        { id: 1, name: '车载导航/中控', priceRate: 0.85 }
      ]}
    ]
  },

  // 维修问题列表（按设备类型分类）
  repairProblems: {
    1: [ // 手机
      { id: 1, name: '屏幕破损/碎屏/显示异常', priceRange: [200, 2000] },
      { id: 2, name: '电池续航/充电问题', priceRange: [100, 600] },
      { id: 3, name: '无法开机/死机/重启', priceRange: [200, 800] },
      { id: 4, name: '系统/软件故障', priceRange: [100, 400] },
      { id: 5, name: '摄像头/拍照问题', priceRange: [150, 800] },
      { id: 6, name: '信号/WiFi/蓝牙问题', priceRange: [100, 400] },
      { id: 7, name: '声音/扬声器/听筒问题', priceRange: [80, 300] },
      { id: 8, name: '按键/接口/卡槽损坏', priceRange: [80, 400] },
      { id: 9, name: '进水/受潮', priceRange: [200, 1000] },
      { id: 10, name: '主板/芯片故障', priceRange: [500, 2000] },
      { id: 11, name: '外壳/中框/后盖损坏', priceRange: [100, 600] },
      { id: 12, name: '面容/指纹识别故障', priceRange: [150, 500] }
    ],
    2: [ // 电脑/笔记本
      { id: 1, name: '无法开机/蓝屏/死机', priceRange: [200, 900] },
      { id: 2, name: '屏幕破损/花屏/闪屏', priceRange: [300, 2000] },
      { id: 3, name: '电池/电源/充电问题', priceRange: [150, 800] },
      { id: 4, name: '系统崩溃/重装系统', priceRange: [100, 300] },
      { id: 5, name: '散热/风扇噪音/过热', priceRange: [100, 400] },
      { id: 6, name: '键盘/触摸板故障', priceRange: [100, 500] },
      { id: 7, name: '硬盘/存储故障', priceRange: [200, 800] },
      { id: 8, name: '显卡/GPU故障', priceRange: [300, 1500] },
      { id: 9, name: '接口/USB/HDMI损坏', priceRange: [100, 400] },
      { id: 10, name: '进水/液体损坏', priceRange: [300, 1500] },
      { id: 11, name: '主板/芯片级维修', priceRange: [500, 2500] },
      { id: 12, name: 'WiFi/蓝牙/网络问题', priceRange: [100, 300] }
    ],
    3: [ // 平板
      { id: 1, name: '屏幕碎/触摸失灵', priceRange: [200, 1500] },
      { id: 2, name: '电池/充电问题', priceRange: [100, 500] },
      { id: 3, name: '无法开机/死机', priceRange: [200, 600] },
      { id: 4, name: '系统卡顿/软件问题', priceRange: [100, 300] },
      { id: 5, name: '充电口/接口损坏', priceRange: [80, 300] },
      { id: 6, name: 'WiFi/蓝牙故障', priceRange: [100, 300] },
      { id: 7, name: '摄像头故障', priceRange: [100, 500] },
      { id: 8, name: '外壳/边框变形', priceRange: [100, 400] },
      { id: 9, name: '进水/受潮', priceRange: [200, 800] }
    ],
    4: [ // 手表/手环
      { id: 1, name: '屏幕碎/显示异常', priceRange: [150, 800] },
      { id: 2, name: '电池/续航问题', priceRange: [80, 300] },
      { id: 3, name: '无法开机/死机', priceRange: [100, 400] },
      { id: 4, name: '充电/触点问题', priceRange: [50, 200] },
      { id: 5, name: '表带/表壳损坏', priceRange: [50, 300] },
      { id: 6, name: '传感器(心率等)故障', priceRange: [100, 400] },
      { id: 7, name: '进水/防水失效', priceRange: [150, 500] },
      { id: 8, name: '蓝牙连接/同步问题', priceRange: [80, 200] }
    ],
    5: [ // 耳机/音响
      { id: 1, name: '单边无声/声音小', priceRange: [80, 300] },
      { id: 2, name: '完全无声/不工作', priceRange: [100, 400] },
      { id: 3, name: '充电/电池问题', priceRange: [50, 200] },
      { id: 4, name: '蓝牙连接不稳定', priceRange: [80, 200] },
      { id: 5, name: '降噪功能失效', priceRange: [100, 300] },
      { id: 6, name: '充电盒故障', priceRange: [80, 250] },
      { id: 7, name: '麦克风问题', priceRange: [80, 200] },
      { id: 8, name: '线材/接口破损', priceRange: [50, 150] }
    ],
    6: [ // 相机/摄像机
      { id: 1, name: 'CMOS/传感器故障', priceRange: [300, 1500] },
      { id: 2, name: '镜头/对焦故障', priceRange: [200, 1200] },
      { id: 3, name: '快门/反光板问题', priceRange: [200, 800] },
      { id: 4, name: '屏幕/取景器故障', priceRange: [150, 600] },
      { id: 5, name: '电池/电源问题', priceRange: [100, 400] },
      { id: 6, name: '卡槽/存储故障', priceRange: [80, 300] },
      { id: 7, name: '无法开机', priceRange: [200, 800] },
      { id: 8, name: '防抖/稳定器故障', priceRange: [200, 600] },
      { id: 9, name: '进水/受潮/发霉', priceRange: [300, 1500] }
    ],
    7: [ // 游戏机
      { id: 1, name: '无法开机/蓝灯/三红', priceRange: [200, 800] },
      { id: 2, name: '手柄/控制器故障', priceRange: [100, 400] },
      { id: 3, name: '屏幕碎(掌机)', priceRange: [150, 600] },
      { id: 4, name: '卡带/光驱读取故障', priceRange: [150, 400] },
      { id: 5, name: '散热/风扇噪音', priceRange: [100, 300] },
      { id: 6, name: 'HDMI/视频输出问题', priceRange: [100, 300] },
      { id: 7, name: 'WiFi/蓝牙连接故障', priceRange: [100, 250] },
      { id: 8, name: '电池/充电问题(掌机)', priceRange: [80, 250] }
    ],
    8: [ // 传感器/仪器
      { id: 1, name: '测量不准/偏差大', priceRange: [200, 1000] },
      { id: 2, name: '无输出/无响应', priceRange: [200, 800] },
      { id: 3, name: '电源/供电故障', priceRange: [150, 500] },
      { id: 4, name: '显示屏/面板故障', priceRange: [150, 600] },
      { id: 5, name: '通信/接口故障', priceRange: [100, 400] },
      { id: 6, name: '传感器探头损坏', priceRange: [200, 800] },
      { id: 7, name: '校准/标定问题', priceRange: [200, 600] }
    ],
    9: [ // 无人机/航拍
      { id: 1, name: '无法起飞/电机故障', priceRange: [200, 800] },
      { id: 2, name: '图传/信号丢失', priceRange: [150, 500] },
      { id: 3, name: '云台/相机故障', priceRange: [200, 800] },
      { id: 4, name: '电池/电源问题', priceRange: [150, 600] },
      { id: 5, name: '桨叶/机身损坏', priceRange: [100, 400] },
      { id: 6, name: 'GPS/定位问题', priceRange: [150, 500] },
      { id: 7, name: '遥控器故障', priceRange: [100, 400] },
      { id: 8, name: '炸机/进水严重损坏', priceRange: [300, 1500] }
    ],
    10: [ // 智能家居
      { id: 1, name: '无法联网/配对失败', priceRange: [80, 200] },
      { id: 2, name: '设备离线/无响应', priceRange: [80, 300] },
      { id: 3, name: '传感器失灵', priceRange: [80, 300] },
      { id: 4, name: '电源/电池问题', priceRange: [50, 200] },
      { id: 5, name: '语音/控制失效', priceRange: [80, 200] },
      { id: 6, name: '摄像头/监控故障', priceRange: [100, 400] },
      { id: 7, name: '门锁/电机故障', priceRange: [150, 500] }
    ],
    11: [ // 打印机/办公设备
      { id: 1, name: '卡纸/进纸故障', priceRange: [80, 200] },
      { id: 2, name: '打印模糊/条纹/缺色', priceRange: [100, 300] },
      { id: 3, name: '无法打印/不响应', priceRange: [100, 400] },
      { id: 4, name: '墨盒/硒鼓/喷头问题', priceRange: [80, 300] },
      { id: 5, name: 'USB/网络连接故障', priceRange: [80, 200] },
      { id: 6, name: '扫描/复印故障', priceRange: [100, 300] },
      { id: 7, name: '主板/电源板故障', priceRange: [200, 800] }
    ],
    12: [ // 服务器
      { id: 1, name: '无法开机/电源故障', priceRange: [500, 3000] },
      { id: 2, name: '硬盘/阵列(RAID)故障', priceRange: [300, 2000] },
      { id: 3, name: '内存/主板故障', priceRange: [500, 3000] },
      { id: 4, name: '风扇/散热异常', priceRange: [200, 1000] },
      { id: 5, name: '系统/RAID配置', priceRange: [300, 1500] },
      { id: 6, name: '网络/网卡故障', priceRange: [200, 1000] },
      { id: 7, name: '主板/芯片级维修', priceRange: [800, 5000] }
    ],
    13: [ // 路由器/网络设备
      { id: 1, name: '无法开机/电源故障', priceRange: [80, 400] },
      { id: 2, name: 'WiFi信号弱/断流', priceRange: [80, 300] },
      { id: 3, name: '网口/接口损坏', priceRange: [80, 300] },
      { id: 4, name: '固件/配置问题', priceRange: [50, 200] },
      { id: 5, name: '频繁掉线/死机', priceRange: [80, 300] },
      { id: 6, name: '散热/过热', priceRange: [50, 200] }
    ],
    14: [ // 显卡/电脑硬件
      { id: 1, name: '无法点亮/黑屏', priceRange: [200, 1200] },
      { id: 2, name: '花屏/显示异常', priceRange: [200, 1000] },
      { id: 3, name: '风扇/散热故障', priceRange: [100, 500] },
      { id: 4, name: '供电/接口损坏', priceRange: [150, 800] },
      { id: 5, name: '性能下降/驱动故障', priceRange: [100, 400] },
      { id: 6, name: '进水/物理损坏', priceRange: [300, 1500] }
    ],

    15: [ // 投影仪/激光电视
      { id: 1, name: '无法开机/黑屏', priceRange: [150, 800] },
      { id: 2, name: '画面模糊/对焦不准', priceRange: [100, 500] },
      { id: 3, name: '色彩失真/偏色', priceRange: [150, 600] },
      { id: 4, name: '灯泡/光源衰减', priceRange: [200, 1000] },
      { id: 5, name: '风扇/散热噪音', priceRange: [100, 300] },
      { id: 6, name: 'HDMI/接口故障', priceRange: [80, 300] },
      { id: 7, name: '系统卡顿/无法升级', priceRange: [100, 300] },
      { id: 8, name: '扬声器/声音问题', priceRange: [80, 250] }
    ],
    16: [ // VR/AR设备
      { id: 1, name: '无法开机/黑屏', priceRange: [150, 800] },
      { id: 2, name: '屏幕/显示异常', priceRange: [200, 1000] },
      { id: 3, name: '手柄/控制器故障', priceRange: [100, 400] },
      { id: 4, name: '头显/佩戴部件损坏', priceRange: [80, 400] },
      { id: 5, name: '追踪/定位失灵', priceRange: [150, 600] },
      { id: 6, name: '电池/充电问题', priceRange: [80, 300] },
      { id: 7, name: '连接/串流故障', priceRange: [100, 400] }
    ],
    17: [ // 监控/安防设备
      { id: 1, name: '无法开机/离线', priceRange: [80, 300] },
      { id: 2, name: '画面模糊/夜视差', priceRange: [80, 300] },
      { id: 3, name: '无法联网/配对失败', priceRange: [80, 250] },
      { id: 4, name: '存储/录像故障', priceRange: [80, 300] },
      { id: 5, name: '进水/外壳损坏', priceRange: [80, 300] },
      { id: 6, name: '供电/电源问题', priceRange: [50, 200] }
    ],
    18: [ // 充电宝/移动电源
      { id: 1, name: '无法充电/充不进', priceRange: [50, 200] },
      { id: 2, name: '电量虚标/掉电快', priceRange: [50, 150] },
      { id: 3, name: '接口/线材损坏', priceRange: [30, 120] },
      { id: 4, name: '指示灯/按键失灵', priceRange: [30, 100] },
      { id: 5, name: '鼓包/发热异常', priceRange: [50, 200] }
    ],
    19: [ // 电子书阅读器
      { id: 1, name: '无法开机/黑屏', priceRange: [100, 500] },
      { id: 2, name: '屏幕碎/显示异常', priceRange: [150, 800] },
      { id: 3, name: '触控失灵', priceRange: [80, 300] },
      { id: 4, name: '电池/续航问题', priceRange: [80, 250] },
      { id: 5, name: '充电/接口故障', priceRange: [50, 200] },
      { id: 6, name: '系统卡顿/无法升级', priceRange: [80, 250] }
    ],
    20: [ // 车载/汽车电子
      { id: 1, name: '无法开机/黑屏', priceRange: [100, 500] },
      { id: 2, name: '画面模糊/镜头脏损', priceRange: [80, 400] },
      { id: 3, name: '无法录像/存储故障', priceRange: [80, 300] },
      { id: 4, name: 'GPS/定位问题', priceRange: [80, 300] },
      { id: 5, name: '供电/电源线故障', priceRange: [50, 200] },
      { id: 6, name: 'WiFi/连接问题', priceRange: [50, 200] }
    ]
  }
};
