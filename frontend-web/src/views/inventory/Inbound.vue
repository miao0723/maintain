<template>
  <div class="inbound-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="单据编号">
          <el-input v-model="searchForm.order_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="备件名称">
          <el-input v-model="searchForm.part_name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplier_id" placeholder="请选择" clearable>
            <el-option
              v-for="sup in suppliers"
              :key="sup.id"
              :label="sup.name"
              :value="sup.id"
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
          新增入库
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="order_no" label="单据编号" width="150" />
        <el-table-column prop="part_name" label="备件名称" min-width="150" />
        <el-table-column prop="part_code" label="备件编号" width="130" />
        <el-table-column prop="quantity" label="入库数量" width="100" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ row.unit_price }}
          </template>
        </el-table-column>
        <el-table-column prop="total_price" label="总价" width="120">
          <template #default="{ row }">
            ¥{{ row.total_price }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" label="供应商" width="150" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="created_at" label="入库时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已完成' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)" v-if="row.status !== 1">删除</el-button>
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

    <!-- 新增入库对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增入库"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="备件" prop="part_id">
          <el-select v-model="form.part_id" placeholder="请选择备件" @change="handlePartChange">
            <el-option
              v-for="part in parts"
              :key="part.id"
              :label="`${part.name} (${part.code})`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier_id">
          <el-select v-model="form.supplier_id" placeholder="请选择供应商">
            <el-option
              v-for="sup in suppliers"
              :key="sup.id"
              :label="sup.name"
              :value="sup.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" @change="handleQuantityChange" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="unit_price">
              <el-input-number v-model="form.unit_price" :min="0" :precision="2" @change="handleQuantityChange" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="总价">
          <el-input v-model="totalPrice" disabled />
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 入库详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="入库详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="单据编号">{{ currentRecord.order_no }}</el-descriptions-item>
        <el-descriptions-item label="入库时间">{{ currentRecord.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备件名称">{{ currentRecord.part_name }}</el-descriptions-item>
        <el-descriptions-item label="备件编号">{{ currentRecord.part_code }}</el-descriptions-item>
        <el-descriptions-item label="入库数量">{{ currentRecord.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ currentRecord.unit_price }}</el-descriptions-item>
        <el-descriptions-item label="总价">¥{{ currentRecord.total_price }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentRecord.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentRecord.operator }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRecord.status === 1 ? 'success' : 'warning'">
            {{ currentRecord.status === 1 ? '已完成' : '待审核' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.notes }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const searchForm = reactive({
  order_no: '',
  part_name: '',
  supplier_id: '',
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

const form = reactive({
  part_id: '',
  supplier_id: '',
  quantity: 1,
  unit_price: 0,
  notes: ''
})

const rules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
  unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const parts = ref([])
const suppliers = ref([])

const totalPrice = computed(() => {
  return `¥${(form.quantity * form.unit_price).toFixed(2)}`
})

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取入库记录列表
    tableData.value = [
      {
        id: 1,
        order_no: 'IN20240324001',
        part_name: '空气滤芯',
        part_code: 'PART001',
        quantity: 100,
        unit_price: 25.00,
        total_price: 2500.00,
        supplier_name: '上海汽配有限公司',
        operator: '张三',
        created_at: '2024-03-24 10:30:00',
        status: 1,
        notes: ''
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取入库记录失败:', error)
    ElMessage.error('获取入库记录失败')
  } finally {
    loading.value = false
  }
}

const fetchParts = async () => {
  try {
    // TODO: 调用API获取备件列表
    parts.value = [
      { id: 1, name: '空气滤芯', code: 'PART001', purchase_price: 25.00 },
      { id: 2, name: '机油滤芯', code: 'PART002', purchase_price: 30.00 }
    ]
  } catch (error) {
    console.error('获取备件列表失败:', error)
  }
}

const fetchSuppliers = async () => {
  try {
    // TODO: 调用API获取供应商列表
    suppliers.value = [
      { id: 1, name: '上海汽配有限公司' },
      { id: 2, name: '北京机电设备有限公司' }
    ]
  } catch (error) {
    console.error('获取供应商列表失败:', error)
  }
}

const handlePartChange = (partId) => {
  const part = parts.value.find(p => p.id === partId)
  if (part) {
    form.unit_price = part.purchase_price
  }
}

const handleQuantityChange = () => {
  // 总价会自动计算
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    order_no: '',
    part_name: '',
    supplier_id: '',
    date_range: []
  })
  handleSearch()
}

const handleAdd = () => {
  dialogVisible.value = true
  Object.assign(form, {
    part_id: '',
    supplier_id: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  })
}

const handleView = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除入库单"${row.order_no}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // TODO: 调用API删除入库记录
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    // TODO: 调用API创建入库记录
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

onMounted(() => {
  fetchData()
  fetchParts()
  fetchSuppliers()
})
</script>

<style lang="scss" scoped>
.inbound-container {
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
