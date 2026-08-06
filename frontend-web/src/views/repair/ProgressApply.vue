<template>
  <div class="progress-apply-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="申请单号">
        <el-input v-model="searchForm.apply_no" placeholder="请输入申请单号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名">
        <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="设备名称">
        <el-input v-model="searchForm.device_name" placeholder="请输入设备名称" clearable />
      </el-form-item>
      <el-form-item label="设备型号">
        <el-input v-model="searchForm.device_model" placeholder="请输入设备型号" clearable />
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="searchForm.approval_status" placeholder="全部" clearable>
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 统计信息 / 状态筛选 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" :class="{ 'stat-active': currentStatus === '' }" @click="filterByStatus('')">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部申请</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-pending" :class="{ 'stat-active': currentStatus === 'pending' }" @click="filterByStatus('pending')">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-approved" :class="{ 'stat-active': currentStatus === 'approved' }" @click="filterByStatus('approved')">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">已通过</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-rejected" :class="{ 'stat-active': currentStatus === 'rejected' }" @click="filterByStatus('rejected')">
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">已拒绝</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建进度申请
      </el-button>
      <el-button type="warning" @click="handleSync" :loading="syncing">
        <el-icon><Refresh /></el-icon>
        同步数据
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%" border>
      <el-table-column prop="apply_no" label="申请单号" width="150" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column prop="device_name" label="设备名称" width="130" show-overflow-tooltip />
      <el-table-column prop="device_model" label="设备型号" width="120" show-overflow-tooltip />
      <el-table-column prop="user_name" label="申请人" width="100" />
      <el-table-column label="进度类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getProgressTypeColor(row.progress_type)" size="small">
            {{ row.progress_type_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="apply_reason" label="申请原因" min-width="160" show-overflow-tooltip />
      <el-table-column label="审核状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getApprovalStatusType(row.approval_status)" size="small">
            {{ row.approval_status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="150" />
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button
            v-if="row.approval_status === 'pending'"
            link
            type="success"
            @click="handleApprove(row)"
          >
            审批
          </el-button>
          <el-button
            v-if="row.approval_status === 'pending'"
            link
            type="danger"
            @click="handleReject(row)"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 创建申请对话框 -->
    <el-dialog v-model="dialogVisible" title="新建进度申请" width="700px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="客户姓名" prop="customer_name">
          <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="formData.device_name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="formData.device_model" placeholder="请输入设备型号" />
        </el-form-item>
        <el-form-item label="进度类型" prop="progress_type">
          <el-select v-model="formData.progress_type" placeholder="请选择进度类型" style="width: 100%">
            <el-option label="配件等待" value="parts_waiting" />
            <el-option label="维修中" value="repairing" />
            <el-option label="测试中" value="testing" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请原因" prop="apply_reason">
          <el-input v-model="formData.apply_reason" type="textarea" :rows="4" placeholder="请详细说明申请原因" />
        </el-form-item>
        <el-form-item label="期望时间">
          <el-date-picker
            v-model="formData.expected_time"
            type="datetime"
            placeholder="选择期望完成时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="申请详情" width="700px">
      <el-descriptions :column="2" border v-if="currentApply">
        <el-descriptions-item label="申请单号" content-class-name="desc-value">{{ currentApply.apply_no }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getApprovalStatusType(currentApply.approval_status)" size="small">
            {{ currentApply.approval_status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentApply.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentApply.phone }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentApply.device_name }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentApply.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentApply.brand_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentApply.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="进度类型" :span="2">
          <el-tag :type="getProgressTypeColor(currentApply.progress_type)" size="small">
            {{ currentApply.progress_type_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="期望时间" :span="2">{{ currentApply.expected_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="2">{{ currentApply.apply_reason }}</el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="2" v-if="currentApply.approval_remark">
          {{ currentApply.approval_remark }}
        </el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="currentApply.approver_name">
          {{ currentApply.approver_name }}
        </el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="currentApply.approval_at">
          {{ currentApply.approval_at }}
        </el-descriptions-item>
        <el-descriptions-item label="申请时间" :span="2">{{ currentApply.created_at }}</el-descriptions-item>
        <el-descriptions-item label="订单编号" v-if="currentApply.order_no">
          {{ currentApply.order_no }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态" v-if="currentApply.order_status">
          {{ getOrderStatusText(currentApply.order_status) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMiniAdminProgressApplyList,
  createMiniAdminProgressApply,
  approveMiniAdminProgressApply,
  rejectMiniAdminProgressApply,
  getMiniAdminProgressApplyStatistics,
  getMiniAdminProgressApplyDetail,
  syncMiniAdminProgressApply
} from '@/api/miniAdmin'
import {
  getProgressApplyList,
  createProgressApply,
  approveProgressApply,
  rejectProgressApply,
  getProgressApplyStatistics,
  getProgressApplyDetail,
  syncProgressApply
} from '@/api/repairProgress'

const route = useRoute()
const isMiniAdminRoute = computed(() => route.path.startsWith('/mini-admin'))

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentApply = ref(null)
const formRef = ref(null)
const syncing = ref(false)
const currentStatus = ref('')

const searchForm = reactive({
  apply_no: '',
  customer_name: '',
  device_name: '',
  device_model: '',
  approval_status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const stats = reactive({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

const formData = reactive({
  customer_name: '',
  phone: '',
  device_name: '',
  device_model: '',
  progress_type: '',
  apply_reason: '',
  expected_time: ''
})

const formRules = {
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  progress_type: [{ required: true, message: '请选择进度类型', trigger: 'change' }],
  apply_reason: [{ required: true, message: '请输入申请原因', trigger: 'blur' }]
}

// 加载列表数据
const loadData = async () => {
  loading.value = true
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminProgressApplyList : getProgressApplyList
    const res = await loader({
      page: pagination.page,
      pageSize: pagination.limit,
      ...searchForm
    })
    tableData.value = res.data.items || res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载申请列表失败', error)
    ElMessage.error('加载申请列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStats = async () => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminProgressApplyStatistics : getProgressApplyStatistics
    const res = await loader()
    if (res.data) {
      stats.total = res.data.total || 0
      stats.pending = res.data.pending || 0
      stats.approved = res.data.approved || 0
      stats.rejected = res.data.rejected || 0
    }
  } catch (error) {
    console.error('加载统计信息失败', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const filterByStatus = (status) => {
  currentStatus.value = status
  searchForm.approval_status = status
  handleSearch()
}

const handleReset = () => {
  currentStatus.value = ''
  Object.assign(searchForm, {
    apply_no: '',
    customer_name: '',
    device_name: '',
    device_model: '',
    approval_status: ''
  })
  handleSearch()
}

const handleCreate = () => {
  Object.assign(formData, {
    customer_name: '',
    phone: '',
    device_name: '',
    device_model: '',
    progress_type: '',
    apply_reason: '',
    expected_time: ''
  })
  dialogVisible.value = true
}

const handleView = async (row) => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminProgressApplyDetail : getProgressApplyDetail
    const res = await loader(row.id)
    currentApply.value = res.data
    viewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.prompt('请输入审批意见', '审批通过', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '可选'
    }).then(async ({ value }) => {
      const submitter = isMiniAdminRoute.value ? approveMiniAdminProgressApply : approveProgressApply
      await submitter(row.id, { approval_remark: value })
      ElMessage.success('审批通过')
      loadData()
      loadStats()
    })
  } catch (error) {
    // 用户取消
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.prompt('请输入拒绝原因', '审批拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    }).then(async ({ value }) => {
      const submitter = isMiniAdminRoute.value ? rejectMiniAdminProgressApply : rejectProgressApply
      await submitter(row.id, { approval_remark: value })
      ElMessage.success('已拒绝申请')
      loadData()
      loadStats()
    })
  } catch (error) {
    // 用户取消
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const submitter = isMiniAdminRoute.value ? createMiniAdminProgressApply : createProgressApply
    await submitter(formData)
    ElMessage.success('申请提交成功')
    dialogVisible.value = false
    loadData()
    loadStats()
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSync = async () => {
  try {
    await ElMessageBox.confirm('确定要同步进度申请数据到本地系统吗？', '确认同步', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    syncing.value = true
    const submitter = isMiniAdminRoute.value ? syncMiniAdminProgressApply : syncProgressApply
    const res = await submitter()
    ElMessage.success(res.message || '同步完成')
    loadData()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败')
    }
  } finally {
    syncing.value = false
  }
}

// 工具函数
const getProgressTypeColor = (type) => {
  const map = {
    parts_waiting: 'success',
    repairing: 'primary',
    testing: '',
    other: 'info'
  }
  return map[type] || ''
}

const getApprovalStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

const getOrderStatusText = (status) => {
  const map = {
    pending: '待处理',
    confirmed: '已确认',
    assigned: '已派单',
    processing: '维修中',
    review: '待评价',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status || '-'
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.progress-apply-page {
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

  .stat-row {
    margin-bottom: 20px;

    .stat-card {
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      }

      &.stat-active {
        border: 2px solid #409eff;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
        transform: translateY(-4px);

        &.stat-pending {
          border-color: #e6a23c;
          box-shadow: 0 4px 16px rgba(230, 162, 60, 0.25);
        }

        &.stat-approved {
          border-color: #67c23a;
          box-shadow: 0 4px 16px rgba(103, 194, 58, 0.25);
        }

        &.stat-rejected {
          border-color: #f56c6c;
          box-shadow: 0 4px 16px rgba(245, 108, 108, 0.25);
        }
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 8px;
      }

      &.stat-pending .stat-value {
        color: #e6a23c;
      }

      &.stat-approved .stat-value {
        color: #67c23a;
      }

      &.stat-rejected .stat-value {
        color: #f56c6c;
      }
    }
  }
}
</style>
