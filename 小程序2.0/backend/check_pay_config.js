// 微信支付配置自检脚本（不打印任何密钥明文）
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');

const PLACEHOLDERS = ['xxxx', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'];
function isReal(v) {
  if (!v || !String(v).trim()) return false;
  return !PLACEHOLDERS.includes(String(v).trim());
}
function urlReal(v) {
  return isReal(v) && !String(v).includes('your-domain');
}

const checks = [
  ['WECHAT_APP_ID', isReal(process.env.WECHAT_APP_ID), '小程序 AppID'],
  ['WECHAT_MCH_ID', isReal(process.env.WECHAT_MCH_ID), '微信支付商户号'],
  ['WECHAT_PAY_API_V3_KEY', isReal(process.env.WECHAT_PAY_API_V3_KEY), 'APIv3 密钥'],
  ['WECHAT_PAY_SERIAL_NO', isReal(process.env.WECHAT_PAY_SERIAL_NO), '商户 API 证书序列号'],
  ['WECHAT_PAY_NOTIFY_URL', urlReal(process.env.WECHAT_PAY_NOTIFY_URL), '支付回调通知地址(需公网HTTPS)'],
];

let ok = true;
console.log('=== 微信支付配置自检 ===');
for (const [k, good, desc] of checks) {
  if (!good) ok = false;
  console.log(`${good ? '✅' : '❌'} ${k}  ${good ? '已配置' : '缺失/仍为占位符'}  (${desc})`);
}

// 证书文件（与 .env 同级，即 backend/ 目录）
const root = __dirname;
const pk = process.env.WECHAT_PAY_PRIVATE_KEY_PATH || './cert/apiclient_key.pem';
const plat = process.env.WECHAT_PAY_PLATFORM_CERT_PATH || './cert/wechatpay_platform.pem';
const pkPath = path.isAbsolute(pk) ? pk : path.resolve(root, pk);
const platPath = path.isAbsolute(plat) ? plat : path.resolve(root, plat);

// 也支持直接文本模式
const pkTextOk = isReal(process.env.WECHAT_PAY_PRIVATE_KEY) && String(process.env.WECHAT_PAY_PRIVATE_KEY).includes('BEGIN');
const platTextOk = isReal(process.env.WECHAT_PAY_PLATFORM_CERT) && String(process.env.WECHAT_PAY_PLATFORM_CERT).includes('BEGIN');

const pkOk = pkTextOk || fs.existsSync(pkPath);
const platOk = platTextOk || fs.existsSync(platPath);
if (!pkOk || !platOk) ok = false;
console.log(`${pkOk ? '✅' : '❌'} 商户私钥  (${pkTextOk ? '文本已填' : pkPath + (pkOk ? ' 存在' : ' 缺失')})`);
console.log(`${platOk ? '✅' : '❌'} 平台证书  (${platTextOk ? '文本已填' : platPath + (platOk ? ' 存在' : ' 缺失')})`);

console.log(ok ? '\n✅ 微信支付配置完整，可发起真实支付' : '\n❌ 仍有缺失项，请补全后重新运行 node check_pay_config.js');
process.exit(ok ? 0 : 1);
