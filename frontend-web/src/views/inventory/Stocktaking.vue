<template>
  <div class="stocktaking-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="盘点中" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已作废" value="cancelled" />
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
          新增盘点
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="盘点单号" width="150" />
        <el-table-column prop="type" label="盘点类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'full' ? 'success' : 'primary'">
              {{ row.type === 'full' ? '全盘' : '抽盘' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="item_count" label="盘点品种" width="100" />
        <el-table-column prop="diff_count" label="差异数" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.diff_count > 0 ? '#F56C6C' : row.diff_count < 0 ? '#67C23A' : '' }">
              {{ row.diff_count > 0 ? `+${row.diff_count}` : row.diff_count }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="盘点人" width="100" />
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
            <el-button link type="success" @click="handleComplete(row)" v-if="row.status === 'pending'">完成</el-button>
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

    <!-- 盘点详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="盘点详情" width="900px">
      <div v-if="currentStocktaking">
        <el-descriptions :column="2" border class="mb-4">
          <el-descriptions-item label="盘点单号">{{ currentStocktaking.order_no }}</el-descriptions-item>
          <el-descriptions-item label="盘点类型">
            <el-tag :type="currentStocktaking.type === 'full' ? 'success' : 'primary'">
              {{ currentStocktaking.type === 'full' ? '全盘' : '抽盘' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="盘点人">{{ currentStocktaking.operator }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentStocktaking.status)">
              {{ getStatusText(currentStocktaking.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentStocktaking.created_at }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentStocktaking.completed_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentStocktaking.notes }}</el-descriptions-item>
        </el-descriptions>

        <h4>盘点明细</h4>
        <el-table :data="currentStocktaking.items" border>
          <el-table-column prop="part_name" label="备件名称" />
          <el-table-column prop="part_code" label="备件编号" />
          <el-table-column prop="book_quantity" label="账面数量" />
          <el-table-column prop="actual_quantity" label="实际数量" />
          <el-table-column prop="diff_quantity" label="差异数">
            <template #default="{ row }">
              <span :style="{ color: row.diff_quantity > 0 ? '#F56C6C' : row.diff_quantity < 0 ? '#67C23A' : '' }">
                {{ row.diff_quantity > 0 ? `+${row.diff_quantity}` : row.diff_quantity }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const searchForm = reactive({
  order_no: '',
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
const currentStocktaking = ref(null)

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '盘点中',
    completed: '已完成',
    cancelled: '已作废'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取盘点单列表
    tableData.value = [
      {
        id: 1,
        order_no: 'ST20240324001',
        type: 'full',
        item_count: 50,
        diff_count: -3,
        operator: '张三',
        status: 'completed',
        created_at: '2024-03-24 09:00:00',
        completed_at: '2024-03-24 12:00:00',
        notes: '季度盘点',
        items: [
          { part_name: '空气滤芯', part_code: 'PART001', book_quantity: 50, actual_quantity: 48, diff_quantity: -2, notes: '损耗' },
          { part_name: '机油滤芯', part_code: 'PART002', book_quantity: 30, actual_quantity: 29, diff_quantity: -1, notes: '' }
        ]
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取盘点单列表失败:', error)
    ElMessage.error('获取盘点单列表失败')
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
    order_no: '',
    status: '',
    date_range: []
  })
  handleSearch()
}

const handleAdd = () => {
  ElMessage.info('新增盘点功能开发中')
}

const handleView = (row) => {
  currentStocktaking.value = row
  detailDialogVisible.value = true
}

const handleComplete = (row) => {
  ElMessage.info('完成盘点功能开发中')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stocktaking-container {
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

  .mb-4 {
    margin-bottom: 16px;
  }

  h4 {
    margin: 16px 0;
    font-size: 16px;
    font-weight: bold;
  }
}
</style>
