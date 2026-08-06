<template>
  <div class="miniprogram-progress-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="总订单" :value="stats.total" />
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="待处理" :value="stats.pending">
            <template #suffix>
              <el-tag type="info" size="small" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="维修中" :value="stats.processing">
            <template #suffix>
              <el-tag type="warning" size="small" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="待验收" :value="stats.review">
            <template #suffix>
              <el-tag type="primary" size="small" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="已完成" :value="stats.completed">
            <template #suffix>
              <el-tag type="success" size="small" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <el-statistic title="已取消" :value="stats.cancelled">
            <template #suffix>
              <el-tag type="danger" size="small" />
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_id" placeholder="请输入订单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="设备型号">
        <el-input v-model="searchForm.device_model" placeholder="请输入设备型号" clearable style="width: 150px" />
      </el-form-item>
      <el-form-item label="订单类型">
        <el-select v-model="searchForm.order_type" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="维修订单" value="repair" />
          <el-option label="旧件回收" value="recycle" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="维修中" value="processing" />
          <el-option label="待验收" value="review" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </el-form-item>
      <el-form-item label="设备类型">
        <el-select v-model="searchForm.device_type" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="手机" :value="1" />
          <el-option label="电脑" :value="2" />
          <el-option label="平板" :value="3" />
          <el-option label="手表" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务方式">
        <el-select v-model="searchForm.service_type" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="到店" value="shop" />
          <el-option label="上门" value="home" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker
          v-model="searchForm.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
    >
      <el-table-column prop="order_id" label="订单号" width="160" fixed />
      <el-table-column prop="user_name" label="用户" width="120" show-overflow-tooltip />
      <el-table-column prop="user_phone" label="手机号" width="120" show-overflow-tooltip />
      <el-table-column prop="order_type" label="订单类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.order_type === 'repair' ? 'primary' : 'success'" size="small">
            {{ row.order_type === 'repair' ? '维修' : '回收' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="设备类型" width="100" align="center">
        <template #default="{ row }">
          {{ getDeviceTypeText(row.device_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="device_model" label="设备型号" width="140" show-overflow-tooltip />
      <el-table-column prop="problem_description" label="故障描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="custom_description" label="自定义描述" min-width="150" show-overflow-tooltip />
      <el-table-column label="故障图片" width="100" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewImages(row.images || [])" v-if="row.images && row.images.length > 0">
            <el-icon><Picture /></el-icon>
            {{ row.images.length }}张
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="服务方式" width="100" align="center">
        <template #default="{ row }">
          {{ row.service_type ? (row.service_type === 'shop' ? '到店' : '上门') : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="brand_name" label="品牌" width="100" show-overflow-tooltip />
      <el-table-column prop="estimated_price" label="预估价格" width="100" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.estimated_price) }}
        </template>
      </el-table-column>
      <el-table-column prop="actual_price" label="实际价格" width="100" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.actual_price) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assigned_user_name" label="维修人员" width="120" show-overflow-tooltip />
      <el-table-column label="优先级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getPriorityType(row.priority)" size="small">
            {{ getPriorityText(row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="120" align="center">
        <template #default="{ row }">
          <el-progress :percentage="row.progress || 0" :format="() => (row.progress || 0) + '%'" />
        </template>
      </el-table-column>
      <el-table-column label="进度照片" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.photo_count > 0" type="info" size="small">{{ row.photo_count }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="进度视频" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.video_count > 0" type="warning" size="small">{{ row.video_count }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" width="160" />
      <el-table-column prop="address_text" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" align="left" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button
            v-if="['processing', 'review', 'completed'].includes(row.status)"
            link
            type="warning"
            @click="handleUpdateProgress(row)"
          >
            更新进度
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            link
            type="success"
            @click="handleAccept(row)"
          >
            接单
          </el-button>
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
      @change="handlePageChange"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />

    <!-- 图片查看对话框 -->
    <el-dialog v-model="imageDialogVisible" title="故障图片" width="800px">
      <el-image
        v-for="(img, index) in currentImages"
        :key="index"
        :src="getFullImageUrl(img)"
        :preview-src-list="currentImages.map(item => getFullImageUrl(item))"
        fit="cover"
        style="width: 100%; height: 400px; margin-bottom: 10px"
        preview-teleported
      />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="900px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentOrder.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <el-tag :type="currentOrder.order_type === 'repair' ? 'primary' : 'success'" size="small">
            {{ currentOrder.order_type === 'repair' ? '维修订单' : '旧件回收' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">
          {{ getDeviceTypeText(currentOrder.device_type) }}
        </el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentOrder.device_model }}</el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ currentOrder.problem_description }}</el-descriptions-item>
        <el-descriptions-item label="自定义描述" :span="2">{{ currentOrder.custom_description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="服务方式">
          {{ currentOrder.service_type ? (currentOrder.service_type === 'shop' ? '到店' : '上门') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentOrder.brand_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(currentOrder.priority)" size="small">
            {{ getPriorityText(currentOrder.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预估价格">{{ formatMoney(currentOrder.estimated_price) }}</el-descriptions-item>
        <el-descriptions-item label="实际价格">{{ formatMoney(currentOrder.actual_price) }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="维修进度">
          <el-progress :percentage="currentOrder.progress || 0" :format="() => (currentOrder.progress || 0) + '%'" />
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentOrder.completed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="维修人员">{{ currentOrder.assigned_user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentOrder.address_text || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 图片展示 -->
      <div v-if="currentOrder?.images?.length" class="order-images">
        <div class="image-title">故障照片：</div>
        <div class="image-list">
          <el-image
            v-for="(img, index) in currentOrder.images"
            :key="index"
            :src="getFullImageUrl(img)"
            :preview-src-list="currentOrder.images.map(item => getFullImageUrl(item))"
            :initial-index="index"
            fit="cover"
            class="order-image"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentOrder?.status === 'pending'" type="success" @click="handleAcceptFromDetail">接单</el-button>
      </template>
    </el-dialog>

    <!-- 更新进度对话框 -->
    <el-dialog v-model="progressDialogVisible" title="更新维修进度" width="600px" :close-on-click-modal="false">
      <el-form :model="progressForm" ref="progressFormRef" label-width="100px">
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="progressForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="维修中" value="processing" v-if="currentOrder?.status === 'pending'" />
            <el-option label="待验收" value="review" v-if="['processing', 'review'].includes(currentOrder?.status)" />
            <el-option label="已完成" value="completed" v-if="['processing', 'review'].includes(currentOrder?.status)" />
          </el-select>
        </el-form-item>
        <el-form-item label="实际价格" prop="actual_price">
          <el-input-number v-model="progressForm.actual_price" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维修进度" prop="progress">
          <el-slider v-model="progressForm.progress" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="progressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProgressSubmit" :loading="progressLoading">确定</el-button>
</template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Picture } from '@element-plus/icons-vue'
import {
  getMiniAdminProgress,
  updateMiniAdminProgress,
  getMiniAdminProgressStatistics
} from '@/api/miniAdmin'
import {
  getMiniprogramRepairProgress,
  updateMiniprogramRepairProgress,
  getMiniprogramRepairProgressStatistics
} from '@/api/repairProgress'
import { getMediaUrl } from '@/utils/media'

const route = useRoute()
const isMiniAdminRoute = computed(() => route.path.startsWith('/mini-admin'))

const loading = ref(false)
const tableData = ref([])
const imageDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const progressDialogVisible = ref(false)
const progressLoading = ref(false)
const currentOrder = ref(null)
const currentImages = ref([])

const searchForm = reactive({
  order_id: '',
  device_model: '',
  order_type: '',
  status: '',
  device_type: '',
  service_type: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const stats = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  review: 0,
  completed: 0,
  cancelled: 0
})

const progressForm = reactive({
  status: '',
  actual_price: null,
  progress: 0
})
const progressFormRef = ref(null)

// 状态映射
const statusMap = {
  pending: '待处理',
  quoted: '待确认报价',
  confirmed: '已确认报价',
  processing: '维修中',
  review: '待验收',
  completed: '已完成',
  cancelled: '已取消'
}

const statusTypeMap = {
  pending: 'info',
  quoted: 'warning',
  confirmed: 'primary',
  processing: 'warning',
  review: 'primary',
  completed: 'success',
  cancelled: 'danger'
}

const priorityMap = {
  low: '低',
  medium: '中',
  high: '高'
}

const priorityTypeMap = {
  low: 'info',
  medium: '',
  high: 'danger'
}

const deviceTypeMap = {
  1: '手机',
  2: '电脑',
  3: '平板',
  4: '手表',
  5: '其他'
}

const getStatusType = (status) => statusTypeMap[status] || ''
const getStatusText = (status) => statusMap[status] || status
const getPriorityType = (priority) => priorityTypeMap[priority] || ''
const getPriorityText = (priority) => priorityMap[priority] || '中'
const getDeviceTypeText = (type) => deviceTypeMap[type] || '未知'

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return `¥${num.toFixed(2)}`
}

// 获取完整图片 URL
const getFullImageUrl = (img) => {
  return getMediaUrl(img)
}

// 加载统计数据
const loadStats = async () => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminProgressStatistics : getMiniprogramRepairProgressStatistics
    const res = await loader()
    if (res.code === 200 || res.code === 0) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.order_id) params.order_id = searchForm.order_id
    if (searchForm.device_model) params.device_model = searchForm.device_model
    if (searchForm.order_type) params.order_type = searchForm.order_type
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.device_type) params.device_type = searchForm.device_type
    if (searchForm.service_type) params.service_type = searchForm.service_type
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.date_start = searchForm.date_range[0]
      params.date_end = searchForm.date_range[1]
    }

    const loader = isMiniAdminRoute.value ? getMiniAdminProgress : getMiniprogramRepairProgress
    const res = await loader({
      page: pagination.page,
      pageSize: pagination.limit,
      ...params
    })
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.list || res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 查看图片
const viewImages = (images) => {
  currentImages.value = images
  imageDialogVisible.value = true
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    order_id: '',
    device_model: '',
    order_type: '',
    status: '',
    device_type: '',
    service_type: '',
    date_range: []
  })
  handleSearch()
}

// 分页变化
const handlePageChange = () => {
  loadData()
}

const handleCurrentChange = (currentPage) => {
  pagination.page = currentPage
  loadData()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.limit = pageSize
  loadData()
}

// 查看详情
const handleView = (row) => {
  currentOrder.value = { ...row }
  detailDialogVisible.value = true
}

// 更新进度
const handleUpdateProgress = (row) => {
  currentOrder.value = { ...row }
  if (row.status === 'pending') progressForm.status = 'processing'
  else if (row.status === 'processing') progressForm.status = 'review'
  else if (row.status === 'review') progressForm.status = 'completed'
  else progressForm.status = row.status
  progressForm.actual_price = row.actual_price
  progressForm.progress = row.progress || 0
  progressDialogVisible.value = true
}

// 提交更新进度
const handleProgressSubmit = async () => {
  if (!progressForm.status) {
    ElMessage.warning('请选择处理状态')
    return
  }
  progressLoading.value = true
  try {
    const data = {
      status: progressForm.status
    }
    if (progressForm.actual_price !== null && progressForm.actual_price !== undefined) {
      data.actual_price = progressForm.actual_price
    }
    if (progressForm.progress !== null && progressForm.progress !== undefined) {
      data.progress = progressForm.progress
    }

    const submitter = isMiniAdminRoute.value ? updateMiniAdminProgress : updateMiniprogramRepairProgress
    const res = await submitter(currentOrder.value.id, data)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('更新成功')
      progressDialogVisible.value = false
      currentOrder.value = null
      loadData()
      loadStats()
    }
  } catch (error) {
    console.error('更新失败', error)
    ElMessage.error(error.message || '更新失败')
  } finally {
    progressLoading.value = false
  }
}

// 接单
const handleAccept = async (row) => {
  try {
    await ElMessageBox.confirm('确定要接单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const submitter = isMiniAdminRoute.value ? updateMiniAdminProgress : updateMiniprogramRepairProgress
    const res = await submitter(row.id, {
      status: 'processing',
      progress: 0
    })

    if (res.code === 200 || res.code === 0) {
      ElMessage.success('接单成功')
      loadData()
      loadStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('接单失败', error)
      ElMessage.error(error.message || '接单失败')
    }
  }
}

// 从详情对话框接单
const handleAcceptFromDetail = () => {
  detailDialogVisible.value = false
  handleAccept(currentOrder.value)
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.miniprogram-progress-page {
  .stats-cards {
    margin-bottom: 20px;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .order-images {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;

    .image-title {
      font-weight: bold;
      margin-bottom: 10px;
    }

    .image-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .order-image {
        width: 120px;
        height: 120px;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
}
</style>
