/**
 * 小程序后端回收公开接口独立测试脚本（不启动完整 server.js）
 * 用法: node test_recycle_public.js
 */
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root123';
process.env.DB_NAME = process.env.DB_NAME || 'repair';

const express = require('express');
const recycleRoutes = require('./routes/recycleRoutes');

const app = express();
app.use(express.json());
app.use('/api/recycle', recycleRoutes);

const PORT = 3007;
app.listen(PORT, () => {
  console.log(`[test] 回收公开接口测试服务: http://localhost:${PORT}/api/recycle`);
});
