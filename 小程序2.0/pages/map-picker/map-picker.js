// pages/map-picker/map-picker.js
const { locationApi } = require('../../utils/api.js')

Page({
  data: {
    // 地图配置
    longitude: 0,
    latitude: 0,
    scale: 16,
    markers: [],
    polyline: [],

    // 选中位置信息
    selectedAddress: {
      province: '',
      city: '',
      district: '',
      township: '',
      street: '',
      streetNumber: '',
      formattedAddress: ''
    },

    // 初始位置（从上个页面传入或定位获得）
    initialLongitude: 0,
    initialLatitude: 0,

    // 当前定位所在城市（用于搜索范围）
    currentCity: '',

    // 状态
    isLoading: true,
    hasError: false,
    errorMessage: '',

    // 搜索相关
    searchKeyword: '',
    searchResults: [],
    isSearching: false,

    // 程序控制移动标志（防止 bindregionchange 重复触发）
    _programmaticMove: 0
  },

  onLoad(options) {
    // 从上个页面获取初始位置
    if (options.longitude && options.latitude) {
      const longitude = parseFloat(options.longitude)
      const latitude = parseFloat(options.latitude)

      this._programmaticMove = 2
      this._lastReqLng = longitude
      this._lastReqLat = latitude
      this.setData({
        initialLongitude: longitude,
        initialLatitude: latitude,
        longitude,
        latitude,
        markers: [{
          id: 1,
          longitude,
          latitude,
          width: 30,
          height: 30,
          anchor: { x: 0.5, y: 1 }
        }],
        isLoading: false
      })

      // 异步获取初始位置的详细地址，不阻塞地图显示
      this.loadAddressInfo(longitude, latitude)
    } else {
      // 没有传入位置，按优先级定位：GPS > IP定位 > 默认
      this.smartLocate()
    }
  },

  /**
   * 智能定位：依次尝试 GPS -> IP定位 -> 高德IP定位 -> 默认
   */
  async smartLocate() {
    this.setData({ isLoading: true, hasError: false })

    // 第一步：尝试GPS定位（最精确）
    try {
      const gpsLocation = await this.getGpsLocationSilent()
      if (gpsLocation) {
        if (this._destroyed) return
        const { longitude, latitude } = gpsLocation
        this._programmaticMove = 2
        this._lastReqLng = longitude
        this._lastReqLat = latitude
        this.setData({
          longitude,
          latitude,
          initialLongitude: longitude,
          initialLatitude: latitude,
          markers: [{
            id: 1,
            longitude,
            latitude,
            width: 30,
            height: 30,
            anchor: { x: 0.5, y: 1 }
          }],
          isLoading: false
        })

        wx.showToast({ title: '已定位到当前位置', icon: 'success', duration: 1500 })
        this.loadAddressInfo(longitude, latitude)
        return
      }
    } catch (e) {
      console.log('GPS定位未成功，尝试IP定位')
    }

    // 第二步：尝试IP定位（精确到城市级别）
    try {
      const ipLocation = await this.getIpLocationSilent()
      if (ipLocation) {
        if (this._destroyed) return
        const { longitude, latitude, city } = ipLocation
        this._programmaticMove = 2
        this._lastReqLng = longitude
        this._lastReqLat = latitude
        this.setData({
          longitude,
          latitude,
          initialLongitude: longitude,
          initialLatitude: latitude,
          currentCity: city || '',
          markers: [{
            id: 1,
            longitude,
            latitude,
            width: 30,
            height: 30,
            anchor: { x: 0.5, y: 1 }
          }],
          isLoading: false
        })

        wx.showToast({ title: `已定位到${city || '附近'}`, icon: 'success', duration: 1500 })
        this.loadAddressInfo(longitude, latitude)
        return
      }
    } catch (e) {
      console.log('IP定位也未成功')
    }

    // 第三步：兜底 - 使用默认位置
    this.useDefaultLocation('定位失败，请在地图上手动选择或搜索您的位置')
  },

  /**
   * 静默GPS定位（不弹窗提示，仅尝试获取位置）
   */
  getGpsLocationSilent() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          const scope = res.authSetting['scope.userLocation']

          if (scope === false) {
            // 用户之前拒绝过，直接跳过
            resolve(null)
            return
          }

          const getLocation = () => {
            wx.getLocation({
              type: 'gcj02',
              isHighAccuracy: true,
              highAccuracyExpireTime: 10000,
              success: (loc) => {
                console.log('GPS定位成功:', loc)
                resolve(loc)
              },
              fail: (err) => {
                console.log('GPS定位失败:', err.errMsg)
                resolve(null)
              }
            })
          }

          if (scope === true) {
            getLocation()
            return
          }

          wx.authorize({
            scope: 'scope.userLocation',
            success: getLocation,
            fail: () => resolve(null)
          })
        },
        fail: () => resolve(null)
      })
    })
  },

  /**
   * 静默IP定位（不弹窗，仅尝试获取位置）
   */
  async getIpLocationSilent() {
    try {
      const result = await locationApi.getIpLocation()
      console.log('IP定位结果:', result)

      if (result && result.success && result.data) {
        const { longitude, latitude, province, city } = result.data

        // 如果IP定位返回了经纬度，直接使用
        if (longitude && latitude) {
          return { longitude, latitude, city, province }
        }

        // 如果只有城市名没有经纬度，用地理编码补全
        if (city) {
          try {
            const geoResult = await locationApi.geocode(city)
            if (geoResult && geoResult.success && geoResult.data) {
              return {
                longitude: geoResult.data.longitude,
                latitude: geoResult.data.latitude,
                city,
                province
              }
            }
          } catch (e) {
            console.log('地理编码补全失败:', e)
          }
        }
      }
      return null
    } catch (e) {
      console.log('IP定位请求失败:', e)
      return null
    }
  },

  /**
   * 使用默认位置
   */
  useDefaultLocation(message) {
    const defaultLongitude = 113.9345
    const defaultLatitude = 22.5337

    this._programmaticMove = 2
    this._lastReqLng = defaultLongitude
    this._lastReqLat = defaultLatitude
    this.setData({
      longitude: defaultLongitude,
      latitude: defaultLatitude,
      initialLongitude: defaultLongitude,
      initialLatitude: defaultLatitude,
      hasError: true,
      errorMessage: message,
      isLoading: false
    })

    this.loadAddressInfo(defaultLongitude, defaultLatitude)
  },

  openLocationSettings() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.smartLocate()
        }
      }
    })
  },

  /**
   * 加载地址信息（逆地理编码）
   */
  async loadAddressInfo(longitude, latitude) {
    try {
      const result = await locationApi.regeocode(longitude, latitude)

      // 页面已销毁则不更新
      if (this._destroyed) return

      if (result && result.success && result.data) {
        const { city } = result.data
        if (city && !this.data.currentCity) {
          this.setData({
            selectedAddress: result.data,
            currentCity: city
          })
        } else {
          this.setData({
            selectedAddress: result.data
          })
        }
      }
    } catch (error) {
      console.log('获取地址信息失败:', error)
    }
  },

  /**
   * 地图区域变化（拖动/缩放时触发）
   * 注意：不要在此处 setData 更新 longitude/latitude，否则会触发地图重新渲染，
   * 又触发 bindregionchange，形成死循环不断调用 API
   */
  onMapRegionChange(e) {
    // 只在拖动/缩放结束时处理（type='end'）
    if (e.type !== 'end') return

    // 程序控制移动时跳过（smartLocate/relocateToCurrent 设置坐标后也会触发此事件）
    if (this._programmaticMove > 0) {
      this._programmaticMove--
      return
    }

    // 获取地图中心坐标
    const mapCtx = wx.createMapContext('map', this)
    mapCtx.getCenterLocation({
      success: (res) => {
        const newLng = res.longitude
        const newLat = res.latitude

        // 最小距离阈值：移动超过 50米才重新请求（避免微小移动频繁请求）
        const lastLng = this._lastReqLng
        const lastLat = this._lastReqLat
        if (lastLng !== undefined && lastLat !== undefined) {
          const dist = this.getDistance(lastLat, lastLng, newLat, newLng)
          if (dist < 0.05) return // 小于50米不请求
        }

        // 防抖：800ms
        if (this.changeTimer) {
          clearTimeout(this.changeTimer)
        }

        this.changeTimer = setTimeout(() => {
          // 页面已销毁则不请求
          if (this._destroyed) return
          // 记录本次请求的坐标
          this._lastReqLng = newLng
          this._lastReqLat = newLat
          this.loadAddressInfo(newLng, newLat)
        }, 800)
      }
    })
  },

  /**
   * 计算两点间距离（km），用于判断是否需要重新请求地址
   */
  getDistance(lat1, lng1, lat2, lng2) {
    const rad = Math.PI / 180
    const dLat = (lat2 - lat1) * rad
    const dLng = (lng2 - lng1) * rad
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLng / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(a))
  },

  /**
   * 用户点击地图
   */
  onMapTap(e) {
    if (!e.detail || !e.detail.longitude) return

    const { longitude, latitude } = e.detail

    // 记录请求坐标，防止 regionchange 重复请求
    this._lastReqLng = longitude
    this._lastReqLat = latitude

    // 不更新地图中心坐标，避免触发 regionchange 死循环
    this.setData({
      markers: [{
        id: 1,
        longitude,
        latitude,
        width: 30,
        height: 30,
        anchor: { x: 0.5, y: 1 }
      }]
    })

    this.loadAddressInfo(longitude, latitude)
  },

  /**
   * 重新定位到当前位置
   */
  async relocateToCurrent() {
    wx.showLoading({ title: '定位中...' })

    try {
      // 优先GPS
      const gpsLocation = await this.getGpsLocationSilent()
      if (gpsLocation) {
        if (this._destroyed) return
        const { longitude, latitude } = gpsLocation
        this._programmaticMove = 2
        this._lastReqLng = longitude
        this._lastReqLat = latitude
        this.setData({
          longitude,
          latitude,
          initialLongitude: longitude,
          initialLatitude: latitude,
          markers: [{
            id: 1,
            longitude,
            latitude,
            width: 30,
            height: 30,
            anchor: { x: 0.5, y: 1 }
          }]
        })
        wx.hideLoading()
        wx.showToast({ title: '已定位到当前位置', icon: 'success', duration: 1500 })
        this.loadAddressInfo(longitude, latitude)
        return
      }

      // 其次IP定位
      const ipLocation = await this.getIpLocationSilent()
      if (ipLocation) {
        if (this._destroyed) return
        const { longitude, latitude, city } = ipLocation
        this._programmaticMove = 2
        this._lastReqLng = longitude
        this._lastReqLat = latitude
        this.setData({
          longitude,
          latitude,
          initialLongitude: longitude,
          initialLatitude: latitude,
          currentCity: city || '',
          markers: [{
            id: 1,
            longitude,
            latitude,
            width: 30,
            height: 30,
            anchor: { x: 0.5, y: 1 }
          }]
        })
        wx.hideLoading()
        wx.showToast({ title: `已定位到${city || '附近'}`, icon: 'success', duration: 1500 })
        this.loadAddressInfo(longitude, latitude)
        return
      }

      wx.hideLoading()
      wx.showToast({ title: '定位失败，请手动选择', icon: 'none', duration: 2000 })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '定位失败', icon: 'none' })
    }
  },

  /**
   * 确认选择
   */
  confirmSelection() {
    const { longitude, latitude, selectedAddress } = this.data

    if (!selectedAddress.formattedAddress) {
      wx.showModal({
        title: '提示',
        content: '未获取到详细地址信息，是否仍然选择此位置？',
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.doSelectLocation(longitude, latitude, selectedAddress)
          }
        }
      })
      return
    }

    this.doSelectLocation(longitude, latitude, selectedAddress)
  },

  /**
   * 执行位置选择
   */
  doSelectLocation(longitude, latitude, selectedAddress) {
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]

    if (prevPage && prevPage.onMapLocationSelect && typeof prevPage.onMapLocationSelect === 'function') {
      prevPage.onMapLocationSelect({
        longitude,
        latitude,
        ...selectedAddress
      })
    }

    wx.navigateBack()
  },

  /**
   * 取消选择
   */
  cancelSelection() {
    wx.navigateBack()
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  /**
   * 确认搜索
   */
  async onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim()

    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }

    this.setData({ isSearching: true })

    try {
      // 使用当前定位所在城市进行搜索，而非硬编码
      const searchCity = this.data.currentCity || ''

      let searchResult = null
      try {
        // 传入当前经纬度实现附近搜索优先
        const { longitude, latitude } = this.data
        searchResult = await locationApi.search(keyword, searchCity, 1, 10, longitude, latitude)
      } catch (searchError) {
        console.log('模糊搜索失败，尝试地理编码:', searchError)
      }

      if (searchResult && searchResult.success && searchResult.data && searchResult.data.results.length > 0) {
        const { results } = searchResult.data

        if (results.length === 1) {
          const result = results[0]
          this._programmaticMove = 2
          this.setData({
            longitude: result.longitude,
            latitude: result.latitude,
            markers: [{
              id: 1,
              longitude: result.longitude,
              latitude: result.latitude,
              width: 30,
              height: 30,
              anchor: { x: 0.5, y: 1 }
            }],
            scale: 17,
            selectedAddress: {
              formattedAddress: result.name + (result.address ? `（${result.address}）` : ''),
              province: result.province,
              city: result.city,
              district: result.district
            },
            searchResults: [],
            isSearching: false
          })
          wx.showToast({ title: '已定位到搜索结果', icon: 'success' })
        } else {
          this.setData({
            searchResults: results,
            isSearching: false
          })
          wx.showToast({ title: `找到${results.length}个结果`, icon: 'success' })
        }
        return
      }

      // 回退到地理编码
      const geoResult = await locationApi.geocode(keyword)

      if (geoResult && geoResult.success && geoResult.data) {
        const { longitude, latitude } = geoResult.data
        this._programmaticMove = 2
        this.setData({
          longitude,
          latitude,
          markers: [{
            id: 1,
            longitude,
            latitude,
            width: 30,
            height: 30,
            anchor: { x: 0.5, y: 1 }
          }],
          scale: 17,
          selectedAddress: geoResult.data,
          searchResults: [],
          isSearching: false
        })
        wx.showToast({ title: '已定位到搜索结果', icon: 'success' })
      } else {
        this.setData({ isSearching: false, searchResults: [] })
        wx.showToast({ title: '未找到该地址', icon: 'none' })
      }
    } catch (error) {
      console.error('搜索失败:', error)
      this.setData({ isSearching: false, searchResults: [] })
      wx.showToast({ title: '搜索失败，请重试', icon: 'none' })
    }
  },

  /**
   * 选择搜索结果
   */
  onSelectSearchResult(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.searchResults[index]

    this._programmaticMove = 2
    this.setData({
      longitude: result.longitude,
      latitude: result.latitude,
      markers: [{
        id: 1,
        longitude: result.longitude,
        latitude: result.latitude,
        width: 30,
        height: 30,
        anchor: { x: 0.5, y: 1 }
      }],
      scale: 17,
      selectedAddress: {
        formattedAddress: result.name + (result.address ? `（${result.address}）` : ''),
        province: result.province,
        city: result.city,
        district: result.district
      },
      searchResults: [],
      searchKeyword: ''
    })

    wx.showToast({ title: '已选择位置', icon: 'success' })
  },

  /**
   * 清除搜索结果
   */
  clearSearchResults() {
    this.setData({ searchResults: [], searchKeyword: '' })
  },

  /**
   * 页面卸载时清理定时器和标志
   */
  onUnload() {
    this._destroyed = true
    if (this.changeTimer) {
      clearTimeout(this.changeTimer)
      this.changeTimer = null
    }
  }
})
