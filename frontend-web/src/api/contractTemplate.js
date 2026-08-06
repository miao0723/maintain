import request from './request'

/**
 * 合同模板 API
 */

/**
 * 获取合同模板列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {object} params - 搜索参数
 */
export function getContractTemplateList(page = 1, pageSize = 10, params = {}) {
  return request({
    url: '/contract-templates',
    method: 'get',
    params: {
      page,
      pageSize,
      ...params
    }
  })
}

/**
 * 获取合同模板详情
 * @param {number} id - 模板 ID
 */
export function getContractTemplateDetail(id) {
  return request({
    url: `/contract-templates/${id}`,
    method: 'get'
  })
}

/**
 * 创建合同模板
 * @param {object} data - 模板数据
 */
export function createContractTemplate(data) {
  return request({
    url: '/contract-templates',
    method: 'post',
    data
  })
}

/**
 * 更新合同模板
 * @param {number} id - 模板 ID
 * @param {object} data - 模板数据
 */
export function updateContractTemplate(id, data) {
  return request({
    url: `/contract-templates/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除合同模板
 * @param {number} id - 模板 ID
 */
export function deleteContractTemplate(id) {
  return request({
    url: `/contract-templates/${id}`,
    method: 'delete'
  })
}

/**
 * 基于模板创建合同并导出PDF
 * @param {object} data - 合同数据（包含模板ID和填充数据）
 */
export function createContractAndExportPDF(data) {
  return request({
    url: '/contract-templates/export-pdf',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

/**
 * 预览合同模板
 * @param {number} id - 模板 ID
 * @param {object} data - 填充数据
 */
export function previewContractTemplate(id, data) {
  return request({
    url: `/contract-templates/${id}/preview`,
    method: 'post',
    data
  })
}

/**
 * 上传 PDF 合同，提取字段并生成模板草稿
 * @param {File} file - PDF 文件
 */
export function importContractTemplatePdf(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/contract-templates/import-pdf',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 从粘贴的合同文本提取字段并生成模板草稿
 * @param {string} text - 合同全文
 */
export function parseContractTemplateText(text) {
  return request({
    url: '/contract-templates/parse-text',
    method: 'post',
    data: { text }
  })
}
