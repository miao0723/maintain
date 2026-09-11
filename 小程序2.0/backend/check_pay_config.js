// 微信支付配置自检脚本（不打印任何密钥/证书明文）
// 用法：node check_pay_config.js
// 可选：node check_pay_config.js --verify-remote （额外请求微信平台证书接口验证商户签名配置）
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');

const verifyRemote = process.argv.includes('--verify-remote');
const rootDir = __dirname;
const placeholderValues = new Set([
  'xxxx',
  'xxxxx',
  'xxxxxxxx',
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'your_merchant_id',
  'your_apiv3_key',
  'your_cert_serial_no',
  'your_wechat_appid'
]);

function value(name) {
  return String(process.env[name] || '').trim();
}

function isReal(name) {
  const v = value(name);
  return !!v && !placeholderValues.has(v) && !/^your[-_]/i.test(v);
}

function isRealHttpsUrl(name) {
  if (!isReal(name)) return false;
  try {
    const url = new URL(value(name));
    return url.protocol === 'https:' &&
      !['your-domain.com', 'localhost', '127.0.0.1'].includes(url.hostname);
  } catch (_) {
    return false;
  }
}

function pemSource(directName, pathName, defaultPath) {
  if (isReal(directName) && value(directName).includes('BEGIN ')) {
    return { ok: true, text: `${directName} 已直接填写 PEM` };
  }

  const configuredPath = value(pathName) || defaultPath;
  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(rootDir, configuredPath);
  return {
    ok: fs.existsSync(resolvedPath),
    text: `${pathName || '默认路径'}: ${resolvedPath}${fs.existsSync(resolvedPath) ? ' 存在' : ' 缺失'}`
  };
}

const checks = [
  ['WECHAT_APP_ID', isReal('WECHAT_APP_ID'), '小程序 AppID'],
  ['WECHAT_MCH_ID', isReal('WECHAT_MCH_ID'), '微信支付商户号'],
  ['WECHAT_PAY_API_V3_KEY', isReal('WECHAT_PAY_API_V3_KEY') && value('WECHAT_PAY_API_V3_KEY').length === 32, 'APIv3 密钥（32位）'],
  ['WECHAT_PAY_SERIAL_NO', isReal('WECHAT_PAY_SERIAL_NO'), '商户 API 证书序列号'],
  ['WECHAT_PAY_NOTIFY_URL', isRealHttpsUrl('WECHAT_PAY_NOTIFY_URL'), '支付回调（公网 HTTPS）'],
  ['WECHAT_PAY_REFUND_NOTIFY_URL', isRealHttpsUrl('WECHAT_PAY_REFUND_NOTIFY_URL'), '退款回调（公网 HTTPS）']
];

let ok = true;
console.log('=== 微信支付配置自检 ===');
console.log(`配置文件: ${path.join(rootDir, '.env')}`);
for (const [name, good, description] of checks) {
  ok = ok && good;
  console.log(`${good ? '✅' : '❌'} ${name.padEnd(33)} ${good ? '已配置' : '缺失/占位符/格式不正确'} (${description})`);
}

const privateKey = pemSource('WECHAT_PAY_PRIVATE_KEY', 'WECHAT_PAY_PRIVATE_KEY_PATH', './cert/apiclient_key.pem');
ok = ok && privateKey.ok;
console.log(`${privateKey.ok ? '✅' : '❌'} 商户 API 私钥${' '.repeat(21)}${privateKey.text}`);

const usingPublicKeyMode = isReal('WECHAT_PAY_PUBLIC_KEY_ID');
if (usingPublicKeyMode) {
  const publicKey = pemSource('WECHAT_PAY_PUBLIC_KEY', 'WECHAT_PAY_PUBLIC_KEY_PATH', './cert/wechatpay_public.pem');
  ok = ok && publicKey.ok;
  console.log(`${publicKey.ok ? '✅' : '❌'} 微信支付公钥${' '.repeat(21)}${publicKey.text}`);
  console.log('✅ 回调验签模式                         公钥模式（WECHAT_PAY_PUBLIC_KEY_ID）');
} else {
  const platformCert = pemSource('WECHAT_PAY_PLATFORM_CERT', 'WECHAT_PAY_PLATFORM_CERT_PATH', './cert/wechatpay_platform.pem');
  console.log(`${platformCert.ok ? '✅' : 'ℹ️'} 微信支付平台证书${' '.repeat(19)}${platformCert.ok ? platformCert.text : '未手动配置；服务将在回调验签时自动下载并轮换'}`);
}

if (verifyRemote) {
  (async () => {
    try {
      const {
        queryTransactionByOutTradeNo,
        refreshPlatformCertificates
      } = require('./services/wechatPayService');

      // 使用一个不存在的商户单号做只读查询：签名/商户号/证书序列号正确时，
      // 微信返回 RESOURCE_NOT_EXISTS；配置错误则返回 SIGN_ERROR / NOT_FOUND 等。
      try {
        await queryTransactionByOutTradeNo(`PAYCONFIG${Date.now()}`);
        console.log('✅ 商户 API 证书远程验证成功');
      } catch (error) {
        if (error?.status === 404 || error?.wechatPayResponse?.code === 'RESOURCE_NOT_EXISTS') {
          console.log('✅ 商户 API 证书远程验证成功');
        } else {
          throw error;
        }
      }

      if (usingPublicKeyMode) {
        console.log('✅ 回调验签远程配置成功（模式: public_key）');
      } else {
        const result = await refreshPlatformCertificates();
        console.log(`✅ 回调验签远程配置成功（模式: ${result.mode}，可用验签密钥数: ${result.keys.length}）`);
      }
    } catch (error) {
      ok = false;
      console.error(`❌ 微信支付远程验证失败: ${error.message}`);
      if (error.wechatPayResponse) {
        console.error('   微信返回 code:', error.wechatPayResponse.code || '(空)');
      }
    } finally {
      console.log(ok ? '\n✅ 微信支付配置完整' : '\n❌ 仍有缺失/错误项');
      process.exit(ok ? 0 : 1);
    }
  })();
} else {
  console.log(ok ? '\n✅ 本地配置检查通过；可运行 node check_pay_config.js --verify-remote 验证商户证书签名' : '\n❌ 仍有缺失项');
  process.exit(ok ? 0 : 1);
}
