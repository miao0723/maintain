<template>
  <div class="mini-page">
    <el-card shadow="never">
      <div class="page-header">
        <div>
          <h2>同步日志</h2>
          <p>只读查看 repair.cmms_sync_log，并提供失败记录重试入口。</p>
        </div>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="同步类型">
          <el-select v-model="searchForm.sync_type" clearable placeholder="全部">
            <el-option label="进度" value="progress" />
            <el-option label="照片" value="photo" />
            <el-option label="视频" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.sync_status" clearable placeholder="全部">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="order_id" label="订单ID" width="100" />
        <el-table-column prop="cmms_order_id" label="CMMS订单ID" width="120" />
        <el-table-column prop="sync_type" label="同步类型" width="100" />
        <el-table-column prop="sync_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.sync_status === 'success' ? 'success' : 'danger'">
              {{ row.sync_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sync_error" label="错误信息" min-width="260" show-overflow-tooltip />
        <el-table-column prop="synced_at" label="同步时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="row.sync_status === 'failed'"
              link
              type="warning"
              @click="retryLog(row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="同步日志详情" width="760px" destroy-on-close>
      <el-descriptions v-loading="detailLoading" :column="2" border>
        <el-descriptions-item label="日志ID">{{ detail.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单ID">{{ detail.order_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="CMMS订单ID">{{ detail.cmms_order_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步类型">{{ detail.sync_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步状态">{{ detail.sync_status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="同步时间">{{ detail.synced_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2">
          <pre class="error-block">{{ detail.sync_error || '无' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button
          v-if="detail.sync_status === 'failed'"
          type="warning"
          :loading="retrying"
          @click="retryLog(detail)"
        >
          重试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMiniAdminSyncLogDetail,
  getMiniAdminSyncLogs,
  retryMiniAdminSyncLog
} from '@/api/miniAdmin'

const loading = ref(false)
const detailLoading = ref(false)
const dialogVisible = ref(false)
const retrying = ref(false)
const tableData = ref([])

const searchForm = reactive({
  sync_type: '',
  sync_status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const detail = reactive({
  id: null,
  order_id: null,
  cmms_order_id: null,
  sync_type: '',
  sync_status: '',
  sync_error: '',
  synced_at: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMiniAdminSyncLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sync_type: searchForm.sync_type,
      sync_status: searchForm.sync_status
    })
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.sync_type = ''
  searchForm.sync_status = ''
  handleSearch()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  loadData()
}

const openDetail = async (row) => {
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await getMiniAdminSyncLogDetail(row.id)
    Object.assign(detail, res.data || {})
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const retryLog = async (row) => {
  try {
    await ElMessageBox.confirm(`确定重试日志 #${row.id} 吗？`, '重试确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    retrying.value = true
    await retryMiniAdminSyncLog(row.id)
    ElMessage.success('已执行重试')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '重试失败')
    }
  } finally {
    retrying.value = false
  }
}

loadData()
</script>

<style scoped lang="scss">
.mini-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    p {
      margin: 8px 0 0;
      color: #64748b;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}

.error-block {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
