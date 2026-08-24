const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const WECHAT_PAY_BASE_URL = 'https://api.mch.weixin.qq.com';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return String(value).trim();
}

function resolveFileContent(rawValue, rootDir) {
  if (!rawValue) return '';
  const trimmed = String(rawValue).trim();
  if (trimmed.includes('BEGIN ')) {
    return trimmed.replace(/\\n/g, '\n');
  }

  const absolutePath = path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(rootDir, trimmed);

  return fs.readFileSync(absolutePath, 'utf8');
}

function getWechatPayConfig() {
  // 证书相对路径以 backend/ 为基准（与 .env 同级），避免解析到项目根目录
  const rootDir = path.resolve(__dirname, '..');
  const privateKeyPem = resolveFileContent(process.env.WECHAT_PAY_PRIVATE_KEY || process.env.WECHAT_PAY_PRIVATE_KEY_PATH, rootDir);
  const platformCertPem = resolveFileContent(process.env.WECHAT_PAY_PLATFORM_CERT || process.env.WECHAT_PAY_PLATFORM_CERT_PATH, rootDir);

  return {
    appid: getRequiredEnv('WECHAT_APP_ID'),
    mchid: getRequiredEnv('WECHAT_MCH_ID'),
    notifyUrl: getRequiredEnv('WECHAT_PAY_NOTIFY_URL'),
    refundNotifyUrl: process.env.WECHAT_PAY_REFUND_NOTIFY_URL || getRequiredEnv('WECHAT_PAY_NOTIFY_URL'),
    apiV3Key: getRequiredEnv('WECHAT_PAY_API_V3_KEY'),
    serialNo: getRequiredEnv('WECHAT_PAY_SERIAL_NO'),
    privateKeyPem,
    platformCertPem
  };
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

function buildAuthorization(method, urlPath, bodyText) {
  const config = getWechatPayConfig();
  const nonceStr = createNonceStr();
  const timestamp = createTimestamp();
  const message = buildMessage(method, urlPath, timestamp, nonceStr, bodyText);
  const signature = signMessage(message, config.privateKeyPem);
  const token = `mchid="${config.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;

  return {
    authorization: `WECHATPAY2-SHA256-RSA2048 ${token}`,
    nonceStr,
    timestamp
  };
}

async function wechatRequest(method, urlPath, payload) {
  const config = getWechatPayConfig();
  const bodyText = payload ? JSON.stringify(payload) : '';
  const auth = buildAuthorization(method, urlPath, bodyText);

  const response = await axios({
    method,
    url: `${WECHAT_PAY_BASE_URL}${urlPath}`,
    data: payload || undefined,
    timeout: 15000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth.authorization,
      'User-Agent': 'electronic-repair-miniapp/1.0'
    }
  });

  return response.data;
}

function createMiniProgramPaySign(prepayId) {
  const config = getWechatPayConfig();
  const timeStamp = createTimestamp();
  const nonceStr = createNonceStr();
  const pkg = `prepay_id=${prepayId}`;
  const signType = 'RSA';
  const message = `${config.appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  const paySign = signMessage(message, config.privateKeyPem);

  return {
    appId: config.appid,
    timeStamp,
    nonceStr,
    package: pkg,
    signType,
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
  return {
    prepayId: data.prepay_id,
    payParams: createMiniProgramPaySign(data.prepay_id),
    raw: data
  };
}

async function queryTransactionByOutTradeNo(outTradeNo) {
  const config = getWechatPayConfig();
  const encoded = encodeURIComponent(outTradeNo);
  return wechatRequest('GET', `/v3/pay/transactions/out-trade-no/${encoded}?mchid=${config.mchid}`);
}

async function createRefund({ outTradeNo, refundNo, reason, refundAmount, totalAmount }) {
  const config = getWechatPayConfig();
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

function decryptNotifyResource(resource, apiV3Key) {
  const key = Buffer.from(apiV3Key, 'utf8');
  const nonce = Buffer.from(resource.nonce, 'utf8');
  const associatedData = Buffer.from(resource.associated_data || '', 'utf8');
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);

  decipher.setAuthTag(authTag);
  if (associatedData.length > 0) {
    decipher.setAAD(associatedData);
  }

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

function verifyWechatPaySignature({ timestamp, nonce, signature, body }) {
  const config = getWechatPayConfig();
  if (!config.platformCertPem) {
    throw new Error('缺少微信支付平台证书配置');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${timestamp}\n${nonce}\n${body}\n`);
  verifier.end();

  return verifier.verify(config.platformCertPem, signature, 'base64');
}

function parseNotify(headers, rawBody) {
  const config = getWechatPayConfig();
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];

  if (!signature || !timestamp || !nonce) {
    throw new Error('缺少微信支付回调签名头');
  }

  const verified = verifyWechatPaySignature({
    timestamp,
    nonce,
    signature,
    body: rawBody
  });

  if (!verified) {
    throw new Error('微信支付回调验签失败');
  }

  const parsed = JSON.parse(rawBody);
  const decrypted = decryptNotifyResource(parsed.resource, config.apiV3Key);

  return {
    envelope: parsed,
    resource: decrypted
  };
}

module.exports = {
  getWechatPayConfig,
  createJsapiTransaction,
  queryTransactionByOutTradeNo,
  createRefund,
  parseNotify
};
