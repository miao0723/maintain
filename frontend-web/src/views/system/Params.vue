<template>
  <div class="params-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="分组">
          <el-select v-model="searchForm.group" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="系统配置" value="system" />
            <el-option label="业务配置" value="business" />
            <el-option label="支付配置" value="payment" />
            <el-option label="消息配置" value="message" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="参数名称/键" clearable />
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
          新增参数
        </el-button>
        <el-button type="success" @click="handleRefreshCache">刷新缓存</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="group" label="分组" width="120">
          <template #default="{ row }">
            <el-tag :type="getGroupColor(row.group)">
              {{ getGroupText(row.group) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="参数名称" width="180" />
        <el-table-column prop="key" label="参数键" min-width="200" />
        <el-table-column prop="value" label="参数值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="更新时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑参数' : '新增参数'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分组" prop="group">
          <el-select v-model="form.group" placeholder="请选择">
            <el-option label="系统配置" value="system" />
            <el-option label="业务配置" value="business" />
            <el-option label="支付配置" value="payment" />
            <el-option label="消息配置" value="message" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="参数键" prop="key">
          <el-input v-model="form.key" placeholder="如：system.title" />
        </el-form-item>
        <el-form-item label="参数值" prop="value">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="4"
            placeholder="支持字符串、数字、JSON 等格式"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getSystemParamList,
  createSystemParam,
  updateSystemParam,
  deleteSystemParam,
  refreshParamCache
} from '@/api/params'

const searchForm = reactive({
  group: '',
  keyword: ''
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

const form = reactive({
  id: null,
  group: 'system',
  name: '',
  key: '',
  value: '',
  description: ''
})

const rules = {
  group: [{ required: true, message: '请选择分组', trigger: 'change' }],
  name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  key: [
    { required: true, message: '请输入参数键', trigger: 'blur' },
    { pattern: /^[a-z_]+\.[a-z_]+$/, message: '格式如：system.name', trigger: 'blur' }
  ],
  value: [{ required: true, message: '请输入参数值', trigger: 'blur' }]
}

const getGroupColor = (group) => {
  const map = {
    system: 'success',
    business: 'primary',
    payment: 'warning',
    message: 'info'
  }
  return map[group] || 'info'
}

const getGroupText = (group) => {
  const map = {
    system: '系统配置',
    business: '业务配置',
    payment: '支付配置',
    message: '消息配置'
  }
  return map[group] || group
}

// 获取参数列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getSystemParamList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      // 后端返回格式：data.items 或 data.list 或 data
      const data = res.data || {}
      const list = data.items || data.list || data || []
      tableData.value = Array.isArray(list) ? list : []
      pagination.total = data.total || 0
    } else {
      ElMessage.error(res.message || '获取参数列表失败')
      tableData.value = []
    }
  } catch (error) {
    console.error('获取参数列表失败:', error)
    ElMessage.error('获取参数列表失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    group: '',
    keyword: ''
  })
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    group: 'system',
    name: '',
    key: '',
    value: '',
    description: ''
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, { ...row })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除参数"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteSystemParam(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchData()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleRefreshCache = async () => {
  try {
    const res = await refreshParamCache()
    if (res.code === 200) {
      ElMessage.success('缓存已刷新')
    } else {
      ElMessage.error(res.message || '刷新失败')
    }
  } catch (error) {
    console.error('刷新缓存失败:', error)
    ElMessage.error('刷新缓存失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    let res
    if (isEdit.value) {
      res = await updateSystemParam(form.id, form)
    } else {
      res = await createSystemParam(form)
    }
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.params-container {
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
