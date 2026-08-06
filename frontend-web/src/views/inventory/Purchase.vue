<template>
  <div class="purchase-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="采购单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入" clearable />
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="采购中" value="purchasing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
          新增采购
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="采购单号" width="150" />
        <el-table-column prop="supplier_name" label="供应商" width="150" />
        <el-table-column prop="total_amount" label="采购总额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="item_count" label="采购品种" width="100" />
        <el-table-column prop="expected_date" label="预计到货日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)" v-if="row.status === 'pending'">编辑</el-button>
            <el-button link type="success" @click="handleApprove(row)" v-if="row.status === 'pending'">审核</el-button>
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

    <!-- 采购详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="采购详情" width="900px">
      <div v-if="currentPurchase">
        <el-descriptions :column="2" border class="mb-4">
          <el-descriptions-item label="采购单号">{{ currentPurchase.order_no }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentPurchase.supplier_name }}</el-descriptions-item>
          <el-descriptions-item label="采购总额">¥{{ currentPurchase.total_amount.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentPurchase.status)">
              {{ getStatusText(currentPurchase.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计到货日期">{{ currentPurchase.expected_date }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentPurchase.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentPurchase.notes }}</el-descriptions-item>
        </el-descriptions>

        <h4>采购明细</h4>
        <el-table :data="currentPurchase.items" border>
          <el-table-column prop="part_name" label="备件名称" />
          <el-table-column prop="part_code" label="备件编号" />
          <el-table-column prop="quantity" label="采购数量" />
          <el-table-column prop="unit_price" label="单价">
            <template #default="{ row }">
              ¥{{ row.unit_price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计">
            <template #default="{ row }">
              ¥{{ row.subtotal.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const searchForm = reactive({
  order_no: '',
  supplier_id: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentPurchase = ref(null)

const suppliers = ref([])

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    approved: 'warning',
    purchasing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已审核',
    purchasing: '采购中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取采购单列表
    tableData.value = [
      {
        id: 1,
        order_no: 'PO20240324001',
        supplier_name: '上海汽配有限公司',
        total_amount: 5000.00,
        item_count: 5,
        expected_date: '2024-03-30',
        status: 'pending',
        created_at: '2024-03-24 10:00:00',
        notes: '',
        items: [
          { part_name: '空气滤芯', part_code: 'PART001', quantity: 100, unit_price: 25.00, subtotal: 2500.00 },
          { part_name: '机油滤芯', part_code: 'PART002', quantity: 50, unit_price: 30.00, subtotal: 1500.00 }
        ]
      }
    ]
    pagination.total = 1
  } catch (error) {
    console.error('获取采购单列表失败:', error)
    ElMessage.error('获取采购单列表失败')
  } finally {
    loading.value = false
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

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    order_no: '',
    supplier_id: '',
    status: ''
  })
  handleSearch()
}

const handleAdd = () => {
  ElMessage.info('新增采购功能开发中')
}

const handleView = (row) => {
  currentPurchase.value = row
  detailDialogVisible.value = true
}

const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中')
}

const handleApprove = (row) => {
  ElMessage.info('审核功能开发中')
}

onMounted(() => {
  fetchData()
  fetchSuppliers()
})
</script>

<style lang="scss" scoped>
.purchase-container {
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

  .mb-4 {
    margin-bottom: 16px;
  }

  h4 {
    margin: 16px 0;
    font-size: 16px;
    font-weight: bold;
  }
}
</style>
