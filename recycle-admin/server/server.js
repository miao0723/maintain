/**
 * 电子产品回收综合服务平台 - 独立后台服务
 *
 * 与维修后台管理系统完全独立部署（同域名、不同端口，默认 3005）。
 * 生产模式直接托管 web/dist 静态资源，单端口即可对外提供完整后台。
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const { router: platformRoutes } = require('./routes/platformRoutes');
const linkRoutes = require('./routes/linkRoutes');
const statsRoutes = require('./routes/statsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志（简要）
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleString('zh-CN')}] ${req.method} ${req.path}`);
  }
  next();
});

// 业务路由（统一前缀 /api）
app.use('/api/auth', authRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/catalog', authenticate, catalogRoutes);
app.use('/api/platforms', authenticate, platformRoutes);
app.use('/api/links', authenticate, linkRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/system', settingRoutes);
app.use('/api/logs', logRoutes);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'OK', service: 'recycle-admin', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'ERROR', message: e.message });
  }
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: status === 500 ? '服务器错误' : err.message });
});

// 生产模式：托管前端构建产物（web/dist），支持前端路由 history 模式
const distDir = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/health).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

const PORT = parseInt(process.env.PORT) || 3005;

db.init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('==============================================');
      console.log('  电子产品回收综合服务平台 - 后台服务已启动');
      console.log(`  API 地址:  http://localhost:${PORT}/api`);
      console.log(`  管理后台:  http://localhost:${PORT} (已托管 web/dist 时)`);
      console.log(`  开发前端:  http://localhost:5175 (web 目录 npm run dev)`);
      console.log('  默认账号:  admin / admin123（首次登录后请修改）');
      console.log('==============================================');
    });
  })
  .catch((err) => {
    console.error('服务启动失败（数据库不可用）:', err.message);
    process.exit(1);
  });
