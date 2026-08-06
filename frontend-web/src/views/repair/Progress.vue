<template>
  <div class="progress-container">
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="订单号">
            <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
          </el-form-item>
          <el-form-item label="设备型号">
            <el-input v-model="searchForm.device_model" placeholder="请输入设备型号" clearable />
          </el-form-item>
          <el-form-item label="阶段">
            <el-select v-model="searchForm.stage" placeholder="请选择阶段" clearable>
              <el-option v-for="item in stageOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待开始" value="pending" />
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
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增进度记录</el-button>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="device_model" label="设备型号" width="160" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户名称" width="120" show-overflow-tooltip />
        <el-table-column prop="customer_phone" label="客户电话" width="130" />
        <el-table-column label="故障图片" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewFaultImages(row.fault_images || [])" v-if="row.fault_images && row.fault_images.length > 0">
              <el-icon><Picture /></el-icon>
              {{ row.fault_images.length }}张
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stage_name" label="阶段" width="120" />
        <el-table-column prop="progress" label="进度" width="140">
          <template #default="{ row }"><el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" /></template>
        </el-table-column>
        <el-table-column prop="handler_name" label="负责人" width="100" />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="start_time" label="开始时间" width="160" />
        <el-table-column prop="end_time" label="结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">更新</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" :close-on-click-modal="false">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="订单ID" prop="order_id"><el-input v-model="formData.order_id" placeholder="请输入小程序订单ID" type="number" /></el-form-item>
        <el-form-item label="阶段" prop="stage">
          <el-select v-model="formData.stage" placeholder="请选择阶段" style="width: 100%">
            <el-option v-for="item in stageOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="阶段名称" prop="stage_name"><el-input v-model="formData.stage_name" placeholder="请输入阶段名称" /></el-form-item>
        <el-form-item label="进度" prop="progress"><div style="width: 100%"><el-slider v-model="formData.progress" :marks="progressMarks" /></div></el-form-item>
        <el-form-item label="负责人" prop="handler_name"><el-input v-model="formData.handler_name" placeholder="请输入负责人" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="开始时间" prop="start_time"><el-date-picker v-model="formData.start_time" type="datetime" placeholder="选择开始时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="结束时间" prop="end_time"><el-date-picker v-model="formData.end_time" type="datetime" placeholder="选择结束时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="描述" prop="description"><el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="进度详情" width="760px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detailData.order_no }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ detailData.device_model }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detailData.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ detailData.customer_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ detailData.stage_name }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="进度" :span="2"><el-progress :percentage="detailData.progress || 0" :color="getProgressColor(detailData.progress)" /></el-descriptions-item>
        <el-descriptions-item label="负责人">{{ detailData.handler_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailData.start_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detailData.end_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="故障图片" :span="2">
          <div v-if="detailData.fault_images && detailData.fault_images.length > 0" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <el-image
              v-for="(img, idx) in detailData.fault_images"
              :key="idx"
              :src="getFullImageUrl(img)"
              :preview-src-list="detailData.fault_images.map(i => getFullImageUrl(i))"
              :initial-index="idx"
              fit="cover"
              style="width: 80px; height: 80px; border-radius: 4px; cursor: pointer"
              preview-teleported
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>

    <!-- 故障图片查看对话框 -->
    <el-dialog v-model="faultImageDialogVisible" title="故障图片" width="800px">
      <el-image
        v-for="(img, index) in currentFaultImages"
        :key="index"
        :src="getFullImageUrl(img)"
        :preview-src-list="currentFaultImages.map(i => getFullImageUrl(i))"
        fit="cover"
        style="width: 100%; height: 400px; margin-bottom: 10px"
        preview-teleported
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { getRepairProgressList, createRepairProgress, updateRepairProgress, deleteRepairProgress } from '@/api/repairProgress'
import { getMediaUrl } from '@/utils/media'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const detailVisible = ref(false)
const formRef = ref(null)
const tableData = ref([])

const searchForm = reactive({ order_no: '', device_model: '', stage: '', status: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const stageOptions = ['待接单', '维修实施', '测试验收', '维修完成']
const progressMarks = { 0: '0%', 50: '50%', 100: '100%' }
const formData = reactive({ id: null, order_id: '', stage: '', stage_name: '', progress: 0, handler_name: '', status: 'pending', start_time: '', end_time: '', description: '' })
const detailData = reactive({ order_no: '', device_model: '', customer_name: '', customer_phone: '', stage_name: '', status: '', progress: 0, handler_name: '', start_time: '', end_time: '', description: '', fault_images: [] })
const formRules = {
  order_id: [{ required: true, message: '请输入订单ID', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
  stage_name: [{ required: true, message: '请输入阶段名称', trigger: 'blur' }]
}

const getProgressColor = (percent) => (percent < 30 ? '#f56c6c' : percent < 70 ? '#e6a23c' : percent < 100 ? '#409eff' : '#67c23a')
const getStatusType = (status) => ({ pending: 'info', in_progress: 'primary', completed: 'success' }[status] || 'info')
const getStatusText = (status) => ({ pending: '待开始', in_progress: '进行中', completed: '已完成' }[status] || status)

// 故障图片相关
const faultImageDialogVisible = ref(false)
const currentFaultImages = ref([])

const viewFaultImages = (images) => {
  currentFaultImages.value = images
  faultImageDialogVisible.value = true
}

const getFullImageUrl = (img) => {
  return getMediaUrl(img)
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRepairProgressList({ page: pagination.current, pageSize: pagination.pageSize, ...searchForm })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取进度列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.current = 1; loadData() }
const handleReset = () => { Object.assign(searchForm, { order_no: '', device_model: '', stage: '', status: '' }); handleSearch() }
const handleAdd = () => {
  dialogTitle.value = '新增进度记录'
  Object.assign(formData, { id: null, order_id: '', stage: '待接单', stage_name: '待接单', progress: 0, handler_name: '', status: 'pending', start_time: '', end_time: '', description: '' })
  dialogVisible.value = true
}
const handleEdit = (row) => { dialogTitle.value = '更新进度'; Object.assign(formData, { ...row, stage_name: row.stage_name || row.stage || '' }); dialogVisible.value = true }
const handleView = (row) => { Object.assign(detailData, row); detailVisible.value = true }
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该进度记录吗?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(async () => {
    await deleteRepairProgress(row.id)
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  formData.stage_name = formData.stage_name || formData.stage
  if (formData.id) await updateRepairProgress(formData.id, formData)
  else await createRepairProgress(formData)
  ElMessage.success(formData.id ? '更新成功' : '新增成功')
  dialogVisible.value = false
  loadData()
}
const handleSizeChange = (size) => { pagination.pageSize = size; loadData() }
const handleCurrentChange = (page) => { pagination.current = page; loadData() }

onMounted(loadData)
</script>

<style lang="scss" scoped>
.progress-container {
  padding: 20px;
  .search-section { margin-bottom: 20px; .search-form { display: flex; flex-wrap: wrap; } }
  .toolbar-section { margin-bottom: 20px; }
  .pagination-section { margin-top: 20px; display: flex; justify-content: flex-end; }
}
</style>
