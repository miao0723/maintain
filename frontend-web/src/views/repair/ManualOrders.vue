<template>
  <div class="manual-orders-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_id" placeholder="请输入订单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="用户手机号">
        <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="待处理" value="pending" />
          <el-option label="已报价" value="quoted" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="维修中" value="processing" />
          <el-option label="待评价" value="review" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
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
        手动创建订单（代客下单）
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
    >
      <el-table-column prop="order_id" label="订单号" width="160" fixed />
      <el-table-column prop="user_name" label="下单用户" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.user_name || row.user_nickname || '-' }}</template>
      </el-table-column>
      <el-table-column prop="user_phone" label="联系电话" width="120">
        <template #default="{ row }">{{ row.user_phone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="device_model" label="设备型号" width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.device_model || '-' }}</template>
      </el-table-column>
      <el-table-column prop="problem_description" label="故障描述" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ row.problem_description || '-' }}</template>
      </el-table-column>
      <el-table-column prop="estimated_price" label="预估价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.estimated_price) }}</template>
      </el-table-column>
      <el-table-column prop="actual_price" label="实收价" width="100" align="right">
        <template #default="{ row }">{{ formatMoney(row.actual_price) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 'pending' || row.status === 'cancelled'"
            link
            type="danger"
            @click="handleDelete(row)"
          >
            删除
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
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 创建/编辑订单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item v-if="dialogMode === 'create'" label="下单用户" prop="user_id">
          <el-select
            v-model="formData.user_id"
            placeholder="搜索并选择小程序用户"
            filterable
            remote
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="`${u.nickname || u.real_name || '用户#' + u.id}${u.phone ? ' (' + u.phone + ')' : ''}`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备类型" prop="device_type">
              <el-select v-model="formData.device_type" placeholder="请选择设备类型" style="width: 100%">
                <el-option
                  v-for="dt in deviceTypes"
                  :key="dt.id"
                  :label="`${dt.icon || '🔧'} ${dt.name}`"
                  :value="dt.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="formData.brand_name" placeholder="如：苹果、华为" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备型号">
              <el-input v-model="formData.device_model" placeholder="如：iPhone 14 Pro" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单类型">
              <el-select v-model="formData.order_type" style="width: 100%">
                <el-option label="维修订单" value="repair" />
                <el-option label="旧件回收" value="recycle" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务方式">
              <el-select v-model="formData.service_type" style="width: 100%">
                <el-option label="到店" value="shop" />
                <el-option label="上门" value="home" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="formData.priority" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="故障描述" prop="problem_description">
          <el-input
            v-model="formData.problem_description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述故障情况"
          />
        </el-form-item>

        <el-form-item label="预估价格">
          <el-input-number v-model="formData.estimated_price" :min="0" :precision="2" :step="50" style="width: 220px" />
        </el-form-item>

        <el-form-item v-if="dialogMode === 'edit'" label="订单状态">
          <el-select v-model="formData.status" style="width: 220px">
            <el-option label="待处理" value="pending" />
            <el-option label="已报价" value="quoted" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="维修中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.custom_description"
            type="textarea"
            :rows="2"
            placeholder="备注将写入订单自定义描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="订单详情"
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单用户">{{ currentOrder.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ deviceTypeText(currentOrder.device_type) }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentOrder.brand_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentOrder.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务方式">
          {{ currentOrder.service_type === 'home' ? '上门' : '到店' }}
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ currentOrder.problem_description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="自定义描述" :span="2">{{ currentOrder.custom_description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="预估价格">{{ formatMoney(currentOrder.estimated_price) }}</el-descriptions-item>
        <el-descriptions-item label="实际价格">{{ formatMoney(currentOrder.actual_price) }}</el-descriptions-item>
        <el-descriptions-item label="维修进度">{{ currentOrder.progress ?? 0 }}%</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createMiniAdminOrder,
  deleteMiniAdminResource,
  getMiniAdminCommonProblemDeviceTypes,
  getMiniAdminOrders,
  getMiniAdminUsers,
  updateMiniAdminOrder
} from '@/api/miniAdmin'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentOrder = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)
const userSearchLoading = ref(false)

const searchForm = reactive({
  order_id: '',
  phone: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const dialogMode = ref('create')
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '手动创建订单（代客下单）' : '编辑订单'
})

const editingId = ref(null)
const userOptions = ref([])
const deviceTypes = ref([])
// 兜底字典（接口失败时显示用）
const deviceTypeMap = { 1: '手机', 2: '电脑', 3: '平板', 4: '手表', 5: '其他' }

const formData = reactive({
  user_id: '',
  device_type: '',
  brand_name: '',
  device_model: '',
  order_type: 'repair',
  service_type: 'shop',
  priority: 'medium',
  problem_description: '',
  custom_description: '',
  estimated_price: 0,
  status: 'pending'
})

const formRules = {
  user_id: [{ required: true, message: '请选择下单用户', trigger: 'change' }],
  device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  problem_description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 5, message: '描述至少5个字符', trigger: 'blur' }
  ]
}

const statusTypeMap = {
  pending: 'info',
  quoted: 'warning',
  confirmed: '',
  processing: 'primary',
  review: 'warning',
  completed: 'success',
  cancelled: 'danger'
}
const statusTextMap = {
  pending: '待处理',
  quoted: '已报价',
  confirmed: '已确认',
  processing: '维修中',
  review: '待评价',
  completed: '已完成',
  cancelled: '已取消'
}

const getStatusType = (status) => statusTypeMap[status] || 'info'
const getStatusText = (status) => statusTextMap[status] || status || '-'

const deviceTypeText = (type) => {
  if (type === null || type === undefined || type === '') return '-'
  const found = deviceTypes.value.find((dt) => dt.id === Number(type))
  return found ? found.name : (deviceTypeMap[type] || '未知')
}

const formatMoney = (value) => {
  const num = Number(value)
  if (value === null || value === undefined || value === '' || Number.isNaN(num)) return '-'
  return `¥${num.toFixed(2)}`
}

// 加载订单列表
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.limit
    }
    if (searchForm.order_id) params.order_id = searchForm.order_id
    if (searchForm.phone) params.phone = searchForm.phone
    if (searchForm.status) params.status = searchForm.status

    const res = await getMiniAdminOrders(params)
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('加载订单列表失败', error)
  } finally {
    loading.value = false
  }
}

const fetchDeviceTypes = async () => {
  try {
    const res = await getMiniAdminCommonProblemDeviceTypes()
    deviceTypes.value = res.data || []
  } catch (error) {
    console.warn('[ManualOrders] 加载设备类型失败，使用兜底字典:', error)
  }
}

// 远程搜索小程序用户
const searchUsers = async (keyword) => {
  if (!keyword) {
    userOptions.value = []
    return
  }
  userSearchLoading.value = true
  try {
    const res = await getMiniAdminUsers({ page: 1, pageSize: 20, keyword })
    userOptions.value = res.data?.items || res.data?.list || []
  } catch (error) {
    console.error('搜索用户失败', error)
  } finally {
    userSearchLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    order_id: '',
    phone: '',
    status: ''
  })
  handleSearch()
}

// 创建订单
const handleCreate = () => {
  dialogMode.value = 'create'
  editingId.value = null
  Object.assign(formData, {
    user_id: '',
    device_type: '',
    brand_name: '',
    device_model: '',
    order_type: 'repair',
    service_type: 'shop',
    priority: 'medium',
    problem_description: '',
    custom_description: '',
    estimated_price: 0,
    status: 'pending'
  })
  userOptions.value = []
  dialogVisible.value = true
}

// 编辑订单
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  Object.assign(formData, {
    device_type: row.device_type,
    brand_name: row.brand_name || '',
    device_model: row.device_model || '',
    order_type: row.order_type || 'repair',
    service_type: row.service_type || 'shop',
    priority: row.priority || 'medium',
    problem_description: row.problem_description || '',
    custom_description: row.custom_description || '',
    estimated_price: Number(row.estimated_price) || 0,
    status: row.status
  })
  dialogVisible.value = true
}

// 查看详情
const handleView = (row) => {
  currentOrder.value = row
  viewDialogVisible.value = true
}

// 删除订单
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除订单 ${row.order_id} 吗？删除后不可恢复`, '提示', {
      type: 'warning'
    })
    await deleteMiniAdminResource('orders', row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消或删除失败（失败已在拦截器提示）
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createMiniAdminOrder({
        user_id: formData.user_id,
        device_type: formData.device_type,
        brand_name: formData.brand_name,
        device_model: formData.device_model,
        order_type: formData.order_type,
        service_type: formData.service_type,
        priority: formData.priority,
        problem_description: formData.problem_description,
        custom_description: formData.custom_description,
        estimated_price: formData.estimated_price,
        status: 'pending'
      })
      ElMessage.success('订单创建成功（已写入小程序订单库）')
    } else {
      await updateMiniAdminOrder(editingId.value, {
        device_type: formData.device_type,
        brand_name: formData.brand_name,
        device_model: formData.device_model,
        order_type: formData.order_type,
        service_type: formData.service_type,
        priority: formData.priority,
        problem_description: formData.problem_description,
        custom_description: formData.custom_description,
        estimated_price: formData.estimated_price,
        status: formData.status
      })
      ElMessage.success('订单已更新')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
  fetchDeviceTypes()
})
</script>

<style lang="scss" scoped>
.manual-orders-page {
  .search-form {
    margin-bottom: 16px;
  }

  .toolbar {
    margin-bottom: 16px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
