<template>
  <div class="progress-photo-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="上传人">
        <el-input v-model="searchForm.uploaded_by_name" placeholder="请输入上传人" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        上传进度照片
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%" border stripe>
      <el-table-column prop="order_no" label="订单号" width="160" />
      <el-table-column prop="customer_name" label="客户" width="100" show-overflow-tooltip />
      <el-table-column prop="device_model" label="设备型号" width="140" show-overflow-tooltip />
      <el-table-column label="照片预览" width="200">
        <template #default="{ row }">
          <div class="table-photo-preview" v-if="row.photos && row.photos.length > 0">
            <el-image
              v-for="(img, idx) in row.photos.slice(0, 3)"
              :key="idx"
              :src="getFullUrl(img)"
              :preview-src-list="row.photos.map(p => getFullUrl(p))"
              :initial-index="idx"
              fit="cover"
              class="preview-thumb"
              preview-teleported
            />
            <el-tag v-if="row.photos.length > 3" size="small" type="info" class="more-tag">
              +{{ row.photos.length - 3 }}
            </el-tag>
          </div>
          <span v-else class="text-muted">无照片</span>
        </template>
      </el-table-column>
      <el-table-column label="照片数量" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.photo_count > 0 ? 'primary' : 'info'" size="small">
            {{ row.photo_count || 0 }}张
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="照片说明" min-width="180" show-overflow-tooltip />
      <el-table-column prop="feedback_group_id" label="反馈组" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip :content="row.feedback_group_id" placement="top">
            <span class="text-muted">{{ shortGroupId(row.feedback_group_id) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="uploaded_by_name" label="上传人" width="100" />
      <el-table-column prop="created_at" label="上传时间" width="160" />
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="warning" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 上传照片对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑进度照片' : '上传进度照片'"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="关联订单" prop="order_id">
          <el-select
            v-model="formData.order_id"
            filterable
            remote
            reserve-keyword
            placeholder="输入订单号搜索"
            :remote-method="searchOrders"
            :loading="orderSearchLoading"
            style="width: 100%"
            value-key="id"
          >
            <el-option
              v-for="item in orderOptions"
              :key="item.id"
              :label="`${item.order_id} - ${item.device_model || '未知设备'} (${item.user_name || '未知客户'})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="照片说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入照片说明，如：维修前、维修中、维修后等"
          />
        </el-form-item>

        <el-form-item label="上传照片" required>
          <el-upload
            v-model:file-list="fileList"
            :action="uploadUrl"
            :headers="getUploadHeaders()"
            :data="buildUploadData()"
            list-type="picture-card"
            :on-preview="handlePicturePreview"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :auto-upload="true"
            multiple
            :limit="10"
            :before-upload="beforeUpload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '上传' }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看照片详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`进度照片详情 - ${currentPhoto?.order_no || ''}`"
      width="900px"
    >
      <div class="photo-detail" v-if="currentPhoto">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ currentPhoto.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentPhoto.customer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentPhoto.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传人">{{ currentPhoto.uploaded_by_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="照片说明" :span="2">{{ currentPhoto.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="反馈组ID" :span="2">
            <el-tooltip :content="currentPhoto.feedback_group_id" placement="top">
              <span>{{ currentPhoto.feedback_group_id || '-' }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="上传时间" :span="2">{{ currentPhoto.created_at }}</el-descriptions-item>
        </el-descriptions>

        <div class="photo-gallery">
          <div class="gallery-header">
            <span class="gallery-title">照片列表</span>
            <el-tag size="small" type="primary">{{ currentPhoto.photos?.length || 0 }}张</el-tag>
          </div>
          <div class="photo-grid">
            <div v-for="(photo, index) in currentPhoto.photos" :key="index" class="photo-item">
              <el-image
                :src="getFullUrl(photo)"
                :preview-src-list="currentPhoto.photos.map(p => getFullUrl(p))"
                :initial-index="index"
                fit="cover"
                preview-teleported
              />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="600px">
      <img :src="previewUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { getMediaUrl } from '@/utils/media'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const previewVisible = ref(false)
const currentPhoto = ref(null)
const previewUrl = ref('')
const formRef = ref(null)
const fileList = ref([])
const isEdit = ref(false)
const orderSearchLoading = ref(false)
const orderOptions = ref([])

const uploadUrl = '/api/upload?type=progress'
const getUploadHeaders = () => ({
  'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
})

const searchForm = reactive({ order_no: '', uploaded_by_name: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })
const formData = reactive({ order_id: '', description: '', images: [] })

const formRules = {
  order_id: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  description: [{ required: true, message: '请输入照片说明', trigger: 'blur' }]
}

const getFullUrl = (url) => {
  return getMediaUrl(url)
}

const shortGroupId = (id) => {
  if (!id) return '-'
  if (id.length > 20) return '...' + id.slice(-12)
  return id
}

const beforeUpload = (file) => {
  if (!formData.order_id) {
    ElMessage.error('请先选择关联订单')
    return false
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

const searchOrders = async (query) => {
  if (!query) { orderOptions.value = []; return }
  orderSearchLoading.value = true
  try {
    const res = await request.get('/miniprogram-progress-media/summary', {
      params: { page: 1, pageSize: 20, order_no: query }
    })
    if (res.code === 200 || res.code === 0) {
      orderOptions.value = res.data.list || []
    }
  } catch { orderOptions.value = [] }
  finally { orderSearchLoading.value = false }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.limit
    }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    const res = await request.get('/miniprogram-progress-media/photos', { params })
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载照片列表失败', error)
    ElMessage.error('加载照片列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleReset = () => {
  Object.assign(searchForm, { order_no: '', uploaded_by_name: '' })
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  fileList.value = []
  orderOptions.value = []
  Object.assign(formData, { id: null, order_id: '', description: '', images: [] })
  dialogVisible.value = true
}

const buildUploadData = () => ({
  type: 'progress',
  order_id: formData.order_id || ''
})

const handleEdit = (row) => {
  isEdit.value = true
  const existingPhotos = row.photos || []
  fileList.value = existingPhotos.map((url, index) => ({
    name: `photo_${index}.jpg`, url: getFullUrl(url), uid: Date.now() + index, status: 'success'
  }))
  orderOptions.value = row.order_no ? [{ id: row.order_id, order_id: row.order_no, device_model: row.device_model, user_name: row.customer_name }] : []
  Object.assign(formData, { id: row.id, order_id: row.order_id, description: row.description || '', images: [...existingPhotos] })
  dialogVisible.value = true
}

const handleView = (row) => {
  currentPhoto.value = row
  viewDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该照片记录吗？', '提示', { type: 'warning' })
    await request.delete(`/miniprogram-progress-media/photos/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* cancelled */ }
}

const handlePicturePreview = (file) => {
  previewUrl.value = file.url
  previewVisible.value = true
}

const handleUploadSuccess = (response) => {
  if (response.code === 200) {
    const fileUrl = response.data.url || response.data.path
    if (fileUrl && !formData.images.includes(fileUrl)) {
      formData.images.push(fileUrl)
    }
  } else {
    ElMessage.error('上传失败: ' + response.message)
  }
}

const handleRemove = (file) => {
  let fileUrl = file.url
  if (!fileUrl && file.response) {
    fileUrl = file.response.data?.url || file.response.data?.path
  }
  // Convert full URL back to relative path for matching
  if (fileUrl && fileUrl.startsWith(window.location.origin)) {
    fileUrl = fileUrl.replace(window.location.origin, '')
  }
  const index = formData.images.indexOf(fileUrl)
  if (index > -1) formData.images.splice(index, 1)
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (formData.images.length === 0) {
    ElMessage.warning('请至少上传一张照片')
    return
  }

  try {
    const data = { order_id: formData.order_id, description: formData.description, images: formData.images }
    if (isEdit.value && formData.id) {
      await request.put(`/miniprogram-progress-media/photos/${formData.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/miniprogram-progress-media/photos', data)
      ElMessage.success('上传成功')
    }
    dialogVisible.value = false
    loadData()
  } catch { /* handled by interceptor */ }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  fileList.value = []
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.progress-photo-page {
  .search-form { margin-bottom: 16px; }
  .toolbar { margin-bottom: 16px; }
  .el-pagination { margin-top: 16px; justify-content: flex-end; }

  .table-photo-preview {
    display: flex;
    align-items: center;
    gap: 4px;

    .preview-thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .more-tag { flex-shrink: 0; }
  }

  .text-muted { color: #909399; font-size: 13px; }

  .photo-detail {
    .photo-gallery {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .gallery-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .gallery-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }

      .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;

        .photo-item {
          aspect-ratio: 4 / 3;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #ebeef5;
          transition: box-shadow 0.2s;

          &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); }

          :deep(.el-image) {
            width: 100%;
            height: 100%;
            img { width: 100%; height: 100%; object-fit: cover; }
          }
        }
      }
    }
  }
}
</style>
