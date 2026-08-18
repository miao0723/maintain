import io, os

NEW_CSS = r'''/* ===== 资料补全弹层（统一美化 · 清晰简洁钢蓝风） ===== */
.fill-mask {
  position: fixed;
  inset: 0;
  background: rgba(23, 38, 54, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 0 44rpx;
}

.fill-card {
  position: relative;
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 36rpx;
  padding: 56rpx 44rpx 40rpx;
  box-sizing: border-box;
  box-shadow: 0 30rpx 80rpx rgba(20, 40, 60, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  animation: fillPop 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.fill-glow {
  position: absolute;
  top: -130rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 440rpx;
  height: 250rpx;
  background: radial-gradient(circle, rgba(106, 154, 187, 0.26) 0%, rgba(106, 154, 187, 0) 70%);
  pointer-events: none;
}

@keyframes fillPop {
  from { opacity: 0; transform: translateY(36rpx) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.fill-emoji {
  position: relative;
  z-index: 1;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #436f95 0%, #6a9abb 100%);
  color: #fff;
  font-size: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 30rpx rgba(67, 111, 149, 0.28);
}

.fill-title {
  position: relative;
  z-index: 1;
  margin-top: 22rpx;
  font-size: 36rpx;
  font-weight: 800;
  color: #1f2f3d;
  letter-spacing: 1rpx;
}

.fill-sub {
  position: relative;
  z-index: 1;
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 1.5;
  color: #8a99a8;
  text-align: center;
  max-width: 460rpx;
}

.fill-avatar {
  position: relative;
  z-index: 1;
  margin-top: 36rpx;
  width: 180rpx;
  height: 180rpx;
  padding: 0;
  border: none;
  background: transparent;
  line-height: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.fill-avatar::after { border: none; }

.fill-avatar-img {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 4rpx solid #ffffff;
  box-shadow: 0 10rpx 26rpx rgba(40, 62, 86, 0.18);
}

.fill-avatar-ph {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #eef3f8 0%, #e2ebf3 100%);
  border: 2rpx dashed #c2d0de;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fill-avatar-ico { font-size: 52rpx; color: #8aa0b6; }
.fill-avatar-tx { margin-top: 8rpx; font-size: 20rpx; color: #8aa0b6; }

.fill-avatar:active .fill-avatar-ph,
.fill-avatar:active .fill-avatar-img { transform: scale(0.96); }

.fill-nick {
  position: relative;
  z-index: 1;
  margin-top: 32rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.fill-nick-label {
  margin-bottom: 12rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #1f2f3d;
}

.fill-nick-input {
  width: 100%;
  height: 92rpx;
  background: #f5f8fb;
  border: 2rpx solid #e2eaf2;
  border-radius: 18rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1f2f3d;
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.fill-nick-input:focus {
  border-color: #4f6b84;
  background: #ffffff;
  box-shadow: 0 0 0 6rpx rgba(79, 107, 132, 0.08);
}

.fill-nick-ph { color: #9aa8b6; }

.fill-save {
  position: relative;
  z-index: 1;
  margin-top: 34rpx;
  width: 100%;
  height: 92rpx;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #436f95 0%, #6a9abb 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 14rpx 30rpx rgba(67, 111, 149, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fill-save::after { border: none; }

.fill-save:active { transform: scale(0.98); box-shadow: 0 8rpx 20rpx rgba(67, 111, 149, 0.32); }

.fill-skip {
  position: relative;
  z-index: 1;
  margin-top: 22rpx;
  font-size: 25rpx;
  color: #9aa8b6;
  padding: 8rpx 20rpx;
}

.fill-skip:active { color: #6a9abb; }

.fill-nick-hidden {
  position: absolute;
  width: 1rpx;
  height: 1rpx;
  overflow: hidden;
  opacity: 0;
  left: -9999rpx;
}

@media (prefers-color-scheme: dark) {
  .fill-card { background: #1f2730; box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, 0.4); }
  .fill-title { color: #eef3f8; }
  .fill-sub { color: #9aa8b6; }
  .fill-nick-label { color: #eef3f8; }
  .fill-nick-input { background: #2a333d; border-color: #3a4654; color: #eef3f8; }
  .fill-nick-ph { color: #7c8b9a; }
  .fill-skip { color: #7c8b9a; }
}
'''

markers = {
    'pages/login/login.wxss': '/* 资料补全弹层 */',
    'pages/home/home.wxss': '/* ===== 资料补全弹层（与登录页一致） ===== */',
}

for f, marker in markers.items():
    s = open(f, encoding='utf-8').read()
    idx = s.find(marker)
    if idx == -1:
        print('!! marker not found in', f)
        continue
    # keep everything before the marker (trim trailing whitespace/newlines)
    head = s[:idx].rstrip()
    if head and not head.endswith('\n'):
        head += '\n'
    open(f, 'w', encoding='utf-8').write(head + '\n' + NEW_CSS)
    print('updated', f, '(kept', len(head.splitlines()), 'lines above marker)')
