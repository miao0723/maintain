// pages/profile-edit/profile-edit.js
const { DEFAULT_AVATAR_URL: defaultAvatarUrl, normalizeAvatarUrl } = require('../../utils/avatar.js')
const { userApi } = require('../../utils/api.js')

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: ''
    },
    realName: '',
    phoneNumber: '',
    email: '',
    defaultAddress: null,
    defaultUnit: null,
    isSaving: false, // 防止重复提交
    uploadedAvatarUrl: '', // 选图后已成功上传到服务端的头像地址（保存时直接引用，无需再阻塞上传）
    uploadingAvatar: false, // 头像后台上传中
    pendingUpload: false // 压缩失败/上传失败时置位，保存时再补传
  },

  onLoad() {
    this.loadProfile()
    this.loadDefaultAddress()
    this.loadDefaultUnit()
  },

  /**
   * 加载个人信息
   */
  loadProfile() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    const globalUserInfo = app.globalData.userInfo || {}
    const localUserInfo = wx.getStorageSync('userInfo') || {}
    const expectedUserId = globalUserInfo.id || localUserInfo.id

    wx.showLoading({ title: '加载中...' });

    userApi.getUserInfo()
      .then(profile => {
        if (expectedUserId && String(profile.id) !== String(expectedUserId)) {
          wx.showToast({
            title: '用户信息不匹配',
            icon: 'none'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
          return
        }

        wx.setStorageSync('userInfo', { ...localUserInfo, ...profile })
        app.globalData.userInfo = { ...globalUserInfo, ...profile }

        this.setData({
          userInfo: {
            avatarUrl: normalizeAvatarUrl(profile.avatar_url),
            nickName: profile.nickname || ''
          },
          realName: profile.real_name || '',
          phoneNumber: profile.phone || '',
          email: profile.email || ''
        });
      })
      .catch(err => {
        console.error('加载用户信息失败', err);
        // 如果API失败，回退到本地存储
        const userInfo = wx.getStorageSync('userInfo') || {};
        const profile = wx.getStorageSync('userProfile') || {};

        this.setData({
          userInfo: {
            avatarUrl: normalizeAvatarUrl(userInfo.avatar_url || userInfo.avatarUrl),
            nickName: userInfo.nickname || userInfo.nickName || ''
          },
          realName: profile.realName || '',
          phoneNumber: profile.phoneNumber || '',
          email: profile.email || ''
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onAvatarError() {
    if (this.data.userInfo.avatarUrl !== defaultAvatarUrl) {
      this.setData({
        'userInfo.avatarUrl': defaultAvatarUrl
      })
    }
  },

  // 微信一键获取头像（open-type="chooseAvatar"）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (avatarUrl) {
      this.setData({ 'userInfo.avatarUrl': avatarUrl, uploadedAvatarUrl: '', pendingUpload: false })
      // 该路径为本地临时文件，选完即后台上传，保存时直接引用
      this.uploadAvatarNow(avatarUrl)
    }
  },

  /**
   * 加载默认地址
   */
  loadDefaultAddress() {
    const { addressApi } = require('../../utils/api.js')
    addressApi.getAddressList()
      .then(addresses => {
        const formatted = (addresses || []).map(a => ({
          id: a.id,
          contactName: a.contact_name,
          contactPhone: a.contact_phone,
          province: a.province,
          city: a.city,
          district: a.district,
          detail: a.detail_address
        }))
        const defaultAddr = formatted.find(a => a.is_default) || formatted[0] || null
        this.setData({ defaultAddress: defaultAddr })
      })
      .catch(err => {
        console.error('加载默认地址失败:', err)
        const addresses = wx.getStorageSync('addresses') || []
        this.setData({
          defaultAddress: addresses.find(a => a.isDefault) || addresses[0] || null
        })
      })
  },

  /**
   * 加载默认单位
   */
  loadDefaultUnit() {
    const { unitApi } = require('../../utils/api.js')
    unitApi.getUnitList()
      .then(units => {
        const formatted = (units || []).map(u => ({
          id: u.id,
          name: u.name,
          address: u.address
        }))
        const defaultUnit = formatted.find(u => u.is_default) || formatted[0] || null
        this.setData({ defaultUnit })
      })
      .catch(err => {
        console.error('加载默认单位失败:', err)
        const units = wx.getStorageSync('units') || []
        this.setData({
          defaultUnit: units.find(u => u.isDefault) || units[0] || null
        })
      })
  },

  /**
   * 判断是否为本地临时文件（尚未上传到服务端，无法直接持久化）
   */
  isLocalTemp(path) {
    return !!(path && (path.startsWith('http://tmp/') || path.startsWith('wxfile://') || path.startsWith('tmp/')))
  },

  /**
   * 选择头像（选完即本地压缩 + 后台上传，保存时不再阻塞）
   */
  handleChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'], // 优先选择压缩后的版本
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const tempFileSize = res.tempFiles[0].size

        console.log('选择的头像文件大小:', (tempFileSize / 1024).toFixed(2), 'KB')

        try {
          wx.showLoading({ title: '处理图片中...', mask: true })

          // 前端图片压缩处理（弱机也能快速完成，目标体积很小）
          const compressedPath = await this.compressImage(tempFilePath)

          wx.hideLoading()

          // 先展示本地预览
          this.setData({
            'userInfo.avatarUrl': compressedPath,
            uploadedAvatarUrl: '',
            pendingUpload: false
          })

          // 立即后台上传，与用户填写资料并行，保存时即可秒完成
          this.uploadAvatarNow(compressedPath)
        } catch (error) {
          wx.hideLoading()
          console.error('图片压缩失败:', error)

          // 压缩失败，使用原始路径并标记待上传
          this.setData({
            'userInfo.avatarUrl': tempFilePath,
            uploadedAvatarUrl: '',
            pendingUpload: true
          })

          wx.showToast({
            title: '使用原图（将自动上传）',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        // 用户取消选择不算错误
        if (err.errMsg && err.errMsg.includes('cancel')) {
          return
        }
        console.error('选择头像失败:', err)
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 后台上传头像（非阻塞，带进度提示）
   * 成功后把服务端地址写入 uploadedAvatarUrl，保存时直接引用即可，不再等待上传。
   */
  uploadAvatarNow(localPath) {
    if (!localPath || !this.isLocalTemp(localPath)) return

    this.setData({ uploadingAvatar: true })
    wx.showToast({ title: '头像上传中...', icon: 'none', duration: 1500 })

    userApi.uploadAvatar(localPath, {
      timeout: 15000,
      onProgress: (p) => {
        // 预留进度处理：弱网时可在此刷新进度条
        if (p && typeof p.progress === 'number') {
          console.log('头像上传进度:', p.progress + '%')
        }
      }
    })
      .then(res => {
        this.setData({ uploadingAvatar: false })
        if (res && res.avatar_url) {
          const url = normalizeAvatarUrl(res.avatar_url)
          this.setData({
            uploadedAvatarUrl: url,
            'userInfo.avatarUrl': url,
            pendingUpload: false
          })
          wx.showToast({ title: '头像已上传', icon: 'success', duration: 1200 })
        } else {
          // 服务端未返回地址，保存时再补传
          this.setData({ pendingUpload: true })
        }
      })
      .catch(err => {
        this.setData({ uploadingAvatar: false, pendingUpload: true })
        console.error('头像后台上传失败，保存时再补传:', err)
        wx.showToast({ title: '头像稍后自动上传', icon: 'none' })
      })
  },

  /**
   * 压缩图片（前端预处理）
   * 头像最终在服务端会被压到 150px，这里只需压到足够小即可，避免弱网/弱机上传几十秒。
   * @param {string} filePath - 图片路径
   * @returns {Promise<string>} 压缩后的图片路径
   */
  compressImage(filePath) {
    return new Promise((resolve, reject) => {
      // 检查图片信息
      wx.getImageInfo({
        src: filePath,
        success: (imageInfo) => {
          console.log('原始图片信息:', imageInfo)

          // 头像显示尺寸很小，最大边长限制在 300 即可（服务端还会再压到 150）
          const maxSize = 300
          let width = imageInfo.width
          let height = imageInfo.height

          // 如果图片超过最大尺寸，进行等比缩放
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round(height * maxSize / width)
              width = maxSize
            } else {
              width = Math.round(width * maxSize / height)
              height = maxSize
            }
          }

          // 目标上传体积上限：超过则逐级降低质量，避免弱网传大图
          const MAX_UPLOAD_KB = 120
          const tryQualities = [60, 50, 40]

          const attempt = (qi) => {
            const quality = tryQualities[qi]
            console.log('压缩尝试 质量=', quality, '尺寸=', width, 'x', height)
            wx.compressImage({
              src: filePath,
              quality,
              compressedWidth: width,
              compressedHeight: height,
              success: (compressRes) => {
                wx.getFileInfo({
                  filePath: compressRes.tempFilePath,
                  success: (fileInfo) => {
                    const kb = fileInfo.size / 1024
                    console.log('压缩后文件大小:', kb.toFixed(2), 'KB')
                    // 体积达标或已降到最低质量，直接采用
                    if (kb <= MAX_UPLOAD_KB || qi >= tryQualities.length - 1) {
                      resolve(compressRes.tempFilePath)
                    } else {
                      attempt(qi + 1)
                    }
                  },
                  fail: () => resolve(compressRes.tempFilePath)
                })
              },
              fail: (error) => {
                console.error('图片压缩失败:', error)
                // 质量压缩失败时，退而求其次用上一次结果；首次失败则回退原图
                reject(error)
              }
            })
          }

          attempt(0)
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error)
          reject(error)
        }
      })
    })
  },

  /**
   * 输入昵称（手动）
   */
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  /**
   * 微信昵称一键填入（input type="nickname" 的 bindnickname 回调）
   */
  onFillNickName(e) {
    const nickName = (e.detail && e.detail.nickName) || ''
    if (nickName) {
      this.setData({ 'userInfo.nickName': nickName })
    }
  },

  /**
   * 输入真实姓名
   */
  onRealNameInput(e) {
    this.setData({
      realName: e.detail.value
    })
  },

  /**
   * 输入电话
   */
  onPhoneInput(e) {
    this.setData({
      phoneNumber: e.detail.value
    })
  },

  /**
   * 输入邮箱
   */
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    })
  },

  /**
   * 跳转到地址管理
   */
  goToAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    })
  },

  /**
   * 跳转到单位管理
   */
  goToUnits() {
    wx.navigateTo({
      url: '/pages/units/units'
    })
  },

  /**
   * 保存个人信息
   */
  async saveProfile() {
    if (this.data.isSaving) return; // 防止重复提交

    const app = getApp()

    const { userInfo, realName, phoneNumber, email } = this.data

    // 验证
    if (!userInfo.nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (phoneNumber && !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({
        title: '请输入正确的邮箱',
        icon: 'none'
      })
      return
    }

    this.setData({ isSaving: true });

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    try {
      let finalAvatarUrl = userInfo.avatarUrl;

      // 优先使用「选图时已后台上传」的服务端地址，保存时秒过、不再阻塞 20s
      if (this.data.uploadedAvatarUrl) {
        finalAvatarUrl = this.data.uploadedAvatarUrl;
      } else if (this.isLocalTemp(finalAvatarUrl)) {
        // 尚未后台上传成功（压缩失败/上传失败兜底），保存时补传
        try {
          const uploadRes = await userApi.uploadAvatar(finalAvatarUrl, { timeout: 15000 });
          if (uploadRes && uploadRes.avatar_url) {
            finalAvatarUrl = normalizeAvatarUrl(uploadRes.avatar_url);
            this.setData({ 'userInfo.avatarUrl': finalAvatarUrl });
          }
        } catch (upErr) {
          // 头像上传失败不阻断整条保存：文字资料照常保存，头像沿用已有/默认
          console.error('保存时上传头像失败，文字资料仍保存:', upErr);
          finalAvatarUrl = '';
        }
      }

      // 更新所有用户信息
      const response = await userApi.updateUserInfo({
        nickname: userInfo.nickName,
        avatar_url: finalAvatarUrl,
        real_name: realName,
        phone: phoneNumber,
        email: email
      });

      const currentUserInfo = wx.getStorageSync('userInfo') || {}
      // 保存成功后更新本地缓存
      wx.setStorageSync('userInfo', { ...currentUserInfo, ...response });
      wx.setStorageSync('userProfile', {
        realName: response.real_name || realName,
        phoneNumber: response.phone || phoneNumber,
        email: response.email || email
      });

      // 更新全局数据
      if (app.globalData) {
        const mergedUserInfo = { ...(app.globalData.userInfo || {}), ...(wx.getStorageSync('userInfo') || {}), ...response }
        app.globalData.userInfo = mergedUserInfo
        app.globalData.isLoggedIn = true
      }

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        this.setData({ isSaving: false });
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      console.error('保存用户信息失败', err);
      wx.hideLoading()
      this.setData({ isSaving: false });
      
      // 如果API失败，仍然保存到本地存储
      const currentUserInfo = wx.getStorageSync('userInfo') || (app.globalData && app.globalData.userInfo) || {}
      const mergedUserInfo = {
        ...currentUserInfo,
        avatar_url: userInfo.avatarUrl,
        nickname: userInfo.nickName
      }
      wx.setStorageSync('userInfo', mergedUserInfo);
      wx.setStorageSync('userProfile', {
        realName: realName,
        phoneNumber: phoneNumber,
        email: email
      });
      if (app.globalData) {
        app.globalData.userInfo = mergedUserInfo
        app.globalData.isLoggedIn = true
      }
      wx.showToast({
        title: '保存成功（本地）',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  }
})
