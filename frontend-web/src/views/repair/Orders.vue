<template>
  <div class="orders-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.order_id" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="searchForm.device_model" placeholder="请输入" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="searchForm.order_type" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="维修" value="repair" />
            <el-option label="回收" value="recycle" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="维修中" value="processing" />
            <el-option label="待验收" value="review" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.device_type" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="手机" :value="1" />
            <el-option label="电脑" :value="2" />
            <el-option label="平板" :value="3" />
            <el-option label="手表" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务方式">
          <el-select v-model="searchForm.service_type" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="到店" value="shop" />
            <el-option label="上门" value="home" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_id" label="订单编号" width="150" />
        <el-table-column label="订单类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.order_type === 'repair' ? 'primary' : 'success'">
              {{ row.order_type === 'repair' ? '维修' : '回收' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备类型" width="100">
          <template #default="{ row }">
            {{ getDeviceTypeText(row.device_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="device_model" label="设备型号" width="140" />
        <el-table-column prop="problem_description" label="故障描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="custom_description" label="自定义描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="故障图片" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewImages(row.images_list || [])" v-if="row.images_list && row.images_list.length > 0">
              <el-icon><Picture /></el-icon>
              {{ row.images_list.length }}张
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="服务方式" width="100">
          <template #default="{ row }">
            {{ row.service_type === 'shop' ? '到店' : '上门' }}
          </template>
        </el-table-column>
        <el-table-column prop="estimated_price" label="预估价格" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.estimated_price?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_price" label="实际价格" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.actual_price?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="assigned_user_name" label="维修人员" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.assigned_user_name" type="success" effect="plain">
              {{ row.assigned_user_name }}
            </el-tag>
            <span v-else style="color: #999">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
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
        <el-table-column prop="assigned_user_name" label="维修人员" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.assigned_user_name" type="success" effect="plain">
              {{ row.assigned_user_name }}
            </el-tag>
            <span v-else style="color: #999">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="success" @click="handleAccept(row)" v-if="row.status === 'pending'">接单</el-button>
            <el-button link type="primary" @click="handleProcess(row)" v-if="row.status === 'processing' || row.status === 'pending' || row.status === 'confirmed'">处理</el-button>
            <el-button link type="warning" @click="handleCreateQuotation(row)" v-if="row.status === 'processing' || row.status === 'completed' || row.status === 'review' || row.status === 'quoted'">发起报价</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="handlePageChange"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </el-card>

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

    <!-- 接单对话框 -->
    <el-dialog v-model="acceptDialogVisible" title="接单" width="500px" :close-on-click-modal="false">
      <el-form :model="acceptForm" ref="acceptFormRef" label-width="100px">
        <el-form-item label="选择维修人员" prop="user_id">
          <el-select v-model="acceptForm.user_id" placeholder="请选择维修人员" style="width: 100%">
            <el-option
              v-for="engineer in engineers"
              :key="engineer.id"
              :label="`${engineer.name} - ${engineer.phone}`"
              :value="engineer.user_id || engineer.id"
            >
              <span>{{ engineer.name }}</span>
              <span style="color: #8492a6; font-size: 13px; margin-left: 10px">{{ engineer.phone }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAcceptSubmit" :loading="acceptLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 处理订单对话框 -->
    <el-dialog v-model="processDialogVisible" :title="processDialogTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="processForm" ref="processFormRef" label-width="100px">
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="processForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="维修中" value="processing" v-if="currentOrder?.status === 'pending'" />
            <el-option label="待验收" value="review" v-if="currentOrder?.status === 'processing'" />
            <el-option label="已完成" value="completed" v-if="currentOrder?.status === 'review' || currentOrder?.status === 'processing'" />
          </el-select>
        </el-form-item>
        <el-form-item label="实际价格" prop="actual_price">
          <el-input-number v-model="processForm.actual_price" :min="0" :precision="2" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="维修进度" prop="progress">
          <el-slider v-model="processForm.progress" :min="0" :max="100" :step="5" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit" :loading="processLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Picture } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  getRepairOrderList,
  acceptRepairOrder,
  updateRepairOrderStatus,
  getDeviceTypeText
} from '@/api/repairOrder'
import request from '@/api/request'
import { getMediaUrl } from '@/utils/media'

const router = useRouter()

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
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)

// 图片查看
const imageDialogVisible = ref(false)
const currentImages = ref([])

// 接单对话框
const acceptDialogVisible = ref(false)
const acceptForm = reactive({
  user_id: null
})
const acceptFormRef = ref(null)
const acceptLoading = ref(false)
const currentOrderId = ref(null)

// 工程师列表（岗位为 engineer 的人员）
const engineers = ref([])

// 处理订单对话框
const processDialogVisible = ref(false)
const processForm = reactive({
  status: '',
  actual_price: null,
  progress: 0
})
const processFormRef = ref(null)
const processLoading = ref(false)
const currentOrder = ref(null)

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

const getStatusType = (status) => statusTypeMap[status] || 'info'
const getStatusText = (status) => statusMap[status] || status
const getPriorityType = (priority) => priorityTypeMap[priority] || ''
const getPriorityText = (priority) => priorityMap[priority] || '中'
const getDeviceTypeText = (type) => deviceTypeMap[type] || '未知'
const getProcessDialogTitle = () => {
  if (!currentOrder.value) return '处理订单'
  if (currentOrder.value.status === 'pending') return '接单并开始维修'
  if (currentOrder.value.status === 'confirmed') return '开始维修'
  if (currentOrder.value.status === 'processing') return '完成维修'
  return '更新订单状态'
}

// 获取完整图片 URL
const getFullImageUrl = (img) => {
  return getMediaUrl(img)
}

// 获取数据
const fetchData = async () => {
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

    const res = await getRepairOrderList(pagination.page, pagination.pageSize, params)
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 查看图片
const viewImages = (images) => {
  currentImages.value = images
  imageDialogVisible.value = true
}

// 查看订单详情
const handleView = (row) => {
  ElMessage.info('查看订单详情功能开发中')
}

// 接单
const handleAccept = (row) => {
  currentOrderId.value = row.id
  acceptForm.user_id = null
  acceptDialogVisible.value = true
}

// 获取工程师列表
const fetchEngineers = async () => {
  try {
    const res = await request({
      url: '/personnel',
      method: 'get',
      params: { page: 1, pageSize: 100, position: 'engineer', status: 1 }
    })
    if (res.code === 200 || res.code === 0) {
      engineers.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取工程师列表失败:', error)
  }
}

// 提交接单
const handleAcceptSubmit = async () => {
  if (!acceptForm.user_id) {
    ElMessage.warning('请选择维修人员')
    return
  }

  // 确认对话框
  try {
    await ElMessageBox.confirm('确认分配该维修人员接单吗？', '确认接单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return // 用户取消
  }

  acceptLoading.value = true
  try {
    const res = await acceptRepairOrder(currentOrderId.value, acceptForm.user_id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('接单成功')
      acceptDialogVisible.value = false
      fetchData()
    }
  } catch (error) {
    console.error('接单失败:', error)
    ElMessage.error(error.message || '接单失败')
  } finally {
    acceptLoading.value = false
  }
}

// 处理订单
const handleProcess = (row) => {
  currentOrder.value = row
  processForm.status = row.status
  processForm.actual_price = row.actual_price
  processForm.progress = row.progress || 0
  processDialogVisible.value = true
}

// 发起报价单
const handleCreateQuotation = (row) => {
  const faultParts = []
  if (row.problem_description) faultParts.push(row.problem_description)
  if (row.custom_description) faultParts.push(row.custom_description)

  router.push({
    path: '/repair/test-report/quote',
    query: {
      order_id: row.id,
      order_no: row.order_id,
      customer_name: row.user_name || '',
      customer_phone: row.user_phone || '',
      device_model: row.device_model || '',
      fault_description: faultParts.join(' - ')
    }
  })
}

// 提交处理
const handleProcessSubmit = async () => {
  processLoading.value = true
  try {
    const data = {
      status: processForm.status
    }
    if (processForm.actual_price !== null && processForm.actual_price !== undefined) {
      data.actual_price = processForm.actual_price
    }
    if (processForm.progress !== null && processForm.progress !== undefined) {
      data.progress = processForm.progress
    }

    const res = await updateRepairOrderStatus(currentOrder.value.id, data)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('操作成功')
      processDialogVisible.value = false
      currentOrder.value = null
      fetchData()
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    processLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
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
  fetchData()
}

const handleCurrentChange = (currentPage) => {
  pagination.page = currentPage
  fetchData()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchEngineers()
})
</script>

<style lang="scss" scoped>
.orders-container {
  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
