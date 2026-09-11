<template>
  <div class="refunds-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号/退款单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="searchForm.refund_status" placeholder="请选择" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="退款中" value="refunding" />
            <el-option label="已退款" value="refunded" />
            <el-option label="退款失败/已拒绝" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_id" label="订单号" width="160" fixed />
        <el-table-column prop="refund_no" label="退款单号" width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.refund_no || '-' }}</template>
        </el-table-column>
        <el-table-column prop="refund_amount" label="退款金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ formatAmount(row.refund_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actual_price" label="订单实付" width="110" align="right">
          <template #default="{ row }">¥{{ formatAmount(row.actual_price) }}</template>
        </el-table-column>
        <el-table-column prop="refund_reason" label="退款原因" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.refund_reason || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.refund_status)">
              {{ getStatusText(row.refund_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="申请用户" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.user_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column prop="refunded_at" label="退款到账时间" width="170">
          <template #default="{ row }">{{ row.refunded_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              link
              type="success"
              @click="handleApprove(row)"
              v-if="row.refund_status === 'failed' || row.refund_status === 'none'"
            >
              同意
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleReject(row)"
              v-if="row.refund_status === 'refunding'"
            >
              拒绝
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

    <!-- 退款详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="退款详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRefund">
        <el-descriptions-item label="订单号">{{ currentRefund.order_id }}</el-descriptions-item>
        <el-descriptions-item label="订单实付">¥{{ formatAmount(currentRefund.actual_price) }}</el-descriptions-item>
        <el-descriptions-item label="退款单号">{{ currentRefund.refund_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信退款单号">{{ currentRefund.wechat_refund_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">¥{{ formatAmount(currentRefund.refund_amount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRefund.refund_status)">
            {{ getStatusText(currentRefund.refund_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请用户">{{ currentRefund.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRefund.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentRefund.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ currentRefund.payment_status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款原因" :span="2">{{ currentRefund.refund_reason || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRefundList, reviewRefund } from '@/api/paymentRecords'

const searchForm = reactive({
  keyword: '',
  refund_status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentRefund = ref(null)

const formatAmount = (value) => {
  const num = Number(value)
  if (value === null || value === undefined || Number.isNaN(num)) return '0.00'
  return num.toFixed(2)
}

const getStatusType = (status) => {
  const map = {
    refunding: 'warning',
    refunded: 'success',
    failed: 'danger',
    none: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    refunding: '退款中',
    refunded: '已退款',
    failed: '退款失败/已拒绝',
    none: '待审核'
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
    if (searchForm.refund_status) params.refund_status = searchForm.refund_status
    const res = await getRefundList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取退款记录失败:', error)
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
    keyword: '',
    refund_status: ''
  })
  handleSearch()
}

const handleView = (row) => {
  currentRefund.value = row
  detailDialogVisible.value = true
}

const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确定同意订单 ${row.order_id} 退款 ¥${formatAmount(row.refund_amount || row.actual_price)} 吗？同意后将进入「退款中」，等待微信退款到账。`,
    '提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      await reviewRefund(row.id, { action: 'approve' })
      ElMessage.success('已同意退款，等待微信退款到账')
      fetchData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

const handleReject = (row) => {
  ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入拒绝原因'
  }).then(async ({ value }) => {
    try {
      await reviewRefund(row.id, { action: 'reject', admin_remark: value })
      ElMessage.success('已拒绝退款')
      fetchData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.refunds-container {
  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
