<template>
  <div class="repair-quote-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="报价单号">
        <el-input v-model="searchForm.quotation_no" placeholder="请输入报价单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="客户姓名">
        <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable style="width: 150px" />
      </el-form-item>
      <el-form-item label="报价状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="草稿" :value="0" />
          <el-option label="已提交" :value="1" />
          <el-option label="已接受" :value="2" />
          <el-option label="已拒绝" :value="3" />
          <el-option label="已转为工单" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建报价单
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" border style="width: 100%">
      <el-table-column prop="quotation_no" label="报价单号" width="150" />
      <el-table-column prop="order_no" label="订单号" width="150" />
      <el-table-column prop="customer_name" label="客户姓名" width="120" />
      <el-table-column prop="customer_phone" label="联系电话" width="130" />
      <el-table-column prop="device_model" label="设备型号" width="150" show-overflow-tooltip />
      <el-table-column prop="fault_description" label="故障描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="total_amount" label="报价总额" width="120" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ Number(row.total_amount || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="final_amount" label="最终金额" width="120" align="right">
        <template #default="{ row }">
          <span class="amount" style="color: #f56c6c">¥{{ Number(row.final_amount || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="报价状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status === 0" link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 0" link type="success" @click="handleSubmitQuote(row)">提交</el-button>
          <el-button link type="info" @click="handlePrint(row)">打印</el-button>
          <el-button v-if="row.status === 0" link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 创建/编辑报价单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1000px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单号" prop="order_no">
              <el-input v-model="formData.order_no" placeholder="请输入订单号" :disabled="!!formData.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customer_name">
              <el-input v-model="formData.customer_name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customer_phone">
              <el-input v-model="formData.customer_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备型号" prop="device_model">
              <el-input v-model="formData.device_model" placeholder="请输入设备型号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="故障描述" prop="fault_description">
          <el-input v-model="formData.fault_description" type="textarea" :rows="3" placeholder="请描述故障情况" />
        </el-form-item>

        <!-- 报价明细 -->
        <el-form-item label="报价明细">
          <div class="quote-items">
            <div v-for="(item, index) in formData.items" :key="index" class="quote-item">
              <el-row :gutter="10">
                <el-col :span="4">
                  <el-select v-model="item.item_type" placeholder="类型" style="width: 100%">
                    <el-option label="维修费" :value="1" />
                    <el-option label="配件费" :value="2" />
                    <el-option label="材料费" :value="3" />
                    <el-option label="上门费" :value="4" />
                    <el-option label="其他" :value="5" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="item.item_name" placeholder="项目名称" />
                </el-col>
                <el-col :span="5">
                  <el-input v-model="item.quantity" type="number" :min="0.01" :step="0.01" placeholder="数量" style="width: 100%" />
                </el-col>
                <el-col :span="4">
                  <el-input v-model="item.unit" placeholder="单位" style="width: 100%" />
                </el-col>
                <el-col :span="4">
                  <el-input-number v-model="item.unit_price" :min="0" :precision="2" :step="0.01" style="width: 100%" />
                </el-col>
                <el-col :span="4">
                  <el-input :value="calculateItemPrice(item).toFixed(2)" disabled>
                    <template #prepend>¥</template>
                  </el-input>
                </el-col>
                <el-col :span="3">
                  <el-button type="danger" link @click="removeItem(index)">删除</el-button>
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addItem">+ 添加项目</el-button>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣金额">
              <el-input-number v-model="formData.discount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报价总额">
              <el-input :value="calculateTotal().toFixed(2)" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最终金额">
              <el-input :value="calculateFinal().toFixed(2)" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期">
              <el-date-picker v-model="formData.valid_until" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注说明">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="报价单详情" width="900px">
      <div class="quote-detail" v-if="currentQuote">
        <div class="quote-header">
          <h2>维修报价单</h2>
          <p class="quote-no">{{ currentQuote.quotation_no }}</p>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentQuote.order_no }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ currentQuote.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentQuote.customer_phone }}</el-descriptions-item>
          <el-descriptions-item label="设备型号" :span="2">{{ currentQuote.device_model }}</el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="2">{{ currentQuote.fault_description }}</el-descriptions-item>
          <el-descriptions-item label="报价总额">¥{{ Number(currentQuote.total_amount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="折扣金额">¥{{ Number(currentQuote.discount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="最终金额">¥{{ Number(currentQuote.final_amount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="有效期">{{ currentQuote.valid_until || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报价状态">
            <el-tag :type="getStatusType(currentQuote.status)" size="small">
              {{ getStatusText(currentQuote.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentQuote.created_at }}</el-descriptions-item>
        </el-descriptions>

        <div class="quote-items-detail">
          <h4>报价明细</h4>
          <el-table :data="currentQuote.items" border>
            <el-table-column prop="item_type" label="类型" width="100">
              <template #default="{ row }">{{ getItemTypeText(row.item_type) }}</template>
            </el-table-column>
            <el-table-column prop="item_name" label="项目名称" />
            <el-table-column prop="quantity" label="数量" width="100" align="center" />
            <el-table-column prop="unit" label="单位" width="80" align="center" />
            <el-table-column prop="unit_price" label="单价" width="120" align="right">
              <template #default="{ row }">¥{{ Number(row.unit_price).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="小计" width="120" align="right">
              <template #default="{ row }">¥{{ Number(calculateItemPrice(row)).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="quote-total">
          <h3>总计：¥{{ Number(currentQuote.final_amount || 0).toFixed(2) }}</h3>
        </div>

        <div class="quote-remark" v-if="currentQuote.remark">
          <h4>备注说明</h4>
          <p>{{ currentQuote.remark }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
        <el-button type="info" @click="handlePrint(currentQuote)">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getQuotationList,
  getQuotationDetail,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  submitQuotation
} from '@/api/quotation'
import { useRoute } from 'vue-router'

const route = useRoute()

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentQuote = ref(null)
const formRef = ref(null)

const searchForm = reactive({
  quotation_no: '',
  order_no: '',
  customer_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const dialogMode = ref('create')
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新建报价单' : '编辑报价单'
})

const formData = reactive({
  id: null,
  order_id: null,
  order_no: '',
  customer_name: '',
  customer_phone: '',
  device_model: '',
  fault_description: '',
  items: [
    { item_type: 1, item_name: '', description: '', quantity: 1, unit: '项', unit_price: 0, sort: 0 }
  ],
  discount: 0,
  valid_until: '',
  remark: ''
})

const formRules = {
  order_no: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  customer_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  device_model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
  fault_description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }]
}

// 项目类型映射
const itemTypeMap = {
  1: '维修费',
  2: '配件费',
  3: '材料费',
  4: '上门费',
  5: '其他'
}

// 状态映射
const statusMap = {
  0: '草稿',
  1: '已提交',
  2: '已接受',
  3: '已拒绝',
  4: '已转为工单'
}

const statusTypeMap = {
  0: 'info',
  1: 'warning',
  2: 'success',
  3: 'danger',
  4: ''
}

const getItemTypeText = (type) => itemTypeMap[type] || '未知'
const getStatusType = (status) => statusTypeMap[status] || ''
const getStatusText = (status) => statusMap[status] || '未知'

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.quotation_no) params.quotation_no = searchForm.quotation_no
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.customer_name) params.customer_name = searchForm.customer_name
    if (searchForm.status !== '') params.status = searchForm.status

    const res = await getQuotationList(pagination.page, pagination.limit, params)
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载报价单列表失败', error)
    ElMessage.error('加载报价单列表失败')
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
    quotation_no: '',
    order_no: '',
    customer_name: '',
    status: ''
  })
  handleSearch()
}

// 创建报价单
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, {
    id: null,
    order_id: null,
    order_no: '',
    customer_name: '',
    customer_phone: '',
    device_model: '',
    fault_description: '',
    items: [{ item_type: 1, item_name: '', description: '', quantity: 1, unit: '项', unit_price: 0, sort: 0 }],
    discount: 0,
    valid_until: '',
    remark: ''
  })

  // 如果 URL 中有订单号参数，自动填充
  if (route.query.order_id) {
    formData.order_id = route.query.order_id
    formData.order_no = route.query.order_no || ''
    formData.customer_name = route.query.customer_name || ''
    formData.customer_phone = route.query.customer_phone || ''
    formData.device_model = route.query.device_model || ''
    formData.fault_description = route.query.fault_description || ''
  }

  dialogVisible.value = true
}

// 编辑报价单
const handleEdit = async (row) => {
  dialogMode.value = 'edit'
  try {
    const res = await getQuotationDetail(row.id)
    if (res.code === 200 || res.code === 0) {
      const data = res.data
      Object.assign(formData, {
        id: data.id,
        order_id: data.order_id,
        order_no: data.order_no,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        device_model: data.device_model,
        fault_description: data.fault_description,
        items: data.items || [{ item_type: 1, item_name: '', description: '', quantity: 1, unit: '项', unit_price: 0, sort: 0 }],
        discount: data.discount || 0,
        valid_until: data.valid_until || '',
        remark: data.remark || ''
      })
      dialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取报价单详情失败')
  }
}

// 查看详情
const handleView = (row) => {
  currentQuote.value = row
  viewDialogVisible.value = true
}

// 提交报价单
const handleSubmitQuote = async (row) => {
  try {
    await ElMessageBox.confirm('确定要提交该报价单吗？', '提示', { type: 'info' })
    const res = await submitQuotation(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('提交成功')
      loadData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交失败')
    }
  }
}

// 打印
const handlePrint = (row) => {
  ElMessage.info('打印功能开发中...')
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该报价单吗？', '提示', { type: 'warning' })
    const res = await deleteQuotation(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 添加项目
const addItem = () => {
  formData.items.push({ item_type: 1, item_name: '', description: '', quantity: 1, unit: '项', unit_price: 0, sort: 0 })
}

// 删除项目
const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一项')
  }
}

// 计算单项价格
const calculateItemPrice = (item) => {
  return (item.quantity || 0) * (item.unit_price || 0)
}

// 计算总额
const calculateTotal = () => {
  return formData.items.reduce((sum, item) => {
    return sum + calculateItemPrice(item)
  }, 0)
}

// 计算最终金额
const calculateFinal = () => {
  const total = calculateTotal()
  const discount = formData.discount || 0
  return Math.max(0, total - discount)
}

const isSuccessCode = (code) => {
  if (code === 0) return true
  return typeof code === 'number' && code >= 200 && code < 300
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const total_amount = calculateTotal()
  const final_amount = calculateFinal()

  const data = {
    order_id: formData.order_id,
    order_no: formData.order_no,
    customer_name: formData.customer_name,
    customer_phone: formData.customer_phone,
    device_model: formData.device_model,
    fault_description: formData.fault_description,
    items: formData.items,
    total_amount,
    discount: formData.discount,
    discount_amount: formData.discount,
    final_amount,
    valid_until: formData.valid_until,
    remark: formData.remark
  }

  try {
    if (dialogMode.value === 'create') {
      const res = await createQuotation(data)
      if (isSuccessCode(res.code)) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        loadData()
      }
    } else {
      const res = await updateQuotation(formData.id, data)
      if (isSuccessCode(res.code)) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()

  // 如果 URL 中有订单号参数，自动打开创建对话框
  if (route.query.order_id) {
    handleCreate()
  }
})
</script>

<style lang="scss" scoped>
.repair-quote-page {
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

  .quote-items {
    width: 100%;

    .quote-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }

  .quote-detail {
    .quote-header {
      text-align: center;
      margin-bottom: 20px;

      h2 {
        margin: 0 0 10px;
      }

      .quote-no {
        color: #666;
        margin: 0;
      }
    }

    .quote-items-detail {
      margin: 20px 0;

      h4 {
        margin: 0 0 10px;
      }
    }

    .quote-total {
      text-align: right;
      margin: 20px 0;

      h3 {
        color: #f56c6c;
        margin: 0;
      }
    }

    .quote-remark {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;

      h4 {
        margin: 0 0 10px;
      }

      p {
        color: #666;
        margin: 0;
      }
    }
  }
}
</style>
