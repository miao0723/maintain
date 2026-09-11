<template>
  <div class="stocktaking-container">
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
          新增盘点
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
        <el-table-column prop="before_stock" label="账面数量" width="100" align="right" />
        <el-table-column prop="after_stock" label="实际数量" width="100" align="right" />
        <el-table-column label="差异" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.quantity > 0 ? '#67C23A' : row.quantity < 0 ? '#F56C6C' : '' }">
              {{ diffText(row.quantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="盘点时间" width="170" />
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

    <!-- 新增盘点对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增盘点"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="备件" prop="part_id">
          <el-select v-model="form.part_id" placeholder="请选择备件" filterable style="width: 100%">
            <el-option
              v-for="part in parts"
              :key="part.id"
              :label="`${part.part_name} (${part.part_code}) - 账面:${part.stock_quantity}`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账面数量">
          <el-text type="info">{{ selectedPart?.stock_quantity ?? '-' }}</el-text>
        </el-form-item>
        <el-form-item label="实际数量" prop="actual_quantity">
          <el-input-number v-model="form.actual_quantity" :min="0" />
        </el-form-item>
        <el-form-item label="预计差异">
          <el-text :type="previewDiff > 0 ? 'success' : previewDiff < 0 ? 'danger' : 'info'">
            {{ diffText(previewDiff) }}
          </el-text>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="如：季度盘点、损耗原因等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 盘点详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="盘点详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="盘点时间">{{ currentRecord.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备件名称">{{ currentRecord.part?.part_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备件编号">{{ currentRecord.part?.part_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账面数量">{{ currentRecord.before_stock }}</el-descriptions-item>
        <el-descriptions-item label="实际数量">{{ currentRecord.after_stock }}</el-descriptions-item>
        <el-descriptions-item label="差异">{{ diffText(currentRecord.quantity) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.notes || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPartsList, getStockRecords, partsStocktake } from '@/api/inventory'

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
  actual_quantity: 0,
  notes: ''
})

const rules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  actual_quantity: [{ required: true, message: '请输入实际数量', trigger: 'blur' }]
}

const parts = ref([])

const selectedPart = computed(() => parts.value.find((p) => p.id === form.part_id) || null)

const previewDiff = computed(() => {
  if (!selectedPart.value || form.actual_quantity === null || form.actual_quantity === undefined) return 0
  return Number(form.actual_quantity) - Number(selectedPart.value.stock_quantity || 0)
})

const diffText = (diff) => {
  const num = Number(diff) || 0
  if (num > 0) return `+${num}（盘盈）`
  if (num < 0) return `${num}（盘亏）`
  return '0（一致）'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
      type: 3
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
    console.error('获取盘点记录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchParts = async () => {
  try {
    const res = await getPartsList({ page: 1, limit: 200 })
    parts.value = res.data?.list || []
  } catch (error) {
    console.error('获取备件列表失败:', error)
  }
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
    actual_quantity: 0,
    notes: ''
  })
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
    await partsStocktake(form.part_id, {
      actual_quantity: form.actual_quantity,
      remark: form.notes || null
    })
    ElMessage.success('盘点成功')
    dialogVisible.value = false
    fetchData()
    fetchParts()
  } catch (error) {
    console.error('盘点失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchParts()
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
}
</style>
