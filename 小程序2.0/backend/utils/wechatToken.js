// 获取并缓存微信 access_token
// 用于需要 access_token 的服务端接口（如手机号快速验证 getuserphonenumber）。
// 微信 access_token 全局唯一，所有服务端调用共用，切勿频繁刷新。

const axios = require('axios');

let cachedToken = null;
let cachedExpireAt = 0; // 绝对过期时间戳(ms)

/**
 * 获取微信 access_token，带内存缓存与提前过期机制。
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const now = Date.now();
  // 提前 5 分钟过期，避免临界时刻用到已失效 token
  if (cachedToken && cachedExpireAt > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    throw new Error('WECHAT_APP_ID / WECHAT_APP_SECRET 未在环境变量中配置');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
  const resp = await axios.get(url);
  const data = resp.data || {};
  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg || data.errcode}`);
  }

  cachedToken = data.access_token;
  cachedExpireAt = now + (Number(data.expires_in) || 7200) * 1000;
  return cachedToken;
}

module.exports = { getAccessToken };
