# 自动发布服务（publisher-service）部署与对接说明

把「引流模块」下 抖音 / 小红书 / 快手 / B站 的自动发布，从**影刀 RPA 文件触发**
改为 **代码脚本自动化（Python + Playwright）**。运营在后台点「发布」即可一键上传视频，
并自动填好文案、话题等设置；各平台账号通过**扫码登录 + Cookie 持久化**管理。

---

## 1. 架构

```
管理后台（Vue）
   │  点击「发布」/「扫码登录」
   ▼
后端 PHP（Docker 容器）            publisher-service（Windows 宿主机）
  MarketingDouyinController  ──HTTP──▶  FastAPI :8899
  PublishDispatcher                  （读本地视频、开浏览器、填表、上传）
  PublisherService（HTTP 客户端）
        │ 通过 host.docker.internal:8899 访问宿主机服务
        ▼
   publisher-service 用每台机器上的 Edge/Chrome 实测浏览器
   登录态（Cookie）沉淀在 data/profiles/<平台> 目录，重启不丢
```

- 后端只负责「把任务交给发布服务 + 轮询进度 + 回写状态」，**不发任何浏览器**。
- 浏览器跑在 **Windows 宿主机**上（有头模式，风控友好、可人工介入）。
- 视频文件：后端把它下载到共享目录 `PUBLISHER_SHARED_VIDEO_DIR`，再映射成宿主机路径
  `PUBLISHER_SHARED_HOST_VIDEO_DIR` 交给发布服务（发布服务读不到容器内部路径）。

---

## 2. 宿主机前置条件

- Windows 10/11，已安装 **Edge**（推荐，默认通道）或 **Chrome**。
- Python **3.10+**（3.11/3.12 均可）。安装时勾选 “Add Python to PATH”。
- 能访问外网（首次要下载 Playwright 浏览器内核，约 150MB；默认走 msedge 时其实可跳过）。

---

## 3. 安装（只需一次）

在 `publisher-service` 目录双击 **`install.bat`**，它会自动：

1. 创建虚拟环境 `.venv`
2. 安装依赖（见 `requirements.txt`）
3. 下载 Playwright Chromium（作为兜底内核；默认用本机 Edge）
4. 从 `.env.example` 生成 `.env`

> 如果 `install.bat` 里升级 pip 报 `safe-delete` 之类的回收站错误，**可忽略**，
> 那只是清理临时文件的告警，依赖和浏览器内核已正常装好。

---

## 4. 配置密钥（必须做）

打开 `publisher-service/.env`，确保：

```
PUBLISHER_TOKEN=一段足够长的随机串
PUBLISHER_BROWSER_CHANNEL=msedge      # 本机装了 Edge 就填 msedge；只有 Chrome 填 chrome
PUBLISHER_HEADLESS=false              # false=有头（推荐）；true=无头
```

**关键**：`PUBLISHER_TOKEN` 必须与后端 `backend/.env` 里的 `PUBLISHER_TOKEN` **完全一致**，
否则后端请求会被发布服务拒绝（HTTP 401）。

### 后端 `backend/.env` 需要新增的变量

```
PUBLISHER_MODE=script                 # script=代码脚本自动化；rpa=回退到旧影刀链路
PUBLISHER_BASE_URL=http://host.docker.internal:8899
PUBLISHER_TOKEN=（与上面一致）
PUBLISHER_TIMEOUT=20
PUBLISHER_SHARED_VIDEO_DIR=/var/www/html/rpa_files/videos
PUBLISHER_SHARED_HOST_VIDEO_DIR=D:\maintain\docker\rpa_files\videos
# 发布完成后回调后端地址（可选；留空则完全依赖前端轮询，也能正常工作）
PUBLISHER_CALLBACK_BASE=
```

### 数据库迁移

后端新增了 `marketing_publish_task` 表（记录每次发布的实时进度/报错），执行：

```
mysql -u root -p cmms_db < backend/database/migrations/016_publish_task.sql
```

---

## 5. 启动

双击 **`start.bat`** 即可启动发布服务（监听 `0.0.0.0:8899`）。
启动后控制台会打印：`publisher-service v1.0.0 已就绪 … 浏览器模式：有头，通道：msedge`。

- 有头模式：发布 / 登录时**会自动弹出真实浏览器窗口**，不要手动关闭，发布完会自动收起。
- 停止：在 start.bat 窗口按 **Ctrl+C**。

> 想让它开机自启 / 后台常驻，可用 Windows 任务计划程序把 `start.bat` 设为登录时启动。

---

## 6. 账号登录（首次必做）

1. 启动 `start.bat`。
2. 进入管理后台：**引流模块 → 发布账号管理**。
   - 顶部显示「发布服务在线 / 离线」。离线请检查 start.bat 是否在跑、token 是否一致。
3. 对每个平台点 **「扫码登录」**，弹窗里会出现二维码（base64 内联，直接显示）。
   用对应 App 扫码，后台自动检测登录成功，Cookie 沉淀进 `data/profiles/`。
4. 登录成功后该平台状态变为「已登录」，之后点内容「发布」就会自动用该账号上传。
5. 可随时点 **「校验登录态」** 确认 Cookie 是否还有效，或点 **「退出」** 清空登录。

---

## 7. 一键发布

在 抖音 / 小红书 / 快手 / B站 任意内容列表里点 **「发布」**：

- 后端 `PublishDispatcher` 组装好 标题 / 文案 / 话题（自动把 `,`、`、`、`#` 统一成数组），
  连同本地视频路径提交给发布服务。
- 发布服务按平台串行排队（每个平台的浏览器配置是独占的），跨平台并行。
- 前端每 2~3 秒轮询进度，自动填表、上传、点发布；成功/失败都会回写内容表状态与任务表。
- 失败会自动重试 1 次，并保留**现场截图**便于排查风控/验证码/改版问题
  （截图经后端 `GET /marketing/publisher/screenshot?path=...` 透传）。

---

## 8. 回退到旧影刀链路

若暂时不想用脚本模式，把 `backend/.env` 改为：

```
PUBLISHER_MODE=rpa
```

后端会自动走原来的 `input.json / output.json` 文件触发逻辑（各 Controller 里保留为
`*ViaRpa` 方法），不影响现有影刀流程。

---

## 9. 目录结构

```
publisher-service/
├── main.py                 # FastAPI 入口（/health、/api/publish、/api/accounts、/api/screenshot）
├── app/
│   ├── config.py           # 配置（读 .env）
│   ├── browser.py          # 浏览器中枢：每平台独立 user_data_dir、Cookie 持久化、空闲回收
│   ├── worker.py           # 发布调度：每平台串行队列、重试、失败截图
│   ├── login.py            # 扫码登录会话管理（返回二维码 base64）
│   ├── store.py            # SQLite：发布任务 + 账号状态
│   ├── uploaders/          # 各平台上传器（填表/话题/标签逻辑各不相同）
│   │   ├── douyin.py
│   │   ├── xiaohongshu.py
│   │   ├── kuaishou.py
│   │   └── bilibili.py
│   └── schemas.py          # 请求/响应模型
├── requirements.txt
├── install.bat / start.bat
├── .env.example / .env
└── data/                   # 运行时生成：publisher.db、profiles/、screenshots/、logs/
```

---

## 10. 常见问题

| 现象 | 排查 |
|------|------|
| 后端提示「无法连接自动发布服务」 | start.bat 没在跑；或 `host.docker.internal` 在容器里不可达（确认 Docker 网络开启） |
| HTTP 401 鉴权失败 | 两端 `PUBLISHER_TOKEN` 不一致 |
| 账号管理显示「离线」 | 服务进程已退出；看 start.bat 控制台报错，通常是浏览器内核缺失 |
| 弹不出浏览器 / 启动报 channel 错误 | 检查 `PUBLISHER_BROWSER_CHANNEL` 与已装浏览器是否匹配；可改 `chromium` 走兜底内核 |
| 视频上传报「文件不存在」 | 确认 `PUBLISHER_SHARED_HOST_VIDEO_DIR` 指向的是**宿主机真实存在的绝对路径** |
| 某平台发布一直 pending | 看发布服务日志 `data/logs/` 与该任务的失败截图 |
