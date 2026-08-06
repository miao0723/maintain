<template>
  <div class="refunds-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="退款编号">
          <el-input v-model="searchForm.refund_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="交易编号">
          <el-input v-model="searchForm.transaction_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="退款状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="退款中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
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

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="refund_no" label="退款编号" width="180" />
        <el-table-column prop="transaction_no" label="交易编号" width="180" />
        <el-table-column prop="amount" label="退款金额" width="120">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column prop="processed_at" label="处理时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              link
              type="success"
              @click="handleApprove(row)"
              v-if="row.status === 'pending'"
            >
              同意
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleReject(row)"
              v-if="row.status === 'pending'"
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
        <el-descriptions-item label="退款编号">{{ currentRefund.refund_no }}</el-descriptions-item>
        <el-descriptions-item label="交易编号">{{ currentRefund.transaction_no }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">¥{{ currentRefund.amount.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRefund.status)">
            {{ getStatusText(currentRefund.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentRefund.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentRefund.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentRefund.processed_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRefund.processor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款原因" :span="2">{{ currentRefund.reason }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRefund.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  refund_no: '',
  transaction_no: '',
  status: '',
  date_range: []
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

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '退款中',
    completed: '已完成',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取退款记录列表
    tableData.value = [
      {
        id: 1,
        refund_no: 'REF20240324001',
        transaction_no: 'TXN20240324001',
        amount: 500.00,
        reason: '服务不满意',
        status: 'completed',
        applicant: '张三',
        created_at: '2024-03-24 14:30:00',
        processed_at: '2024-03-24 15:00:00',
        processor: '管理员',
        notes: '已全额退款'
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取退款记录失败:', error)
    ElMessage.error('获取退款记录失败')
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
    refund_no: '',
    transaction_no: '',
    status: '',
    date_range: []
  })
  handleSearch()
}

const handleView = (row) => {
  currentRefund.value = row
  detailDialogVisible.value = true
}

const handleApprove = (row) => {
  ElMessageBox.confirm(`确定同意退款 ¥${row.amount.toFixed(2)} 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API同意退款
      ElMessage.success('退款已批准')
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
      // TODO: 调用API拒绝退款
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
