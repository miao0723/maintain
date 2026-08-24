/**
 * 统一文件存储模块
 * ------------------------------------------------------------
 * 进度反馈的图片/视频在 multer 落盘到本地临时目录、并经 compressImage
 * 压缩后，由本模块决定「最终存储位置」：
 *
 *   - local （默认）：保留原行为——文件留在后端服务器本地磁盘，
 *     返回相对路径 /uploads/progress/{orderId}/{filename}，由 express.static 提供公网读取。
 *
 *   - remote：把文件 POST 到「自有服务器」的上传接口，拿到公网可读的
 *     URL 写进数据库，并删除本地临时文件。这样所有用户（公网）都能读取，
 *     不再依赖后端这台机器是否被公网访问。
 *
 * 切换方式：在 backend/.env 设置 FILE_STORAGE_MODE=remote 并填好 REMOTE_* 即可，
 * 无需改动任何业务/前端代码（前端 normalizeMediaUrl 已能识别完整 URL）。
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

let FormData;
try {
  FormData = require('form-data');
} catch (e) {
  FormData = null;
}

const MODE = (process.env.FILE_STORAGE_MODE || 'local').toLowerCase();
const REMOTE_UPLOAD_URL = process.env.REMOTE_UPLOAD_URL || '';
const REMOTE_UPLOAD_TOKEN = process.env.REMOTE_UPLOAD_TOKEN || '';
const REMOTE_UPLOAD_FIELD = process.env.REMOTE_UPLOAD_FIELD || 'file';
const REMOTE_PUBLIC_BASE = (process.env.REMOTE_PUBLIC_BASE || '').replace(/\/$/, '');

function isRemoteStorage() {
  return MODE === 'remote';
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    /* ignore */
  }
}

/**
 * 从上传服务器响应中尽量找出公网可访问的 URL。
 * 兼容常见返回结构：
 *   { url } / { fileUrl } / { link } / { path }
 *   { data: { url } } / { data: { fileUrl } }
 *   { code:0, data:{ src:'https://...' } }
 * 若服务器只返回相对路径（如 /files/xxx.jpg），则用 REMOTE_PUBLIC_BASE 拼接。
 */
function extractPublicUrl(resp) {
  const body = resp && resp.data !== undefined ? resp.data : resp;

  const candidates = [];
  const walk = (obj, depth) => {
    if (!obj || depth > 5) return;
    if (typeof obj === 'string') {
      if (/^https?:\/\//.test(obj)) candidates.push(obj);
      else if (/^\/\//.test(obj)) candidates.push('https:' + obj); // 协议相对
      else if (/^\/[^\/]/.test(obj) && REMOTE_PUBLIC_BASE) candidates.push(REMOTE_PUBLIC_BASE + obj);
    } else if (typeof obj === 'object') {
      ['url', 'fileUrl', 'file_url', 'link', 'src', 'path', 'filePath', 'file_path', 'imageUrl', 'image_url']
        .forEach((k) => {
          if (obj[k] !== undefined) candidates.push(obj[k]);
        });
      Object.keys(obj).forEach((k) => walk(obj[k], depth + 1));
    }
  };
  walk(body, 0);

  const full = candidates.find((c) => typeof c === 'string' && /^https?:\/\//.test(c));
  if (full) return full;

  const rel = candidates.find((c) => typeof c === 'string' && REMOTE_PUBLIC_BASE && c.startsWith('/'));
  if (rel) return REMOTE_PUBLIC_BASE + rel;

  return null;
}

/**
 * 把本地临时文件上传到自有服务器，返回公网可读 URL。
 * @param {string} localAbsPath 本地临时文件绝对路径
 * @param {object} opts { orderId, kind, originalname, mimetype }
 * @returns {Promise<string>} 公网 URL
 */
async function uploadToRemote(localAbsPath, { orderId, kind, originalname, mimetype } = {}) {
  if (!REMOTE_UPLOAD_URL) {
    throw new Error('FILE_STORAGE_MODE=remote 但未配置 REMOTE_UPLOAD_URL');
  }
  if (!FormData) {
    throw new Error('缺少 form-data 依赖，无法上传到远程服务器');
  }
  if (!fs.existsSync(localAbsPath)) {
    throw new Error('待上传文件不存在: ' + localAbsPath);
  }

  const buf = fs.readFileSync(localAbsPath);
  const form = new FormData();
  form.append(REMOTE_UPLOAD_FIELD, buf, {
    filename: originalname || path.basename(localAbsPath),
    contentType: mimetype || 'application/octet-stream'
  });
  if (orderId) form.append('orderId', String(orderId));
  if (kind) form.append('type', kind);

  const headers = { ...form.getHeaders() };
  if (REMOTE_UPLOAD_TOKEN) headers['Authorization'] = `Bearer ${REMOTE_UPLOAD_TOKEN}`;

  const resp = await axios.post(REMOTE_UPLOAD_URL, form, {
    headers,
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (resp.status < 200 || resp.status >= 300) {
    throw new Error('远程服务器返回 HTTP ' + resp.status);
  }

  const url = extractPublicUrl(resp);
  if (!url) {
    throw new Error('远程服务器未返回可识别的文件URL，响应: ' + JSON.stringify(resp.data).slice(0, 300));
  }
  return url;
}

module.exports = {
  isRemoteStorage,
  uploadToRemote,
  safeUnlink,
  extractPublicUrl
};
