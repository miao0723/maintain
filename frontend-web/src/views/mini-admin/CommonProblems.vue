<template>
  <div class="content-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="问题名称搜索" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.device_type_id" placeholder="请选择设备类型" clearable style="width: 180px">
            <el-option label="全部" value="" />
            <el-option
              v-for="dt in deviceTypes"
              :key="dt.id"
              :label="`${dt.icon || '🔧'} ${dt.name}`"
              :value="dt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增常见问题</el-button>
        <el-dropdown trigger="click" @command="handleSync">
          <el-button>
            数据同步
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="toLocal">同步到本地</el-dropdown-item>
              <el-dropdown-item command="fromLocal">从本地导入</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="icon" label="图标" width="70" align="center">
          <template #default="{ row }">
            <span style="font-size: 24px">{{ row.icon || '🔧' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="问题名称" min-width="220" />
        <el-table-column prop="device_type_name" label="设备类型" width="160" />
        <el-table-column prop="base_price" label="基础价格" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.base_price || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="price_range" label="价格范围" width="150" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑常见问题' : '新增常见问题'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="问题名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入问题名称，如：屏幕碎裂" />
        </el-form-item>
        <el-form-item label="设备类型" prop="device_type_id">
          <el-select v-model="form.device_type_id" placeholder="请选择设备类型" style="width: 100%">
            <el-option
              v-for="dt in deviceTypes"
              :key="dt.id"
              :label="`${dt.icon || '🔧'} ${dt.name}`"
              :value="dt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入 emoji 图标，如：📱" maxlength="10" />
        </el-form-item>
        <el-form-item label="基础价格" prop="base_price">
          <el-input-number v-model="form.base_price" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格范围" prop="price_range">
          <el-input v-model="form.price_range" placeholder="如：50-200元" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createMiniAdminCommonProblem,
  deleteMiniAdminCommonProblem,
  getMiniAdminCommonProblemDeviceTypes,
  getMiniAdminCommonProblems,
  syncMiniAdminCommonProblemsFromLocal,
  syncMiniAdminCommonProblemsToLocal,
  updateMiniAdminCommonProblem
} from '@/api/miniAdmin'

const searchForm = reactive({
  keyword: '',
  device_type_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const submitLoading = ref(false)
const deviceTypes = ref([])

const form = reactive({
  id: null,
  device_type_id: '',
  name: '',
  icon: '🔧',
  base_price: 0,
  price_range: ''
})

const rules = {
  name: [{ required: true, message: '请输入问题名称', trigger: 'blur' }],
  device_type_id: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    device_type_id: '',
    name: '',
    icon: '🔧',
    base_price: 0,
    price_range: ''
  })
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMiniAdminCommonProblems({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      device_type_id: searchForm.device_type_id
    })
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchDeviceTypes = async () => {
  try {
    const res = await getMiniAdminCommonProblemDeviceTypes()
    deviceTypes.value = res.data || []
  } catch (error) {
    ElMessage.error(error.message || '获取设备类型失败')
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.device_type_id = ''
  handleSearch()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    device_type_id: row.device_type_id,
    name: row.name,
    icon: row.icon || '🔧',
    base_price: Number(row.base_price || 0),
    price_range: row.price_range || ''
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除常见问题“${row.name}”吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteMiniAdminCommonProblem(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitLoading.value = true
  try {
    const payload = {
      device_type_id: form.device_type_id,
      name: form.name,
      icon: form.icon || '🔧',
      base_price: form.base_price,
      price_range: form.price_range
    }
    if (isEdit.value) {
      await updateMiniAdminCommonProblem(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createMiniAdminCommonProblem(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSync = async (command) => {
  try {
    if (command === 'toLocal') {
      await ElMessageBox.confirm('确定同步到本地 maintenance_items 吗？', '同步确认', {
        type: 'info',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      const res = await syncMiniAdminCommonProblemsToLocal()
      ElMessage.success(res.message || '同步成功')
      return
    }

    await ElMessageBox.confirm('确定从本地 maintenance_items 导入到 common_problems 吗？', '导入确认', {
      type: 'info',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await syncMiniAdminCommonProblemsFromLocal()
    ElMessage.success(res.message || '导入成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '同步失败')
    }
  }
}

onMounted(() => {
  fetchData()
  fetchDeviceTypes()
})
</script>

<style scoped lang="scss">
.content-container {
  .search-form {
    margin-bottom: 20px;
  }

  .toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
