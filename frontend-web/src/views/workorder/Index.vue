<template>
  <div class="workorder-page">
    <el-card>
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入工单号" clearable />
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="searchForm.keyword" placeholder="设备名称/编号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待派单" :value="0" />
            <el-option label="已派单" :value="1" />
            <el-option label="维修中" :value="2" />
            <el-option label="待验收" :value="3" />
            <el-option label="已完成" :value="4" />
            <el-option label="已关闭" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部" clearable>
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
            <el-option label="紧急" :value="4" />
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
          新建工单
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
      >
        <el-table-column prop="order_no" label="工单号" width="150" />
        <el-table-column label="设备" width="200">
          <template #default="{ row }">
            {{ row.device?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fault_type" label="故障类型" width="120" />
        <el-table-column prop="fault_description" label="故障描述" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="维修人" width="120">
          <template #default="{ row }">
            {{ row.assigned_user?.real_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="[0, 1].includes(row.status)"
              link
              type="primary"
              @click="handleAssign(row)"
            >
              指派
            </el-button>
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
    </el-card>

    <!-- 查看/编辑对话框 -->
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
        <el-form-item label="设备" prop="device_id">
          <el-select
            v-model="formData.device_id"
            placeholder="请选择设备"
            filterable
            :disabled="isView"
            style="width: 100%"
          >
            <el-option
              v-for="device in deviceList"
              :key="device.id"
              :label="`${device.name} (${device.asset_code})`"
              :value="device.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="故障类型" prop="fault_type">
          <el-input
            v-model="formData.fault_type"
            placeholder="如：电气故障、机械故障等"
            :disabled="isView"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority" :disabled="isView">
            <el-radio :label="1">低</el-radio>
            <el-radio :label="2">中</el-radio>
            <el-radio :label="3">高</el-radio>
            <el-radio :label="4">紧急</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="故障描述" prop="fault_description">
          <el-input
            v-model="formData.fault_description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述故障情况"
            :disabled="isView"
          />
        </el-form-item>

        <el-form-item label="现场照片">
          <image-upload v-model="formData.images" :disabled="isView" />
        </el-form-item>
      </el-form>

      <template #footer v-if="!isView">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 指派对话框 -->
    <el-dialog v-model="assignDialogVisible" title="指派维修人" width="500px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="维修人">
          <el-select v-model="assignForm.assigned_to" placeholder="请选择维修人" style="width: 100%">
            <el-option
              v-for="engineer in engineerList"
              :key="engineer.id"
              :label="engineer.real_name"
              :value="engineer.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getWorkOrderList, createWorkOrder, deleteWorkOrder, assignWorkOrder } from '@/api/workorder'
import { getDeviceList } from '@/api/device'
import { getAvailableEngineers } from '@/api/engineer'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const deviceList = ref([])
const engineerList = ref([])

const searchForm = reactive({
  order_no: '',
  keyword: '',
  status: '',
  priority: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMode = ref('') // create, view
const formRef = ref(null)
const formData = reactive({
  device_id: '',
  fault_type: '',
  fault_description: '',
  priority: 2,
  images: []
})

const formRules = {
  device_id: [{ required: true, message: '请选择设备', trigger: 'change' }],
  fault_type: [{ required: true, message: '请输入故障类型', trigger: 'blur' }],
  fault_description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 5, message: '描述至少5个字符', trigger: 'blur' }
  ]
}

// 指派对话框
const assignDialogVisible = ref(false)
const assignForm = reactive({
  id: null,
  assigned_to: ''
})

const isView = computed(() => dialogMode.value === 'view')

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const res = await getWorkOrderList(params)
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('加载工单列表失败', error)
  } finally {
    loading.value = false
  }
}

// 加载设备列表
const loadDevices = async () => {
  try {
    const res = await getDeviceList({ limit: 1000 })
    deviceList.value = res.list || []
  } catch (error) {
    console.error('加载设备列表失败', error)
  }
}

// 加载工程师列表
const loadEngineers = async () => {
  try {
    const res = await getAvailableEngineers()
    engineerList.value = res.list || []
  } catch (error) {
    console.error('加载工程师列表失败', error)
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
    keyword: '',
    status: '',
    priority: ''
  })
  handleSearch()
}

// 新建
const handleCreate = () => {
  dialogMode.value = 'create'
  dialogTitle.value = '新建工单'
  Object.assign(formData, {
    device_id: '',
    fault_type: '',
    fault_description: '',
    priority: 2,
    images: []
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row) => {
  dialogMode.value = 'view'
  dialogTitle.value = '工单详情'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该工单吗？', '提示', {
      type: 'warning'
    })
    await deleteWorkOrder(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消
  }
}

// 指派
const handleAssign = (row) => {
  assignForm.id = row.id
  assignForm.assigned_to = row.assigned_to || ''
  assignDialogVisible.value = true
}

// 提交指派
const handleAssignSubmit = async () => {
  if (!assignForm.assigned_to) {
    ElMessage.warning('请选择维修人')
    return
  }
  try {
    await assignWorkOrder(assignForm.id, { assigned_to: assignForm.assigned_to })
    ElMessage.success('指派成功')
    assignDialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await createWorkOrder(formData)
    ElMessage.success('创建成功')
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

// 优先级
const getPriorityType = (priority) => {
  const map = { 1: '', 2: 'info', 3: 'warning', 4: 'danger' }
  return map[priority] || ''
}

const getPriorityText = (priority) => {
  const map = { 1: '低', 2: '中', 3: '高', 4: '紧急' }
  return map[priority] || '未知'
}

// 状态
const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'warning', 2: 'primary', 3: '', 4: 'success', 5: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { 0: '待派单', 1: '已派单', 2: '维修中', 3: '待验收', 4: '已完成', 5: '已关闭' }
  return map[status] || '未知'
}

onMounted(() => {
  loadData()
  loadDevices()
  loadEngineers()
})
</script>

<style lang="scss" scoped>
.workorder-page {
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
}
</style>
