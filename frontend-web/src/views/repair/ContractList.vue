<template>
  <div class="contract-container">
    <el-card shadow="never">
      <!-- 子Tab导航 -->
      <el-tabs v-model="activeTab" class="contract-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="合同列表" name="list"></el-tab-pane>
        <el-tab-pane label="合同创建" name="create"></el-tab-pane>
        <el-tab-pane label="合同模板" name="templates"></el-tab-pane>
      </el-tabs>

      <!-- 合同列表内容 -->
      <div v-show="activeTab == 'list'" class="tab-content">
        <!-- 搜索区域 -->
        <div class="search-section">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="合同编号">
              <el-input v-model="searchForm.contract_number" placeholder="请输入合同编号" clearable />
            </el-form-item>
            <el-form-item label="客户名称">
              <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="全部" value="" />
                <el-option label="草稿" value="draft" />
                <el-option label="执行中" value="active" />
                <el-option label="已过期" value="expired" />
                <el-option label="已终止" value="terminated" />
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
          <el-button type="primary" :icon="Plus" @click="goToCreatePage">新增维修合同</el-button>
              <el-button :icon="Edit" @click="handleQuickAdd">快速录入</el-button>
        </div>

        <!-- 数据表格 -->
        <el-table :data="tableData" border stripe v-loading="loading">
          <el-table-column prop="contract_number" label="合同编号" width="150" />
          <el-table-column prop="customer_name" label="客户名称" width="150" />
          <el-table-column prop="customer_phone" label="客户电话" width="130" />
          <el-table-column prop="machine_type" label="机械类型" width="120" />
          <el-table-column prop="service_content" label="服务内容" width="200" show-overflow-tooltip />
          <el-table-column prop="annual_fee" label="合同金额" width="120" align="right">
            <template #default="{ row }">
              ¥{{ Number(row.annual_fee || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="start_date" label="开始日期" width="120" />
          <el-table-column prop="end_date" label="结束日期" width="120" />
          <el-table-column prop="sign_date" label="签订日期" width="120" />
          <el-table-column prop="contract_file" label="合同文件" width="150">
            <template #default="{ row }">
              <el-link v-if="row.contract_file" :href="'/uploads/contracts/' + (row.contract_file.split('/').pop() || row.contract_file)" target="_blank" type="primary">
                <el-icon><Document /></el-icon> 查看
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
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
      </div>

      <!-- 子路由内容（合同创建/合同模板） -->
      <div v-show="activeTab !== 'list'" class="tab-content">
        <router-view />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑维修合同' : '新增维修合同'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同编号" prop="contract_number">
              <el-input v-model="formData.contract_number" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户电话" prop="customer_phone">
              <el-input v-model="formData.customer_phone" placeholder="请输入客户电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机械类型" prop="machine_type">
              <el-input v-model="formData.machine_type" placeholder="请输入机械类型" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="服务内容" prop="service_content">
          <el-input v-model="formData.service_content" type="textarea" :rows="4" placeholder="请输入服务内容" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="formData.start_date"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="formData.end_date"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="签订日期" prop="sign_date">
              <el-date-picker
                v-model="formData.sign_date"
                type="date"
                placeholder="选择签订日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合同金额" prop="annual_fee">
              <el-input-number v-model="formData.annual_fee" :min="0" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="执行中" value="active" />
                <el-option label="已过期" value="expired" />
                <el-option label="已终止" value="terminated" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="合同文件" prop="contract_file">
          <el-upload
            v-model:file-list="fileList"
            :action="uploadUrl"
            :data="{ type: 'contract' }"
            :on-success="handleFileSuccess"
            :on-remove="handleFileRemove"
            :before-upload="handleBeforeUpload"
            :limit="1"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp,.webp,.ppt,.pptx"
          >
            <el-button type="primary">上传合同文件</el-button>
          </el-upload>
          <div v-if="formData.contract_file" class="file-info" style="margin-top: 10px">
            <el-icon><Document /></el-icon>
            <el-link v-if="formData.contract_file" :href="'/uploads/contracts/' + (formData.contract_file.split('/').pop() || formData.contract_file)" target="_blank" type="primary">{{ formData.contract_file.split('/').pop() || formData.contract_file }}</el-link>
            <el-button link type="danger" size="small" @click="handleFileRemove">清除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="维修合同详情" width="800px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="合同编号">{{ detailData.contract_number }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detailData.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ detailData.customer_phone }}</el-descriptions-item>
        <el-descriptions-item label="机械类型">{{ detailData.machine_type }}</el-descriptions-item>
        <el-descriptions-item label="合同金额" :span="2">¥{{ Number(detailData.annual_fee || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="服务内容" :span="2">{{ detailData.service_content }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detailData.start_date }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ detailData.end_date }}</el-descriptions-item>
        <el-descriptions-item label="签订日期">{{ detailData.sign_date }}</el-descriptions-item>
        <el-descriptions-item label="合同文件">
          <el-link v-if="detailData.contract_file" :href="'/uploads/contracts/' + (detailData.contract_file.split('/').pop() || detailData.contract_file)" target="_blank" type="primary">
            <el-icon><Document /></el-icon> 查看合同文件
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Edit } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getRepairContractList,
  getRepairContractDetail,
  createRepairContract,
  updateRepairContract,
  deleteRepairContract
} from '@/api/repairContract'

const route = useRoute()
const router = useRouter()

// 子Tab导航
const activeTab = ref('list')

const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const fileList = ref([])
const uploading = ref(false)
const uploadUrl = '/api/upload'

const searchForm = reactive({
  contract_number: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: null,
  contract_number: '',
  customer_name: '',
  customer_phone: '',
  machine_type: '',
  service_content: '',
  annual_fee: 0,
  start_date: '',
  end_date: '',
  sign_date: '',
  contract_file: '',
  status: 'draft'
})

const formRules = {
  contract_number: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  machine_type: [{ required: true, message: '请输入机械类型', trigger: 'blur' }],
  service_content: [{ required: true, message: '请输入服务内容', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const detailData = ref(null)
const tableData = ref([])

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    active: 'success',
    expired: 'warning',
    terminated: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    draft: '草稿',
    active: '执行中',
    expired: '已过期',
    terminated: '已终止'
  }
  return map[status] || status
}

const goToCreatePage = () => {
  router.push('/repair/contract/create')
}

const handleQuickAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

// Tab切换
const handleTabChange = (tabName) => {
  if (tabName === 'create') {
    router.push('/repair/contract/create')
  } else if (tabName === 'templates') {
    router.push('/repair/contract/templates')
  } else {
    activeTab.value = 'list'
    router.push('/repair/contract/list')
  }
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.contract_number) params.contract_number = searchForm.contract_number
    if (searchForm.customer_name) params.customer_name = searchForm.customer_name
    if (searchForm.status) params.status = searchForm.status

    const res = await getRepairContractList(pagination.page, pagination.pageSize, params)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      const data = res.data || {}
      tableData.value = data.items || data.list || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    console.error('获取维修合同列表失败', error)
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
  searchForm.contract_number = ''
  searchForm.customer_name = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  formData.id = null
  formData.contract_number = ''
  formData.customer_name = ''
  formData.customer_phone = ''
  formData.machine_type = ''
  formData.service_content = ''
  formData.annual_fee = 0
  formData.start_date = ''
  formData.end_date = ''
  formData.sign_date = ''
  formData.contract_file = ''
  formData.status = 'draft'
  fileList.value = []
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const res = await getRepairContractDetail(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      const data = res.data
      Object.assign(formData, data)
      if (data.contract_file) {
        const filename = (data.contract_file.split('/').pop() || data.contract_file)
        fileList.value = [{ name: filename, url: `/uploads/contracts/${filename}` }]
      }
      isEdit.value = true
      dialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取合同详情失败')
  }
}

const handleView = async (row) => {
  try {
    const res = await getRepairContractDetail(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      detailData.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取合同详情失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该维修合同吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteRepairContract(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleBeforeUpload = () => {
  uploading.value = true
}

const handleFileSuccess = (response, file) => {
  uploading.value = false
  if (response.code === 0 || response.code === 200) {
    formData.contract_file = response.data.path || ''

    if (response.data.ocr_result && !response.data.ocr_result.error) {
      const ocr = response.data.ocr_result
      if (ocr.contract_number) formData.contract_number = ocr.contract_number
      if (ocr.customer_name) formData.customer_name = ocr.customer_name
      if (ocr.customer_phone) formData.customer_phone = ocr.customer_phone
      if (ocr.machine_type) formData.machine_type = ocr.machine_type
      if (ocr.service_content) formData.service_content = ocr.service_content
      if (ocr.annual_fee) formData.annual_fee = parseFloat(ocr.annual_fee) || 0
      if (ocr.start_date) formData.start_date = ocr.start_date
      if (ocr.end_date) formData.end_date = ocr.end_date
      ElMessage.success('文件上传成功，已自动识别合同信息')
    } else {
      ElMessage.success('文件上传成功')
    }
  } else {
    ElMessage.error(response.message || '文件上传失败')
  }
}

const handleFileError = () => {
  uploading.value = false
  ElMessage.error('文件上传失败')
}

const handleFileRemove = () => {
  fileList.value = []
  formData.contract_file = ''
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      const res = await updateRepairContract(formData.id, formData)
      if (res.code === 200 || res.code === 0 || res.code === 201) {
        ElMessage.success('合同更新成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      const res = await createRepairContract(formData)
      if (res.code === 200 || res.code === 0 || res.code === 201) {
        ElMessage.success('合同创建成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('提交错误:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

onMounted(() => {
  // 根据URL确定当前tab
  const pathParts = route.path.split('/')
  const lastPart = pathParts[pathParts.length - 1]
  if (lastPart === 'create') {
    activeTab.value = 'create'
  } else if (lastPart === 'templates') {
    activeTab.value = 'templates'
  } else {
    activeTab.value = 'list'
  }

  if (activeTab.value === 'list') {
    // 只有在列表tab时才加载数据
    fetchData()

    // 检查是否有订单创建的query参数
    if (route.query.order_id) {
      const { customer_name, customer_phone, machine_type, service_content, start_date } = route.query
      formData.customer_name = customer_name || ''
      formData.customer_phone = customer_phone || ''
      formData.machine_type = machine_type || ''
      formData.service_content = service_content || ''
      if (start_date) formData.start_date = start_date
      isEdit.value = false
      dialogVisible.value = true
    }
  }
})
</script>

<style lang="scss" scoped>
.contract-container {
  padding: 20px;

  .contract-tabs {
    margin-bottom: 20px;
  }

  .tab-content {
    min-height: 400px;
  }

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

  .file-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      color: #409eff;
    }
  }
}
</style>
