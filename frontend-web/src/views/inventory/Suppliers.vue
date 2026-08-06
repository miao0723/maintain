<template>
  <div class="suppliers-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="供应商名称/联系人" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="合作中" value="1" />
            <el-option label="暂停合作" value="0" />
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
          新增供应商
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="供应商名称" min-width="200" />
        <el-table-column prop="code" label="供应商代码" width="130" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="contact_email" label="邮箱" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '合作中' : '暂停合作' }}
            </el-tag>
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
      :title="isEdit ? '编辑供应商' : '新增供应商'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商代码" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="form.contact_person" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="form.contact_phone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="contact_email">
              <el-input v-model="form.contact_email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">合作中</el-radio>
                <el-radio :value="0">暂停合作</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 供应商详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="供应商详情" width="700px">
      <el-descriptions :column="2" border v-if="currentSupplier">
        <el-descriptions-item label="供应商名称">{{ currentSupplier.name }}</el-descriptions-item>
        <el-descriptions-item label="供应商代码">{{ currentSupplier.code }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentSupplier.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentSupplier.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentSupplier.contact_email }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentSupplier.status === 1 ? 'success' : 'info'">
            {{ currentSupplier.status === 1 ? '合作中' : '暂停合作' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentSupplier.address }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentSupplier.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/inventory'

const searchForm = reactive({
  keyword: '',
  status: ''
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
const isEdit = ref(false)
const formRef = ref(null)
const currentSupplier = ref(null)

const form = reactive({
  id: null,
  name: '',
  code: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  status: 1,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入供应商代码', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  contact_email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getSuppliers({
      page: pagination.page,
      limit: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    })
    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || "获取供应商列表失败")
    }
  } catch (error) {
    console.error("获取供应商列表失败:", error)
    ElMessage.error("获取供应商列表失败")
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
    keyword: '',
    status: ''
  })
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    status: 1,
    description: ''
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, { ...row })
}

const handleView = (row) => {
  currentSupplier.value = row
  detailDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除供应商"${row.name}"吗？`, "提示", {
    type: "warning"
  }).then(async () => {
    try {
      await deleteSupplier(row.id)
      ElMessage.success("删除成功")
      fetchData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      await updateSupplier(form.id, form)
    } else {
      await createSupplier(form)
    }
    ElMessage.success(isEdit.value ? "更新成功" : "创建成功")
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error(error.response?.data?.message || "操作失败")
  }
}


onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.suppliers-container {
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
