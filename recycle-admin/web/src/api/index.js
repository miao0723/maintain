import request from './request'

// ===== 认证 =====
export const login = (data) => request.post('/auth/login', data)
export const ssoLogin = (mainToken) => request.post('/auth/sso', { token: mainToken })
export const getMe = () => request.get('/auth/me')
export const changePassword = (data) => request.post('/auth/change-password', data)

// ===== 估价系数（快速估价用，详见下方系统设置区块的 getConditionRates）=====

// ===== 回收订单 =====
export const getOrders = (params) => request.get('/orders', { params })
export const getOrderDetail = (id) => request.get(`/orders/${id}`)
export const quoteOrder = (id, data) => request.post(`/orders/${id}/quote`, data)
export const updateOrderStatus = (id, data) => request.post(`/orders/${id}/status`, data)
export const createOrder = (data) => request.post('/orders', data)
export const getUserOptions = (keyword) => request.get('/orders/meta/options', { params: { keyword } })
export const exportOrderUrl = (params) => `/api/orders/export/list?${new URLSearchParams(params).toString()}`

// ===== 配价库 =====
export const getCatalogTree = () => request.get('/catalog/tree')
export const getCategoryFactors = () => request.get('/catalog/category-factors')
export const updateCategoryFactor = (id, factor) => request.put(`/catalog/category-factors/${id}`, { factor })
export const getModels = (params) => request.get('/catalog/models', { params })
export const createCategory = (data) => request.post('/catalog/categories', data)
export const updateCategory = (id, data) => request.put(`/catalog/categories/${id}`, data)
export const deleteCategory = (id) => request.delete(`/catalog/categories/${id}`)
export const createBrand = (data) => request.post('/catalog/brands', data)
export const updateBrand = (id, data) => request.put(`/catalog/brands/${id}`, data)
export const deleteBrand = (id) => request.delete(`/catalog/brands/${id}`)
export const createModel = (data) => request.post('/catalog/models', data)
export const updateModel = (id, data) => request.put(`/catalog/models/${id}`, data)
export const updateModelPrice = (id, data) => request.put(`/catalog/models/${id}/price`, data)
export const deleteModel = (id) => request.delete(`/catalog/models/${id}`)
export const batchPrice = (data) => request.post('/catalog/models/batch-price', data)
export const getPriceLogs = (params) => request.get('/catalog/price-logs', { params })

// ===== 系统日志 =====
export const getOpLogs = (params) => request.get('/logs', { params })
// 配价库导出（新窗口下载 CSV，?token= 供鉴权）
export const exportCatalogUrl = () => `/api/catalog/export/models?token=${encodeURIComponent(localStorage.getItem('recycle_admin_token') || '')}`

// ===== 回收平台 =====
export const getPlatforms = (params) => request.get('/platforms', { params })
export const createPlatform = (data) => request.post('/platforms', data)
export const updatePlatform = (id, data) => request.put(`/platforms/${id}`, data)
export const deletePlatform = (id) => request.delete(`/platforms/${id}`)
export const clickPlatform = (id) => request.post(`/platforms/${id}/click`)

// ===== 采购链接 =====
export const getLinks = (params) => request.get('/links', { params })
export const createLink = (data) => request.post('/links', data)
export const updateLink = (id, data) => request.put(`/links/${id}`, data)
export const deleteLink = (id) => request.delete(`/links/${id}`)
export const clickLink = (id) => request.post(`/links/${id}/click`)
export const getClickStats = () => request.get('/links/click-stats')

// ===== 统计 =====
export const getDashboard = () => request.get('/stats/dashboard')

// ===== 系统设置 =====
export const getSettings = () => request.get('/system/settings')
export const saveSettings = (items) => request.put('/system/settings', { items })
export const getConditionRates = () => request.get('/system/condition-rates')
export const updateConditionRate = (id, data) => request.put(`/system/condition-rates/${id}`, data)
export const createConditionRate = (data) => request.post('/system/condition-rates', data)
export const deleteConditionRate = (id) => request.delete(`/system/condition-rates/${id}`)
export const getAdmins = () => request.get('/system/admins')
export const createAdmin = (data) => request.post('/system/admins', data)
export const updateAdmin = (id, data) => request.put(`/system/admins/${id}`, data)
export const deleteAdmin = (id) => request.delete(`/system/admins/${id}`)
export const getOperationLogs = (params) => request.get('/system/operation-logs', { params })

// ===== 质检中心 =====
export const getQcOrders = (params) => request.get('/qc/orders', { params })
export const getQcOrderDetail = (id) => request.get(`/qc/orders/${id}`)
export const getQcReport = (id) => request.get(`/qc/orders/${id}/report`)
export const createQcOrder = (data) => request.post('/qc/orders', data)
export const startQcOrder = (id) => request.put(`/qc/orders/${id}/start`)
export const gradeQcOrder = (id, data) => request.put(`/qc/orders/${id}/grade`, data)
export const completeQcOrder = (id) => request.put(`/qc/orders/${id}/complete`)
export const getQcPriceSuggestion = (id, gradeKey) => request.get(`/qc/orders/${id}/price-suggestion`, { params: { grade_key: gradeKey } })
export const saveQcMedia = (qcOrderId, data) => request.post(`/qc/orders/${qcOrderId}/media`, data)
export const deleteQcMedia = (mediaId) => request.delete(`/qc/media/${mediaId}`)
export const saveQcReview = (qcOrderId, data) => request.post(`/qc/orders/${qcOrderId}/reviews`, data)
export const resolveQcReview = (reviewId, data) => request.put(`/qc/reviews/${reviewId}`, data)
export const getQcTemplates = (params) => request.get('/qc/templates', { params })
export const getQcTemplateDetail = (id) => request.get(`/qc/templates/${id}`)
export const createQcTemplate = (data) => request.post('/qc/templates', data)
export const updateQcTemplate = (id, data) => request.put(`/qc/templates/${id}`, data)
export const deleteQcTemplate = (id) => request.delete(`/qc/templates/${id}`)
export const createQcItem = (templateId, data) => request.post(`/qc/templates/${templateId}/items`, data)
export const updateQcItem = (id, data) => request.put(`/qc/items/${id}`, data)
export const deleteQcItem = (id) => request.delete(`/qc/items/${id}`)
export const createQcGrade = (templateId, data) => request.post(`/qc/templates/${templateId}/grades`, data)
export const updateQcGrade = (id, data) => request.put(`/qc/grades/${id}`, data)
export const deleteQcGrade = (id) => request.delete(`/qc/grades/${id}`)
export const publishQcVersion = (templateId, changelog) => request.post(`/qc/templates/${templateId}/publish`, { changelog })
