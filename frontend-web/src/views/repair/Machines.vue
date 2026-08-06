<template>
  <div class="machines-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="机械名称">
          <el-input v-model="searchForm.name" placeholder="请输入机械名称" clearable />
        </el-form-item>
        <el-form-item label="机械种类">
          <el-select v-model="searchForm.category_id" placeholder="请选择" clearable style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
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
          新增机械
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="机械名称" min-width="200" />
        <el-table-column prop="model" label="型号" width="150" />
        <el-table-column prop="category_name" label="机械种类" width="150" />
        <el-table-column prop="manufacturer" label="制造商" width="150" />
        <el-table-column prop="power" label="功率 (kW)" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
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
      :title="isEdit ? '编辑机械' : '新增机械'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机械名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入机械名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机械种类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制造商" prop="manufacturer">
              <el-input v-model="form.manufacturer" placeholder="请输入制造商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="功率 (kW)" prop="power">
              <el-input-number v-model="form.power" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作重量 (吨)" prop="weight">
              <el-input-number v-model="form.weight" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格参数" prop="specifications">
          <el-input
            v-model="form.specifications"
            type="textarea"
            :rows="3"
            placeholder="请输入规格参数"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
  getMachines,
  getActiveCategories,
  createMachine,
  updateMachine,
  deleteMachine
} from '@/api/repair'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const categories = ref([])

const searchForm = reactive({
  name: '',
  category_id: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const form = reactive({
  id: null,
  name: '',
  model: '',
  category_id: '',
  manufacturer: '',
  power: 0,
  weight: 0,
  specifications: '',
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入机械名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择机械种类', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getMachines({
      page: pagination.page,
      limit: pagination.pageSize,
      ...searchForm
    })
    console.log('Machines API response:', res)
    console.log('res.code:', res.code)
    console.log('res.data:', res.data)
    if (res.code === 0 || res.code === 200) {
      console.log('Machines data list:', res.data?.list)
      tableData.value = res.data?.list || []
      pagination.total = res.data?.total || 0
      console.log('Set tableData to:', tableData.value)
      console.log('Set pagination.total to:', pagination.total)
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('fetchData error:', error)
    ElMessage.error('获取数据失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await getActiveCategories()
    console.log('Active Categories API response:', res)
    console.log('res.code:', res.code)
    if (res.code === 0 || res.code === 200) {
      console.log('Active Categories data:', res.data)
      categories.value = res.data || []
      console.log('Set categories to:', categories.value)
    } else {
      ElMessage.error(res.message || '获取分类列表失败')
    }
  } catch (error) {
    console.error('fetchCategories error:', error)
    ElMessage.error('获取分类列表失败')
    categories.value = []
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.category_id = ''
  searchForm.status = ''
  handleSearch()
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.model = ''
  form.category_id = ''
  form.manufacturer = ''
  form.power = 0
  form.weight = 0
  form.specifications = ''
  form.status = 1
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(form, row)
  isEdit.value = true
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该机械吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteMachine(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('handleDelete error:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const res = isEdit.value
      ? await updateMachine(form.id, form)
      : await createMachine(form)

    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('handleSubmit error:', error)
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  console.log('Machines page mounted')
  fetchCategories()
  fetchData()
})
</script>

<style lang="scss" scoped>
.machines-container {
  .search-form {
    margin-bottom: 20px;
  }

  .toolbar {
    margin-bottom: 20px;
  }

  :deep(.el-pagination) {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
