微信支付证书目录 (backend/cert/)
=====================================

本目录用于存放微信支付所需的 PEM 证书文件。
服务启动时会按 backend/.env 中的路径读取：

  WECHAT_PAY_PRIVATE_KEY_PATH=./cert/apiclient_key.pem       # 商户 API 私钥
  WECHAT_PAY_PLATFORM_CERT_PATH=./cert/wechatpay_platform.pem # 微信支付平台证书

获取方式：
  1. 登录微信支付商户平台 (pay.weixin.qq.com)
       -> 「账户中心」->「API安全」->「API证书」
  2. 点击「申请证书」，下载证书工具，按引导生成证书
  3. 解压后你会得到：
       - apiclient_key.pem   （商户私钥，本目录需要这份）
       - apiclient_cert.pem  （商户证书，JSAPI 支付不需要，可忽略）
  4. 平台证书 (wechatpay_platform.pem) 需用微信官方「证书下载工具」
     (WeChatPay-Guest-Certificate-Download) 获取，不要手动拼。

⚠️ 安全提醒：
  - 这两个文件属于核心敏感凭据，不要提交到 git / 公开仓库。
  - 已加入 .gitignore 的 cert/ 目录不会被版本控制追踪。
  - 私钥一旦泄露，应立即在商户平台「API证书」中作废并重新申请。

也可以在 .env 中直接填证书文本（换行写成 \n），对应变量：
  WECHAT_PAY_PRIVATE_KEY=
  WECHAT_PAY_PLATFORM_CERT=
（二选一：文件路径 或 直接文本，代码会优先用 *_PATH）
