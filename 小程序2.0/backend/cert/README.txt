微信支付证书目录（backend/cert/）
=====================================

推荐在 backend/.env 中配置：

1. 商户 API 私钥（必需，用于请求签名和 wx.requestPayment 二次签名）
   WECHAT_PAY_PRIVATE_KEY_PATH=./cert/apiclient_key.pem
   或直接：
   WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

2. 回调验签密钥（二选一）

   A. 新商户「微信支付公钥」模式：
      WECHAT_PAY_PUBLIC_KEY_ID=PUB_KEY_ID_xxxxxxxx
      WECHAT_PAY_PUBLIC_KEY_PATH=./cert/wechatpay_public.pem

   B. 旧「平台证书」模式：
      可以不配置平台证书。后端会在收到回调时自动调用微信支付
      /v3/certificates 下载、解密并缓存平台证书，证书轮换时自动刷新。
      如需固定证书，也可配置：
      WECHAT_PAY_PLATFORM_CERT_PATH=./cert/wechatpay_platform.pem

文件获取：
  - 商户 API 私钥 / 证书序列号：
    微信支付商户平台 -> 账户中心 -> API安全 -> API证书
  - 微信支付公钥 / 公钥ID：
    微信支付商户平台 -> 账户中心 -> API安全 -> 微信支付公钥

安全提醒：
  - *.pem 和 .env 都是核心敏感凭据，绝不要提交到 git。
  - 泄露后应立即在商户平台作废并重新生成。
