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
    isSaving: false // 防止重复提交
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
   * 选择头像（带前端预处理）
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

          // 前端图片压缩处理
          const compressedPath = await this.compressImage(tempFilePath)

          wx.hideLoading()

          this.setData({
            'userInfo.avatarUrl': compressedPath
          })

          wx.showToast({
            title: '头像已上传',
            icon: 'success',
            duration: 1500
          })
        } catch (error) {
          wx.hideLoading()
          console.error('图片压缩失败:', error)

          // 压缩失败，使用原始路径
          this.setData({
            'userInfo.avatarUrl': tempFilePath
          })

          wx.showToast({
            title: '使用原图',
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
   * 压缩图片（前端预处理）
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

          // 计算压缩后的尺寸
          const maxSize = 800 // 最大边长
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

          console.log('压缩后尺寸:', width, 'x', height)

          // 压缩图片
          wx.compressImage({
            src: filePath,
            quality: 80, // 压缩质量 0-100
            compressedWidth: width,
            compressedHeight: height,
            success: (compressRes) => {
              // 获取压缩后文件大小
              wx.getFileInfo({
                filePath: compressRes.tempFilePath,
                success: (fileInfo) => {
                  console.log('压缩后文件大小:', (fileInfo.size / 1024).toFixed(2), 'KB')
                }
              })
              resolve(compressRes.tempFilePath)
            },
            fail: (error) => {
              console.error('图片压缩失败:', error)
              reject(error)
            }
          })
        },
        fail: (error) => {
          console.error('获取图片信息失败:', error)
          reject(error)
        }
      })
    })
  },

  /**
   * 输入昵称
   */
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
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

      // 如果是本地临时文件，先上传头像
      if (finalAvatarUrl && (finalAvatarUrl.startsWith('http://tmp/') || finalAvatarUrl.startsWith('wxfile://') || finalAvatarUrl.startsWith('tmp/'))) {
        const uploadRes = await userApi.uploadAvatar(finalAvatarUrl);
        if (uploadRes && uploadRes.avatar_url) {
          finalAvatarUrl = uploadRes.avatar_url;
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
