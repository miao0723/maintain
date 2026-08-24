<template>
  <div class="order-devices-container">
    <div class="page-header">
      <h2>设备信息</h2>
      <span class="subtitle">维修订单关联的设备明细（设备名称 / 序列号 / 设备来源 / 数量 / 单位 / 备注 / 状态）</span>
    </div>
    <el-card shadow="never">
      <!-- 搜索 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="设备名称">
          <el-input v-model="searchForm.name" placeholder="请输入设备名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="订单ID">
          <el-input-number v-model="searchForm.order_id" :min="1" :controls="false" placeholder="关联订单ID" clearable />
        </el-form-item>
        <el-form-item label="设备来源">
          <el-select v-model="searchForm.source" placeholder="请选择" clearable style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option v-for="s in sourceOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="全部" value="" />
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增设备明细
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="关联订单" min-width="150">
          <template #default="{ row }">
            <span>#{{ row.order_id }}</span>
            <span v-if="row.order_code" style="color:#64748b;">（{{ row.order_code }}）</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="设备名称" min-width="160" />
        <el-table-column prop="serial_no" label="序列号" min-width="140" />
        <el-table-column prop="source" label="设备来源" width="120" />
        <el-table-column label="数量/单位" width="120">
          <template #default="{ row }">
            {{ row.quantity }}{{ row.unit ? ' ' + row.unit : '' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备明细' : '新增设备明细'"
      width="720px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="关联订单" prop="order_id">
          <el-select
            v-model="form.order_id"
            placeholder="请选择订单"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="o in orderOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号" prop="serial_no">
              <el-input v-model="form.serial_no" placeholder="可空（同一设备可复用于多订单）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备来源" prop="source">
              <el-select v-model="form.source" placeholder="可空，可后补" clearable filterable allow-create style="width: 100%;">
                <el-option v-for="s in sourceOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="0" :precision="2" :step="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如：台/个/套，默认 台" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="可空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getOrderDeviceList,
  getOrderDeviceDetail,
  createOrderDevice,
  updateOrderDevice,
  deleteOrderDevice
} from '@/api/orderDevice'
import { getRepairOrderList } from '@/api/repairOrder'

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const sourceOptions = ['采购', '客户自备', '租赁', '调拨', '赠送']
const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'maintenance', label: '维修中' },
  { value: 'idle', label: '闲置' },
  { value: 'scrapped', label: '报废' }
]
const statusMap = Object.fromEntries(statusOptions.map(o => [o.value, o.label]))
const statusColorMap = { normal: 'success', maintenance: 'warning', idle: 'info', scrapped: 'danger' }

const orderOptions = ref([])

const searchForm = reactive({ name: '', order_id: '', source: '', status: '' })

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const tableData = ref([])

const form = reactive({
  id: null,
  order_id: '',
  name: '',
  serial_no: '',
  source: '',
  quantity: 1,
  unit: '台',
  remarks: '',
  status: 'normal'
})

const rules = {
  order_id: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const statusLabel = (s) => statusMap[s] || s || '-'
const statusTagType = (s) => statusColorMap[s] || 'info'

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOrderDeviceList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    if (res.code === 0 || res.code === 200) {
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchOrders = async () => {
  try {
    const res = await getRepairOrderList(1, 200)
    const items = res.data?.list || res.data?.items || []
    orderOptions.value = items.map(o => ({
      value: o.id,
      label: `#${o.id}` + (o.order_id ? `（${o.order_id}）` : '')
    }))
  } catch (e) {
    orderOptions.value = []
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.order_id = ''
  searchForm.source = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    order_id: '',
    name: '',
    serial_no: '',
    source: '',
    quantity: 1,
    unit: '台',
    remarks: '',
    status: 'normal'
  })
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const res = await getOrderDeviceDetail(row.id)
    const data = res.data || row
    Object.assign(form, {
      id: data.id,
      order_id: data.order_id,
      name: data.name,
      serial_no: data.serial_no || '',
      source: data.source || '',
      quantity: Number(data.quantity) || 1,
      unit: data.unit || '台',
      remarks: data.remarks || '',
      status: data.status || 'normal'
    })
    isEdit.value = true
    dialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该设备明细吗？', '提示', { type: 'warning' })
    const res = await deleteOrderDevice(row.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...form }
    if (isEdit.value) delete payload.id
    const res = isEdit.value
      ? await updateOrderDevice(form.id, payload)
      : await createOrderDevice(payload)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchOrders()
  fetchData()
})
</script>

<style lang="scss" scoped>
.order-devices-container {
  .page-header {
    margin-bottom: 16px;
    h2 {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
    }
    .subtitle {
      color: #64748b;
      font-size: 13px;
    }
  }
  .search-form {
    margin-bottom: 20px;
  }
  .toolbar {
    margin-bottom: 20px;
  }
  :deep(.el-pagination) {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
