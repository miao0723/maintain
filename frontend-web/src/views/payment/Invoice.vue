<template>
  <div class="invoice-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="发票号码">
          <el-input v-model="searchForm.invoice_no" placeholder="请输入发票号码" clearable />
        </el-form-item>
        <el-form-item label="发票类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="增值税专用发票" value="special" />
            <el-option label="增值税普通发票" value="normal" />
            <el-option label="电子发票" value="electronic" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待开具" value="pending" />
            <el-option label="已开具" value="issued" />
            <el-option label="已作废" value="void" />
          </el-select>
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
          新增发票
        </el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">开票总额</div>
              <div class="stat-value">¥{{ totalAmount.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">待开具</div>
              <div class="stat-value stat-warning">{{ pendingCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">已开具</div>
              <div class="stat-value stat-success">{{ issuedCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-item">
              <div class="stat-label">本月开票</div>
              <div class="stat-value stat-info">¥{{ monthAmount.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="invoice_no" label="发票号码" min-width="180" />
        <el-table-column prop="type" label="发票类型" width="150">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="company_name" label="购买方名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="tax_no" label="纳税人识别号" width="180" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税额" width="120">
          <template #default="{ row }">
            ¥{{ row.tax_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="价税合计" width="120">
          <template #default="{ row }">
            <span class="total-text">¥{{ row.total_amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="issue_date" label="开票日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="success"
              @click="handleIssue(row)"
            >
              开票
            </el-button>
            <el-button
              v-if="row.status === 'issued'"
              link
              type="danger"
              @click="handleVoid(row)"
            >
              作废
            </el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑发票' : '新增发票'"
      width="800px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-divider content-position="left">发票信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发票类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择发票类型" style="width: 100%;">
                <el-option label="增值税专用发票" value="special" />
                <el-option label="增值税普通发票" value="normal" />
                <el-option label="电子发票" value="electronic" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票号码" prop="invoice_no">
              <el-input v-model="form.invoice_no" placeholder="请输入发票号码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额（不含税）" prop="amount">
              <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                @change="calculateTotal"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率" prop="tax_rate">
              <el-select v-model="form.tax_rate" placeholder="请选择税率" @change="calculateTotal" style="width: 100%;">
                <el-option label="13%" :value="0.13" />
                <el-option label="9%" :value="0.09" />
                <el-option label="6%" :value="0.06" />
                <el-option label="3%" :value="0.03" />
                <el-option label="0%" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="税额">
              <el-input v-model="form.tax_amount" disabled style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价税合计">
              <el-input v-model="form.total_amount" disabled style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="开票日期" prop="issue_date">
          <el-date-picker
            v-model="form.issue_date"
            type="date"
            placeholder="选择开票日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>

        <el-divider content-position="left">购买方信息</el-divider>
        <el-form-item label="购买方名称" prop="company_name">
          <el-input v-model="form.company_name" placeholder="请输入公司名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纳税人识别号" prop="tax_no">
              <el-input v-model="form.tax_no" placeholder="请输入纳税人识别号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址电话">
              <el-input v-model="form.address_phone" placeholder="请输入地址电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行">
              <el-input v-model="form.bank_name" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="form.bank_account" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="发票详情" width="800px">
      <el-descriptions :column="2" border v-if="currentInvoice">
        <el-descriptions-item label="发票号码">{{ currentInvoice.invoice_no }}</el-descriptions-item>
        <el-descriptions-item label="发票类型">{{ getTypeText(currentInvoice.type) }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentInvoice.amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="税率">{{ (currentInvoice.tax_rate * 100).toFixed(0) }}%</el-descriptions-item>
        <el-descriptions-item label="税额">¥{{ currentInvoice.tax_amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="价税合计">¥{{ currentInvoice.total_amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="开票日期" :span="2">{{ currentInvoice.issue_date }}</el-descriptions-item>
        <el-descriptions-item label="购买方名称" :span="2">{{ currentInvoice.company_name }}</el-descriptions-item>
        <el-descriptions-item label="纳税人识别号">{{ currentInvoice.tax_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentInvoice.status)">
            {{ getStatusText(currentInvoice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址电话" :span="2">{{ currentInvoice.address_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ currentInvoice.bank_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账号">{{ currentInvoice.bank_account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentInvoice.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE = '/api'
const getHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentInvoice = ref(null)

const searchForm = reactive({
  invoice_no: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const statisticsData = ref({
  total_amount: 0,
  pending_count: 0,
  issued_count: 0,
  month_amount: 0
})

const form = reactive({
  id: null,
  invoice_no: '',
  type: 'normal',
  amount: 0,
  tax_rate: 0.13,
  tax_amount: 0,
  total_amount: 0,
  issue_date: '',
  company_name: '',
  tax_no: '',
  address_phone: '',
  bank_name: '',
  bank_account: '',
  remark: '',
  status: 'pending'
})

const rules = {
  type: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
  invoice_no: [{ required: true, message: '请输入发票号码', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  tax_rate: [{ required: true, message: '请选择税率', trigger: 'change' }],
  issue_date: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
  company_name: [{ required: true, message: '请输入购买方名称', trigger: 'blur' }],
  tax_no: [{ required: true, message: '请输入纳税人识别号', trigger: 'blur' }]
}

// 统计数据
const totalAmount = computed(() => statisticsData.value.total_amount)
const pendingCount = computed(() => statisticsData.value.pending_count)
const issuedCount = computed(() => statisticsData.value.issued_count)
const monthAmount = computed(() => statisticsData.value.month_amount)

const getTypeText = (type) => {
  const texts = {
    special: '增值税专用发票',
    normal: '增值税普通发票',
    electronic: '电子发票'
  }
  return texts[type] || '未知'
}

const getStatusType = (status) => {
  const types = { pending: 'warning', issued: 'success', void: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待开具', issued: '已开具', void: '已作废' }
  return texts[status] || '未知'
}

const calculateTotal = () => {
  form.tax_amount = parseFloat((form.amount * form.tax_rate).toFixed(2))
  form.total_amount = parseFloat((form.amount + form.tax_amount).toFixed(2))
}

const fetchStatistics = async () => {
  try {
    const response = await axios.get(`${API_BASE}/payment/invoices/statistics`, {
      headers: getHeaders()
    })
    if (response.data.code === 200) {
      statisticsData.value = response.data.data
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
      invoice_no: searchForm.invoice_no,
      type: searchForm.type,
      status: searchForm.status
    }

    const response = await axios.get(`${API_BASE}/payment/invoices`, {
      headers: getHeaders(),
      params
    })

    if (response.data.code === 200) {
      tableData.value = response.data.data.list || []
      pagination.total = response.data.data.total
    }
  } catch (error) {
    console.error('获取发票列表失败:', error)
    ElMessage.error('获取发票列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.invoice_no = ''
  searchForm.type = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  form.id = null
  form.invoice_no = ''
  form.type = 'normal'
  form.amount = 0
  form.tax_rate = 0.13
  form.tax_amount = 0
  form.total_amount = 0
  form.issue_date = ''
  form.company_name = ''
  form.tax_no = ''
  form.address_phone = ''
  form.bank_name = ''
  form.bank_account = ''
  form.remark = ''
  form.status = 'pending'
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleView = (row) => {
  currentInvoice.value = row
  detailDialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(form, row)
  isEdit.value = true
  dialogVisible.value = true
}

const handleIssue = async (row) => {
  ElMessageBox.confirm('确认开具该发票？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
      const response = await axios.post(`${API_BASE}/payment/invoices/${row.id}/issue`, {}, {
        headers: getHeaders()
      })
      if (response.data.code === 200) {
        ElMessage.success('开票成功')
        fetchData()
        fetchStatistics()
      }
    } catch (error) {
      console.error('开票失败:', error)
      ElMessage.error('开票失败')
    }
  }).catch(() => {})
}

const handleVoid = async (row) => {
  ElMessageBox.confirm('确定要作废该发票吗？作废后不可恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.post(`${API_BASE}/payment/invoices/${row.id}/void`, {}, {
        headers: getHeaders()
      })
      if (response.data.code === 200) {
        ElMessage.success('发票已作废')
        fetchData()
        fetchStatistics()
      }
    } catch (error) {
      console.error('作废失败:', error)
      ElMessage.error('作废失败')
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定要删除该发票吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`${API_BASE}/payment/invoices/${row.id}`, {
        headers: getHeaders()
      })
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchData()
        fetchStatistics()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleExport = async () => {
  try {
    const params = {
      invoice_no: searchForm.invoice_no,
      type: searchForm.type,
      status: searchForm.status,
      format: 'xlsx'
    }

    const response = await axios.get(`${API_BASE}/payment/invoices/export`, {
      headers: getHeaders(),
      params,
      responseType: 'blob'
    })

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `发票记录_${new Date().getTime()}.xlsx`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const response = isEdit.value
      ? await axios.put(`${API_BASE}/payment/invoices/${form.id}`, form, {
          headers: getHeaders()
        })
      : await axios.post(`${API_BASE}/payment/invoices`, form, {
          headers: getHeaders()
        })

    if (response.data.code === 200 || response.data.code === 201) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
      fetchStatistics()
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
  }
}

onMounted(() => {
  fetchData()
  fetchStatistics()
})
</script>

<style lang="scss" scoped>
.invoice-container {
  .search-form {
    margin-bottom: 20px;
  }

  .toolbar {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-item {
      text-align: center;

      .stat-label {
        color: #909399;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }

      .stat-success {
        color: #67C23A;
      }

      .stat-warning {
        color: #E6A23C;
      }

      .stat-info {
        color: #409EFF;
      }
    }
  }

  .amount-text {
    color: #409EFF;
    font-weight: 500;
  }

  .total-text {
    color: #F56C6C;
    font-weight: bold;
  }

  :deep(.el-pagination) {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
