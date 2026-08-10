/**
 * 设备类型识别测试脚本（非侵入式：用 vm 沙箱加载 scanRoutes.js，不修改源码）
 * 覆盖全部 14 种支持类型，并重点验证「路由器被误判成手机」的修复场景。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, 'routes', 'scanRoutes.js');
const src = fs.readFileSync(filePath, 'utf8');

// ---- 构造沙箱，stub 掉 express / multer，真实加载 deviceData ----
const expressStub = { Router: () => ({ post: () => {}, get: () => {} }) };
const multerStub = function () { return { single: () => ({}) }; };
multerStub.memoryStorage = () => ({});

const sandbox = {
  require: (mod) => {
    if (mod === 'express') return expressStub;
    if (mod === 'multer') return multerStub;
    if (mod.startsWith('.')) return require(path.resolve(path.dirname(filePath), mod));
    return require(mod);
  },
  console,
  process,
  Buffer,
  module: { exports: {} },
  exports: {},
};

vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: filePath });

const { matchDeviceByRules, detectHardCategory, normalizeDeviceType } = sandbox;

function run(aiResult) {
  return matchDeviceByRules(aiResult);
}

// 每个测试用例：期望得到的设备大类
const cases = [
  // 类型, 描述, aiResult
  ['手机', 'iPhone 15', { brand: 'apple', name: 'iPhone', type: '手机', features: { shape: '直板手机' } }],
  ['电脑/笔记本', '联想笔记本', { brand: '联想', name: 'Lenovo', type: '电脑/笔记本', features: { shape: '笔记本电脑' } }],
  ['平板', 'iPad', { brand: 'apple', name: 'iPad', type: '平板', features: { shape: '平板' } }],
  ['手表/手环', 'Apple Watch', { brand: 'apple', name: 'Apple Watch', type: '手表/手环', features: { shape: '智能手表' } }],
  ['耳机/音响', 'AirPods', { brand: 'apple', name: 'AirPods', type: '耳机/音响', features: { shape: 'tws耳机' } }],
  ['相机/摄像机', '佳能相机', { brand: '佳能', name: 'Canon', type: '相机/摄像机', features: { shape: '相机' } }],
  ['游戏机', 'Switch', { brand: '任天堂', name: 'Switch', type: '游戏机', features: { shape: '游戏机' } }],
  ['传感器/仪器', '西门子PLC', { brand: '西门子', name: 'Siemens', type: '传感器/仪器', features: { shape: '传感器' } }],
  ['无人机/航拍', '大疆无人机', { brand: '大疆', name: 'DJI', type: '无人机/航拍', features: { shape: '无人机' } }],
  ['智能家居', '小米智能音箱', { brand: '小米', name: '小米音箱', type: '智能家居', features: { shape: '智能音箱' } }],
  ['打印机/办公设备', 'HP 打印机', { brand: '惠普', name: 'HP', type: '打印机/办公设备', features: { shape: '打印机' } }],
  ['服务器', '戴尔机架服务器', { brand: '戴尔', name: 'PowerEdge', type: '服务器', features: { shape: '机架服务器' } }],
  ['路由器/网络设备', '华为路由器', { brand: '华为', name: '华为路由', type: '路由器/网络设备', features: { shape: '路由器' } }],
  ['显卡/电脑硬件', 'NVIDIA 显卡', { brand: 'nvidia', name: 'RTX', type: '显卡/电脑硬件', features: { shape: '显卡' } }],
];

// 重点回归场景：AI 把「小米路由器」误判成手机 type=手机，但名称/描述含路由器+四天线
const regressionCases = [
  ['路由器/网络设备', '小米路由器被AI误判为手机', { brand: '小米', name: '小米路由器', type: '手机', description: '白色小米路由器 四天线设计', features: { shape: '直板手机' } }],
  ['路由器/网络设备', '无品牌路由器(只识别到天线)', { brand: '', name: '路由器', type: '未知', description: '白色路由器 四根外置天线', features: { shape: '路由器' } }],
  ['服务器', '无品牌机架服务器', { brand: '', name: '服务器', type: '未知', description: '1U机架式服务器 多硬盘位', features: { shape: '机架服务器' } }],
  ['显卡/电脑硬件', '无品牌显卡', { brand: '', name: '显卡', type: '未知', description: '独立显卡 带风扇散热片', features: { shape: '显卡' } }],
];

let pass = 0, fail = 0;
function check(label, got, want) {
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`${ok ? '✅' : '❌'} ${label}\n   期望: ${want}\n   实际: ${got}`);
  return ok;
}

console.log('========== 一、全部支持类型识别测试 ==========');
console.log('');
for (const [want, desc, ai] of cases) {
  const r = run(ai);
  check(`[${desc}] -> ${want}`, r.type, want);
}

console.log('\n========== 二、关键回归场景（大方向锁定） ==========');
for (const [want, desc, ai] of regressionCases) {
  const r = run(ai);
  check(`[${desc}] -> ${want}`, r.type, want);
}

console.log('\n========== 三、normalizeDeviceType 模糊归一化 ==========');
const normCases = [
  ['手机', 'smartphone'], ['电脑/笔记本', 'laptop'], ['平板', 'iPad tablet'],
  ['手表/手环', 'smartwatch'], ['耳机/音响', 'headphone'], ['相机/摄像机', 'camera'],
  ['游戏机', 'PlayStation'], ['传感器/仪器', 'PLC sensor'], ['无人机/航拍', 'drone'],
  ['智能家居', 'smart home'], ['打印机/办公设备', 'printer'], ['服务器', 'rack server'],
  ['路由器/网络设备', 'wifi router'], ['显卡/电脑硬件', 'NVIDIA GPU'],
];
for (const [want, raw] of normCases) {
  const got = normalizeDeviceType(raw);
  check(`normalize("${raw}") -> ${want}`, got, want);
}

console.log('\n========== 四、detectHardCategory 强特征命中 ==========');
const hardCases = [
  ['路由器/网络设备', '白色小米路由器 四天线设计'],
  ['服务器', '戴尔 PowerEdge 机架式服务器'],
  ['显卡/电脑硬件', 'NVIDIA RTX 4090 独立显卡'],
  [null, '苹果 iPhone 手机'],
];
for (const [want, blob] of hardCases) {
  const got = detectHardCategory(blob);
  check(`detectHardCategory("${blob}") -> ${String(want)}`, got, want);
}

console.log(`\n========== 结果汇总 ==========`);
console.log(`通过: ${pass}  失败: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
