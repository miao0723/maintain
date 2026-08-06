<template>
  <div class="detection-fee-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="费用单号">
        <el-input v-model="searchForm.fee_no" placeholder="请输入费用单号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名">
        <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="设备名称">
        <el-input v-model="searchForm.device_name" placeholder="请输入设备名称" clearable />
      </el-form-item>
      <el-form-item label="收费状态">
        <el-select v-model="searchForm.payment_status" placeholder="全部" clearable>
          <el-option label="未收费" value="unpaid" />
          <el-option label="已收费" value="paid" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建检测费用
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
    >
      <el-table-column prop="fee_no" label="费用单号" width="150" />
      <el-table-column prop="customer_name" label="客户姓名" width="120" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column prop="device_name" label="设备名称" width="150" show-overflow-tooltip />
      <el-table-column prop="detection_items" label="检测项目" min-width="200" show-overflow-tooltip />
      <el-table-column prop="detection_fee" label="检测费用" width="120" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ (row.detection_fee || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="payment_status" label="收费状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.payment_status === 'paid' ? 'success' : 'warning'" size="small">
            {{ row.payment_status === 'paid' ? '已收费' : '未收费' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="detection_time" label="检测时间" width="160" />
      <el-table-column label="操作" width="250" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="row.payment_status === 'unpaid'"
            link
            type="success"
            @click="handlePayment(row)"
          >
            收款
          </el-button>
          <el-button link type="info" @click="handlePrint(row)">打印</el-button>
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

    <!-- 创建/编辑费用单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="formData.device_name" placeholder="请输入设备名称" />
        </el-form-item>

        <el-form-item label="检测项目" prop="detection_items">
          <el-input
            v-model="formData.detection_items"
            type="textarea"
            :rows="3"
            placeholder="请输入检测项目，多个项目用逗号分隔"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测费用" prop="detection_fee">
              <el-input-number v-model="formData.detection_fee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测时间" prop="detection_time">
              <el-date-picker
                v-model="formData.detection_time"
                type="datetime"
                placeholder="选择检测时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="检测人员" prop="detection_user">
          <el-input v-model="formData.detection_user" placeholder="请输入检测人员姓名" />
        </el-form-item>

        <el-form-item label="检测备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入检测备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="检测费用详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentFee">
        <el-descriptions-item label="费用单号">{{ currentFee.fee_no }}</el-descriptions-item>
        <el-descriptions-item label="收费状态">
          <el-tag :type="currentFee.payment_status === 'paid' ? 'success' : 'warning'" size="small">
            {{ currentFee.payment_status === 'paid' ? '已收费' : '未收费' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentFee.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentFee.phone }}</el-descriptions-item>
        <el-descriptions-item label="设备名称" :span="2">{{ currentFee.device_name }}</el-descriptions-item>
        <el-descriptions-item label="检测项目" :span="2">{{ currentFee.detection_items }}</el-descriptions-item>
        <el-descriptions-item label="检测费用">¥{{ (currentFee.detection_fee || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="检测时间">{{ currentFee.detection_time }}</el-descriptions-item>
        <el-descriptions-item label="检测人员" :span="2">{{ currentFee.detection_user }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentFee.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentFee.remark || '无' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentFee?.payment_status === 'unpaid'"
          type="success"
          @click="handlePayment(currentFee)"
        >
          收款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentFee = ref(null)
const formRef = ref(null)

const searchForm = reactive({
  fee_no: '',
  customer_name: '',
  device_name: '',
  payment_status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const dialogMode = ref('create')
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新建检测费用' : '编辑检测费用'
})

const formData = reactive({
  customer_name: '',
  phone: '',
  device_name: '',
  detection_items: '',
  detection_fee: 0,
  detection_time: '',
  detection_user: '',
  remark: ''
})

const formRules = {
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  detection_items: [{ required: true, message: '请输入检测项目', trigger: 'blur' }],
  detection_fee: [{ required: true, message: '请输入检测费用', trigger: 'blur' }],
  detection_time: [{ required: true, message: '请选择检测时间', trigger: 'change' }],
  detection_user: [{ required: true, message: '请输入检测人员', trigger: 'blur' }]
}

// 模拟数据
const mockData = [
  {
    id: 1,
    fee_no: 'DF20260326001',
    customer_name: '李四',
    phone: '13900139000',
    device_name: '装载机 ZL50',
    detection_items: '发动机性能检测,液压系统检测,传动系统检测',
    detection_fee: 500,
    payment_status: 'paid',
    detection_time: '2026-03-26 10:00',
    detection_user: '王工程师',
    created_at: '2026-03-26 10:30:00',
    remark: '设备整体状况良好'
  },
  {
    id: 2,
    fee_no: 'DF20260326002',
    customer_name: '王五',
    phone: '13700137000',
    device_name: '推土机 TY220',
    detection_items: '发动机检测,电气系统检测',
    detection_fee: 300,
    payment_status: 'unpaid',
    detection_time: '2026-03-26 14:00',
    detection_user: '李工程师',
    created_at: '2026-03-26 14:30:00',
    remark: ''
  }
]

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用实际API
    tableData.value = mockData
    pagination.total = mockData.length
  } catch (error) {
    console.error('加载检测费用列表失败', error)
    ElMessage.error('加载检测费用列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    fee_no: '',
    customer_name: '',
    device_name: '',
    payment_status: ''
  })
  handleSearch()
}

// 创建费用
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, {
    customer_name: '',
    phone: '',
    device_name: '',
    detection_items: '',
    detection_fee: 0,
    detection_time: '',
    detection_user: '',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑费用
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 查看详情
const handleView = (row) => {
  currentFee.value = row
  viewDialogVisible.value = true
}

// 收款
const handlePayment = async (row) => {
  try {
    await ElMessageBox.confirm('确定已收到款项吗？', '收款确认', {
      type: 'success'
    })
    // TODO: 调用收款API
    ElMessage.success('收款成功')
    viewDialogVisible.value = false
    loadData()
  } catch (error) {
    // 用户取消
  }
}

// 打印
const handlePrint = (row) => {
  ElMessage.info('打印功能开发中...')
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    // TODO: 调用创建/编辑API
    ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已在拦截器中处理
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.detection-fee-page {
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

  .amount {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
