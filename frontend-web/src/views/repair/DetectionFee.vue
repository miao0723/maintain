<template>
  <div class="detection-fee-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="费用单号/订单号">
        <el-input v-model="searchForm.keyword" placeholder="请输入" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="待收款" value="unpaid" />
          <el-option label="已收款" value="paid" />
          <el-option label="已减免" value="waived" />
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

    <!-- 汇总卡片 -->
    <el-row :gutter="20" style="margin-bottom: 16px">
      <el-col :span="8">
        <el-card shadow="never"><el-statistic title="待收款合计" :value="summary.unpaid_amount" precision="2" prefix="¥" /></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><el-statistic title="已收款合计" :value="summary.paid_amount" precision="2" prefix="¥" /></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><el-statistic title="费用单总数" :value="pagination.total" /></el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建检测费用
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%" border>
      <el-table-column prop="fee_no" label="费用单号" width="170" fixed />
      <el-table-column prop="order_no" label="关联订单" width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.order_no || '-' }}</template>
      </el-table-column>
      <el-table-column prop="user_name" label="客户" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.user_name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="user_phone" label="联系电话" width="120">
        <template #default="{ row }">{{ row.user_phone || '-' }}</template>
      </el-table-column>
      <el-table-column prop="device_model" label="设备型号" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.device_model || '-' }}</template>
      </el-table-column>
      <el-table-column prop="amount" label="检测费用" width="110" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ formatAmount(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收款方式" width="100" align="center">
        <template #default="{ row }">{{ payMethodText(row.pay_method) }}</template>
      </el-table-column>
      <el-table-column prop="paid_at" label="收款时间" width="160">
        <template #default="{ row }">{{ row.paid_at || '-' }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status === 'unpaid'" link type="success" @click="handlePayment(row)">收款</el-button>
          <el-button v-if="row.status === 'unpaid'" link type="warning" @click="handleWaive(row)">减免</el-button>
          <el-button v-if="row.status !== 'paid'" link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新建检测费用对话框 -->
    <el-dialog v-model="dialogVisible" title="新建检测费用" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="关联订单" prop="order_id">
          <el-select
            v-model="formData.order_id"
            placeholder="输入订单号/型号/故障描述搜索"
            filterable
            remote
            :remote-method="searchOrders"
            :loading="orderSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="o in orderOptions"
              :key="o.id"
              :label="`${o.order_id}（${o.device_model || '未填型号'}）`"
              :value="o.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="formData.fee_type" style="width: 100%">
            <el-option label="检测费" value="detection" />
            <el-option label="其他费用" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用金额" prop="amount">
          <el-input-number v-model="formData.amount" :min="0.01" :precision="2" :step="50" style="width: 220px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="如：检测项目说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="检测费用详情" width="650px">
      <el-descriptions :column="2" border v-if="currentFee">
        <el-descriptions-item label="费用单号">{{ currentFee.fee_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentFee.status)" size="small">{{ getStatusText(currentFee.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ currentFee.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ currentFee.order_status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentFee.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentFee.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentFee.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="费用金额">¥{{ formatAmount(currentFee.amount) }}</el-descriptions-item>
        <el-descriptions-item label="收款方式">{{ payMethodText(currentFee.pay_method) }}</el-descriptions-item>
        <el-descriptions-item label="收款时间">{{ currentFee.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentFee.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentFee.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentFee?.status === 'unpaid'"
          type="success"
          @click="handlePayment(currentFee)"
        >
          收款
        </el-button>
      </template>
    </el-dialog>

    <!-- 收款对话框 -->
    <el-dialog v-model="payDialogVisible" title="确认收款" width="420px">
      <el-form label-width="100px">
        <el-form-item label="收款金额">
          <el-text>¥{{ formatAmount(currentFee?.amount) }}</el-text>
        </el-form-item>
        <el-form-item label="收款方式">
          <el-select v-model="payMethod" style="width: 100%">
            <el-option label="微信支付" value="wechat" />
            <el-option label="现金" value="cash" />
            <el-option label="转账" value="transfer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="submitLoading" @click="handleConfirmPay">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMiniAdminOrders } from '@/api/miniAdmin'
import { createServiceFee, deleteServiceFee, getServiceFeeList, payServiceFee } from '@/api/paymentRecords'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const payDialogVisible = ref(false)
const currentFee = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)
const orderSearchLoading = ref(false)
const payMethod = ref('wechat')

const searchForm = reactive({
  keyword: '',
  status: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const summary = ref({
  unpaid_amount: 0,
  paid_amount: 0
})

const orderOptions = ref([])

const formData = reactive({
  order_id: '',
  fee_type: 'detection',
  amount: 100,
  remark: ''
})

const formRules = {
  order_id: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  amount: [{ required: true, message: '请输入费用金额', trigger: 'blur' }]
}

const formatAmount = (value) => {
  const num = Number(value)
  if (value === null || value === undefined || Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}

const getStatusType = (status) => {
  const map = { unpaid: 'warning', paid: 'success', waived: 'info' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { unpaid: '待收款', paid: '已收款', waived: '已减免' }
  return map[status] || status || '-'
}

const payMethodText = (method) => {
  const map = { wechat: '微信支付', cash: '现金', transfer: '转账' }
  return map[method] || '-'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.limit,
      fee_type: 'detection'
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.date_range?.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    const res = await getServiceFeeList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
    if (res.data?.summary) summary.value = res.data.summary
  } catch (error) {
    console.error('加载检测费用列表失败', error)
  } finally {
    loading.value = false
  }
}

// 远程搜索订单
const searchOrders = async (keyword) => {
  if (!keyword) {
    orderOptions.value = []
    return
  }
  orderSearchLoading.value = true
  try {
    const res = await getMiniAdminOrders({ page: 1, pageSize: 20, keyword })
    orderOptions.value = res.data?.items || []
  } catch (error) {
    console.error('搜索订单失败', error)
  } finally {
    orderSearchLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    date_range: []
  })
  handleSearch()
}

const handleCreate = () => {
  Object.assign(formData, {
    order_id: '',
    fee_type: 'detection',
    amount: 100,
    remark: ''
  })
  orderOptions.value = []
  dialogVisible.value = true
}

const handleView = (row) => {
  currentFee.value = row
  viewDialogVisible.value = true
}

const handlePayment = (row) => {
  currentFee.value = row
  payMethod.value = 'wechat'
  payDialogVisible.value = true
}

const handleConfirmPay = async () => {
  submitLoading.value = true
  try {
    await payServiceFee(currentFee.value.id, { action: 'pay', pay_method: payMethod.value })
    ElMessage.success('已确认收款')
    payDialogVisible.value = false
    viewDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('收款失败', error)
  } finally {
    submitLoading.value = false
  }
}

const handleWaive = async (row) => {
  try {
    await ElMessageBox.confirm(`确定减免费用单 ${row.fee_no}（¥${formatAmount(row.amount)}）吗？`, '提示', {
      type: 'warning'
    })
    await payServiceFee(row.id, { action: 'waive' })
    ElMessage.success('已减免')
    loadData()
  } catch (error) {
    // 取消或失败
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除费用单 ${row.fee_no} 吗？`, '提示', { type: 'warning' })
    await deleteServiceFee(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 取消或失败
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await createServiceFee({
      order_id: formData.order_id,
      fee_type: formData.fee_type,
      amount: formData.amount,
      remark: formData.remark
    })
    ElMessage.success('费用单已创建')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('创建失败', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.detection-fee-page {
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

  .amount {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
