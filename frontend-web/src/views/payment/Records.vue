<template>
  <div class="payment-records-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号/商户单号/微信单号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="支付渠道">
          <el-select v-model="searchForm.payment_channel" placeholder="请选择" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="微信支付" value="wechat" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.payment_status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="已入账" value="paid" />
            <el-option label="部分退款" value="partial_refunded" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付时间">
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

      <!-- 统计信息 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="累计入账" :value="statistics.total_amount" precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日入账" :value="statistics.today_amount" precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="交易笔数" :value="statistics.total_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="有效交易占比" :value="statistics.success_rate" suffix="%" />
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="订单号" width="160" fixed />
        <el-table-column prop="wechat_transaction_id" label="微信交易单号" width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.wechat_transaction_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="入账金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收入类型" width="100" align="center">
          <template #default="{ row }">{{ incomeTypeText(row.income_type) }}</template>
        </el-table-column>
        <el-table-column label="支付渠道" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payment_channel === 'wechat' ? 'success' : 'info'">
              {{ channelText(row.payment_channel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payer_name" label="付款用户" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.payer_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.payment_status)">
              {{ statusText(row.payment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paid_at" label="支付时间" width="170">
          <template #default="{ row }">{{ row.paid_at || '-' }}</template>
        </el-table-column>
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

    <!-- 交易详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="交易详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="订单号">{{ currentRecord.order_no }}</el-descriptions-item>
        <el-descriptions-item label="收入类型">{{ incomeTypeText(currentRecord.income_type) }}</el-descriptions-item>
        <el-descriptions-item label="入账金额">¥{{ formatAmount(currentRecord.amount) }}</el-descriptions-item>
        <el-descriptions-item label="支付渠道">{{ channelText(currentRecord.payment_channel) }}</el-descriptions-item>
        <el-descriptions-item label="商户单号">{{ currentRecord.out_trade_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信交易单号">{{ currentRecord.wechat_transaction_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="付款用户">{{ currentRecord.payer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRecord.payer_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentRecord.payment_status)">
            {{ statusText(currentRecord.payment_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="结算状态">{{ currentRecord.settle_status === 'settled' ? '已结算' : '未结算' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentRecord.paid_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款时间">{{ currentRecord.refunded_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getTransactionList, getTransactionStatistics } from '@/api/paymentRecords'

const searchForm = reactive({
  keyword: '',
  payment_channel: '',
  payment_status: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const statistics = ref({
  total_amount: 0,
  today_amount: 0,
  total_count: 0,
  success_rate: 0
})

const tableData = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentRecord = ref(null)

const formatAmount = (value) => {
  const num = Number(value)
  if (value === null || value === undefined || Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}

const incomeTypeText = (type) => {
  const map = { order: '订单收入', adjust: '调整', compensation: '赔付' }
  return map[type] || type || '-'
}

const channelText = (channel) => {
  const map = { wechat: '微信支付' }
  return map[channel] || channel || '-'
}

const statusType = (status) => {
  const map = {
    paid: 'success',
    partial_refunded: 'warning',
    refunded: 'danger'
  }
  return map[status] || 'info'
}

const statusText = (status) => {
  const map = {
    paid: '已入账',
    partial_refunded: '部分退款',
    refunded: '已退款'
  }
  return map[status] || status || '-'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.payment_channel) params.payment_channel = searchForm.payment_channel
    if (searchForm.payment_status) params.payment_status = searchForm.payment_status
    if (searchForm.date_range?.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    const res = await getTransactionList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取交易记录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStatistics = async () => {
  try {
    const res = await getTransactionStatistics()
    if (res.data) statistics.value = { ...statistics.value, ...res.data }
  } catch (error) {
    console.error('获取交易统计失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    payment_channel: '',
    payment_status: '',
    date_range: []
  })
  handleSearch()
}

const handleView = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchData()
  fetchStatistics()
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
