// utils/api.js - API服务层封装（真实API模式）
const USE_LOCAL_STORAGE = false; // 设置为 true 使用本地存储模式
const { getApiBaseCandidates } = require('./runtimeConfig.js')

let activeBaseUrl = '';

function isDevtoolsEnvironment() {
  try {
    const info = wx.getSystemInfoSync()
    return info && info.platform === 'devtools'
  } catch (e) {
    return false
  }
}

function buildConnectionErrorMessage(candidates, errMsg = '') {
  const primary = candidates[0] || ''
  const isDevtools = isDevtoolsEnvironment()
  const looksLikeTimeout = errMsg.includes('timeout')

  if (looksLikeTimeout) {
    return isDevtools
      ? `请求超时，请检查后端和网络：${primary}`
      : `请求超时，请确认手机与电脑在同一 Wi-Fi，并可访问 ${primary}`
  }

  if (isDevtools) {
    return `服务器连接失败，请确认后端已启动：${primary}`
  }

  return `真机无法连接接口，请确认手机与电脑在同一 Wi-Fi：${primary}`
}

/**
 * HTTP请求封装
 * @param {string} url - 请求路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
function request(url, method = 'GET', data = null, options = {}) {
  // 获取token
  const token = wx.getStorageSync('token') || '';
  const retryOnHttpStatus = Array.isArray(options.retryOnHttpStatus)
    ? options.retryOnHttpStatus
    : [];
  const suppressErrorToast = !!options.suppressErrorToast
  const resolveOnHttpError = !!options.resolveOnHttpError
  // 超时时间（毫秒），默认 15s。不设置时 wx.request 可能长时间挂起导致页面卡死
  const timeout = options.timeout || 15000

  return new Promise((resolve, reject) => {
    const baseCandidates = getApiBaseCandidates()
    const candidates = [
      ...(activeBaseUrl ? [activeBaseUrl] : []),
      ...baseCandidates.filter(base => base !== activeBaseUrl)
    ]

    // 避免把 null/undefined 序列化成字符串 "null" 作为请求体（会导致后端 JSON 解析失败）
    const hasBody = data !== null && data !== undefined
    const payload = hasBody ? data : undefined

    if (candidates.length === 0) {
      if (!suppressErrorToast) {
        wx.showToast({
          title: '未配置接口地址',
          icon: 'none'
        });
      }
      reject(new Error('API base URL is not configured'));
      return;
    }

    const tryRequest = (index) => {
      const baseUrl = candidates[index];
      const fullUrl = baseUrl + url;
      console.log('CODEBUDDY_DEBUG request method=', method, 'fullUrl=', fullUrl, 'hasToken=', !!token);
      wx.request({
        url: fullUrl,
        method: method,
        data: payload,
        timeout: timeout,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.header
        },
        success: (res) => {
          const { statusCode, data: responseData } = res;
          console.log('CODEBUDDY_DEBUG response statusCode=', statusCode, 'url=', url);

          if (retryOnHttpStatus.includes(statusCode) && index < candidates.length - 1) {
            console.log('CODEBUDDY_DEBUG 命中HTTP状态重试，尝试下一个地址:', candidates[index + 1], 'statusCode=', statusCode);
            tryRequest(index + 1);
            return;
          }

          if (statusCode >= 200 && statusCode < 300) {
            activeBaseUrl = baseUrl;
            resolve(responseData);
          } else if (statusCode === 400) {
            // 业务错误，但响应体中有success字段来判断
            console.log('业务错误:', responseData);
            resolve(responseData);
          } else if (statusCode === 401) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 1500);
            reject(new Error('Unauthorized'));
          } else {
            const errorMsg = responseData?.message || `请求失败(${statusCode})`;
            if (resolveOnHttpError) {
              resolve({
                success: false,
                message: errorMsg,
                statusCode,
                data: responseData
              });
              return;
            }
            if (!suppressErrorToast) {
              wx.showToast({
                title: errorMsg,
                icon: 'none'
              });
            }
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.log('CODEBUDDY_DEBUG request fail err=', err, 'url=', fullUrl, 'tryIndex=', index);
          if (index < candidates.length - 1) {
            console.log('CODEBUDDY_DEBUG 尝试下一个地址:', candidates[index + 1]);
            tryRequest(index + 1);
            return;
          }
          // 所有地址都尝试失败
          const originalErrMsg = err.errMsg || '';
          const toastTitle = buildConnectionErrorMessage(candidates, originalErrMsg)

          if (!suppressErrorToast) {
            wx.showToast({
              title: toastTitle,
              icon: 'none',
              duration: 3000
            });
          }
          // 把原始微信错误传给上层，方便诊断
          reject(new Error(`[${originalErrMsg}] ${toastTitle} | candidates: ${candidates.join(', ')}`));
        }
      });
    };
    tryRequest(0);
  });
}

function uploadFileWithCandidates(pathname, filePath, formData = {}, options = {}) {
  const token = wx.getStorageSync('token') || '';
  const suppressErrorToast = !!options.suppressErrorToast
  const timeout = options.timeout || 20000

  return new Promise((resolve, reject) => {
    const baseCandidates = getApiBaseCandidates()
    const candidates = [
      ...(activeBaseUrl ? [activeBaseUrl] : []),
      ...baseCandidates.filter(base => base !== activeBaseUrl)
    ]

    if (candidates.length === 0) {
      if (!suppressErrorToast) {
        wx.showToast({
          title: '未配置接口地址',
          icon: 'none'
        })
      }
      reject(new Error('API base URL is not configured'))
      return
    }

    const tryUpload = (index) => {
      const baseUrl = candidates[index]
      const uploadUrl = `${baseUrl}${pathname}`

      wx.uploadFile({
        url: uploadUrl,
        filePath,
        name: options.fieldName || 'file',
        timeout: timeout,
        formData,
        header: {
          'Authorization': token ? `Bearer ${token}` : '',
          ...(options.header || {})
        },
        success: (res) => {
          let parsed
          try {
            parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          } catch (error) {
            parsed = null
          }

          if (res.statusCode >= 200 && res.statusCode < 300 && parsed) {
            activeBaseUrl = baseUrl
            resolve(parsed)
            return
          }

          if (index < candidates.length - 1) {
            tryUpload(index + 1)
            return
          }

          const errorMsg = parsed?.message || `上传失败(${res.statusCode})`
          if (!suppressErrorToast) {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            })
          }
          reject(new Error(errorMsg))
        },
        fail: (err) => {
          if (index < candidates.length - 1) {
            tryUpload(index + 1)
            return
          }

          const originalErrMsg = err.errMsg || ''
          const toastTitle = buildConnectionErrorMessage(candidates, originalErrMsg)
          if (!suppressErrorToast) {
            wx.showToast({
              title: toastTitle,
              icon: 'none',
              duration: 3000
            })
          }
          reject(new Error(`[${originalErrMsg}] ${toastTitle} | candidates: ${candidates.join(', ')}`))
        }
      })
    }

    tryUpload(0)
  })
}

// 用户相关API
const userApi = {
  // 微信登录
  wechatLogin(code, userInfo) {
    return request('/user/login', 'POST', { code, userInfo });
  },

  // 获取用户信息
  getUserInfo() {
    console.log('CODEBUDDY_DEBUG getUserInfo request=/user/info');
    return request('/user/info', 'GET');
  },

  // 更新用户信息
  updateUserInfo(data) {
    return request('/user/info', 'PUT', data);
  },

  // 上传头像（带进度提示）
  uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token') || '';
      const uploadBaseUrl = activeBaseUrl || getApiBaseCandidates()[0];

      if (!uploadBaseUrl) {
        reject(new Error('API base URL is not configured'));
        return;
      }

      wx.showLoading({ title: '上传中...', mask: true })

      const uploadTask = wx.uploadFile({
        url: uploadBaseUrl + '/user/avatar',
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve(data);
          } else {
            reject(new Error('上传失败'));
          }
        },
        fail: (err) => {
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      });

      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        console.log('上传进度:', res.progress + '%');
        if (res.progress < 100) {
          wx.showLoading({ title: `上传中 ${res.progress}%`, mask: true });
        }
      });
    });
  }
};

// 地址相关API
const addressApi = {
  // 获取地址列表
  getAddressList() {
    return request('/addresses', 'GET');
  },

  // 获取地址列表（别名，供代客订单地址复用）
  getList() {
    return request('/addresses', 'GET');
  },

  // 创建地址
  createAddress(data) {
    return request('/addresses', 'POST', data);
  },

  // 更新地址
  updateAddress(id, data) {
    return request(`/addresses/${id}`, 'PUT', data);
  },

  // 删除地址
  deleteAddress(id) {
    return request(`/addresses/${id}`, 'DELETE');
  },

  // 设置默认地址
  setDefaultAddress(id) {
    return request(`/addresses/${id}/default`, 'POST', {});
  }
};

// 位置相关API
const locationApi = {
  // 根据IP获取大致位置
  getIpLocation(ip) {
    const url = ip ? `/location/ip-location?ip=${ip}` : '/location/ip-location';
    return request(url, 'GET');
  },

  // 地理编码：将地址转换为经纬度
  geocode(address, city) {
    return request('/location/geocode', 'POST', { address, city });
  },

  // 关键字搜索（模糊搜索）
  search(keyword, city, page = 1, pageSize = 10, longitude, latitude) {
    const data = { keyword, city, page, pageSize };
    if (longitude && latitude) {
      data.longitude = longitude;
      data.latitude = latitude;
    }
    return request('/location/search', 'POST', data);
  },

  // 逆地理编码：将经纬度转换为地址
  regeocode(longitude, latitude) {
    return request('/location/regeocode', 'POST', { longitude, latitude });
  }
};

// 订单相关API
const orderApi = {
  // 获取订单列表（使用新的路由）
  getOrderList(params = {}) {
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo?.id;

    if (!userId) {
      return Promise.reject(new Error('请先登录'));
    }

    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = queryString ? `/orders/user/${userId}?${queryString}` : `/orders/user/${userId}`;
    return request(url, 'GET');
  },

  // 获取未读进度订单列表
  getProgressUnreadList() {
    return request('/orders/progress-unread-list', 'GET');
  },

  // 获取订单详情
  getOrderDetail(orderId) {
    return request(`/orders/${orderId}/detail`, 'GET');
  },

  // 创建维修订单
  createOrder(data) {
    return request('/orders/create', 'POST', data);
  },

  // 取消订单
  cancelOrder(orderId) {
    return request(`/orders/${orderId}/cancel`, 'POST');
  },

  // 编辑订单（用户端）
  editOrder(orderId, data) {
    return request(`/orders/${orderId}/edit`, 'PUT', data);
  },

  // 申请退款（用户端）
  refundOrder(orderId, data) {
    return request(`/orders/${orderId}/refund`, 'POST', data);
  },

  // 提交评价
  submitReview(data) {
    return request('/orders/submit-review', 'POST', data);
  },

  // 创建支付单
  createPayment(orderId) {
    return request('/pay/create', 'POST', { orderId });
  },

  // 查询支付状态
  queryPaymentStatus(orderId) {
    return request(`/pay/query/${orderId}`, 'GET');
  },

  // 申请真实退款
  applyPaymentRefund(orderId, data) {
    return request('/pay/refund/apply', 'POST', {
      orderId,
      ...data
    });
  }
};

// 单位相关API
const unitApi = {
  // 获取单位列表
  getUnitList() {
    return request('/units', 'GET');
  },

  // 创建单位
  createUnit(data) {
    return request('/units', 'POST', data);
  },

  // 更新单位
  updateUnit(id, data) {
    return request(`/units/${id}`, 'PUT', data);
  },

  // 删除单位
  deleteUnit(id) {
    return request(`/units/${id}`, 'DELETE');
  },

  // 设置默认单位
  setDefaultUnit(id) {
    return request(`/units/${id}/default`, 'POST');
  }
};

// 客服聊天相关API
const chatApi = {
  // 发送消息给AI客服
  sendMessage(data) {
    return request('/chat/message', 'POST', data);
  },

  // 上传音频并转写为文字
  transcribeAudio(filePath, formData = {}) {
    return uploadFileWithCandidates('/chat/transcribe', filePath, formData, {
      fieldName: 'file'
    })
  },

  // 转人工客服
  transferToHuman(data) {
    return request('/chat/transfer-to-human', 'POST', data);
  },

  // 查询人工客服状态
  getHumanStatus(conversationId) {
    return request(`/chat/human-status?conversationId=${conversationId}`, 'GET');
  },

  // 清空对话历史
  clearHistory(conversationId) {
    return request('/chat/clear-history', 'POST', { conversationId });
  },

  // 获取或创建会话
  getOrCreateConversation(userId) {
    return request(`/chat-persistence/conversation/${userId}`, 'GET');
  },

  // 获取会话列表
  getConversations(userId) {
    return request(`/chat-persistence/conversations/${userId}`, 'GET');
  },

  // 获取会话历史消息
  getConversationHistory(conversationId) {
    return request(`/chat-persistence/history/${conversationId}`, 'GET');
  },

  // 删除会话
  deleteConversation(conversationId) {
    return request(`/chat-persistence/conversation/${conversationId}`, 'DELETE', null, {
      retryOnHttpStatus: [502, 503, 504],
      suppressErrorToast: true
    });
  }
};

// 产品相关API
const productApi = {
  // 获取产品列表
  getProductList(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/products?${queryString}` : '/products';
    return request(url, 'GET');
  },

  // 获取产品详情
  getProductDetail(id) {
    return request(`/products/${id}`, 'GET');
  },

  // 搜索产品
  searchProducts(keyword) {
    return request(`/products/search/${encodeURIComponent(keyword)}`, 'GET');
  }
};

// 知识库相关API
const knowledgeApi = {
  // RAG 知识检索
  retrieve(data) {
    return request('/knowledge/retrieve', 'POST', data);
  },

  // 获取知识分类
  getCategories() {
    return request('/knowledge/categories', 'GET');
  },

  // 根据分类获取知识
  getByCategory(category) {
    return request(`/knowledge/category/${encodeURIComponent(category)}`, 'GET');
  }
};

// 管理员相关API
const adminApi = {
  // 获取仪表板统计数据
  getDashboardStats() {
    return request('/admin/dashboard', 'GET');
  },

  // 获取所有用户
  getAllUsers(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';
    return request(url, 'GET');
  },

  // 更新用户角色
  updateUserRole(userId, role) {
    return request(`/admin/users/${userId}/role`, 'PUT', { role });
  },

  // 禁用/启用用户
  toggleUserStatus(userId, status) {
    return request(`/admin/users/${userId}/status`, 'PUT', { status });
  },

  // 获取所有订单
  getAllOrders(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';
    return request(url, 'GET');
  },

  // 更新订单状态
  updateOrderStatus(orderId, status) {
    return request(`/admin/orders/${orderId}/status`, 'PUT', { status });
  },

  // 更新订单价格
  updateOrderPrice(orderId, price) {
    return request(`/admin/orders/${orderId}/price`, 'PUT', { price });
  },

  // 编辑订单信息
  editOrder(orderId, data) {
    return request(`/admin/orders/${orderId}/edit`, 'PUT', data);
  },

  // 申请退款
  refundOrder(orderId, data) {
    return request(`/admin/orders/${orderId}/refund`, 'PUT', data);
  },

  // 获取设备列表
  getAllDevices(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/devices?${queryString}` : '/admin/devices';
    return request(url, 'GET');
  },

  // 创建设备
  createDevice(data) {
    return request('/admin/devices', 'POST', data);
  },

  // 更新设备
  updateDevice(deviceId, data) {
    return request(`/admin/devices/${deviceId}`, 'PUT', data);
  },

  // 删除设备
  deleteDevice(deviceId) {
    return request(`/admin/devices/${deviceId}`, 'DELETE');
  },

  // 获取价格列表
  getAllPrices(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/prices?${queryString}` : '/admin/prices';
    return request(url, 'GET');
  },

  // 创建价格
  createPrice(data) {
    return request('/admin/prices', 'POST', data);
  },

  // 更新价格
  updatePrice(priceId, data) {
    return request(`/admin/prices/${priceId}`, 'PUT', data);
  },

  // 删除价格
  deletePrice(priceId) {
    return request(`/admin/prices/${priceId}`, 'DELETE');
  },

  // 获取统计数据
  getStatistics(type = 'all', params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/statistics/${type}?${queryString}` : `/admin/statistics/${type}`;
    return request(url, 'GET');
  },

  // 获取管理员待处理事项计数（红点提示）
  getPendingCount() {
    return request('/admin/pending-count', 'GET');
  },

  // 获取内部人员免付款待确认订单列表
  getInternalOrders(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/admin/internal-orders?${queryString}` : '/admin/internal-orders';
    return request(url, 'GET');
  },

  // 管理员确认内部人员免付款订单
  confirmInternalOrder(orderId, data = {}) {
    return request(`/admin/orders/${orderId}/internal-confirm`, 'PUT', data);
  },

  // 管理员代客下单（无需报价，直接设定金额，转发给用户填写地址并支付）
  createOrderByAdmin(data) {
    return request('/admin/orders/create-by-admin', 'POST', data);
  }
};

// 用户侧 - 确认管理员代客创建的订单（填写地址后提交）
const userConfirmApi = {
  confirmAdminOrder(orderId, data = {}) {
    return request(`/admin/orders/${orderId}/user-confirm`, 'PUT', data);
  }
};

const adminServiceApi = {
  getConversations() {
    return request('/admin/service/conversations', 'GET');
  },

  getAllConversations() {
    return request('/admin/service/conversations/all', 'GET');
  },

  getPendingCount() {
    return request('/admin/service/pending-count', 'GET');
  },

  getHistory(conversationId) {
    return request(`/admin/service/history/${conversationId}`, 'GET');
  },

  claimConversation(data) {
    return request('/admin/service/claim', 'POST', data);
  },

  completeConversation(conversationId) {
    return request('/admin/service/complete', 'POST', { conversationId });
  },

  getStatus(conversationId) {
    return request(`/admin/service/status/${conversationId}`, 'GET');
  }
};

// 进度申请相关API
const progressApplyApi = {
  // 获取我的申请列表
  getMyList(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/progress-apply/my/list?${queryString}` : '/progress-apply/my/list';
    return request(url, 'GET');
  },

  // 创建进度申请
  create(data) {
    return request('/progress-apply', 'POST', data);
  },

  // 获取申请详情
  getDetail(id) {
    return request(`/progress-apply/${id}`, 'GET');
  },

  // 取消/删除申请
  delete(id) {
    return request(`/progress-apply/${id}`, 'DELETE');
  }
};

// AI 故障诊断 API
const diagnoseApi = {
  // 提交诊断信息并获取分析结果
  analyze(data) {
    return request('/diagnose/analyze', 'POST', data);
  }
};

// 用户设备绑定 API
const userDevicesApi = {
  // 获取设备列表
  // params: { purpose: 'repair' | 'recycle' } 可选，按设备用途筛选（both 同时存在两处）
  getList(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/user-devices?${queryString}` : '/user-devices';
    return request(url, 'GET');
  },

  // 获取设备详情
  getDetail(id) {
    return request(`/user-devices/${id}`, 'GET');
  },

  // 添加设备
  create(data, options = {}) {
    return request('/user-devices', 'POST', data, options);
  },

  // 更新设备
  update(id, data) {
    return request(`/user-devices/${id}`, 'PUT', data);
  },

  // 删除设备
  delete(id) {
    return request(`/user-devices/${id}`, 'DELETE', null, { resolveOnHttpError: true });
  },

  // 设为默认设备
  setDefault(id) {
    return request(`/user-devices/${id}/default`, 'POST');
  }
};

// 售后相关API（设备维修档案 / 质保 / 建议）
const afterSalesApi = {
  // 设备售后总览：设备信息 + 质保状态 + 维修履历 + 建议
  getDeviceSummary(deviceId) {
    return request(`/after-sales/device/${deviceId}`, 'GET');
  },
  // 仅获取保养/换新建议
  getAdvice(deviceId) {
    return request(`/after-sales/advice/${deviceId}`, 'GET');
  },
  // 按订单查询质保
  getWarrantyByOrder(orderId) {
    return request(`/after-sales/warranty/order/${orderId}`, 'GET');
  },
  // 客服侧：某用户的售后总览（设备 + 质保 + 近期维修）
  getCustomerSummary(userId) {
    return request(`/after-sales/customer-summary/${userId}`, 'GET');
  }
};

// 管理员 - 进度申请管理API
const adminProgressApplyApi = {
  // 获取所有申请列表
  getList(params = {}) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    const url = queryString ? `/progress-apply?${queryString}` : '/progress-apply';
    return request(url, 'GET');
  },

  // 审批通过
  approve(id, remark = '') {
    return request(`/progress-apply/${id}/approve`, 'POST', { approval_remark: remark });
  },

  // 审批拒绝
  reject(id, remark) {
    return request(`/progress-apply/${id}/reject`, 'POST', { approval_remark: remark });
  },

  // 获取申请详情
  getDetail(id) {
    return request(`/progress-apply/${id}`, 'GET');
  }
};

module.exports = {
  userApi,
  addressApi,
  locationApi,
  orderApi,
  unitApi,
  chatApi,
  productApi,
  knowledgeApi,
  adminApi,
  adminServiceApi,
  progressApplyApi,
  adminProgressApplyApi,
  diagnoseApi,
  userDevicesApi,
  afterSalesApi,
  userConfirmApi
};
