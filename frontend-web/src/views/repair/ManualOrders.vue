<template>
  <div class="manual-orders-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名">
        <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable>
          <el-option label="待派单" :value="0" />
          <el-option label="已派单" :value="1" />
          <el-option label="维修中" :value="2" />
          <el-option label="待验收" :value="3" />
          <el-option label="已完成" :value="4" />
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
        手动创建订单
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
    >
      <el-table-column prop="order_no" label="订单号" width="150" />
      <el-table-column prop="customer_name" label="客户姓名" width="120" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column prop="device_name" label="设备名称" width="150" show-overflow-tooltip />
      <el-table-column prop="fault_description" label="故障描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="amount" label="订单金额" width="100" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ (row.amount || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="订单来源" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="success" size="small">手动创建</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 0"
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
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="formData.device_name" placeholder="请输入设备名称" />
        </el-form-item>

        <el-form-item label="设备型号">
          <el-input v-model="formData.device_model" placeholder="请输入设备型号" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单类型">
              <el-select v-model="formData.order_type" placeholder="请选择订单类型" style="width: 100%">
                <el-option label="维修订单" value="repair" />
                <el-option label="旧件回收" value="recycle" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" :value="1" />
                <el-option label="中" :value="2" />
                <el-option label="高" :value="3" />
                <el-option label="紧急" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="故障描述" prop="fault_description">
          <el-input
            v-model="formData.fault_description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述故障情况"
          />
        </el-form-item>

        <el-form-item label="上门地址">
          <el-input v-model="formData.address" placeholder="请输入上门地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预约时间">
              <el-date-picker
                v-model="formData.appointment_time"
                type="datetime"
                placeholder="选择预约时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单金额">
              <el-input-number
                v-model="formData.amount"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="现场照片">
          <image-upload v-model="formData.images" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="订单详情"
      width="700px"
    >
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单来源">
          <el-tag type="success" size="small">手动创建</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.phone }}</el-descriptions-item>
        <el-descriptions-item label="设备名称" :span="2">{{ currentOrder.device_name }}</el-descriptions-item>
        <el-descriptions-item label="设备型号" :span="2">{{ currentOrder.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ currentOrder.fault_description }}</el-descriptions-item>
        <el-descriptions-item label="上门地址" :span="2">{{ currentOrder.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ currentOrder.appointment_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ (currentOrder.amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(currentOrder.priority)" size="small">
            {{ getPriorityText(currentOrder.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentOrder.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentOrder = ref(null)
const formRef = ref(null)

const searchForm = reactive({
  order_no: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const dialogMode = ref('create')
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '手动创建订单' : '编辑订单'
})

const formData = reactive({
  customer_name: '',
  phone: '',
  device_name: '',
  device_model: '',
  order_type: 'repair',
  priority: 2,
  fault_description: '',
  address: '',
  appointment_time: '',
  amount: 0,
  images: [],
  remark: ''
})

const formRules = {
  customer_name: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  device_name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  fault_description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 5, message: '描述至少5个字符', trigger: 'blur' }
  ]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    order_no: 'MO20260326001',
    customer_name: '赵六',
    phone: '13600136000',
    device_name: '起重机 QY25',
    device_model: 'QY25K5',
    order_type: 'repair',
    priority: 3,
    fault_description: '起重臂液压缸漏油，需要紧急维修',
    address: '深圳市南山区XX路XX号',
    appointment_time: '2026-03-27 09:00',
    amount: 6000,
    status: 0,
    source: 'manual',
    created_at: '2026-03-26 11:00:00',
    remark: '客户要求尽快上门',
    images: []
  },
  {
    id: 2,
    order_no: 'MO20260326002',
    customer_name: '孙七',
    phone: '13500135000',
    device_name: '推土机 TY220',
    device_model: 'TY220B',
    order_type: 'repair',
    priority: 2,
    fault_description: '履带松动，需要调整',
    address: '成都市武侯区XX路XX号',
    appointment_time: '2026-03-28 14:00',
    amount: 1500,
    status: 1,
    source: 'manual',
    created_at: '2026-03-26 13:30:00',
    remark: '',
    images: []
  }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    // const res = await getManualOrders({
    //   ...searchForm,
    //   page: pagination.page,
    //   limit: pagination.limit
    // })

    // 使用模拟数据
    tableData.value = mockData
    pagination.total = mockData.length
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    order_no: '',
    customer_name: '',
    status: ''
  })
  handleSearch()
}

// 创建订单
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, {
    customer_name: '',
    phone: '',
    device_name: '',
    device_model: '',
    order_type: 'repair',
    priority: 2,
    fault_description: '',
    address: '',
    appointment_time: '',
    amount: 0,
    images: [],
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑订单
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(formData, row)
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
    await ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
      type: 'warning'
    })
    // TODO: 调用删除API
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    // TODO: 调用创建/编辑API
    ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 状态类型
const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: '', 4: 'success' }
  return map[status] || ''
}

// 状态文本
const getStatusText = (status) => {
  const map = { 0: '待派单', 1: '已派单', 2: '维修中', 3: '待验收', 4: '已完成' }
  return map[status] || '未知'
}

// 优先级类型
const getPriorityType = (priority) => {
  const map = { 1: '', 2: 'info', 3: 'warning', 4: 'danger' }
  return map[priority] || ''
}

// 优先级文本
const getPriorityText = (priority) => {
  const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  return map[priority] || '未知'
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.manual-orders-page {
  .search-form {
    margin-bottom: 20px;
  }

  .toolbar {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .amount {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
