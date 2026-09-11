const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const WECHAT_PAY_BASE_URL = 'https://api.mch.weixin.qq.com';
const PLATFORM_CERT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const NOTIFY_TIMESTAMP_MAX_SKEW_SECONDS = 5 * 60;

let platformCertificateCache = null;
let platformCertificateLoading = null;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return String(value).trim();
}

function normalizePem(rawValue) {
  return String(rawValue || '')
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .trim();
}

function readPemFile(filePath, rootDir) {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(rootDir, filePath);

  let content;
  try {
    content = fs.readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(`无法读取微信支付证书文件 ${resolvedPath}: ${error.message}`);
  }

  return normalizePem(content);
}

/**
 * 支持两种配置方式：
 * 1. *_PATH 指向 PEM 文件（backend/.env 中相对路径以 backend/ 为基准）
 * 2. 直接把 PEM 文本填到环境变量，换行可写成 \n
 */
function resolvePemContent({ directEnvName, pathEnvName, label }) {
  const rootDir = path.resolve(__dirname, '..');
  const directValue = process.env[directEnvName];
  const pathValue = process.env[pathEnvName];

  if (directValue && String(directValue).trim()) {
    const pem = normalizePem(directValue);
    if (!pem.includes('BEGIN ')) {
      throw new Error(`${directEnvName} 不是有效的 PEM 文本（缺少 BEGIN 标记）`);
    }
    return pem;
  }

  if (pathValue && String(pathValue).trim()) {
    const pem = readPemFile(String(pathValue).trim(), rootDir);
    if (!pem.includes('BEGIN ')) {
      throw new Error(`${pathEnvName} 指向的文件不是有效的 ${label} PEM 文件`);
    }
    return pem;
  }

  return '';
}

function getWechatPayConfig() {
  const privateKeyPem = resolvePemContent({
    directEnvName: 'WECHAT_PAY_PRIVATE_KEY',
    pathEnvName: 'WECHAT_PAY_PRIVATE_KEY_PATH',
    label: '商户 API 私钥'
  });
  const publicKeyPem = resolvePemContent({
    directEnvName: 'WECHAT_PAY_PUBLIC_KEY',
    pathEnvName: 'WECHAT_PAY_PUBLIC_KEY_PATH',
    label: '微信支付公钥'
  });
  const platformCertPem = resolvePemContent({
    directEnvName: 'WECHAT_PAY_PLATFORM_CERT',
    pathEnvName: 'WECHAT_PAY_PLATFORM_CERT_PATH',
    label: '微信支付平台证书'
  });
  const publicKeyId = (process.env.WECHAT_PAY_PUBLIC_KEY_ID || '').trim();

  if (!privateKeyPem) {
    throw new Error('缺少商户 API 私钥：请配置 WECHAT_PAY_PRIVATE_KEY_PATH 或 WECHAT_PAY_PRIVATE_KEY');
  }
  if (publicKeyPem && !publicKeyId) {
    throw new Error('使用微信支付公钥模式时必须配置 WECHAT_PAY_PUBLIC_KEY_ID');
  }
  if (publicKeyId && !publicKeyPem) {
    throw new Error('已配置 WECHAT_PAY_PUBLIC_KEY_ID，还必须配置微信支付公钥文件或 PEM 文本');
  }

  return {
    appid: getRequiredEnv('WECHAT_APP_ID'),
    mchid: getRequiredEnv('WECHAT_MCH_ID'),
    notifyUrl: getRequiredEnv('WECHAT_PAY_NOTIFY_URL'),
    refundNotifyUrl: (process.env.WECHAT_PAY_REFUND_NOTIFY_URL || '').trim(),
    apiV3Key: getRequiredEnv('WECHAT_PAY_API_V3_KEY'),
    serialNo: getRequiredEnv('WECHAT_PAY_SERIAL_NO'),
    privateKeyPem,
    publicKeyPem,
    publicKeyId,
    platformCertPem
  };
}

function isWechatPayConfigured() {
  try {
    const config = getWechatPayConfig();
    return !!(
      config.appid &&
      config.mchid &&
      config.notifyUrl &&
      config.apiV3Key &&
      config.serialNo &&
      config.privateKeyPem.includes('PRIVATE KEY')
    );
  } catch (_) {
    return false;
  }
}

function createNonceStr() {
  return crypto.randomBytes(16).toString('hex');
}

function createTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function buildMessage(method, urlPath, timestamp, nonceStr, bodyText) {
  return `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyText}\n`;
}

function signMessage(message, privateKeyPem) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

function buildAuthorization(config, method, urlPath, bodyText) {
  const nonceStr = createNonceStr();
  const timestamp = createTimestamp();
  const message = buildMessage(method, urlPath, timestamp, nonceStr, bodyText);
  const signature = signMessage(message, config.privateKeyPem);
  const token = [
    `mchid="${config.mchid}"`,
    `nonce_str="${nonceStr}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${config.serialNo}"`,
    `signature="${signature}"`
  ].join(',');

  return `WECHATPAY2-SHA256-RSA2048 ${token}`;
}

async function wechatRequest(method, urlPath, payload) {
  const config = getWechatPayConfig();
  const bodyText = payload ? JSON.stringify(payload) : '';

  try {
    const response = await axios({
      method,
      url: `${WECHAT_PAY_BASE_URL}${urlPath}`,
      data: payload || undefined,
      timeout: 15000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: buildAuthorization(config, method, urlPath, bodyText),
        'User-Agent': 'electronic-repair-miniapp/2.0'
      }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      error.wechatPayResponse = error.response.data;
      error.status = error.response.status;
      const remoteMessage = error.response.data?.message || error.response.status;
      error.message = `微信支付接口请求失败(${error.response.status}): ${remoteMessage}`;
    }
    throw error;
  }
}

function createMiniProgramPaySign(config, prepayId) {
  const timeStamp = createTimestamp();
  const nonceStr = createNonceStr();
  const pkg = `prepay_id=${prepayId}`;
  const message = `${config.appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  const paySign = signMessage(message, config.privateKeyPem);

  return {
    appId: config.appid,
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign
  };
}

async function createJsapiTransaction({ description, outTradeNo, amount, openid, attach }) {
  const config = getWechatPayConfig();
  const payload = {
    appid: config.appid,
    mchid: config.mchid,
    description,
    out_trade_no: outTradeNo,
    notify_url: config.notifyUrl,
    amount: {
      total: amount,
      currency: 'CNY'
    },
    payer: {
      openid
    }
  };

  if (attach) {
    payload.attach = attach;
  }

  const data = await wechatRequest('POST', '/v3/pay/transactions/jsapi', payload);
  if (!data?.prepay_id) {
    throw new Error('微信支付未返回 prepay_id');
  }

  return {
    prepayId: data.prepay_id,
    payParams: createMiniProgramPaySign(config, data.prepay_id),
    raw: data
  };
}

async function queryTransactionByOutTradeNo(outTradeNo) {
  const config = getWechatPayConfig();
  const encoded = encodeURIComponent(outTradeNo);
  const mchid = encodeURIComponent(config.mchid);
  return wechatRequest('GET', `/v3/pay/transactions/out-trade-no/${encoded}?mchid=${mchid}`);
}

async function createRefund({ outTradeNo, refundNo, reason, refundAmount, totalAmount }) {
  const config = getWechatPayConfig();
  if (!config.refundNotifyUrl) {
    throw new Error('缺少环境变量 WECHAT_PAY_REFUND_NOTIFY_URL（退款结果无法异步同步）');
  }

  const payload = {
    out_trade_no: outTradeNo,
    out_refund_no: refundNo,
    notify_url: config.refundNotifyUrl,
    reason: reason || '用户申请退款',
    amount: {
      refund: refundAmount,
      total: totalAmount,
      currency: 'CNY'
    }
  };

  return wechatRequest('POST', '/v3/refund/domestic/refunds', payload);
}

function decryptAes256Gcm(resource, apiV3Key) {
  const key = Buffer.from(apiV3Key, 'utf8');
  if (key.length !== 32) {
    throw new Error('WECHAT_PAY_API_V3_KEY 必须是 32 位字符串');
  }

  const nonce = Buffer.from(resource.nonce, 'utf8');
  const associatedData = Buffer.from(resource.associated_data || '', 'utf8');
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  if (ciphertext.length <= 16) {
    throw new Error('微信支付回调解密数据无效');
  }

  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(authTag);
  if (associatedData.length > 0) {
    decipher.setAAD(associatedData);
  }

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function normalizeSerial(serial) {
  return String(serial || '')
    .replace(/[\s:]/g, '')
    .toUpperCase();
}

function getCertificateSerial(certificatePem) {
  try {
    return normalizeSerial(new crypto.X509Certificate(certificatePem).serialNumber);
  } catch (error) {
    throw new Error(`无法解析微信支付平台证书序列号: ${error.message}`);
  }
}

async function loadPlatformCertificates() {
  const config = getWechatPayConfig();
  const response = await wechatRequest('GET', '/v3/certificates');
  const now = Date.now();
  const items = [];

  for (const item of response?.data || []) {
    const expireTime = Date.parse(item.expire_time || '');
    if (Number.isFinite(expireTime) && expireTime - 5 * 60 * 1000 <= now) {
      continue;
    }

    const certificatePem = decryptAes256Gcm(item.encrypt_certificate, config.apiV3Key);
    if (!String(certificatePem).includes('BEGIN CERTIFICATE')) {
      continue;
    }

    items.push({
      serialNo: normalizeSerial(item.serial_no),
      publicKeyPem: String(certificatePem)
    });
  }

  if (!items.length) {
    throw new Error('微信支付平台证书列表为空');
  }

  platformCertificateCache = {
    items,
    fetchedAt: now
  };
  return items;
}

async function getPlatformVerificationKeys({ forceRefresh = false } = {}) {
  const config = getWechatPayConfig();

  // 新版微信支付商户可使用「微信支付公钥 + 公钥ID」验签。
  if (config.publicKeyPem) {
    return {
      mode: 'public_key',
      keys: [{
        serialNo: normalizeSerial(config.publicKeyId),
        publicKeyPem: config.publicKeyPem
      }]
    };
  }

  const staticKeys = config.platformCertPem
    ? [{
        serialNo: getCertificateSerial(config.platformCertPem),
        publicKeyPem: config.platformCertPem
      }]
    : [];

  // 旧版平台证书支持自动从微信支付下载，避免手工下载/轮换证书。
  if (!forceRefresh && staticKeys.length) {
    return { mode: 'platform_certificate', keys: staticKeys };
  }

  if (
    !forceRefresh &&
    platformCertificateCache &&
    Date.now() - platformCertificateCache.fetchedAt < PLATFORM_CERT_CACHE_TTL_MS
  ) {
    return { mode: 'platform_certificate', keys: platformCertificateCache.items };
  }

  if (!platformCertificateLoading) {
    platformCertificateLoading = loadPlatformCertificates()
      .finally(() => {
        platformCertificateLoading = null;
      });
  }

  try {
    const items = await platformCertificateLoading;
    return { mode: 'platform_certificate', keys: items };
  } catch (error) {
    if (staticKeys.length) {
      return { mode: 'platform_certificate', keys: staticKeys };
    }
    throw error;
  }
}

async function refreshPlatformCertificates() {
  platformCertificateCache = null;
  return getPlatformVerificationKeys({ forceRefresh: true });
}

function getHeaderValue(headers, name) {
  return headers?.[String(name).toLowerCase()] ?? headers?.[name];
}

async function verifyWechatPaySignature({ timestamp, nonce, signature, serial, body }) {
  const requestTimestamp = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (
    !signature ||
    !nonce ||
    !Number.isFinite(requestTimestamp) ||
    Math.abs(now - requestTimestamp) > NOTIFY_TIMESTAMP_MAX_SKEW_SECONDS
  ) {
    return false;
  }

  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verifyOne = (pem) => {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(pem, signature, 'base64');
  };

  let { keys } = await getPlatformVerificationKeys();
  const normalizedSerial = normalizeSerial(serial);
  let candidates = normalizedSerial
    ? keys.filter((item) => normalizeSerial(item.serialNo) === normalizedSerial)
    : keys;

  if (!candidates.length) {
    const refreshed = await getPlatformVerificationKeys({ forceRefresh: true });
    keys = refreshed.keys;
    candidates = normalizedSerial
      ? keys.filter((item) => normalizeSerial(item.serialNo) === normalizedSerial)
      : keys;
  }

  return candidates.some((item) => verifyOne(item.publicKeyPem));
}

function normalizeRawBody(rawBody) {
  if (Buffer.isBuffer(rawBody)) return rawBody.toString('utf8');
  if (typeof rawBody === 'string') return rawBody;
  if (rawBody && typeof rawBody === 'object') return JSON.stringify(rawBody);
  return '';
}

async function parseNotify(headers, rawBody) {
  const body = normalizeRawBody(rawBody);
  const signature = getHeaderValue(headers, 'wechatpay-signature');
  const timestamp = getHeaderValue(headers, 'wechatpay-timestamp');
  const nonce = getHeaderValue(headers, 'wechatpay-nonce');
  const serial = getHeaderValue(headers, 'wechatpay-serial');

  if (!signature || !timestamp || !nonce || !serial) {
    throw new Error('缺少微信支付回调签名头');
  }
  if (!body) {
    throw new Error('微信支付回调报文为空');
  }

  const verified = await verifyWechatPaySignature({
    timestamp,
    nonce,
    signature,
    serial,
    body
  });
  if (!verified) {
    throw new Error('微信支付回调验签失败');
  }

  const parsed = JSON.parse(body);
  if (!parsed?.resource?.ciphertext) {
    throw new Error('微信支付回调缺少加密资源');
  }

  const config = getWechatPayConfig();
  const decryptedText = decryptAes256Gcm(parsed.resource, config.apiV3Key);
  let decrypted;
  try {
    decrypted = JSON.parse(decryptedText);
  } catch (_) {
    throw new Error('微信支付回调解密后不是有效 JSON');
  }

  return {
    envelope: parsed,
    resource: decrypted
  };
}

module.exports = {
  getWechatPayConfig,
  isWechatPayConfigured,
  createJsapiTransaction,
  queryTransactionByOutTradeNo,
  createRefund,
  parseNotify,
  refreshPlatformCertificates
};
