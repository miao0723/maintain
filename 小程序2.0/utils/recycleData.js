// utils/recycleData.js - 回收产品数据（层级：分类→品牌→型号）
module.exports = {
  categories: [
    {
      id: 'phone',
      name: '手机回收',
      icon: '📱',
      color: '#4A90D9',
      brands: [
        {
          id: 'iphone',
          name: 'iPhone',
          logo: '🍎',
          logoText: 'A',
          logoColor: '#000000',
          models: [
            { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', specs: 'A19 Pro芯片 · 6.9英寸', basePrice: 8500, color: '#2D2D2D' },
            { id: 'iphone-17-pro', name: 'iPhone 17 Pro', specs: 'A19 Pro芯片 · 6.3英寸', basePrice: 7500, color: '#3A3A3A' },
            { id: 'iphone-17', name: 'iPhone 17', specs: 'A19芯片 · 6.3英寸', basePrice: 5500, color: '#4A4A8A' },
            { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', specs: 'A18 Pro芯片 · 6.9英寸', basePrice: 7200, color: '#8B7355' },
            { id: 'iphone-16-pro', name: 'iPhone 16 Pro', specs: 'A18 Pro芯片 · 6.3英寸', basePrice: 6200, color: '#8B7355' },
            { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max', specs: 'A17 Pro芯片 · 6.7英寸', basePrice: 5800, color: '#4B6E8C' },
            { id: 'iphone-15-pro', name: 'iPhone 15 Pro', specs: 'A17 Pro芯片 · 6.1英寸', basePrice: 4900, color: '#4B6E8C' },
            { id: 'iphone-15', name: 'iPhone 15', specs: 'A16芯片 · 6.1英寸', basePrice: 3800, color: '#6B8FA3' },
            { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', specs: 'A16芯片 · 6.7英寸', basePrice: 4600, color: '#5C3A6B' },
            { id: 'iphone-14-pro', name: 'iPhone 14 Pro', specs: 'A16芯片 · 6.1英寸', basePrice: 3900, color: '#5C3A6B' },
            { id: 'iphone-14', name: 'iPhone 14', specs: 'A15芯片 · 6.1英寸', basePrice: 2800, color: '#7B9EB3' },
            { id: 'iphone-13-series', name: 'iPhone 13 系列', specs: 'A15芯片 · 6.1英寸', basePrice: 2500, color: '#E86B6B' },
            { id: 'iphone-se', name: 'iPhone SE 系列', specs: '紧凑设计 · 经典Home键', basePrice: 1200, color: '#999' }
          ]
        },
        {
          id: 'huawei',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'huawei-mate80-pro', name: 'Mate 80 Pro', specs: '麒麟9100 · 6.8英寸', basePrice: 7500, color: '#C5A34E' },
            { id: 'huawei-mate80', name: 'Mate 80', specs: '麒麟9100 · 6.7英寸', basePrice: 6000, color: '#C5A34E' },
            { id: 'huawei-mate70-pro', name: 'Mate 70 Pro', specs: '麒麟9100 · 6.8英寸', basePrice: 6500, color: '#D4AF37' },
            { id: 'huawei-mate70', name: 'Mate 70', specs: '麒麟9100 · 6.7英寸', basePrice: 5200, color: '#D4AF37' },
            { id: 'huawei-pura80', name: 'Pura 80 Ultra', specs: '麒麟9020 · 1英寸传感器', basePrice: 7000, color: '#C9A96E' },
            { id: 'huawei-pura70', name: 'Pura 70 Ultra', specs: '麒麟9010 · 6.8英寸', basePrice: 5800, color: '#8B7D6B' },
            { id: 'huawei-mate-x6', name: 'Mate X6 折叠屏', specs: '麒麟9020 · 7.9英寸', basePrice: 9000, color: '#2C2C2C' },
            { id: 'huawei-mate-x5', name: 'Mate X5 折叠屏', specs: '麒麟9000S · 7.85英寸', basePrice: 7500, color: '#2C2C2C' },
            { id: 'huawei-nova13', name: 'Nova 13 Pro', specs: '麒麟8000 · 6.7英寸', basePrice: 2500, color: '#9DC6A0' },
            { id: 'huawei-nova', name: 'Nova 系列', specs: '中端实力派', basePrice: 1500, color: '#9DC6A0' }
          ]
        },
        {
          id: 'honor',
          name: '荣耀',
          logo: '💠',
          logoText: '荣',
          logoColor: '#0AB3E6',
          models: [
            { id: 'honor-magic7-pro', name: 'Magic7 Pro', specs: '骁龙8 Elite · 2亿长焦', basePrice: 5500, color: '#1C2833' },
            { id: 'honor-magic7', name: 'Magic7', specs: '骁龙8 Elite · AI智能', basePrice: 4200, color: '#2E4053' },
            { id: 'honor-magic-v3', name: 'Magic V3 折叠屏', specs: '骁龙8 Gen3 · 超薄折叠', basePrice: 6500, color: '#34495E' },
            { id: 'honor-200-pro', name: '200 Pro', specs: '第三代骁龙8s · 雅顾影像', basePrice: 3200, color: '#7FB3D8' },
            { id: 'honor-x60', name: 'X60 Pro', specs: '骁龙6 Gen1 · 长续航', basePrice: 1800, color: '#AED6F1' }
          ]
        },
        {
          id: 'xiaomi',
          name: '小米',
          logo: '🟠',
          logoText: '米',
          logoColor: '#FF6900',
          models: [
            { id: 'xiaomi-15-ultra', name: '小米15 Ultra', specs: '骁龙8 Elite · 徕卡影像', basePrice: 6000, color: '#2C2C2C' },
            { id: 'xiaomi-15-pro', name: '小米15 Pro', specs: '骁龙8 Elite · 6.73英寸', basePrice: 4800, color: '#4A4A4A' },
            { id: 'xiaomi-15', name: '小米15', specs: '骁龙8 Elite · 6.36英寸', basePrice: 4200, color: '#4A4A4A' },
            { id: 'xiaomi-14-ultra', name: '小米14 Ultra', specs: '骁龙8 Gen3 · 徕卡全焦段', basePrice: 4800, color: '#5A5A5A' },
            { id: 'xiaomi-14', name: '小米14 系列', specs: '骁龙8 Gen3 · 徕卡光学', basePrice: 3200, color: '#5A5A5A' },
            { id: 'xiaomi-mix-fold', name: 'MIX Fold 4', specs: '骁龙8 Gen3 · 折叠大屏', basePrice: 5500, color: '#1C1C2E' },
            { id: 'redmi-k80-pro', name: '红米K80 Pro', specs: '骁龙8 Elite · 高性价比', basePrice: 3000, color: '#E85D3A' },
            { id: 'redmi-k80', name: '红米K80', specs: '骁龙8 Gen3 · 国民性能', basePrice: 2200, color: '#F1948A' },
            { id: 'redmi-note14', name: '红米Note 14 Pro', specs: '天玑7300 · 金刚品质', basePrice: 1500, color: '#7EB8DA' },
            { id: 'redmi-turbo', name: '红米Turbo 4', specs: '天玑8400 · 性能先锋', basePrice: 1800, color: '#5DADE2' }
          ]
        },
        {
          id: 'oppo',
          name: 'OPPO',
          logo: '🟢',
          logoText: 'O',
          logoColor: '#1BA784',
          models: [
            { id: 'oppo-find-x8-ultra', name: 'Find X8 Ultra', specs: '骁龙8 Elite · 哈苏影像', basePrice: 5800, color: '#1A1A2E' },
            { id: 'oppo-find-x8-pro', name: 'Find X8 Pro', specs: '天玑9400 · 哈苏四摄', basePrice: 4800, color: '#2E4A3A' },
            { id: 'oppo-find-x8', name: 'Find X8', specs: '天玑9400 · 6.6英寸', basePrice: 4200, color: '#2E4A3A' },
            { id: 'oppo-find-n5', name: 'Find N5 折叠屏', specs: '骁龙8 Elite · 超薄折叠', basePrice: 7200, color: '#1C1C3E' },
            { id: 'oppo-reno13', name: 'Reno 13 Pro', specs: '天玑8350 · 人像大师', basePrice: 2500, color: '#9B59B6' },
            { id: 'oppo-reno', name: 'Reno 系列', specs: '轻薄影像手机', basePrice: 1800, color: '#9B59B6' },
            { id: 'oppo-a5', name: 'A5 Pro', specs: '天玑6300 · 防水耐用', basePrice: 1200, color: '#7F8C8D' },
            { id: 'oppo-a', name: 'A 系列', specs: '入门性价比之选', basePrice: 800, color: '#7F8C8D' }
          ]
        },
        {
          id: 'vivo',
          name: 'vivo',
          logo: '🔵',
          logoText: 'V',
          logoColor: '#415FFF',
          models: [
            { id: 'vivo-x200-ultra', name: 'X200 Ultra', specs: '天玑9400 · 蔡司全焦段', basePrice: 6000, color: '#1B3A5C' },
            { id: 'vivo-x200-pro', name: 'X200 Pro', specs: '天玑9400 · 蔡司影像', basePrice: 5200, color: '#1B3A5C' },
            { id: 'vivo-x200', name: 'X200', specs: '天玑9400 · 6.67英寸', basePrice: 3800, color: '#2C5F8A' },
            { id: 'vivo-x-fold4', name: 'X Fold4 折叠屏', specs: '骁龙8 Elite · 双屏体验', basePrice: 6800, color: '#1C1C3E' },
            { id: 'vivo-s20', name: 'S20 Pro', specs: '天玑9300 · 柔光环人像', basePrice: 3000, color: '#E8A0BF' },
            { id: 'vivo-s', name: 'S 系列', specs: '人像自拍专家', basePrice: 1600, color: '#E8A0BF' },
            { id: 'iqoo-13', name: 'iQOO 13', specs: '骁龙8 Elite · 电竞旗舰', basePrice: 4000, color: '#1ABC9C' },
            { id: 'iqoo-neo10', name: 'iQOO Neo10 Pro', specs: '天玑9400 · 性能先锋', basePrice: 2800, color: '#2ECC71' }
          ]
        },
        {
          id: 'oneplus',
          name: '一加',
          logo: '🔴',
          logoText: '1+',
          logoColor: '#F5010C',
          models: [
            { id: 'oneplus-13', name: '一加 13', specs: '骁龙8 Elite · 哈苏影像', basePrice: 4500, color: '#E74C3C' },
            { id: 'oneplus-12', name: '一加 12', specs: '骁龙8 Gen3 · 2K东方屏', basePrice: 3500, color: '#E74C3C' },
            { id: 'oneplus-ace5', name: '一加 Ace 5 Pro', specs: '骁龙8 Elite · 游戏旗舰', basePrice: 3000, color: '#2C3E50' },
            { id: 'oneplus-ace3', name: '一加 Ace 3V', specs: '第三代骁龙7+ · 长续航', basePrice: 1800, color: '#5D6D7E' }
          ]
        },
        {
          id: 'realme',
          name: '真我',
          logo: '🟡',
          logoText: 'RM',
          logoColor: '#DAA520',
          models: [
            { id: 'realme-gt7-pro', name: '真我GT7 Pro', specs: '骁龙8 Elite · 游戏旗舰', basePrice: 3500, color: '#F39C12' },
            { id: 'realme-gt7', name: '真我GT7', specs: '天玑9400 · 性能先锋', basePrice: 2800, color: '#F1C40F' },
            { id: 'realme-gt-neo6', name: '真我GT Neo6 SE', specs: '第三代骁龙7+ · 高性价比', basePrice: 1800, color: '#FFD700' }
          ]
        },
        {
          id: 'meizu',
          name: '魅族',
          logo: '🔮',
          logoText: '魅',
          logoColor: '#00BCD4',
          models: [
            { id: 'meizu-21-pro', name: '魅族 21 Pro', specs: '骁龙8 Gen3 · 白面板', basePrice: 3500, color: '#F5F5F0' },
            { id: 'meizu-21', name: '魅族 21', specs: '骁龙8 Gen3 · Flyme', basePrice: 2500, color: '#FAFAF5' },
            { id: 'meizu-lucky08', name: 'Lucky 08', specs: '骁龙8s Gen3 · AI手机', basePrice: 2000, color: '#FF6B6B' }
          ]
        },
        {
          id: 'samsung',
          name: '三星',
          logo: '💠',
          logoText: 'S',
          logoColor: '#1428A0',
          models: [
            { id: 'samsung-s25-ultra', name: 'Galaxy S25 Ultra', specs: '骁龙8 Elite · S Pen', basePrice: 7200, color: '#5B6EA5' },
            { id: 'samsung-s25-plus', name: 'Galaxy S25+', specs: '骁龙8 Elite · 6.7英寸', basePrice: 5200, color: '#6B7EB5' },
            { id: 'samsung-s25', name: 'Galaxy S25', specs: '骁龙8 Elite · 6.2英寸', basePrice: 4800, color: '#7B8EB5' },
            { id: 'samsung-s24-ultra', name: 'Galaxy S24 Ultra', specs: '骁龙8 Gen3 · 钛金属', basePrice: 5800, color: '#5B6EA5' },
            { id: 'samsung-z-fold6', name: 'Z Fold6', specs: '骁龙8 Gen3 · 折叠大屏', basePrice: 7500, color: '#2D2D4A' },
            { id: 'samsung-z-flip6', name: 'Z Flip6', specs: '骁龙8 Gen3 · 翻盖折叠', basePrice: 4200, color: '#C39BD3' }
          ]
        },
        {
          id: 'nubia',
          name: '努比亚/红魔',
          logo: '🎯',
          logoText: '红',
          logoColor: '#E20613',
          models: [
            { id: 'nubia-z70-ultra', name: '努比亚 Z70 Ultra', specs: '骁龙8 Elite · 屏下摄像', basePrice: 4500, color: '#1C1C1E' },
            { id: 'redmagic-10-pro', name: '红魔 10 Pro', specs: '骁龙8 Elite · 内置风扇', basePrice: 4000, color: '#E74C3C' }
          ]
        }
      ]
    },
    {
      id: 'computer',
      name: '电脑回收',
      icon: '💻',
      color: '#5A6E8A',
      brands: [
        {
          id: 'macbook',
          name: 'Apple Mac',
          logo: '🍎',
          logoText: 'A',
          logoColor: '#000000',
          models: [
            { id: 'macbook-pro-16', name: 'MacBook Pro 16"', specs: 'M4 Max芯片 · 16英寸', basePrice: 15000, color: '#1C1C1E' },
            { id: 'macbook-pro-14', name: 'MacBook Pro 14"', specs: 'M4 Pro/Max · 14英寸', basePrice: 12000, color: '#2C2C2E' },
            { id: 'macbook-air-15', name: 'MacBook Air 15"', specs: 'M4芯片 · 15英寸', basePrice: 8000, color: '#EBE3D5' },
            { id: 'macbook-air-13', name: 'MacBook Air 13"', specs: 'M4芯片 · 13英寸', basePrice: 6500, color: '#D4C9B8' },
            { id: 'macbook-pro-m3-14', name: 'MacBook Pro M3 14"', specs: 'M3 Pro芯片 · 14英寸', basePrice: 9000, color: '#3C3C3E' },
            { id: 'imac-m4', name: 'iMac 24" M4', specs: 'M4芯片 · 一体机', basePrice: 8500, color: '#7EB8C9' },
            { id: 'mac-mini-m4', name: 'Mac mini M4', specs: 'M4芯片 · 迷你主机', basePrice: 3500, color: '#8E8E93' },
            { id: 'mac-studio', name: 'Mac Studio', specs: 'M2 Ultra · 工作站', basePrice: 20000, color: '#8E8E93' }
          ]
        },
        {
          id: 'thinkpad',
          name: '联想 ThinkPad',
          logo: '💼',
          logoText: 'L',
          logoColor: '#E2231A',
          models: [
            { id: 'thinkpad-x1-12', name: 'ThinkPad X1 Carbon Gen12', specs: 'Ultra 7 · 14英寸', basePrice: 8000, color: '#1C1C1E' },
            { id: 'thinkpad-x1', name: 'ThinkPad X1 Carbon', specs: 'Ultra 7 · 14英寸', basePrice: 7000, color: '#1C1C1E' },
            { id: 'thinkpad-t16', name: 'ThinkPad T16', specs: 'Ultra 5 · 16英寸', basePrice: 5000, color: '#3C3C3E' },
            { id: 'thinkpad-t14', name: 'ThinkPad T14', specs: 'Ultra 5 · 14英寸商务', basePrice: 4800, color: '#3C3C3E' },
            { id: 'thinkpad-p1', name: 'ThinkPad P1', specs: 'Core i9 · RTX专业卡', basePrice: 12000, color: '#1C1C1E' },
            { id: 'lenovo-legion', name: '拯救者 Y9000P', specs: 'i9-14900HX · RTX4070', basePrice: 7000, color: '#2D2D4A' },
            { id: 'lenovo-legion-r9000', name: '拯救者 R9000P', specs: 'R9-7945HX · RTX4060', basePrice: 5500, color: '#2D2D4A' },
            { id: 'lenovo-yoga', name: 'YOGA Pro 14s', specs: 'Ultra 9 · 3K OLED触屏', basePrice: 5000, color: '#4A7A9E' },
            { id: 'lenovo-xiaoxin', name: '小新Pro 16', specs: 'Ultra 5 · 16英寸全能', basePrice: 3800, color: '#4A7A9E' }
          ]
        },
        {
          id: 'huawei-pc',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'huawei-matebook-x-2025', name: 'MateBook X Pro 2025', specs: 'Ultra 9 · OLED触屏', basePrice: 8500, color: '#2C3E50' },
            { id: 'huawei-matebook-x', name: 'MateBook X Pro', specs: 'Ultra 9 · OLED触屏', basePrice: 8000, color: '#2C3E50' },
            { id: 'huawei-matebook-14', name: 'MateBook 14', specs: '2.8K OLED · 轻薄', basePrice: 4500, color: '#4A6741' },
            { id: 'huawei-matebook-16', name: 'MateBook 16s', specs: 'i9-13900H · 16英寸大屏', basePrice: 5000, color: '#4A6741' },
            { id: 'huawei-matebook-d', name: 'MateBook D16', specs: 'i5-13500H · 16英寸', basePrice: 3000, color: '#7F8C8D' },
            { id: 'huawei-matebook-e', name: 'MateBook E Go', specs: '二合一 · 骁龙8cx', basePrice: 2500, color: '#A8D8B9' }
          ]
        },
        {
          id: 'dell',
          name: '戴尔',
          logo: '🔘',
          logoText: 'D',
          logoColor: '#007DB8',
          models: [
            { id: 'dell-xps-16', name: 'XPS 16', specs: 'Ultra 9 · 16英寸OLED', basePrice: 8000, color: '#C0C0C0' },
            { id: 'dell-xps-14', name: 'XPS 14', specs: 'Ultra 7 · 14英寸', basePrice: 6500, color: '#C0C0C0' },
            { id: 'dell-xps', name: 'XPS 系列', specs: 'Ultra处理器 · 窄边框', basePrice: 6500, color: '#C0C0C0' },
            { id: 'dell-alienware-m18', name: 'Alienware m18', specs: 'i9-14900HX · RTX4090', basePrice: 12000, color: '#1A1A2E' },
            { id: 'dell-alienware-x16', name: 'Alienware X16', specs: 'Ultra 9 · RTX4070', basePrice: 9000, color: '#1A1A2E' },
            { id: 'dell-inspiron-16', name: 'Inspiron 16 Plus', specs: 'Ultra 7 · 16英寸全能', basePrice: 4000, color: '#5B8FA8' },
            { id: 'dell-inspiron', name: 'Inspiron 灵越', specs: '家用全能本', basePrice: 3000, color: '#5B8FA8' }
          ]
        },
        {
          id: 'asus',
          name: '华硕',
          logo: '🔷',
          logoText: 'AS',
          logoColor: '#131F35',
          models: [
            { id: 'asus-rog-x16', name: 'ROG 枪神8 超竞版', specs: 'i9-14900HX · RTX4090', basePrice: 11000, color: '#2D1B2E' },
            { id: 'asus-rog', name: 'ROG 枪神/幻', specs: '性能电竞旗舰', basePrice: 8000, color: '#2D1B2E' },
            { id: 'asus-tuf-a16', name: '天选5 Pro', specs: 'R9-7940HX · RTX4070', basePrice: 5500, color: '#4ECDC4' },
            { id: 'asus-tuf', name: '天选系列', specs: '二次元电竞本', basePrice: 4500, color: '#4ECDC4' },
            { id: 'asus-zenbook-14', name: '灵耀14 2025', specs: 'Ultra 9 · 14英寸OLED', basePrice: 5000, color: '#2C3E50' },
            { id: 'asus-zenbook', name: '灵耀系列', specs: '轻薄商务品质', basePrice: 4000, color: '#2C3E50' },
            { id: 'asus-proart-p16', name: 'ProArt 创16', specs: 'Ultra 9 · RTX4070创作本', basePrice: 9000, color: '#1C1C1E' }
          ]
        },
        {
          id: 'hp',
          name: '惠普',
          logo: '⬜',
          logoText: 'HP',
          logoColor: '#0096D6',
          models: [
            { id: 'hp-spectre-x360', name: 'Spectre x360', specs: 'Ultra 9 · OLED翻转触屏', basePrice: 8000, color: '#34495E' },
            { id: 'hp-envy-x360', name: 'ENVY x360', specs: 'Ryzen 7 · 翻转全能', basePrice: 4500, color: '#7F8C8D' },
            { id: 'hp-omen', name: '暗影精灵 10', specs: 'i9-14900HX · RTX4070', basePrice: 6500, color: '#1A1A2E' },
            { id: 'hp-pavilion', name: '星Book Pro 16', specs: 'Ultra 7 · 16英寸', basePrice: 3500, color: '#5B8FA8' }
          ]
        },
        {
          id: 'acer',
          name: '宏碁',
          logo: '🟩',
          logoText: 'AC',
          logoColor: '#83B81A',
          models: [
            { id: 'acer-predator', name: '掠夺者 Helios 18', specs: 'i9-14900HX · RTX4090', basePrice: 10000, color: '#1A1A2E' },
            { id: 'acer-nitro', name: '暗影骑士·擎', specs: 'i7-14700HX · RTX4060', basePrice: 4500, color: '#E74C3C' },
            { id: 'acer-swift-go', name: '非凡Go 14', specs: 'Ultra 7 · 2.8K OLED', basePrice: 4200, color: '#2E86C1' }
          ]
        },
        {
          id: 'surface',
          name: '微软 Surface',
          logo: '🪟',
          logoText: 'MS',
          logoColor: '#0078D4',
          models: [
            { id: 'surface-laptop-7', name: 'Surface Laptop 7', specs: '骁龙X Elite · Copilot', basePrice: 8000, color: '#34495E' },
            { id: 'surface-pro-11', name: 'Surface Pro 11', specs: '骁龙X Elite · 二合一', basePrice: 7000, color: '#2C3E50' },
            { id: 'surface-laptop-go', name: 'Surface Laptop Go', specs: 'Core i5 · 轻巧便携', basePrice: 3000, color: '#AED6F1' }
          ]
        },
        {
          id: 'honor-pc',
          name: '荣耀',
          logo: '💠',
          logoText: '荣',
          logoColor: '#0AB3E6',
          models: [
            { id: 'honor-magicbook-art', name: 'MagicBook Art 14', specs: 'Ultra 7 · 3.1K OLED', basePrice: 5500, color: '#2980B9' },
            { id: 'honor-magicbook-pro', name: 'MagicBook Pro 16', specs: 'Ultra 5 · 16英寸', basePrice: 4000, color: '#5499C7' },
            { id: 'honor-magicbook-x', name: 'MagicBook X 系列', specs: 'Core i5 · 轻薄学生本', basePrice: 2800, color: '#85C1E9' }
          ]
        },
        {
          id: 'mechrevo',
          name: '机械革命',
          logo: '⚙️',
          logoText: '机',
          logoColor: '#333333',
          models: [
            { id: 'mechrevo-water', name: '旷世 16 Super', specs: 'i9-14900HX · RTX4080', basePrice: 6000, color: '#1C1C1E' },
            { id: 'mechrevo-jiaolong', name: '蛟龙 16 Pro', specs: 'R9-7945HX · RTX4070', basePrice: 4800, color: '#2C3E50' },
            { id: 'mechrevo-imini', name: '无界 14X', specs: 'R7-8845HS · 超轻薄', basePrice: 3200, color: '#7F8C8D' }
          ]
        }
      ]
    },
    {
      id: 'tablet',
      name: '平板回收',
      icon: '📟',
      color: '#E67E22',
      brands: [
        {
          id: 'ipad',
          name: 'iPad',
          logo: '🍎',
          logoText: 'A',
          logoColor: '#000000',
          models: [
            { id: 'ipad-pro-m4-13', name: 'iPad Pro M4 13"', specs: 'M4芯片 · OLED屏', basePrice: 8500, color: '#1C1C1E' },
            { id: 'ipad-pro-m4-11', name: 'iPad Pro M4 11"', specs: 'M4芯片 · OLED屏', basePrice: 7000, color: '#2C2C2E' },
            { id: 'ipad-pro-m2', name: 'iPad Pro M2 12.9"', specs: 'M2芯片 · mini-LED', basePrice: 5500, color: '#3C3C3E' },
            { id: 'ipad-air-m3', name: 'iPad Air M3', specs: 'M3芯片 · 11/13英寸', basePrice: 4500, color: '#A8C8F0' },
            { id: 'ipad-air-m2', name: 'iPad Air M2', specs: 'M2芯片 · 11/13英寸', basePrice: 4200, color: '#A8C8F0' },
            { id: 'ipad-11', name: 'iPad 第11代', specs: 'A16芯片 · 10.9英寸', basePrice: 2500, color: '#F5DEB3' },
            { id: 'ipad-10', name: 'iPad 第10代', specs: 'A14芯片 · 10.9英寸', basePrice: 2200, color: '#F5DEB3' },
            { id: 'ipad-mini-7', name: 'iPad mini 7', specs: 'A17 Pro芯片 · 8.3英寸', basePrice: 3000, color: '#D8BFD8' },
            { id: 'ipad-mini', name: 'iPad mini 6', specs: 'A15芯片 · 8.3英寸', basePrice: 2500, color: '#D8BFD8' }
          ]
        },
        {
          id: 'huawei-pad',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'huawei-matepad-pro-14', name: 'MatePad Pro 14.2', specs: 'OLED屏 · 鸿蒙', basePrice: 6000, color: '#C5A34E' },
            { id: 'huawei-matepad-pro', name: 'MatePad Pro 13.2', specs: 'OLED柔性屏 · 鸿蒙', basePrice: 5200, color: '#C5A34E' },
            { id: 'huawei-matepad-12x', name: 'MatePad 12 X', specs: '120Hz · PaperMatte屏', basePrice: 3000, color: '#8FBC8F' },
            { id: 'huawei-matepad-air', name: 'MatePad Air', specs: '11.5英寸 · 144Hz', basePrice: 2500, color: '#8FBC8F' },
            { id: 'huawei-matepad-se', name: 'MatePad SE', specs: '入门学习平板', basePrice: 1200, color: '#B0C4DE' }
          ]
        },
        {
          id: 'xiaomi-pad',
          name: '小米',
          logo: '🟠',
          logoText: '米',
          logoColor: '#FF6900',
          models: [
            { id: 'xiaomi-pad-7-pro', name: '小米平板 7 Pro', specs: '骁龙8s Gen3 · 3.2K屏', basePrice: 3000, color: '#34495E' },
            { id: 'xiaomi-pad-7', name: '小米平板 7', specs: '骁龙7+ Gen3 · 2.8K屏', basePrice: 2000, color: '#5D6D7E' },
            { id: 'xiaomi-pad-6s-pro', name: '小米平板 6S Pro', specs: '骁龙8 Gen2 · 12.4英寸', basePrice: 2500, color: '#5D6D7E' },
            { id: 'redmi-pad-pro', name: 'Redmi Pad Pro', specs: '骁龙7s Gen2 · 12.1英寸', basePrice: 1400, color: '#E85D3A' }
          ]
        },
        {
          id: 'samsung-pad',
          name: '三星',
          logo: '💠',
          logoText: 'S',
          logoColor: '#1428A0',
          models: [
            { id: 'samsung-tab-s10-ultra', name: 'Galaxy Tab S10 Ultra', specs: '天玑9300+ · 14.6英寸', basePrice: 6500, color: '#B8B8B8' },
            { id: 'samsung-tab-s10-plus', name: 'Galaxy Tab S10+', specs: '天玑9300+ · 12.4英寸', basePrice: 4800, color: '#C8C8C8' },
            { id: 'samsung-tab-s9-fe', name: 'Galaxy Tab S9 FE', specs: 'Exynos · 10.9英寸', basePrice: 2500, color: '#A8D8B9' }
          ]
        },
        {
          id: 'lenovo-pad',
          name: '联想',
          logo: '💼',
          logoText: 'L',
          logoColor: '#E2231A',
          models: [
            { id: 'lenovo-y700', name: '拯救者 Y700', specs: '骁龙8 Gen3 · 8.8英寸电竞', basePrice: 2500, color: '#1A1A2E' },
            { id: 'lenovo-xiaoxin-pad', name: '小新Pad Pro', specs: '天玑8300 · 12.7英寸', basePrice: 1800, color: '#4A7A9E' }
          ]
        },
        {
          id: 'oppo-pad',
          name: 'OPPO',
          logo: '🟢',
          logoText: 'O',
          logoColor: '#1BA784',
          models: [
            { id: 'oppo-pad3-pro', name: 'OPPO Pad 3 Pro', specs: '骁龙8 Gen3 · 12.1英寸', basePrice: 3200, color: '#1A1A2E' },
            { id: 'oppo-pad3', name: 'OPPO Pad 3', specs: '天玑8350 · 2.8K屏', basePrice: 2200, color: '#2E4A3A' }
          ]
        },
        {
          id: 'vivo-pad',
          name: 'vivo',
          logo: '🔵',
          logoText: 'V',
          logoColor: '#415FFF',
          models: [
            { id: 'vivo-pad3-pro', name: 'vivo Pad3 Pro', specs: '天玑9300 · 13英寸巨幕', basePrice: 3000, color: '#1B3A5C' },
            { id: 'vivo-pad3', name: 'vivo Pad3', specs: '骁龙8s Gen3 · 12.1英寸', basePrice: 2400, color: '#2C5F8A' }
          ]
        }
      ]
    },
    {
      id: 'wearable',
      name: '智能穿戴',
      icon: '⌚',
      color: '#8E44AD',
      brands: [
        {
          id: 'apple-watch',
          name: 'Apple Watch',
          logo: '🍎',
          logoText: 'A',
          logoColor: '#000000',
          models: [
            { id: 'aw-ultra2', name: 'Apple Watch Ultra 2', specs: 'S9芯片 · 49mm钛金属', basePrice: 4500, color: '#F5DEB3' },
            { id: 'aw-s10', name: 'Apple Watch S10', specs: 'S10芯片 · 全天候显示', basePrice: 2800, color: '#FFD700' },
            { id: 'aw-s9', name: 'Apple Watch S9', specs: 'S9芯片 · 全天候显示', basePrice: 2200, color: '#FFD700' },
            { id: 'aw-se2', name: 'Apple Watch SE 2', specs: 'S8芯片 · 性价比之选', basePrice: 1500, color: '#C0C0C0' }
          ]
        },
        {
          id: 'huawei-watch',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'hw-ultimate', name: 'WATCH Ultimate', specs: '100米潜水 · 卫星通信', basePrice: 4000, color: '#C5A34E' },
            { id: 'hw-gt5-pro', name: 'WATCH GT 5 Pro', specs: '钛合金 · 14天续航', basePrice: 2200, color: '#C5A34E' },
            { id: 'hw-gt5', name: 'WATCH GT 5', specs: 'AMOLED屏 · 专业运动', basePrice: 1400, color: '#8F8F8F' },
            { id: 'hw-fit3', name: 'WATCH FIT 3', specs: '方形轻薄设计', basePrice: 800, color: '#E8A0BF' }
          ]
        },
        {
          id: 'xiaomi-watch',
          name: '小米',
          logo: '🟠',
          logoText: '米',
          logoColor: '#FF6900',
          models: [
            { id: 'mi-watch-s4', name: '小米手表 S4', specs: '1.43英寸AMOLED', basePrice: 1000, color: '#2C3E50' },
            { id: 'mi-watch-s3', name: '小米手表 S3', specs: '可换表圈 · 12通道心率', basePrice: 800, color: '#34495E' },
            { id: 'redmi-watch5', name: 'Redmi Watch 5', specs: '1.97英寸大屏 · 20天续航', basePrice: 400, color: '#E85D3A' }
          ]
        },
        {
          id: 'samsung-watch',
          name: '三星',
          logo: '💠',
          logoText: 'S',
          logoColor: '#1428A0',
          models: [
            { id: 'sw-ultra', name: 'Galaxy Watch Ultra', specs: '钛金属 · 户外旗舰', basePrice: 3500, color: '#F5DEB3' },
            { id: 'sw-7', name: 'Galaxy Watch7', specs: 'BioActive传感器', basePrice: 1800, color: '#696969' },
            { id: 'sw-fe', name: 'Galaxy Watch FE', specs: '入门智能手表', basePrice: 1000, color: '#B0C4DE' }
          ]
        },
        {
          id: 'oppo-watch',
          name: 'OPPO',
          logo: '🟢',
          logoText: 'O',
          logoColor: '#1BA784',
          models: [
            { id: 'oppo-watch-x2', name: 'OPPO Watch X2', specs: '骁龙W5 · 全智能', basePrice: 1800, color: '#1A1A2E' },
            { id: 'oppo-watch-se', name: 'OPPO Watch SE', specs: '性价比智能手表', basePrice: 800, color: '#7F8C8D' }
          ]
        },
        {
          id: 'honor-watch',
          name: '荣耀',
          logo: '💠',
          logoText: '荣',
          logoColor: '#0AB3E6',
          models: [
            { id: 'honor-watch5', name: '荣耀手表5', specs: '1.85英寸 · 14天续航', basePrice: 1000, color: '#2980B9' },
            { id: 'honor-watch-gs', name: '荣耀手表 GS4', specs: '经典圆形 · 商务风', basePrice: 1200, color: '#34495E' }
          ]
        },
        {
          id: 'garmin',
          name: '佳明',
          logo: '🏃',
          logoText: 'G',
          logoColor: '#000000',
          models: [
            { id: 'garmin-fenix8', name: 'Fēnix 8', specs: '军工级 · 专业户外', basePrice: 5500, color: '#F5DEB3' },
            { id: 'garmin-epix-pro', name: 'Epix Pro Gen2', specs: 'AMOLED · 多频定位', basePrice: 4000, color: '#1C1C1E' },
            { id: 'garmin-forerunner965', name: 'Forerunner 965', specs: '铁人三项专业表', basePrice: 3000, color: '#2C3E50' },
            { id: 'garmin-venu3', name: 'Venu 3', specs: '健康管理 · 日常运动', basePrice: 2000, color: '#7FB3D8' }
          ]
        }
      ]
    },
    {
      id: 'display',
      name: '显示器回收',
      icon: '🖥️',
      color: '#16A085',
      brands: [
        {
          id: 'apple-display',
          name: 'Apple',
          logo: '🍎',
          logoText: 'A',
          logoColor: '#000000',
          models: [
            { id: 'studio-display', name: 'Studio Display', specs: '5K分辨率 · 27英寸', basePrice: 8000, color: '#C0C0C0' },
            { id: 'pro-display-xdr', name: 'Pro Display XDR', specs: '6K分辨率 · 32英寸', basePrice: 25000, color: '#1C1C1E' }
          ]
        },
        {
          id: 'dell-display',
          name: '戴尔',
          logo: '🔘',
          logoText: 'D',
          logoColor: '#007DB8',
          models: [
            { id: 'dell-u3224kb', name: 'UltraSharp U3224KB', specs: '6K分辨率 · 32英寸', basePrice: 12000, color: '#1C1C1E' },
            { id: 'dell-u2723qe', name: 'UltraSharp U2723QE', specs: '4K IPS Black · 27英寸', basePrice: 3000, color: '#2C2C2E' },
            { id: 'dell-aw3423dw', name: 'Alienware AW3423DW', specs: 'QD-OLED · 34英寸 175Hz', basePrice: 5000, color: '#1A1A2E' }
          ]
        },
        {
          id: 'samsung-display',
          name: '三星',
          logo: '💠',
          logoText: 'S',
          logoColor: '#1428A0',
          models: [
            { id: 'samsung-odyssey-g9', name: 'Odyssey Neo G9', specs: '量子点Mini-LED · 57英寸', basePrice: 8000, color: '#1A1A2E' },
            { id: 'samsung-odyssey-g8', name: 'Odyssey G8 QD-OLED', specs: 'QD-OLED · 34英寸 175Hz', basePrice: 4500, color: '#1A1A2E' },
            { id: 'samsung-smart-monitor', name: 'Smart Monitor M8', specs: '4K · 32英寸智能屏幕', basePrice: 2500, color: '#F5F5F0' }
          ]
        },
        {
          id: 'lg-display',
          name: 'LG',
          logo: '🔲',
          logoText: 'LG',
          logoColor: '#A50034',
          models: [
            { id: 'lg-27gr95qe', name: 'UltraGear 27GR95QE', specs: 'OLED · 27英寸 240Hz', basePrice: 4000, color: '#1C1C1E' },
            { id: 'lg-27up850n', name: '27UP850N', specs: '4K · 27英寸专业色准', basePrice: 2200, color: '#2C2C2E' },
            { id: 'lg-c3-42', name: 'OLED C3 42"', specs: 'OLED · 42英寸电视/显示器', basePrice: 5000, color: '#1C1C1E' }
          ]
        },
        {
          id: 'xiaomi-display',
          name: '小米',
          logo: '🟠',
          logoText: '米',
          logoColor: '#FF6900',
          models: [
            { id: 'xiaomi-redmi-g27', name: 'Redmi 电竞 27', specs: 'Fast IPS · 27英寸 180Hz', basePrice: 800, color: '#E85D3A' },
            { id: 'xiaomi-4k-monitor', name: '小米 4K显示器', specs: '4K · 27英寸专业色准', basePrice: 1800, color: '#2C3E50' }
          ]
        }
      ]
    },
    {
      id: 'home',
      name: '生活家居',
      icon: '🏠',
      color: '#27AE60',
      brands: [
        {
          id: 'audio',
          name: '音频设备',
          logo: '🎵',
          logoText: '音',
          logoColor: '#555555',
          models: [
            { id: 'airpods-pro2', name: 'AirPods Pro 2', specs: 'H2芯片 · 主动降噪', basePrice: 1400, color: '#F5F5F0' },
            { id: 'airpods-4', name: 'AirPods 4', specs: 'H2芯片 · 空间音频', basePrice: 900, color: '#FAF9F6' },
            { id: 'airpods-max', name: 'AirPods Max', specs: 'H1双芯片 · 头戴降噪', basePrice: 3000, color: '#C0C0C0' },
            { id: 'sony-wh1000xm5', name: 'WH-1000XM5', specs: '顶级降噪头戴', basePrice: 1800, color: '#1C1C1E' },
            { id: 'sony-wf1000xm5', name: 'WF-1000XM5', specs: '旗舰真无线降噪', basePrice: 1200, color: '#2C2C2E' },
            { id: 'bose-qc-ultra', name: 'Bose QC Ultra', specs: '沉浸空间音频', basePrice: 2000, color: '#1A1A2E' },
            { id: 'bose-qc-earbuds', name: 'Bose QC Ultra Earbuds', specs: '真无线沉浸降噪', basePrice: 1500, color: '#2C2C3E' },
            { id: 'huawei-freebuds6', name: '华为 FreeBuds 6', specs: '强力降噪 · 超长续航', basePrice: 800, color: '#C5A34E' },
            { id: 'xiaomi-buds5', name: '小米 Buds 5 Pro', specs: 'Hi-Fi音质 · 空间音频', basePrice: 700, color: '#2C3E50' },
            { id: 'galaxy-buds3', name: 'Galaxy Buds3 Pro', specs: 'Galaxy AI · 智能降噪', basePrice: 900, color: '#7B8EB5' },
            { id: 'homepod', name: 'HomePod mini', specs: 'Siri智能音箱', basePrice: 600, color: '#2C2C3E' },
            { id: 'jbl-flip7', name: 'JBL Flip 7', specs: '便携防水蓝牙音箱', basePrice: 500, color: '#4ECDC4' }
          ]
        },
        {
          id: 'router',
          name: '网络设备',
          logo: '📡',
          logoText: '网',
          logoColor: '#555555',
          models: [
            { id: 'huawei-ax6', name: '华为路由 AX6', specs: 'Wi-Fi 6+ · 7200Mbps', basePrice: 300, color: '#2C3E50' },
            { id: 'huawei-be7', name: '华为路由 BE7', specs: 'Wi-Fi 7 · 万兆口', basePrice: 800, color: '#2C3E50' },
            { id: 'xiaomi-be10000', name: '小米 BE10000', specs: 'Wi-Fi 7 · 三频万兆', basePrice: 1200, color: '#1C1C1E' },
            { id: 'xiaomi-ax9000', name: '小米 AX9000', specs: 'Wi-Fi 6 · 三频', basePrice: 600, color: '#1C1C1E' },
            { id: 'tp-link-archer', name: 'TP-Link Archer BE800', specs: 'Wi-Fi 7 旗舰', basePrice: 1000, color: '#2D2D2D' },
            { id: 'asus-rt-be96u', name: '华硕 RT-BE96U', specs: 'Wi-Fi 7 · 双万兆口', basePrice: 1500, color: '#1A1A2E' }
          ]
        },
        {
          id: 'vacuum',
          name: '扫地机器人',
          logo: '🧹',
          logoText: '扫',
          logoColor: '#555555',
          models: [
            { id: 'roborock-s10', name: '石头 G30/G20S', specs: '智能避障 · 自清洁 · 热水洗', basePrice: 3000, color: '#F5F5F0' },
            { id: 'roborock-s8', name: '石头 G/S 系列', specs: '智能避障 · 自清洁', basePrice: 2500, color: '#F5F5F0' },
            { id: 'dreame-x50', name: '追觅 X50 Ultra', specs: '仿生双机械臂 · 自动上下水', basePrice: 4000, color: '#2C3E50' },
            { id: 'dreame-x40', name: '追觅 X 系列', specs: '仿生机械臂', basePrice: 3000, color: '#2C3E50' },
            { id: 'ecovacs-x5', name: '科沃斯 X5 Pro', specs: '全能基站 · 热水洗 · 机械臂', basePrice: 2500, color: '#5A6E8A' },
            { id: 'ecovacs-t50', name: '科沃斯 T50 Pro', specs: '超高避障 · 大吸力', basePrice: 2000, color: '#6B8299' }
          ]
        },
        {
          id: 'keyboard',
          name: '键盘鼠标',
          logo: '⌨️',
          logoText: '键',
          logoColor: '#555555',
          models: [
            { id: 'apple-magic-keyboard', name: 'Apple Magic Keyboard', specs: '妙控键盘 · Mac专用', basePrice: 800, color: '#C0C0C0' },
            { id: 'logitech-mx-master3', name: '罗技 MX Master 3S', specs: 'Master系列 · 人体工学', basePrice: 500, color: '#1C1C1E' },
            { id: 'logitech-gpro-x', name: '罗技 G Pro X 60', specs: '电竞机械键盘', basePrice: 800, color: '#1A1A2E' },
            { id: 'razer-blackwidow', name: '雷蛇 BlackWidow V4', specs: '绿轴机械 · RGB灯效', basePrice: 600, color: '#00FF00' }
          ]
        }
      ]
    },
    {
      id: 'camera',
      name: '相机回收',
      icon: '📷',
      color: '#E74C3C',
      brands: [
        {
          id: 'sony-camera',
          name: '索尼',
          logo: '🔴',
          logoText: 'S',
          logoColor: '#000000',
          models: [
            { id: 'sony-a1ii', name: 'α1 II', specs: '5000万像素 · 30fps连拍', basePrice: 35000, color: '#1C1C1E' },
            { id: 'sony-a7r5', name: 'α7R V', specs: '6100万像素 · AI对焦', basePrice: 18000, color: '#1C1C1E' },
            { id: 'sony-a7iv', name: 'α7 IV', specs: '3300万像素 · 全能旗舰', basePrice: 12000, color: '#2C2C2E' },
            { id: 'sony-a7c2', name: 'α7C II', specs: '紧凑全画幅', basePrice: 9000, color: '#4A4A4A' },
            { id: 'sony-a7cii', name: 'α7CR', specs: '6100万像素 · 紧凑机身', basePrice: 14000, color: '#5A5A5A' },
            { id: 'sony-zve1', name: 'ZV-E1', specs: '全画幅Vlog相机', basePrice: 10000, color: '#F5F5F0' },
            { id: 'sony-zve10ii', name: 'ZV-E10 II', specs: 'APS-C Vlog相机', basePrice: 5000, color: '#FAFAF5' }
          ]
        },
        {
          id: 'canon-camera',
          name: '佳能',
          logo: '🔴',
          logoText: 'C',
          logoColor: '#CC0000',
          models: [
            { id: 'canon-r1', name: 'EOS R1', specs: '2400万像素 · 旗舰速度机', basePrice: 35000, color: '#1C1C1E' },
            { id: 'canon-r5ii', name: 'EOS R5 II', specs: '4500万像素 · 8K视频', basePrice: 20000, color: '#1C1C1E' },
            { id: 'canon-r5', name: 'EOS R5', specs: '4500万像素 · 8K30P', basePrice: 15000, color: '#2C2C2E' },
            { id: 'canon-r6ii', name: 'EOS R6 II', specs: '2420万像素 · 高速连拍', basePrice: 12000, color: '#2C2C2E' },
            { id: 'canon-r8', name: 'EOS R8', specs: '入门全画幅', basePrice: 7000, color: '#4A4A4A' },
            { id: 'canon-r7', name: 'EOS R7', specs: 'APS-C高速相机', basePrice: 6000, color: '#5A5A5A' }
          ]
        },
        {
          id: 'nikon-camera',
          name: '尼康',
          logo: '🟡',
          logoText: 'N',
          logoColor: '#D4AF37',
          models: [
            { id: 'nikon-z9', name: 'Z9', specs: '4570万像素 · 120fps', basePrice: 28000, color: '#1C1C1E' },
            { id: 'nikon-z8', name: 'Z8', specs: '4570万像素 · 8K60P', basePrice: 20000, color: '#2C2C2E' },
            { id: 'nikon-z6iii', name: 'Z6 III', specs: '2450万像素 · 高速全能', basePrice: 12000, color: '#4A4A4A' },
            { id: 'nikon-zf', name: 'Zf', specs: '复古全画幅 · 2450万像素', basePrice: 10000, color: '#8B7355' },
            { id: 'nikon-z50ii', name: 'Z50 II', specs: 'APS-C入门 · 便携', basePrice: 5000, color: '#5A5A5A' }
          ]
        },
        {
          id: 'fujifilm',
          name: '富士',
          logo: '📸',
          logoText: 'F',
          logoColor: '#000000',
          models: [
            { id: 'fuji-gfx100ii', name: 'GFX100 II', specs: '1亿像素 · 中画幅', basePrice: 35000, color: '#1C1C1E' },
            { id: 'fuji-gfx50sii', name: 'GFX50S II', specs: '中画幅入门', basePrice: 18000, color: '#2C2C2E' },
            { id: 'fuji-x-t5', name: 'X-T5', specs: '4020万像素 · 复古旗舰', basePrice: 9000, color: '#8B7355' },
            { id: 'fuji-x-h2s', name: 'X-H2S', specs: '2616万像素 · 40fps堆栈', basePrice: 10000, color: '#1C1C1E' },
            { id: 'fuji-x100vi', name: 'X100VI', specs: '4020万像素 · 复古旁轴', basePrice: 8000, color: '#8B7355' },
            { id: 'fuji-x-s20', name: 'X-S20', specs: 'Vlog全能 · 2610万像素', basePrice: 6000, color: '#4A4A4A' }
          ]
        },
        {
          id: 'gopro',
          name: '运动相机',
          logo: '🎬',
          logoText: 'Go',
          logoColor: '#005DAA',
          models: [
            { id: 'gopro-hero13', name: 'GoPro HERO13', specs: '5.3K视频 · 防水20m', basePrice: 2500, color: '#4A90D9' },
            { id: 'gopro-hero12', name: 'GoPro HERO12', specs: '5.3K视频 · HDR', basePrice: 2000, color: '#5BA0E9' },
            { id: 'dji-action5', name: 'DJI Action 5', specs: '4K · 磁吸快拆', basePrice: 2000, color: '#1C1C1E' },
            { id: 'dji-action4', name: 'DJI Action 4', specs: '1/1.3"传感器 · 防水', basePrice: 1500, color: '#2C2C2E' },
            { id: 'insta360-x4', name: 'Insta360 X4', specs: '8K全景 · 360°拍摄', basePrice: 2800, color: '#F5DEB3' },
            { id: 'insta360-ace-pro', name: 'Insta360 Ace Pro', specs: '徕卡联合 · 8K视频', basePrice: 2000, color: '#2C3E50' }
          ]
        },
        {
          id: 'lenses',
          name: '镜头',
          logo: '🔍',
          logoText: '镜',
          logoColor: '#555555',
          models: [
            { id: 'sony-2470gm2', name: 'Sony FE 24-70 F2.8 GM II', specs: '大三元标准变焦', basePrice: 10000, color: '#1C1C1E' },
            { id: 'sony-70200gm2', name: 'Sony FE 70-200 F2.8 GM II', specs: '大三元长焦', basePrice: 12000, color: '#F5F5F0' },
            { id: 'sony-50f12', name: 'Sony FE 50 F1.2 GM', specs: '人像镜皇', basePrice: 8000, color: '#1C1C1E' },
            { id: 'canon-rf2470', name: 'Canon RF 24-70 F2.8L', specs: 'L系列标准变焦', basePrice: 10000, color: '#1C1C1E' },
            { id: 'canon-rf70200', name: 'Canon RF 70-200 F2.8L', specs: 'L系列轻量长焦', basePrice: 12000, color: '#F5F5F0' },
            { id: 'nikon-z2470', name: 'Nikon Z 24-70 F2.8 S', specs: 'S-Line标准变焦', basePrice: 10000, color: '#1C1C1E' }
          ]
        }
      ]
    },
    {
      id: 'gaming',
      name: '游戏机回收',
      icon: '🎮',
      color: '#9B59B6',
      brands: [
        {
          id: 'playstation',
          name: 'PlayStation',
          logo: '🎮',
          logoText: 'PS',
          logoColor: '#003791',
          models: [
            { id: 'ps5-pro', name: 'PS5 Pro', specs: '性能升级 · 光追增强', basePrice: 3800, color: '#1C1C1E' },
            { id: 'ps5-slim', name: 'PS5 Slim', specs: '轻薄款 · 1TB存储', basePrice: 2800, color: '#F5F5F0' },
            { id: 'ps5-digital', name: 'PS5 数字版', specs: 'SSD超快加载', basePrice: 2500, color: '#F5F5F0' },
            { id: 'ps4-pro', name: 'PS4 Pro', specs: '4K游戏主机', basePrice: 1200, color: '#2C2C2E' },
            { id: 'psvr2', name: 'PS VR2', specs: '4K HDR · 眼球追踪', basePrice: 2500, color: '#F5F5F0' }
          ]
        },
        {
          id: 'nintendo',
          name: '任天堂',
          logo: '🕹️',
          logoText: 'N',
          logoColor: '#E60012',
          models: [
            { id: 'switch2', name: 'Nintendo Switch 2', specs: '新世代 · 性能升级', basePrice: 2500, color: '#E74C3C' },
            { id: 'switch-oled', name: 'Switch OLED', specs: '7英寸OLED屏', basePrice: 1500, color: '#E74C3C' },
            { id: 'switch-standard', name: 'Switch 续航版', specs: '经典款 · 续航增强', basePrice: 1000, color: '#F39C12' },
            { id: 'switch-lite', name: 'Switch Lite', specs: '纯掌机便携版', basePrice: 800, color: '#F39C12' }
          ]
        },
        {
          id: 'xbox',
          name: 'Xbox',
          logo: '🎮',
          logoText: 'X',
          logoColor: '#107C10',
          models: [
            { id: 'xbox-series-x', name: 'Xbox Series X', specs: '12TF性能 · 4K120', basePrice: 2500, color: '#1C1C1E' },
            { id: 'xbox-series-s', name: 'Xbox Series S', specs: '小巧次世代主机', basePrice: 1400, color: '#F5F5F0' },
            { id: 'xbox-one-x', name: 'Xbox One X', specs: '强化版主机', basePrice: 800, color: '#2C2C2E' }
          ]
        },
        {
          id: 'steam-deck',
          name: 'Steam Deck',
          logo: '🎮',
          logoText: 'SD',
          logoColor: '#1A9FFF',
          models: [
            { id: 'steam-deck-oled', name: 'Steam Deck OLED', specs: 'OLED屏 · 90Hz · 定制APU', basePrice: 3000, color: '#1C1C1E' },
            { id: 'steam-deck-lcd', name: 'Steam Deck LCD', specs: '定制APU · 7英寸', basePrice: 1800, color: '#2C2C2E' }
          ]
        },
        {
          id: 'retro',
          name: '复古/掌机',
          logo: '🕹️',
          logoText: '掌',
          logoColor: '#555555',
          models: [
            { id: 'rog-ally', name: 'ROG Ally X', specs: '锐龙Z1 · 1080P 120Hz', basePrice: 3500, color: '#1A1A2E' },
            { id: 'legion-go', name: 'Lenovo Legion Go', specs: '锐龙Z1 · 8.8英寸', basePrice: 2800, color: '#2D2D4A' },
            { id: 'ayaneo', name: 'AYANEO 2S', specs: '7840U · 无边框掌机', basePrice: 2500, color: '#1C1C1E' }
          ]
        }
      ]
    },
    {
      id: 'drone',
      name: '无人机回收',
      icon: '🚁',
      color: '#3498DB',
      brands: [
        {
          id: 'dji',
          name: '大疆',
          logo: '🚁',
          logoText: 'DJ',
          logoColor: '#404040',
          models: [
            { id: 'dji-mavic4-pro', name: 'Mavic 4 Pro', specs: '哈苏多焦段 · 全向避障', basePrice: 12000, color: '#4A4A4A' },
            { id: 'dji-mavic3-pro', name: 'Mavic 3 Pro', specs: '哈苏三摄 · 43分钟', basePrice: 10000, color: '#4A4A4A' },
            { id: 'dji-mavic3-classic', name: 'Mavic 3 Classic', specs: '哈苏单摄 · 46分钟', basePrice: 7000, color: '#696969' },
            { id: 'dji-air3s', name: 'Air 3S', specs: '双摄 · 全向避障', basePrice: 6500, color: '#696969' },
            { id: 'dji-air3', name: 'Air 3', specs: '双摄 · 全向避障', basePrice: 5500, color: '#808080' },
            { id: 'dji-mini4-pro', name: 'Mini 4 Pro', specs: '249g · 全向避障', basePrice: 4200, color: '#808080' },
            { id: 'dji-mini3-pro', name: 'Mini 3 Pro', specs: '249g · 三向避障', basePrice: 3000, color: '#A0A0A0' },
            { id: 'dji-avata2', name: 'Avata 2', specs: '沉浸飞行体验', basePrice: 3500, color: '#1C1C2E' },
            { id: 'dji-neo', name: 'DJI Neo', specs: '掌上起降 · 入门首选', basePrice: 1200, color: '#F5DEB3' },
            { id: 'dji-flip', name: 'DJI Flip', specs: '轻便折叠 · Vlog航拍', basePrice: 2500, color: '#9DC6A0' }
          ]
        },
        {
          id: 'autel',
          name: '道通',
          logo: '🛸',
          logoText: '道',
          logoColor: '#F39C12',
          models: [
            { id: 'autel-evo2-pro-v3', name: 'EVO II Pro V3', specs: '1英寸传感器 · 6K', basePrice: 6000, color: '#F39C12' },
            { id: 'autel-evo-lite', name: 'EVO Lite+', specs: '1英寸传感器 · 249g+', basePrice: 3500, color: '#F1C40F' }
          ]
        }
      ]
    },
    {
      id: 'server',
      name: '服务器回收',
      icon: '🖥️',
      color: '#5B6B8C',
      brands: [
        {
          id: 'dell',
          name: '戴尔',
          logo: '🖥️',
          logoText: '戴',
          logoColor: '#007DB8',
          models: [
            { id: 'dell-r760', name: 'PowerEdge R760', specs: '2U双路 · 至强可扩展', basePrice: 16000, color: '#007DB8' },
            { id: 'dell-r750', name: 'PowerEdge R750', specs: '2U双路 · 主流机架', basePrice: 9000, color: '#0085C3' },
            { id: 'dell-r650', name: 'PowerEdge R650', specs: '1U双路 · 高密度', basePrice: 7000, color: '#0099CC' },
            { id: 'dell-t550', name: 'PowerEdge T550', specs: '塔式 · 双路', basePrice: 6000, color: '#00A3CC' }
          ]
        },
        {
          id: 'hpe',
          name: '惠普HPE',
          logo: '🔵',
          logoText: 'HP',
          logoColor: '#0096D6',
          models: [
            { id: 'hpe-dl380', name: 'ProLiant DL380 Gen11', specs: '2U双路 · 经典机架', basePrice: 14000, color: '#0096D6' },
            { id: 'hpe-dl360', name: 'ProLiant DL360 Gen11', specs: '1U双路 · 高性能', basePrice: 10000, color: '#00A3E0' },
            { id: 'hpe-ml350', name: 'ProLiant ML350', specs: '塔式 · 双路', basePrice: 7000, color: '#33B5E5' }
          ]
        },
        {
          id: 'lenovo-srv',
          name: '联想',
          logo: '🧱',
          logoText: '联',
          logoColor: '#E2231A',
          models: [
            { id: 'lenovo-sr650', name: 'ThinkSystem SR650', specs: '2U双路 · 企业级', basePrice: 11000, color: '#E2231A' },
            { id: 'lenovo-sr630', name: 'ThinkSystem SR630', specs: '1U双路 · 高密度', basePrice: 8000, color: '#E84C3D' },
            { id: 'lenovo-st550', name: 'ThinkSystem ST550', specs: '塔式 · 双路', basePrice: 6000, color: '#F1948A' }
          ]
        },
        {
          id: 'huawei-srv',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'huawei-2288h', name: 'FusionServer 2288H V6', specs: '2U双路 · 鲲鹏/至强', basePrice: 12000, color: '#CF0A2C' },
            { id: 'huawei-taishan', name: 'TaiShan 2280', specs: '2U · 鲲鹏处理器', basePrice: 9000, color: '#D4AF37' }
          ]
        },
        {
          id: 'inspur',
          name: '浪潮',
          logo: '🌊',
          logoText: '浪',
          logoColor: '#1E6FD9',
          models: [
            { id: 'inspur-nf5280m7', name: 'NF5280M7', specs: '2U双路 · 主流机架', basePrice: 10000, color: '#1E6FD9' },
            { id: 'inspur-nf5260m6', name: 'NF5260M6', specs: '1U双路 · 高密度', basePrice: 7000, color: '#4A90D9' }
          ]
        },
        {
          id: 'h3c-srv',
          name: '新华三H3C',
          logo: '🔷',
          logoText: 'H3',
          logoColor: '#E60012',
          models: [
            { id: 'h3c-r4900', name: 'UniServer R4900 G6', specs: '2U双路 · 企业级', basePrice: 10500, color: '#E60012' },
            { id: 'h3c-r4700', name: 'UniServer R4700 G6', specs: '1U双路 · 高密度', basePrice: 8500, color: '#F1948A' }
          ]
        }
      ]
    },
    {
      id: 'network',
      name: '网络设备回收',
      icon: '📡',
      color: '#3E8E7E',
      brands: [
        {
          id: 'huawei-net',
          name: '华为',
          logo: '🔶',
          logoText: '华',
          logoColor: '#CF0A2C',
          models: [
            { id: 'hw-ax3pro', name: 'AX3 Pro', specs: 'WiFi6 · 双核', basePrice: 150, color: '#CF0A2C' },
            { id: 'hw-ax6', name: 'AX6', specs: 'WiFi6+ · 千兆', basePrice: 300, color: '#D4AF37' },
            { id: 'hw-be3pro', name: 'BE3 Pro', specs: 'WiFi7 · 双频', basePrice: 450, color: '#8B7D6B' },
            { id: 'hw-ar', name: '企业AR系列路由', specs: '企业级 · 多业务', basePrice: 1500, color: '#5C3A6B' }
          ]
        },
        {
          id: 'h3c-net',
          name: '华三H3C',
          logo: '🔷',
          logoText: 'H3',
          logoColor: '#E60012',
          models: [
            { id: 'h3c-nx30', name: 'Magic NX30 Pro', specs: 'WiFi6 · 3000M', basePrice: 250, color: '#E60012' },
            { id: 'h3c-msr', name: '企业MSR路由器', specs: '企业级 · 多业务', basePrice: 1200, color: '#F1948A' },
            { id: 'h3c-switch', name: '交换机/Switch', specs: '全千兆/万兆', basePrice: 1000, color: '#7FB3D8' }
          ]
        },
        {
          id: 'tplink',
          name: 'TP-LINK',
          logo: '🟦',
          logoText: 'TP',
          logoColor: '#0050A4',
          models: [
            { id: 'tp-xdr5480', name: 'XDR5480', specs: 'WiFi6 · 5400M', basePrice: 350, color: '#0050A4' },
            { id: 'tp-xdr6030', name: 'XDR6030', specs: 'WiFi6 · 6000M', basePrice: 250, color: '#2E75B6' },
            { id: 'tp-er', name: '企业ER系列', specs: '企业级 · 多WAN', basePrice: 800, color: '#9DC6A0' }
          ]
        },
        {
          id: 'xiaomi-net',
          name: '小米',
          logo: '🟠',
          logoText: '米',
          logoColor: '#FF6900',
          models: [
            { id: 'mi-ax9000', name: '路由器AX9000', specs: 'WiFi6 · 三频', basePrice: 400, color: '#FF6900' },
            { id: 'mi-ax6000', name: '路由器AX6000', specs: 'WiFi6 · 6000M', basePrice: 250, color: '#FF8C00' },
            { id: 'mi-be6500', name: '路由器BE6500', specs: 'WiFi7 · 双频', basePrice: 450, color: '#FFA500' }
          ]
        },
        {
          id: 'netgear',
          name: '网件Netgear',
          logo: '🟥',
          logoText: 'NG',
          logoColor: '#7AB800',
          models: [
            { id: 'ng-rax200', name: 'Nighthawk RAX200', specs: 'WiFi6 · 三频', basePrice: 900, color: '#7AB800' },
            { id: 'ng-orbi', name: 'Orbi Mesh', specs: '分布式 · 全屋覆盖', basePrice: 1500, color: '#A3D900' }
          ]
        },
        {
          id: 'cisco',
          name: '思科Cisco',
          logo: '🔷',
          logoText: 'Ci',
          logoColor: '#1BA0D7',
          models: [
            { id: 'cisco-isr', name: '企业路由器ISR', specs: '企业级 · 多业务', basePrice: 2000, color: '#1BA0D7' },
            { id: 'cisco-catalyst', name: 'Catalyst交换机', specs: '企业级 · 核心交换', basePrice: 1800, color: '#4AB3E3' }
          ]
        }
      ]
    },
    {
      id: 'gpu',
      name: '显卡回收',
      icon: '🎛️',
      color: '#8E5B8C',
      brands: [
        {
          id: 'nvidia',
          name: 'NVIDIA',
          logo: '🟩',
          logoText: 'NV',
          logoColor: '#76B900',
          models: [
            { id: 'nv-4090', name: 'RTX 4090', specs: '24G · 旗舰游戏/AI', basePrice: 12000, color: '#76B900' },
            { id: 'nv-4080s', name: 'RTX 4080 Super', specs: '16G · 高端', basePrice: 8000, color: '#82C900' },
            { id: 'nv-4070ti', name: 'RTX 4070 Ti Super', specs: '16G · 高性价比', basePrice: 6000, color: '#9ACD32' },
            { id: 'nv-4060', name: 'RTX 4060', specs: '8G · 主流', basePrice: 2200, color: '#A9D700' },
            { id: 'nv-3090', name: 'RTX 3090', specs: '24G · 上代旗舰', basePrice: 5000, color: '#5B8C00' }
          ]
        },
        {
          id: 'amd',
          name: 'AMD',
          logo: '🔴',
          logoText: 'A',
          logoColor: '#ED1C24',
          models: [
            { id: 'amd-7900xtx', name: 'RX 7900 XTX', specs: '24G · 旗舰', basePrice: 6500, color: '#ED1C24' },
            { id: 'amd-7800xt', name: 'RX 7800 XT', specs: '16G · 高端', basePrice: 3800, color: '#F04E54' },
            { id: 'amd-7600', name: 'RX 7600', specs: '8G · 主流', basePrice: 1800, color: '#F1948A' }
          ]
        },
        {
          id: 'intel-gpu',
          name: '英特尔',
          logo: '🔵',
          logoText: 'I',
          logoColor: '#0071C5',
          models: [
            { id: 'intel-a770', name: 'Arc A770', specs: '16G · 独显', basePrice: 1800, color: '#0071C5' },
            { id: 'intel-b580', name: 'Arc B580', specs: '12G · 新架构', basePrice: 1600, color: '#2E9BE6' }
          ]
        }
      ]
    }
  ],

  // 引导对话问题
  guideQuestions: [
    {
      id: 'condition',
      question: '您的设备成色如何？',
      type: 'select',
      options: [
        { label: '全新未使用', value: 'mint', rate: 1.0, desc: '未拆封或仅拆封，无任何使用痕迹' },
        { label: '九成新', value: 'excellent', rate: 0.9, desc: '轻微使用痕迹，无划痕' },
        { label: '八成新', value: 'good', rate: 0.8, desc: '正常使用痕迹，可能有细微划痕' },
        { label: '七成新', value: 'fair', rate: 0.7, desc: '明显使用痕迹，有划痕或磕碰' },
        { label: '六成新及以下', value: 'poor', rate: 0.55, desc: '明显磨损、磕碰，但功能正常' }
      ]
    },
    {
      id: 'screen',
      question: '屏幕状况如何？',
      type: 'select',
      options: [
        { label: '屏幕完好无损', value: 'perfect', rate: 1.0 },
        { label: '有轻微划痕', value: 'scratched', rate: 0.9 },
        { label: '有明显划痕', value: 'deep-scratched', rate: 0.75 },
        { label: '有碎裂/坏点', value: 'damaged', rate: 0.4 },
        { label: '屏幕完全损坏', value: 'broken', rate: 0.15 }
      ]
    },
    {
      id: 'function',
      question: '设备功能是否正常？',
      type: 'select',
      options: [
        { label: '全部功能正常', value: 'all-good', rate: 1.0 },
        { label: '部分功能有问题', value: 'minor-issues', rate: 0.7, desc: '如扬声器、按键等小问题' },
        { label: '有较大故障', value: 'major-issues', rate: 0.4, desc: '如摄像头不工作、信号差等' },
        { label: '无法正常使用', value: 'not-working', rate: 0.15, desc: '不开机或无法正常操作' }
      ]
    },
    {
      id: 'version',
      question: '您的设备是什么版本？',
      type: 'select',
      options: [
        { label: '国行/大陆版', value: 'china', rate: 1.0, desc: '中国大陆正规渠道购买' },
        { label: '港版/澳版', value: 'hk', rate: 0.95, desc: '港澳地区购买' },
        { label: '国际版/海外版', value: 'international', rate: 0.85, desc: '海外渠道购买' },
        { label: '不确定', value: 'unknown', rate: 0.9 }
      ]
    },
    {
      id: 'accessories',
      question: '配件是否齐全？',
      type: 'select',
      options: [
        { label: '原装配件齐全（含包装）', value: 'full-box', rate: 1.0, desc: '包装盒、充电器、数据线等都在' },
        { label: '有充电器和数据线', value: 'basic', rate: 0.98, desc: '基础配件都有' },
        { label: '只有裸机', value: 'device-only', rate: 0.93, desc: '无任何配件' }
      ]
    },
    {
      id: 'repair-history',
      question: '设备是否有维修史？',
      type: 'select',
      options: [
        { label: '从未维修过', value: 'never', rate: 1.0 },
        { label: '官方授权店维修过', value: 'official', rate: 0.92, desc: '有官方维修记录' },
        { label: '非官方渠道维修过', value: 'third-party', rate: 0.75, desc: '第三方维修或拆机过' },
        { label: '不确定', value: 'unknown-repair', rate: 0.85 }
      ]
    },
    {
      id: 'extra',
      question: '还有其他需要说明的问题吗？',
      type: 'input',
      placeholder: '如进水、摔过、电池鼓包等额外情况...',
      required: false
    }
  ],

  // 成色计算参考
  conditionRates: {
    mint: 1.0,
    excellent: 0.9,
    good: 0.8,
    fair: 0.7,
    poor: 0.55
  }
};
