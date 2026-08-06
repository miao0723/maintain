<template>
  <div class="parts-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="配件名称/编号" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="searchForm.category" placeholder="分类名称" clearable />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="searchForm.stock_status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="正常" value="normal" />
            <el-option label="低库存" value="low" />
            <el-option label="缺货" value="out" />
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
          新增配件
        </el-button>
        <el-button type="success" @click="handleInbound">入库</el-button>
        <el-button type="warning" @click="handleOutbound">出库</el-button>
        <el-button type="info" @click="handleExportExcel">导出 Excel</el-button>
        <el-button type="info" plain @click="handleExportCsv">导出 CSV</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="part_name" label="配件名称" min-width="150" />
        <el-table-column prop="part_code" label="配件编号" width="130" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="specification" label="规格型号" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="stock_quantity" label="库存数量" width="100">
          <template #default="{ row }">
            <el-tag :type="getStockType(row)">
              {{ row.stock_quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="min_stock" label="最小库存" width="100" />
        <el-table-column prop="purchase_price" label="采购单价" width="100">
          <template #default="{ row }">
            ¥{{ row.purchase_price }}
          </template>
        </el-table-column>
        <el-table-column prop="selling_price" label="销售单价" width="100">
          <template #default="{ row }">
            ¥{{ row.selling_price }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" width="120" />
        <el-table-column prop="image_url" label="图片" width="100">
          <template #default="{ row }">
            <el-image v-if="row.image_url" :src="row.image_url" fit="cover" style="width: 50px; height: 50px; border-radius: 4px;" :preview-src-list="[row.image_url]" preview-teleported />
            <span v-else style="color: #909399; font-size: 12px;">无图片</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleHistory(row)">记录</el-button>
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
      :title="isEdit ? '编辑配件' : '新增配件'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="配件名称" prop="part_name">
              <el-input v-model="form.part_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配件编号" prop="part_code">
              <el-input v-model="form.part_code" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="form.category" placeholder="配件分类名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="form.specification" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择">
                <el-option label="个" value="个" />
                <el-option label="件" value="件" />
                <el-option label="台" value="台" />
                <el-option label="套" value="套" />
                <el-option label="米" value="米" />
                <el-option label="千克" value="千克" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前库存" prop="stock_quantity">
              <el-input-number v-model="form.stock_quantity" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最小库存" prop="min_stock">
              <el-input-number v-model="form.min_stock" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购单价" prop="purchase_price">
              <el-input-number v-model="form.purchase_price" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售单价" prop="selling_price">
              <el-input-number v-model="form.selling_price" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置" prop="location">
              <el-input v-model="form.location" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="配件图片">
          <ImageDragUpload v-model="form.image_url" placeholder="上传配件图片" :max-size="5" />
          <div style="margin-top: 8px; color: #909399; font-size: 12px;">
            支持：点击上传、拖拽上传、输入外部URL
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 配件详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="配件详情" width="700px">
      <el-descriptions :column="2" border v-if="currentPart">
        <el-descriptions-item label="配件名称">{{ currentPart.part_name }}</el-descriptions-item>
        <el-descriptions-item label="配件编号">{{ currentPart.part_code }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentPart.category }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ currentPart.specification }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentPart.unit }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">
          <el-tag :type="getStockType(currentPart)">{{ currentPart.stock_quantity }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最小库存">{{ currentPart.min_stock }}</el-descriptions-item>
        <el-descriptions-item label="采购单价">¥{{ currentPart.purchase_price }}</el-descriptions-item>
        <el-descriptions-item label="销售单价">¥{{ currentPart.selling_price }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ currentPart.location }}</el-descriptions-item>
        <el-descriptions-item label="配件图片" :span="2">
          <el-image v-if="currentPart.image_url" :src="currentPart.image_url" fit="contain" style="width: 200px; height: 200px; border-radius: 4px;" :preview-src-list="[currentPart.image_url]" preview-teleported />
          <span v-else style="color: #909399;">暂无图片</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 入库对话框 -->
    <el-dialog v-model="inboundDialogVisible" title="配件入库" width="500px">
      <el-form :model="inboundForm" ref="inboundFormRef" label-width="100px">
        <el-form-item label="配件" prop="part_id">
          <el-select v-model="inboundForm.part_id" placeholder="请选择配件">
            <el-option v-for="part in tableData" :key="part.id" :label="part.part_name" :value="part.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="inboundForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inboundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInboundSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 出库对话框 -->
    <el-dialog v-model="outboundDialogVisible" title="配件出库" width="500px">
      <el-form :model="outboundForm" ref="outboundFormRef" label-width="100px">
        <el-form-item label="配件" prop="part_id">
          <el-select v-model="outboundForm.part_id" placeholder="请选择配件">
            <el-option v-for="part in tableData" :key="part.id" :label="part.part_name" :value="part.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="outboundForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="outboundForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outboundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOutboundSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 出入库记录对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      :title="`出库入库记录 - ${currentPart?.part_name || ''}`"
      width="900px"
    >
      <div class="history-info" v-if="currentPart">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="配件编号">{{ currentPart.part_code }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">
            <el-tag :type="getStockType(currentPart)">{{ currentPart.stock_quantity }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="单位">{{ currentPart.unit }}</el-descriptions-item>
          <el-descriptions-item label="规格">{{ currentPart.specification }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-table
        :data="historyRecords"
        v-loading="historyLoading"
        border
        stripe
        class="history-table"
      >
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getRecordTypeTag(row.type)">{{ getRecordTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.type === 2 ? '#f56c6c' : '#67c23a' }">
              {{ row.type === 2 ? '-' : '+' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="before_quantity" label="变动前" width="100" />
        <el-table-column prop="after_quantity" label="变动后" width="100" />
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="order_id" label="工单号" width="120" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="操作时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="historyPagination.page"
        v-model:page-size="historyPagination.pageSize"
        :total="historyPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="history-pagination"
        @size-change="fetchHistoryRecords"
        @current-change="fetchHistoryRecords"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ImageDragUpload from '@/components/ImageDragUpload.vue'
import {
  getPartsList,
  createParts,
  updateParts,
  deleteParts,
  partsInbound,
  partsOutbound,
  exportParts,
  getStockRecords
} from '@/api/inventory'

const searchForm = reactive({
  keyword: '',
  category: '',
  stock_status: ''
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
const inboundDialogVisible = ref(false)
const outboundDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const inboundFormRef = ref(null)
const outboundFormRef = ref(null)
const currentPart = ref(null)
const historyRecords = ref([])
const historyLoading = ref(false)
const historyPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  id: null,
  part_code: '',
  part_name: '',
  category: '',
  specification: '',
  unit: '个',
  stock_quantity: 0,
  min_stock: 10,
  purchase_price: 0,
  selling_price: 0,
  location: '',
  image_url: ''
})

const inboundForm = reactive({
  part_id: '',
  quantity: 1,
  remark: ''
})

const outboundForm = reactive({
  part_id: '',
  quantity: 1,
  remark: ''
})

const rules = {
  part_name: [{ required: true, message: '请输入配件名称', trigger: 'blur' }],
  part_code: [{ required: true, message: '请输入配件编号', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }]
}

const getStockType = (row) => {
  if (row.stock_quantity <= 0) return 'danger'
  if (row.stock_quantity < row.min_stock) return 'warning'
  return 'success'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPartsList({
      page: pagination.page,
      limit: pagination.pageSize,
      keyword: searchForm.keyword,
      category: searchForm.category,
      stock_status: searchForm.stock_status
    })
    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取配件列表失败')
    }
  } catch (error) {
    console.error('获取配件列表失败:', error)
    ElMessage.error('获取配件列表失败')
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
    category: '',
    stock_status: ''
  })
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    part_code: '',
    part_name: '',
    category: '',
    specification: '',
    unit: '个',
    stock_quantity: 0,
    min_stock: 10,
    purchase_price: 0,
    selling_price: 0,
    location: '',
    image_url: ''
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  const formData = {
    id: row.id,
    part_code: row.part_code,
    part_name: row.part_name,
    category: row.category,
    specification: row.specification,
    unit: row.unit,
    stock_quantity: row.stock_quantity,
    min_stock: row.min_stock,
    purchase_price: row.purchase_price,
    selling_price: row.selling_price,
    location: row.location,
    image_url: row.image_url || ''
  }
  Object.assign(form, formData)
}

const handleView = (row) => {
  currentPart.value = row
  detailDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除配件"${row.part_name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteParts(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  })
}

const handleInbound = () => {
  inboundDialogVisible.value = true
  inboundForm.part_id = ''
  inboundForm.quantity = 1
  inboundForm.remark = ''
}

const handleOutbound = () => {
  outboundDialogVisible.value = true
  outboundForm.part_id = ''
  outboundForm.quantity = 1
  outboundForm.remark = ''
}

const handleInboundSubmit = async () => {
  try {
    await partsInbound(inboundForm.part_id, {
      quantity: inboundForm.quantity,
      remark: inboundForm.remark
    })
    ElMessage.success('入库成功')
    inboundDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('入库失败:', error)
    ElMessage.error(error.response?.data?.message || '入库失败')
  }
}

const handleOutboundSubmit = async () => {
  try {
    await partsOutbound(outboundForm.part_id, {
      quantity: outboundForm.quantity,
      remark: outboundForm.remark
    })
    ElMessage.success('出库成功')
    outboundDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('出库失败:', error)
    ElMessage.error(error.response?.data?.message || '出库失败')
  }
}

const fetchHistoryRecords = async () => {
  if (!currentPart.value) return

  historyLoading.value = true
  try {
    const res = await getStockRecords({
      page: historyPagination.page,
      limit: historyPagination.pageSize,
      part_id: currentPart.value.id
    })
    if (res.code === 200) {
      historyRecords.value = res.data.list || []
      historyPagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取库存记录失败')
    }
  } catch (error) {
    console.error('获取库存记录失败:', error)
    ElMessage.error('获取库存记录失败')
  } finally {
    historyLoading.value = false
  }
}

const getRecordTypeText = (type) => {
  const typeMap = {
    1: '入库',
    2: '出库',
    3: '盘点'
  }
  return typeMap[type] || '未知'
}

const getRecordTypeTag = (type) => {
  const typeMap = {
    1: 'success',
    2: 'warning',
    3: 'info'
  }
  return typeMap[type] || ''
}

const handleExportExcel = async () => {
  try {
    const response = await exportParts({
      format: 'xlsx',
      keyword: searchForm.keyword,
      category: searchForm.category,
      stock_status: searchForm.stock_status
    })

    // 检查响应数据
    if (!response || !response.data) {
      ElMessage.error('导出失败：未收到数据')
      return
    }

    // 检查是否是 Blob 类型
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data])

    // 检查 blob 大小，如果太小可能是错误响应
    if (blob.size < 100) {
      const text = await blob.text()
      try {
        const json = JSON.parse(text)
        if (json.message) {
          ElMessage.error('导出失败：' + json.message)
        } else {
          ElMessage.error('导出失败')
        }
      } catch {
        ElMessage.error('导出失败')
      }
      return
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '配件库存_' + new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_') + '.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  }
}

const handleExportCsv = async () => {
  try {
    const response = await exportParts({
      format: 'csv',
      keyword: searchForm.keyword,
      category: searchForm.category,
      stock_status: searchForm.stock_status
    })

    // 检查响应数据
    if (!response || !response.data) {
      ElMessage.error('导出失败：未收到数据')
      return
    }

    // 检查是否是 Blob 类型
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv;charset=utf-8;' })

    // 检查 blob 大小，如果太小可能是错误响应
    if (blob.size < 100) {
      const text = await blob.text()
      try {
        const json = JSON.parse(text)
        if (json.message) {
          ElMessage.error('导出失败：' + json.message)
        } else {
          ElMessage.error('导出失败')
        }
      } catch {
        ElMessage.error('导出失败')
      }
      return
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '配件库存_' + new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-').replace(/\s/g, '_') + '.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  }
}

const handleHistory = (row) => {
  currentPart.value = row
  historyDialogVisible.value = true
  fetchHistoryRecords()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 调试：打印提交的数据
  console.log('提交的表单数据:', JSON.parse(JSON.stringify(form)))
  console.log('image_url值:', form.image_url)

  try {
    if (isEdit.value) {
      await updateParts(form.id, form)
    } else {
      await createParts(form)
    }
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.parts-container {
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

.history-info {
  margin-bottom: 20px;
}

.history-table {
  margin-bottom: 15px;
}

.history-pagination {
  margin-top: 15px;
  justify-content: flex-end;
}
</style>
