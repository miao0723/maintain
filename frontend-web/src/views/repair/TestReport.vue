<template>
  <div class="test-report-container">
    <div class="page-header">
      <div class="page-header__titles">
        <h1 class="page-title">检测记录</h1>
        <p class="page-subtitle">数据来自数据库，支持检索、新增/编辑/删除与导出 PDF（需登录且具备接口权限）</p>
      </div>
    </div>

    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="模糊搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="编号、客户、机械、型号、项目、检测员、描述…"
            clearable
            style="width: 280px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="报告编号">
          <el-input v-model="searchForm.report_number" placeholder="支持模糊" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="支持模糊" clearable />
        </el-form-item>
        <el-form-item label="检测状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 130px;">
            <el-option label="全部" value="" />
            <el-option label="待检测" value="pending" />
            <el-option label="检测中" value="testing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增报告
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe class="data-table" empty-text=" ">
        <template #empty>
          <el-empty>
            <template #description>
              <p class="empty-desc">
                暂无检测记录。请确认已执行迁移并写入
                <code>test_reports</code>
                表数据，且接口
                <code>/api/test-reports</code>
                可访问（需登录）。
              </p>
            </template>
            <el-button type="primary" @click="handleAdd">新增报告</el-button>
          </el-empty>
        </template>
        <el-table-column prop="id" label="ID" width="72" />
        <el-table-column prop="report_number" label="报告编号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户名称" width="130" show-overflow-tooltip />
        <el-table-column prop="machine_name" label="机械名称" width="120" show-overflow-tooltip />
        <el-table-column prop="machine_model" label="型号" width="100" show-overflow-tooltip />
        <el-table-column prop="test_items" label="检测项目" min-width="140" show-overflow-tooltip />
        <el-table-column prop="test_result" label="检测结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultType(row.test_result)" size="small">
              {{ getResultText(row.test_result) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tester_name" label="检测员" width="88" />
        <el-table-column prop="test_date" label="检测日期" width="110" />
        <el-table-column prop="status" label="状态" width="92">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="178" fixed="right" align="center">
          <template #default="{ row }">
            <div class="op-cell">
              <div class="op-cell__row">
                <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </div>
              <div class="op-cell__export">
                <el-button
                  type="primary"
                  plain
                  size="small"
                  class="op-export-btn"
                  :loading="pdfLoadingId === row.id"
                  @click="handleExportRowPdf(row)"
                >
                  <el-icon><Download /></el-icon>
                  导出 PDF
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增/编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑检测报告' : '新增检测报告'"
      width="820px"
      destroy-on-close
      class="report-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告编号" prop="report_number">
              <el-input v-model="form.report_number" placeholder="可手动输入，建议唯一" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="form.customer_name" placeholder="客户或单位名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机械名称" prop="machine_name">
              <el-input v-model="form.machine_name" placeholder="设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="machine_model">
              <el-input v-model="form.machine_model" placeholder="规格型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测日期" prop="test_date">
              <el-date-picker
                v-model="form.test_date"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测员" prop="tester_name">
              <el-input v-model="form.tester_name" placeholder="检测人员姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">检测信息</el-divider>
        <el-form-item label="检测项目" prop="test_items">
          <el-input v-model="form.test_items" placeholder="多个项目可用逗号分隔，如：发动机，液压系统，传动系统" />
        </el-form-item>
        <el-form-item label="检测结果" prop="test_result">
          <el-radio-group v-model="form.test_result">
            <el-radio :value="'qualified'">合格</el-radio>
            <el-radio :value="'unqualified'">不合格</el-radio>
            <el-radio :value="'partial'">部分合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检测描述" prop="test_description">
          <el-input
            v-model="form.test_description"
            type="textarea"
            :rows="4"
            placeholder="检测过程、数据与发现的问题（客户可见）"
          />
        </el-form-item>
        <el-form-item label="处理建议" prop="suggestion">
          <el-input
            v-model="form.suggestion"
            type="textarea"
            :rows="3"
            placeholder="后续维护或整改建议"
          />
        </el-form-item>
        <el-form-item label="检测状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="'pending'">待检测</el-radio>
            <el-radio :value="'testing'">检测中</el-radio>
            <el-radio :value="'completed'">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="检测报告详情"
      width="820px"
      destroy-on-close
      class="detail-dialog"
    >
      <template v-if="currentReport">
        <div class="detail-banner">
          <div class="detail-banner__title">{{ currentReport.report_number }}</div>
          <el-tag :type="getStatusType(currentReport.status)" effect="dark" round>
            {{ getStatusText(currentReport.status) }}
          </el-tag>
        </div>
        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="客户名称">{{ currentReport.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="检测日期">{{ currentReport.test_date }}</el-descriptions-item>
          <el-descriptions-item label="机械名称">{{ currentReport.machine_name }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ currentReport.machine_model }}</el-descriptions-item>
          <el-descriptions-item label="检测项目" :span="2">{{ currentReport.test_items }}</el-descriptions-item>
          <el-descriptions-item label="检测结果" :span="2">
            <el-tag :type="getResultType(currentReport.test_result)">
              {{ getResultText(currentReport.test_result) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检测员">{{ currentReport.tester_name }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentReport.created_at }}</el-descriptions-item>
          <el-descriptions-item label="检测描述" :span="2">
            <div class="detail-text-block">{{ currentReport.test_description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="处理建议" :span="2">
            <div class="detail-text-block">{{ currentReport.suggestion }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="detailPdfLoading"
          @click="handleExportDetailPdf"
        >
          <el-icon class="btn-icon"><Download /></el-icon>
          导出 PDF
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import {
  getTestReportList,
  getTestReportDetail,
  createTestReport,
  updateTestReport,
  deleteTestReport
} from '@/api/testReport'
import { downloadTestReportPdf } from '@/utils/testReportPdf'

const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentReport = ref(null)
const pdfLoadingId = ref(null)
const detailPdfLoading = ref(false)

const searchForm = reactive({
  keyword: '',
  report_number: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const form = reactive({
  id: null,
  report_number: '',
  customer_name: '',
  machine_name: '',
  machine_model: '',
  test_date: '',
  tester_name: '',
  test_items: '',
  test_result: 'qualified',
  test_description: '',
  suggestion: '',
  status: 'pending'
})

const rules = {
  report_number: [{ required: true, message: '请输入报告编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  machine_name: [{ required: true, message: '请输入机械名称', trigger: 'blur' }],
  test_date: [{ required: true, message: '请选择检测日期', trigger: 'change' }]
}

const getResultType = (result) => {
  const types = { qualified: 'success', unqualified: 'danger', partial: 'warning' }
  return types[result] || 'info'
}

const getResultText = (result) => {
  const texts = { qualified: '合格', unqualified: '不合格', partial: '部分合格' }
  return texts[result] || '未知'
}

const getStatusType = (status) => {
  const types = { pending: 'info', testing: 'warning', completed: 'success' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待检测', testing: '检测中', completed: '已完成' }
  return texts[status] || '未知'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.report_number) params.report_number = searchForm.report_number
    if (searchForm.customer_name) params.customer_name = searchForm.customer_name
    if (searchForm.status) params.status = searchForm.status

    const res = await getTestReportList(pagination.page, pagination.pageSize, params)
    if (res.code === 200 || res.code === 0) {
      const data = res.data || {}
      tableData.value = data.items || data.list || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    console.error('获取检测报告列表失败', error)
    const msg =
      error?.response?.data?.message || error?.message || '获取数据失败（请检查是否登录、接口 /api/test-reports 是否可达）'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.report_number = ''
  searchForm.customer_name = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  form.id = null
  form.report_number = ''
  form.customer_name = ''
  form.machine_name = ''
  form.machine_model = ''
  form.test_date = ''
  form.tester_name = ''
  form.test_items = ''
  form.test_result = 'qualified'
  form.test_description = ''
  form.suggestion = ''
  form.status = 'pending'
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const res = await getTestReportDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      const data = res.data
      Object.assign(form, data)
      isEdit.value = true
      dialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取报告详情失败')
  }
}

const handleView = async (row) => {
  try {
    const res = await getTestReportDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      currentReport.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取报告详情失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该检测报告吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteTestReport(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleExportRowPdf(row) {
  pdfLoadingId.value = row.id
  try {
    const res = await getTestReportDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      await downloadTestReportPdf(res.data)
      ElMessage.success('PDF 已生成并开始下载')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  } finally {
    pdfLoadingId.value = null
  }
}

async function handleExportDetailPdf() {
  if (!currentReport.value) return
  detailPdfLoading.value = true
  try {
    await downloadTestReportPdf(currentReport.value)
    ElMessage.success('PDF 已生成并开始下载')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  } finally {
    detailPdfLoading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      const res = await updateTestReport(form.id, form)
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('编辑成功')
        dialogVisible.value = false
        fetchData()
      }
    } else {
      const res = await createTestReport(form)
      if (res.code === 200 || res.code === 0) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchData()
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.test-report-container {
  padding-bottom: 24px;
  max-width: 100%;
}

.op-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 4px 0;
}

.op-cell__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 4px;
}

.op-cell__export {
  width: 100%;
}

.op-export-btn {
  width: 100%;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
}

.page-header {
  padding: 18px 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 55%, #fff 100%);
  border: 1px solid #e2e8f0;
}

.page-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.search-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 48px);
}

.search-form {
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.toolbar {
  margin-bottom: 16px;
}

.data-table {
  border-radius: 8px;
  overflow: hidden;
}

.btn-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.detail-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: -8px -8px 16px;
  background: linear-gradient(90deg, #eff6ff 0%, #fff 100%);
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.detail-banner__title {
  font-size: 16px;
  font-weight: 600;
  color: #1e3a8a;
}

.detail-text-block {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #334155;
}

.detail-desc {
  :deep(.el-descriptions__label) {
    width: 108px;
    font-weight: 500;
    color: #475569;
  }
}

:deep(.el-pagination) {
  margin-top: 20px;
  justify-content: flex-end;
}

.empty-desc {
  margin: 0 0 12px;
  max-width: 420px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;

  code {
    font-size: 12px;
    padding: 1px 5px;
    background: #f1f5f9;
    border-radius: 4px;
    color: #475569;
  }
}

</style>
