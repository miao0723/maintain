<template>
  <div class="mini-page">
    <el-card shadow="never">
      <div class="page-header">
        <div>
          <h2>维修订单</h2>
          <p>统一查看 repair 数据库订单数据，支持状态校正、实际金额与备注补录。</p>
        </div>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号 / 故障 / 型号" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部">
            <el-option
              v-for="(label, val) in statusMap"
              :key="val"
              :label="label"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.device_type" clearable placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="(label, val) in deviceTypeMap" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务方式">
          <el-select v-model="searchForm.service_type" clearable placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="(label, val) in serviceTypeMap" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="order_id" label="订单编号" min-width="160" />
        <el-table-column label="客户" min-width="110">
          <template #default="{ row }">{{ row.user_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="设备类型" width="90">
          <template #default="{ row }">{{ deviceTypeMap[row.device_type] || '-' }}</template>
        </el-table-column>
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="device_model" label="型号" min-width="110" />
        <el-table-column label="故障描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.problem_description || row.custom_description || '-' }}</template>
        </el-table-column>
        <el-table-column label="服务方式" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ serviceTypeMap[row.service_type] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实际价格" width="110">
          <template #default="{ row }">
            <span v-if="row.actual_price != null" style="color: #f56c6c; font-weight: bold">
              ¥{{ Number(row.actual_price).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)" size="small">
              {{ priorityMap[row.priority] || '中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusMap[row.status] || row.status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="订单详情" width="760px" destroy-on-close>
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border class="detail-descriptions" v-if="formData.order_id">
          <el-descriptions-item label="订单编号">{{ formData.order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ orderTypeMap[formData.order_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名">{{ formData.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ formData.user_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ deviceTypeMap[formData.device_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ formData.brand_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ formData.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务方式">{{ serviceTypeMap[formData.service_type] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预估价格">
            ¥{{ formData.estimated_price != null ? Number(formData.estimated_price).toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="实际价格">
            ¥{{ formData.actual_price != null ? Number(formData.actual_price).toFixed(2) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityType(formData.priority)" size="small">
              {{ priorityMap[formData.priority] || '中' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(formData.status)">{{ statusMap[formData.status] || formData.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="服务人员">{{ formData.assigned_user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formData.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formData.completed_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="2">{{ formData.problem_description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">状态校正</el-divider>
        <el-form :model="formData" label-width="90px" class="detail-form">
          <el-form-item label="订单状态">
            <el-select v-model="formData.status" style="width: 100%">
              <el-option
                v-for="(label, val) in statusMap"
                :key="val"
                :label="label"
                :value="val"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="实际价格">
            <el-input-number
              v-model="formData.actual_price"
              :min="0"
              :precision="2"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="formData.remark" type="textarea" :rows="4" placeholder="记录校正原因或人工备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="saving" @click="savePayment">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMiniAdminPaymentDetail,
  getMiniAdminPayments,
  updateMiniAdminPayment
} from '@/api/miniAdmin'

const deviceTypeMap = {
  1: '手机',
  2: '电脑',
  3: '平板',
  4: '手表',
  5: '其他'
}
const serviceTypeMap = {
  shop: '到店',
  home: '上门'
}
const priorityMap = {
  low: '低',
  medium: '中',
  high: '高'
}
const orderTypeMap = {
  repair: '维修',
  recycle: '回收'
}
const statusMap = {
  pending: '待处理',
  quoted: '待确认报价',
  confirmed: '已确认报价',
  processing: '维修中',
  review: '待验收',
  completed: '已完成',
  cancelled: '已取消'
}

const statusType = (status) => ({
  pending: 'info',
  quoted: 'warning',
  confirmed: 'primary',
  processing: 'warning',
  review: 'success',
  completed: 'success',
  cancelled: 'danger'
}[status] || 'info')

const priorityType = (priority) => ({
  low: 'info',
  medium: '',
  high: 'danger'
}[priority] || '')

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const tableData = ref([])

const searchForm = reactive({
  keyword: '',
  status: '',
  device_type: '',
  service_type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  id: null,
  order_id: '',
  order_type: '',
  user_name: '',
  user_phone: '',
  device_type: '',
  brand_name: '',
  device_model: '',
  service_type: '',
  estimated_price: 0,
  actual_price: 0,
  priority: 'medium',
  status: '',
  assigned_user_name: '',
  created_at: '',
  completed_at: '',
  problem_description: '',
  remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMiniAdminPayments({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
      device_type: searchForm.device_type,
      service_type: searchForm.service_type
    })
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.device_type = ''
  searchForm.service_type = ''
  handleSearch()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  loadData()
}

const openDetail = async (row) => {
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await getMiniAdminPaymentDetail(row.id)
    Object.assign(formData, {
      remark: '',
      order_type: '',
      user_name: '',
      user_phone: '',
      brand_name: '',
      device_model: '',
      estimated_price: 0,
      priority: 'medium',
      assigned_user_name: '',
      created_at: '',
      completed_at: '',
      problem_description: '',
      ...(res.data || {})
    })
    formData.id = row.id
    formData.actual_price = formData.actual_price != null ? Number(formData.actual_price) : 0
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const savePayment = async () => {
  saving.value = true
  try {
    await updateMiniAdminPayment(formData.id, {
      status: formData.status,
      actual_price: formData.actual_price,
      remark: formData.remark
    })
    ElMessage.success('订单已更新')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

loadData()
</script>

<style scoped lang="scss">
.mini-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    p {
      margin: 8px 0 0;
      color: #64748b;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}

.detail-descriptions {
  margin-bottom: 20px;
}

.detail-form {
  margin-top: 20px;
}
</style>
