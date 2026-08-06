<template>
  <div class="external-container">
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="订单号">
            <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
          </el-form-item>
          <el-form-item label="设备型号">
            <el-input v-model="searchForm.device_model" placeholder="请输入设备型号" clearable />
          </el-form-item>
          <el-form-item label="外部单位">
            <el-input v-model="searchForm.external_unit" placeholder="请输入外部单位" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar-section">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增联动维修</el-button>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="device_model" label="设备型号" width="160" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户名称" width="120" show-overflow-tooltip />
        <el-table-column prop="customer_phone" label="客户电话" width="130" />
        <el-table-column prop="external_unit" label="外部单位" width="180" show-overflow-tooltip />
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="repair_content" label="维修内容" min-width="220" show-overflow-tooltip />
        <el-table-column prop="amount" label="维修金额" width="110">
          <template #default="{ row }">¥{{ formatMoney(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="完成日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
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

      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="820px" :close-on-click-modal="false">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单ID" prop="order_id">
              <el-input v-model="formData.order_id" placeholder="请输入小程序订单ID" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外部单位" prop="external_unit">
              <el-input v-model="formData.external_unit" placeholder="请输入外部单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="formData.contact_person" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="formData.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="维修内容" prop="repair_content">
          <el-input v-model="formData.repair_content" type="textarea" :rows="3" placeholder="请输入维修内容" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="维修金额" prop="amount">
              <el-input-number v-model="formData.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待处理" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker v-model="formData.start_date" type="date" placeholder="选择开始日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="完成日期" prop="end_date">
              <el-date-picker v-model="formData.end_date" type="date" placeholder="选择完成日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="联动维修详情" width="760px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detailData.order_no }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ detailData.device_model }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detailData.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ detailData.customer_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="外部单位">{{ detailData.external_unit }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailData.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="维修金额">¥{{ formatMoney(detailData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ detailData.start_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成日期">{{ detailData.end_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="维修内容" :span="2">{{ detailData.repair_content || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
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
import { Plus } from '@element-plus/icons-vue'
import { getExternalRepairList, createExternalRepair, updateExternalRepair, deleteExternalRepair } from '@/api/repairProgress'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const detailVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])

const searchForm = reactive({ order_no: '', device_model: '', external_unit: '', status: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const formData = reactive({ id: null, order_id: '', external_unit: '', contact_person: '', contact_phone: '', repair_content: '', amount: 0, status: 'pending', start_date: '', end_date: '', remark: '' })
const detailData = reactive({ order_no: '', device_model: '', customer_name: '', customer_phone: '', external_unit: '', contact_person: '', contact_phone: '', repair_content: '', amount: 0, status: '', start_date: '', end_date: '', remark: '' })
const formRules = {
  order_id: [{ required: true, message: '请输入订单ID', trigger: 'blur' }],
  external_unit: [{ required: true, message: '请输入外部单位', trigger: 'blur' }]
}

const formatMoney = (value) => {
  const num = Number(value || 0)
  return Number.isNaN(num) ? '0.00' : num.toFixed(2)
}
const getStatusType = (status) => ({ pending: 'info', in_progress: 'primary', completed: 'success' }[status] || 'info')
const getStatusText = (status) => ({ pending: '待处理', in_progress: '进行中', completed: '已完成' }[status] || status)

const loadData = async () => {
  loading.value = true
  try {
    const res = await getExternalRepairList({ page: pagination.current, pageSize: pagination.pageSize, ...searchForm })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取联动维修列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.current = 1; loadData() }
const handleReset = () => { Object.assign(searchForm, { order_no: '', device_model: '', external_unit: '', status: '' }); handleSearch() }
const handleAdd = () => {
  dialogTitle.value = '新增联动维修'
  Object.assign(formData, { id: null, order_id: '', external_unit: '', contact_person: '', contact_phone: '', repair_content: '', amount: 0, status: 'pending', start_date: '', end_date: '', remark: '' })
  dialogVisible.value = true
}
const handleEdit = (row) => { dialogTitle.value = '编辑联动维修'; Object.assign(formData, { ...row }); dialogVisible.value = true }
const handleView = (row) => { Object.assign(detailData, row); detailVisible.value = true }
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该联动维修记录吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(async () => {
    await deleteExternalRepair(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (formData.id) await updateExternalRepair(formData.id, formData)
  else await createExternalRepair(formData)
  ElMessage.success(formData.id ? '更新成功' : '新增成功')
  dialogVisible.value = false
  loadData()
}
const handleSizeChange = (size) => { pagination.pageSize = size; loadData() }
const handleCurrentChange = (page) => { pagination.current = page; loadData() }

onMounted(loadData)
</script>

<style lang="scss" scoped>
.external-container {
  padding: 20px;
  .search-section { margin-bottom: 20px; .search-form { display: flex; flex-wrap: wrap; } }
  .toolbar-section { margin-bottom: 20px; }
  .pagination-section { margin-top: 20px; display: flex; justify-content: flex-end; }
}
</style>
