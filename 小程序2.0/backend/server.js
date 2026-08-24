require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const dotenv = require('dotenv');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const socketHub = require('./services/socketHub');

const app = express();
const db = require('./database');
const server = http.createServer(app);

// 统一静态文件服务：uploads 目录必须与上传写入目录保持一致
// 路由里写文件用的是 routes/ 下的 ../uploads（即 backend/uploads），
// 这里必须指向同一个目录，否则文件落盘在 backend/uploads 而静态从项目根/uploads 取，必然 404。
const uploadsRoot = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsRoot));
// 冗余兜底：同时通过 API 前缀暴露，避免 nginx 仅反代 /mp-api 时根路径 /uploads 取不到文件
app.use('/api/uploads', express.static(uploadsRoot));
// 历史遗留兜底：早期 progressRoutes 曾把进度媒体写到项目根 uploads/（routes/../../uploads），
// 导致部分订单（如 67/90/106）文件不在 backend/uploads 而 404。此处追加一层静态服务：
// express.static 在文件不存在时会 next() 到下一层，因此不影响正常目录，同时让旧文件立即可读。
// 新上传已修复为写 backend/uploads（见 progressRoutes.js sharedUploadsRoot）。
const legacyUploadsRoot = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(legacyUploadsRoot));
app.use('/api/uploads', express.static(legacyUploadsRoot));

// 中间件
app.use(cors());
app.use('/api/pay/notify', express.text({ type: '*/*' }));
app.use('/api/pay/refund/notify', express.text({ type: '*/*' }));
// strict:false 允许请求体为顶层原始值（如微信 DELETE 发送 body="null" 时不会被拒绝）
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 数据库健康检查
app.get('/db-health', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 as status');
    res.json({ status: 'OK', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    res.status(500).json({ status: 'ERROR', database: 'disconnected', error: error.message });
  }
});

// 路由
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const unitRoutes = require('./routes/unitRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatPersistenceRoutes = require('./routes/chatPersistenceRoutes');
const productRoutes = require('./routes/productRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const locationRoutes = require('./routes/locationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminServiceRoutes = require('./routes/adminServiceRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const repairRecordsRoutes = require('./routes/repairRecordsRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const progressRoutes = require('./routes/progressRoutes');
const progressApplyRoutes = require('./routes/progressApplyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const diagnoseRoutes = require('./routes/diagnoseRoutes');
const userDevicesRoutes = require('./routes/userDevicesRoutes');
const recycleRoutes = require('./routes/recycleRoutes');
const scanRoutes = require('./routes/scanRoutes');
const afterSalesRoutes = require('./routes/afterSalesRoutes');
const { expireOldReviewOrders } = require('./utils/reviewExpire');
const { ensureIncomeTable, backfillIncome } = require('./services/incomeService');

app.use('/api/user', userRoutes);
app.use('/api/user-devices', userDevicesRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-persistence', chatPersistenceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/service', adminServiceRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/repair-records', repairRecordsRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/progress-apply', progressApplyRoutes);
app.use('/api/pay', paymentRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/recycle', recycleRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/after-sales', afterSalesRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  // 透传错误的真实状态码（如 body-parser 的 400），不要再硬编码 500
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.type || 'Request Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;
const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';
const wss = new WebSocket.Server({ server, path: '/ws/chat' });
socketHub.attach(wss);

function readEnvSnapshot() {
  const rootEnvPath = path.join(__dirname, '../.env');
  const backendEnvPath = path.join(__dirname, '.env');
  const parse = (filePath) => {
    try {
      if (!fs.existsSync(filePath)) return {};
      return dotenv.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return {};
    }
  };

  return {
    ...process.env,
    ...parse(rootEnvPath),
    ...parse(backendEnvPath)
  };
}

server.listen(PORT, SERVER_HOST, () => {
  const envSnapshot = readEnvSnapshot();
  console.log(`Server is running on http://${SERVER_HOST}:${PORT}`);
  console.log('[VoiceConfig]', {
    provider: envSnapshot.VOICE_PROVIDER || 'qwen',
    hasDashscopeKey: !!(envSnapshot.DASHSCOPE_API_KEY || envSnapshot.VOICE_API_KEY),
    workspaceId: envSnapshot.DASHSCOPE_WORKSPACE_ID || '',
    voiceApiBaseUrl: envSnapshot.VOICE_API_BASE_URL || '',
    voiceModel: envSnapshot.VOICE_MODEL || 'qwen3-asr-flash'
  });

  // 待评价订单自动过期：启动即执行一次，之后每 30 分钟执行一次
  expireOldReviewOrders();
  setInterval(expireOldReviewOrders, 30 * 60 * 1000);

  // 交易收入表：建表 + 历史已完成订单回填
  ensureIncomeTable()
    .then(() => backfillIncome())
    .then((count) => console.log(`[收入表] 初始化完成，本次回填 ${count || 0} 条历史收入`))
    .catch((e) => console.error('[收入表] 初始化失败:', e));
});
