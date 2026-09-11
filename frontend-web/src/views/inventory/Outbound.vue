<template>
  <div class="outbound-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="备件">
          <el-select v-model="searchForm.part_id" placeholder="全部" clearable filterable style="width: 220px">
            <el-option
              v-for="part in parts"
              :key="part.id"
              :label="`${part.part_name} (${part.part_code})`"
              :value="part.id"
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

      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增出库
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column label="备件名称" min-width="150">
          <template #default="{ row }">{{ row.part?.part_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="备件编号" width="130">
          <template #default="{ row }">{{ row.part?.part_code || '-' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="出库数量" width="100" align="right" />
        <el-table-column label="库存变化" width="120" align="center">
          <template #default="{ row }">{{ row.before_stock }} → {{ row.after_stock }}</template>
        </el-table-column>
        <el-table-column prop="notes" label="备注（领用人/用途）" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="出库时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
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

    <!-- 新增出库对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增出库"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="备件" prop="part_id">
          <el-select v-model="form.part_id" placeholder="请选择备件" filterable style="width: 100%" @change="handlePartChange">
            <el-option
              v-for="part in parts"
              :key="part.id"
              :label="`${part.part_name} (${part.part_code}) - 库存:${part.stock_quantity}`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :max="maxQuantity" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="领用人" prop="receiver">
              <el-input v-model="form.receiver" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="form.purpose" placeholder="如：维修使用、日常消耗等" />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 出库详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="出库详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="出库时间">{{ currentRecord.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备件名称">{{ currentRecord.part?.part_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备件编号">{{ currentRecord.part?.part_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出库数量">{{ currentRecord.quantity }}</el-descriptions-item>
        <el-descriptions-item label="库存变化">{{ currentRecord.before_stock }} → {{ currentRecord.after_stock }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.notes || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPartsList, getStockRecords, partsOutbound } from '@/api/inventory'
import { getDepartmentList } from '@/api/departments'

const searchForm = reactive({
  part_id: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const formRef = ref(null)
const currentRecord = ref(null)
const submitLoading = ref(false)

const form = reactive({
  part_id: '',
  quantity: 1,
  receiver: '',
  department: '',
  purpose: '',
  notes: ''
})

const rules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入出库数量', trigger: 'blur' }],
  receiver: [{ required: true, message: '请输入领用人', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

const parts = ref([])
const departments = ref([])
const maxQuantity = ref(999)

// 将领用人/部门/用途合并写入备注（stock_records 无独立字段）
const buildRemark = () => {
  const segments = []
  if (form.receiver) segments.push(`领用人:${form.receiver}`)
  if (form.department) segments.push(`部门:${form.department}`)
  if (form.purpose) segments.push(`用途:${form.purpose}`)
  if (form.notes) segments.push(form.notes)
  return segments.join('；') || null
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      type: 2
    }
    if (searchForm.part_id) params.part_id = searchForm.part_id
    if (searchForm.date_range?.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    const res = await getStockRecords(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取出库记录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchParts = async () => {
  try {
    const res = await getPartsList({ page: 1, limit: 200, status: 1 })
    parts.value = res.data?.list || []
  } catch (error) {
    console.error('获取备件列表失败:', error)
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList({ page: 1, limit: 100 })
    departments.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const handlePartChange = (partId) => {
  const part = parts.value.find((p) => p.id === partId)
  maxQuantity.value = part ? Number(part.stock_quantity) || 0 : 999
  if (form.quantity > maxQuantity.value) form.quantity = maxQuantity.value
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    part_id: '',
    date_range: []
  })
  handleSearch()
}

const handleAdd = () => {
  Object.assign(form, {
    part_id: '',
    quantity: 1,
    receiver: '',
    department: '',
    purpose: '',
    notes: ''
  })
  maxQuantity.value = 999
  dialogVisible.value = true
}

const handleView = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await partsOutbound(form.part_id, {
      quantity: form.quantity,
      remark: buildRemark()
    })
    ElMessage.success('出库成功')
    dialogVisible.value = false
    fetchData()
    fetchParts()
  } catch (error) {
    console.error('出库失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchParts()
  fetchDepartments()
})
</script>

<style lang="scss" scoped>
.outbound-container {
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
