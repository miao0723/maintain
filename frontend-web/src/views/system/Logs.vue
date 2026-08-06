<template>
  <div class="logs-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日志类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="登录日志" value="login" />
            <el-option label="操作日志" value="operation" />
            <el-option label="系统日志" value="system" />
            <el-option label="错误日志" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="请输入" clearable />
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
          <el-button type="danger" @click="handleClearLog">清空日志</el-button>
          <el-button type="info" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="log_type" label="日志类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.log_type)">
              {{ getTypeText(row.log_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP 地址" width="140" />
        <el-table-column prop="created_at" label="操作时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
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

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="日志 ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="日志类型">
          <el-tag :type="getTypeColor(currentLog.log_type)">
            {{ getTypeText(currentLog.log_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作内容" :span="2">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="IP 地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre style="max-height: 200px; overflow: auto;">{{ formatJson(currentLog.params) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2" v-if="currentLog.result">
          <pre style="max-height: 200px; overflow: auto;">{{ formatJson(currentLog.result) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getSystemLogList,
  clearSystemLogs,
  exportSystemLogs
} from '@/api/logs'

const searchForm = reactive({
  type: '',
  operator: '',
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
const currentLog = ref(null)

const getTypeColor = (type) => {
  const map = {
    login: 'success',
    operation: 'primary',
    system: 'info',
    error: 'danger'
  }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = {
    login: '登录日志',
    operation: '操作日志',
    system: '系统日志',
    error: '错误日志'
  }
  return map[type] || type
}

const formatJson = (data) => {
  try {
    return JSON.stringify(JSON.parse(data || '{}'), null, 2)
  } catch {
    return data || '{}'
  }
}

// 获取日志列表
const fetchData = async () => {
  loading.value = true
  try {
    // 处理日期范围
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
      delete params.date_range
    }

    const res = await getSystemLogList(params)
    if (res.code === 200) {
      // 后端返回格式：data.items 或 data.list 或 data
      const data = res.data || {}
      const list = data.items || data.list || data || []
      tableData.value = Array.isArray(list) ? list : []
      pagination.total = data.total || 0
    } else {
      ElMessage.error(res.message || '获取日志列表失败')
      tableData.value = []
    }
  } catch (error) {
    console.error('获取日志列表失败:', error)
    ElMessage.error('获取日志列表失败')
    tableData.value = []
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
    type: '',
    operator: '',
    date_range: []
  })
  handleSearch()
}

const handleView = (row) => {
  currentLog.value = row
  detailDialogVisible.value = true
}

const handleClearLog = () => {
  ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复！', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await clearSystemLogs()
      if (res.code === 200) {
        ElMessage.success('日志已清空')
        fetchData()
      } else {
        ElMessage.error(res.message || '清空失败')
      }
    } catch (error) {
      console.error('清空日志失败:', error)
      ElMessage.error('清空日志失败')
    }
  })
}

const handleExport = async () => {
  try {
    const params = { ...searchForm }
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    const res = await exportSystemLogs(params)
    if (res.code === 200) {
      ElMessage.success('导出成功')
    } else {
      ElMessage.error(res.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.logs-container {
  .search-form {
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  pre {
    background: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
  }
}
</style>
