<template>
<div class="repair-report-container">
  <el-card shadow="never">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="报告编号">
          <el-input v-model="searchForm.report_number" placeholder="请输入报告编号" clearable />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="维修中" value="repairing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="toolbar-section">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增维修报告</el-button>
      <el-button type="success" :icon="Upload" @click="handlePreview">预览可导入订单</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="report_number" label="报告编号" width="150" />
      <el-table-column prop="order_no" label="订单号" width="120" />
      <el-table-column prop="machine_name" label="机械名称" width="150" show-overflow-tooltip />
      <el-table-column prop="fault_description" label="故障描述" width="150" show-overflow-tooltip />
      <el-table-column prop="repair_content" label="维修内容" width="150" show-overflow-tooltip />
      <el-table-column prop="parts_used" label="更换配件" width="120" show-overflow-tooltip />
      <el-table-column prop="repair_hours" label="维修工时" width="100" align="center">
        <template #default="{ row }">
          {{ Number(row.repair_hours || 0).toFixed(1) }}小时
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="维修费用" width="100" align="right">
        <template #default="{ row }">
          ¥{{ Number(row.amount || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="repairer_name" label="维修员" width="100" />
      <el-table-column prop="completion_date" label="完成时间" width="160" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="success" @click="handleExport(row)">导出</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </el-card>

  <!-- 新增/编辑对话框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑维修报告' : '新增维修报告'"
    width="800px"
    :close-on-click-modal="false"
  >
    <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="报告编号" prop="report_number">
            <el-input v-model="formData.report_number" placeholder="自动生成或手动输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单号" prop="order_no">
            <el-input v-model="formData.order_no" placeholder="请输入订单号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="故障描述" prop="fault_description">
        <el-input v-model="formData.fault_description" type="textarea" :rows="3" placeholder="请输入故障描述" />
      </el-form-item>
      <el-form-item label="维修内容" prop="repair_content">
        <el-input v-model="formData.repair_content" type="textarea" :rows="3" placeholder="请输入维修内容" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="更换配件" prop="parts_used">
            <el-input v-model="formData.parts_used" placeholder="请输入更换配件" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="维修工时" prop="repair_hours">
            <el-input-number v-model="formData.repair_hours" :min="0" :precision="1" :step="0.5" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="维修费用" prop="amount">
            <el-input-number v-model="formData.amount" :min="0" :precision="2" :step="10" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="维修员" prop="repairer_name">
            <el-input v-model="formData.repairer_name" placeholder="请输入维修员" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="完成时间" prop="completion_date">
            <el-date-picker
              v-model="formData.completion_date"
              type="datetime"
              placeholder="选择完成时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
              <el-option label="待处理" value="pending" />
              <el-option label="维修中" value="repairing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 查看详情对话框 -->
  <el-dialog v-model="detailVisible" title="维修报告详情" width="800px">
    <el-descriptions :column="2" border v-if="detailData">
      <el-descriptions-item label="报告编号">{{ detailData.report_number }}</el-descriptions-item>
      <el-descriptions-item label="订单号">{{ detailData.order_no }}</el-descriptions-item>
      <el-descriptions-item label="机械名称" :span="2">{{ detailData.machine_name }}</el-descriptions-item>
      <el-descriptions-item label="故障描述" :span="2">{{ detailData.fault_description }}</el-descriptions-item>
      <el-descriptions-item label="维修内容" :span="2">{{ detailData.repair_content }}</el-descriptions-item>
      <el-descriptions-item label="更换配件">{{ detailData.parts_used }}</el-descriptions-item>
      <el-descriptions-item label="维修工时">{{ Number(detailData.repair_hours || 0).toFixed(1) }}小时</el-descriptions-item>
      <el-descriptions-item label="维修费用">¥{{ Number(detailData.amount || 0).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="维修员">{{ detailData.repairer_name }}</el-descriptions-item>
      <el-descriptions-item label="完成时间">{{ detailData.completion_date }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(detailData.status)">
          {{ getStatusText(detailData.status) }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button type="success" @click="handleExport(detailData)" :loading="exportingPdf">导出PDF</el-button>
      <el-button @click="detailVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 导入预览对话框 -->
  <el-dialog v-model="importPreviewVisible" title="可导入的电子维修订单" width="900px">
    <el-alert
      title="以下是从电子维修库中已完成的维修订单，点击导入可将订单数据添加到维修报告"
      type="info"
      :closable="false"
      style="margin-bottom: 15px"
    />
    <el-table :data="importPreviewData" border stripe v-loading="importPreviewLoading" max-height="500">
      <el-table-column prop="order_no" label="订单号" width="170" fixed />
      <el-table-column prop="device_type_name" label="设备类型" width="88" />
      <el-table-column prop="device_model" label="设备型号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="problem_description" label="问题简述" min-width="120" show-overflow-tooltip />
      <el-table-column prop="custom_description" label="补充说明" min-width="140" show-overflow-tooltip />
      <el-table-column prop="service_type_text" label="服务方式" width="88" align="center" />
      <el-table-column prop="priority_text" label="优先级" width="72" align="center" />
      <el-table-column prop="repair_hours" label="维修工时" width="96" align="center">
        <template #default="{ row }">
          <span v-if="row.repair_hours === null || row.repair_hours === undefined">-</span>
          <span v-else>{{ Number(row.repair_hours).toFixed(1) }}小时</span>
        </template>
      </el-table-column>
      <el-table-column label="预估/实付" width="120" align="right">
        <template #default="{ row }">
          <span>¥{{ Number(row.estimated_price ?? 0).toFixed(2) }}</span>
          <span> / </span>
          <span>¥{{ Number(row.actual_price ?? row.amount ?? 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="completed_at" label="完成时间" width="170" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.already_imported" type="info">已导入</el-tag>
          <el-tag v-else type="success">待导入</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="row.already_imported"
            @click="handleImportSingle(row)"
          >
            导入
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button type="primary" @click="handleImportAll" :loading="importing">批量导入全部</el-button>
      <el-button @click="importPreviewVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { downloadRepairReportPdf } from '@/utils/repairReportPdf'
import {
  getRepairReportList,
  getRepairReportDetail,
  createRepairReport,
  updateRepairReport,
  deleteRepairReport,
  importFromRepair,
  getImportPreview,
  importSingleOrder
} from '@/api/repairReport'

const loading = ref(false)
const importing = ref(false)
const exportingPdf = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const importPreviewVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const searchForm = reactive({
  report_number: '',
  order_no: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: null,
  report_number: '',
  order_no: '',
  machine_name: '',
  fault_description: '',
  repair_content: '',
  parts_used: '',
  repair_hours: 0,
  amount: 0,
  repairer_name: '',
  completion_date: '',
  status: 'pending'
})

const formRules = {
  report_number: [{ required: true, message: '请输入报告编号', trigger: 'blur' }],
  order_no: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  fault_description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }],
  repair_content: [{ required: true, message: '请输入维修内容', trigger: 'blur' }],
  repairer_name: [{ required: true, message: '请输入维修员', trigger: 'blur' }],
  completion_date: [{ required: true, message: '请选择完成时间', trigger: 'change' }]
}

const detailData = ref(null)
const tableData = ref([])
const importPreviewData = ref([])
const importPreviewLoading = ref(false)

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    repairing: 'warning',
    completed: 'success'
  }
  return map[status] || map[String(status)] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    repairing: '维修中',
    completed: '已完成',
    0: '待处理',
    1: '维修中',
    2: '已完成'
  }
  return map[status] || map[String(status)] || status
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.report_number) params.report_number = searchForm.report_number
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.status) params.status = searchForm.status

    const res = await getRepairReportList(pagination.page, pagination.pageSize, params)
    if (res.code === 200 || res.code === 0) {
      const data = res.data || {}
      tableData.value = data.items || data.list || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    console.error('获取维修报告列表失败', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.report_number = ''
  searchForm.order_no = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  formData.id = null
  formData.report_number = ''
  formData.order_no = ''
  formData.machine_name = ''
  formData.fault_description = ''
  formData.repair_content = ''
  formData.parts_used = ''
  formData.repair_hours = 0
  formData.amount = 0
  formData.repairer_name = ''
  formData.completion_date = ''
  formData.status = 'pending'
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const res = await getRepairReportDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      const data = res.data
      Object.assign(formData, data)
      isEdit.value = true
      dialogVisible.value = true
    } else {
      ElMessage.error(res.message || '获取报告详情失败')
    }
  } catch (error) {
    ElMessage.error('获取报告详情失败')
  }
}

const handleView = async (row) => {
  try {
    const res = await getRepairReportDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      detailData.value = res.data
      detailVisible.value = true
    } else {
      ElMessage.error(res.message || '获取报告详情失败')
    }
  } catch (error) {
    ElMessage.error('获取报告详情失败')
  }
}

const handleExport = async (row) => {
  if (!row?.id) {
    ElMessage.warning('缺少报告数据，无法导出')
    return
  }

  exportingPdf.value = true
  try {
    const detailRes = await getRepairReportDetail(row.id)
    if (!(detailRes.code === 200 || detailRes.code === 0)) {
      ElMessage.error(detailRes.message || '获取报告详情失败')
      return
    }

    const reportData = detailRes.data || row
    await downloadRepairReportPdf(reportData, reportData.report_number || '维修报告')
    ElMessage.success('PDF导出成功')
  } catch (error) {
    console.error('导出维修报告失败', error)
    ElMessage.error(error.message || '导出失败')
  } finally {
    exportingPdf.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该维修报告吗？此操作不会删除原订单。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteRepairReport(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      const res = await updateRepairReport(formData.id, formData)
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      const res = await createRepairReport(formData)
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '创建失败')
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 预览可导入订单
const handlePreview = async () => {
  importPreviewVisible.value = true
  importPreviewLoading.value = true
  try {
    const res = await getImportPreview()
    if (res.code === 200 || res.code === 0) {
      importPreviewData.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取预览失败')
    }
  } catch (error) {
    ElMessage.error('获取预览数据失败')
  } finally {
    importPreviewLoading.value = false
  }
}

// 导入单个订单
const handleImportSingle = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要导入订单 ${row.order_no} 吗？`,
      '导入确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    const res = await importSingleOrder(row.order_id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('导入成功')
      handlePreview()
      fetchData()
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '导入失败')
    }
  }
}

// 批量导入全部未导入订单
const handleImportAll = async () => {
  try {
    await ElMessageBox.confirm(
      '将导入所有待导入的订单到维修报告。是否继续？',
      '导入确认',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    importing.value = true
    const res = await importFromRepair()
    if (res.code === 200 || res.code === 0) {
      const { imported, skipped, total } = res.data || {}
      ElMessage.success(`导入完成！共处理 ${total} 条记录，成功导入 ${imported} 条，跳过 ${skipped} 条`)
      handlePreview()
      fetchData()
      importPreviewVisible.value = false
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '导入失败')
    }
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.repair-report-container {
  padding: 20px;

  .search-section {
    margin-bottom: 20px;

    .search-form {
      display: flex;
      flex-wrap: wrap;
    }
  }

  .toolbar-section {
    margin-bottom: 20px;
  }

  .pagination-section {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
