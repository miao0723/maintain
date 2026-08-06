<template>
  <div class="online-payment-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.order_id" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="故障/型号/编号" clearable />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.device_type" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="(label, val) in deviceTypeMap" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="(label, val) in statusMap"
              :key="val"
              :label="label"
              :value="val"
            />
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
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-title">订单总数</div>
            <div class="stat-value">{{ statistics.total }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-pending">
            <div class="stat-title">待处理</div>
            <div class="stat-value">{{ statistics.pending }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-processing">
            <div class="stat-title">维修中</div>
            <div class="stat-value">{{ statistics.processing }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-completed">
            <div class="stat-title">已完成</div>
            <div class="stat-value">{{ statistics.completed }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_id" label="订单编号" min-width="160" />
        <el-table-column label="客户" min-width="120">
          <template #default="{ row }">{{ row.user_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="设备类型" width="90">
          <template #default="{ row }">{{ deviceTypeMap[row.device_type] || '-' }}</template>
        </el-table-column>
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="device_model" label="型号" min-width="110" />
        <el-table-column label="故障描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.problem_description || row.custom_description || '-' }}</template>
        </el-table-column>
        <el-table-column label="服务方式" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ serviceTypeMap[row.service_type] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预估价格" width="110">
          <template #default="{ row }">
            <span v-if="row.estimated_price != null">¥{{ Number(row.estimated_price).toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="实际价格" width="110">
          <template #default="{ row }">
            <span v-if="row.actual_price != null" style="color: #f56c6c; font-weight: bold">
              ¥{{ Number(row.actual_price).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)" size="small">
              {{ priorityMap[row.priority] || '中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusMap[row.status] || row.status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
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
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="760px" destroy-on-close>
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border v-if="currentOrder" class="detail-descriptions">
          <el-descriptions-item label="订单编号">{{ currentOrder.order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ orderTypeMap[currentOrder.order_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名">{{ currentOrder.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.user_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ deviceTypeMap[currentOrder.device_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentOrder.brand_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentOrder.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务方式">{{ serviceTypeMap[currentOrder.service_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预估价格">
            ¥{{ currentOrder.estimated_price != null ? Number(currentOrder.estimated_price).toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="实际价格">
            ¥{{ currentOrder.actual_price != null ? Number(currentOrder.actual_price).toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityType(currentOrder.priority)" size="small">
              {{ priorityMap[currentOrder.priority] || '中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentOrder.status)">{{ statusMap[currentOrder.status] || currentOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务人员">{{ currentOrder.assigned_user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrder.updated_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.completed_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="2">{{ currentOrder.problem_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="自定义描述" :span="2">{{ currentOrder.custom_description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">状态校正</el-divider>
        <el-form :model="formData" label-width="90px" class="detail-form">
          <el-form-item label="订单状态">
            <el-select v-model="formData.status" style="width: 100%">
              <el-option
                v-for="(label, val) in statusMap"
                :key="val"
                :label="label"
                :value="val"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="实际价格">
            <el-input-number
              v-model="formData.actual_price"
              :min="0"
              :precision="2"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="人工备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="saving" @click="saveOrder">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const API_BASE = '/api'
const getHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const deviceTypeMap = {
  1: '手机',
  2: '电脑',
  3: '平板',
  4: '手表',
  5: '其他'
}
const serviceTypeMap = {
  shop: '到店',
  home: '上门'
}
const priorityMap = {
  low: '低',
  medium: '中',
  high: '高'
}
const orderTypeMap = {
  repair: '维修',
  recycle: '回收'
}
const statusMap = {
  pending: '待处理',
  quoted: '待确认报价',
  confirmed: '已确认报价',
  processing: '维修中',
  review: '待验收',
  completed: '已完成',
  cancelled: '已取消'
}

const statusType = (status) => ({
  pending: 'info',
  quoted: 'warning',
  confirmed: 'primary',
  processing: 'warning',
  review: 'success',
  completed: 'success',
  cancelled: 'danger'
}[status] || 'info')

const priorityType = (priority) => ({
  low: 'info',
  medium: '',
  high: 'danger'
}[priority] || '')

const searchForm = reactive({
  order_id: '',
  keyword: '',
  device_type: '',
  status: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const statistics = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  completed_amount: 0,
  estimated_amount: 0
})

const tableData = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const currentOrder = ref(null)

const formData = reactive({
  id: null,
  status: '',
  actual_price: 0,
  remark: ''
})

const fetchStatistics = async () => {
  try {
    const response = await axios.get(`${API_BASE}/payment/online/statistics`, {
      headers: getHeaders()
    })
    if (response.data.code === 200) {
      statistics.value = { ...statistics.value, ...(response.data.data || {}) }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      order_id: searchForm.order_id,
      keyword: searchForm.keyword,
      device_type: searchForm.device_type,
      status: searchForm.status,
      date_range: searchForm.date_range && searchForm.date_range.length === 2
        ? searchForm.date_range.join(',')
        : ''
    }

    const response = await axios.get(`${API_BASE}/payment/online`, {
      headers: getHeaders(),
      params
    })

    if (response.data.code === 200) {
      tableData.value = response.data.data.list || []
      pagination.total = response.data.data.total
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    order_id: '',
    keyword: '',
    device_type: '',
    status: '',
    date_range: []
  })
  handleSearch()
}

const handleView = async (row) => {
  detailDialogVisible.value = true
  detailLoading.value = true
  currentOrder.value = null
  try {
    const response = await axios.get(`${API_BASE}/payment/online/${row.id}`, {
      headers: getHeaders()
    })
    if (response.data.code === 200) {
      currentOrder.value = response.data.data || {}
      Object.assign(formData, {
        id: currentOrder.value.id,
        status: currentOrder.value.status || '',
        actual_price: currentOrder.value.actual_price != null ? Number(currentOrder.value.actual_price) : 0,
        remark: ''
      })
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const saveOrder = async () => {
  saving.value = true
  try {
    const response = await axios.put(
      `${API_BASE}/payment/online/${formData.id}`,
      {
        status: formData.status,
        actual_price: formData.actual_price,
        remark: formData.remark
      },
      { headers: getHeaders() }
    )
    if (response.data.code === 200) {
      ElMessage.success('订单已更新')
      detailDialogVisible.value = false
      fetchData()
      fetchStatistics()
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchStatistics()
})
</script>

<style lang="scss" scoped>
.online-payment-container {
  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}

.stat-card {
  text-align: center;

  .stat-title {
    color: #909399;
    font-size: 13px;
  }

  .stat-value {
    margin-top: 8px;
    font-size: 26px;
    font-weight: bold;
    color: #303133;
  }

  &.stat-pending .stat-value { color: #e6a23c; }
  &.stat-processing .stat-value { color: #409eff; }
  &.stat-completed .stat-value { color: #67c23a; }
}

.detail-descriptions {
  margin-bottom: 12px;
}

.detail-form {
  margin-top: 8px;
}
</style>
