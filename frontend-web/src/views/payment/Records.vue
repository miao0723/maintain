<template>
  <div class="payment-records-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="交易编号">
          <el-input v-model="searchForm.transaction_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="searchForm.payment_method" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank" />
            <el-option label="余额" value="balance" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待支付" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
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
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计信息 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="总交易额" :value="statistics.total_amount" precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日交易额" :value="statistics.today_amount" precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="交易笔数" :value="statistics.total_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="成功率" :value="statistics.success_rate" suffix="%" />
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="transaction_no" label="交易编号" width="180" />
        <el-table-column prop="order_no" label="订单编号" width="150" />
        <el-table-column prop="amount" label="交易金额" width="120">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="120">
          <template #default="{ row }">
            <el-tag :type="getPaymentMethodType(row.payment_method)">
              {{ getPaymentMethodText(row.payment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payer_name" label="付款人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column prop="completed_at" label="完成时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              link
              type="warning"
              @click="handleRefund(row)"
              v-if="row.status === 'completed'"
            >
              退款
            </el-button>
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

    <!-- 交易详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="交易详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="交易编号">{{ currentRecord.transaction_no }}</el-descriptions-item>
        <el-descriptions-item label="订单编号">{{ currentRecord.order_no }}</el-descriptions-item>
        <el-descriptions-item label="交易金额">¥{{ currentRecord.amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag :type="getPaymentMethodType(currentRecord.payment_method)">
            {{ getPaymentMethodText(currentRecord.payment_method) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="付款人">{{ currentRecord.payer_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRecord.status)">
            {{ getStatusText(currentRecord.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRecord.created_at }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentRecord.completed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog v-model="refundDialogVisible" title="交易退款" width="500px">
      <el-form :model="refundForm" :rules="refundRules" ref="refundFormRef" label-width="100px">
        <el-form-item label="退款金额">
          <el-input-number v-model="refundForm.amount" :min="0.01" :max="maxRefundAmount" :precision="2" />
          <span style="margin-left: 10px; color: #909399">最多可退 ¥{{ maxRefundAmount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  transaction_no: '',
  payment_method: '',
  status: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const statistics = ref({
  total_amount: 125680.50,
  today_amount: 3250.00,
  total_count: 1256,
  success_rate: 98.5
})

const tableData = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const refundDialogVisible = ref(false)
const refundFormRef = ref(null)
const currentRecord = ref(null)
const maxRefundAmount = ref(0)

const refundForm = reactive({
  amount: 0,
  reason: ''
})

const refundRules = {
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }]
}

const getPaymentMethodType = (method) => {
  const map = {
    wechat: 'success',
    alipay: 'primary',
    bank: 'warning',
    balance: 'info'
  }
  return map[method] || ''
}

const getPaymentMethodText = (method) => {
  const map = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '银行卡',
    balance: '余额'
  }
  return map[method] || method
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    completed: 'success',
    cancelled: 'warning',
    refunded: 'danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '待支付',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取交易记录列表
    tableData.value = [
      {
        id: 1,
        transaction_no: 'TXN20240324001',
        order_no: 'ORD20240324001',
        amount: 500.00,
        payment_method: 'wechat',
        payer_name: '张三',
        status: 'completed',
        created_at: '2024-03-24 10:30:00',
        completed_at: '2024-03-24 10:30:15',
        notes: '设备维修费'
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取交易记录失败:', error)
    ElMessage.error('获取交易记录失败')
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
    transaction_no: '',
    payment_method: '',
    status: '',
    date_range: []
  })
  handleSearch()
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleView = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

const handleRefund = (row) => {
  currentRecord.value = row
  maxRefundAmount.value = row.amount
  refundForm.amount = row.amount
  refundForm.reason = ''
  refundDialogVisible.value = true
}

const handleConfirmRefund = async () => {
  const valid = await refundFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    // TODO: 调用API处理退款
    ElMessage.success('退款成功')
    refundDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('退款失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.payment-records-container {
  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
