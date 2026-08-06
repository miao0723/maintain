import request from './request'

/**
 * 获取人员列表
 */
export function getPersonnelList(params) {
  return request({
    url: '/personnel',
    method: 'get',
    params
  })
}

/**
 * 获取人员详情
 */
export function getPersonnelDetail(id) {
  return request({
    url: `/personnel/${id}`,
    method: 'get'
  })
}

/**
 * 创建人员
 */
export function createPersonnel(data) {
  return request({
    url: '/personnel',
    method: 'post',
    data
  })
}

/**
 * 更新人员
 */
export function updatePersonnel(id, data) {
  return request({
    url: `/personnel/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除人员
 */
export function deletePersonnel(id) {
  return request({
    url: `/personnel/${id}`,
    method: 'delete'
  })
}

export function batchCreatePersonnel(items) {
  return request({
    url: '/personnel/batch',
    method: 'post',
    data: { items }
  })
}

/**
 * 导入人员数据
 */
export function importPersonnel(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/personnel/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导出人员数据
 */
export function exportPersonnel(params) {
  return request({
    url: '/personnel/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
