<template>
  <div class="binding-panel">
    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="人员姓名">
        <el-input v-model="searchForm.personnel_name" placeholder="请输入姓名" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="部门名称">
        <el-input v-model="searchForm.department_name" placeholder="请输入部门" clearable @keyup.enter="handleSearch" />
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

    <!-- 操作按钮 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleBind">
        <el-icon><Link /></el-icon>
        绑定部门
      </el-button>
      <el-button type="success" @click="handleBatchBind">
        <el-icon><Link /></el-icon>
        批量绑定
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="personnel_id" label="人员ID" width="80" />
      <el-table-column prop="personnel_name" label="人员姓名" width="120" />
      <el-table-column prop="personnel_code" label="工号" width="120" />
      <el-table-column prop="personnel_position" label="职位" width="100" />
      <el-table-column prop="department_id" label="部门ID" width="80" />
      <el-table-column prop="department_name" label="所属部门" min-width="150">
        <template #default="{ row }">
          <el-tag v-if="row.department_name" type="success">{{ row.department_name }}</el-tag>
          <el-tag v-else type="info">未绑定</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bound_at" label="绑定时间" width="160">
        <template #default="{ row }">
          {{ row.bound_at ? formatTime(row.bound_at) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.department_id"
            link
            type="danger"
            @click="handleUnbind(row)"
          >
            解绑
          </el-button>
          <el-button v-else link type="primary" @click="handleBindOne(row)">
            绑定
          </el-button>
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
      @change="handlePageChange"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />

    <!-- 绑定对话框 -->
    <el-dialog
      v-model="bindDialogVisible"
      title="绑定人员到部门"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="100px">
        <el-form-item label="选择人员" prop="personnel_id" v-if="!singlePersonnel">
          <el-select
            v-model="bindForm.personnel_id"
            placeholder="请选择人员"
            filterable
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="person in personnelList"
              :key="person.id"
              :label="`${person.name} (${person.code || '无工号'})`"
              :value="person.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="人员姓名" v-else>
          <el-input v-model="bindForm.personnel_name" disabled />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select
            v-model="bindForm.department_id"
            placeholder="请选择部门"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBind" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量绑定对话框 -->
    <el-dialog
      v-model="batchBindDialogVisible"
      title="批量绑定人员到部门"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchBindForm" :rules="batchBindRules" ref="batchBindFormRef" label-width="100px">
        <el-form-item label="绑定方式">
          <el-radio-group v-model="batchBindForm.bindMode">
            <el-radio value="selection">选中项</el-radio>
            <el-radio value="filter">筛选条件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="已选人员" v-if="batchBindForm.bindMode === 'selection'">
          <el-tag
            v-for="person in selectedRows"
            :key="person.id"
            closable
            @close="removeSelection(person.id)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ person.personnel_name }}
          </el-tag>
          <el-text v-if="selectedRows.length === 0" type="info">请先在表格中选择人员</el-text>
        </el-form-item>
        <el-form-item label="姓名筛选" v-if="batchBindForm.bindMode === 'filter'">
          <el-input v-model="batchBindForm.filterName" placeholder="支持模糊匹配" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select
            v-model="batchBindForm.department_id"
            placeholder="请选择部门"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchBindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBatchBind" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Link } from '@element-plus/icons-vue'
import {
  getPersonnelDepartmentList,
  bindPersonnelToDepartment,
  unbindPersonnelFromDepartment,
  getDepartmentList,
  getPersonnelList
} from '@/api/binding'

const searchForm = reactive({
  personnel_name: '',
  department_name: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])

// 绑定对话框
const bindDialogVisible = ref(false)
const bindFormRef = ref(null)
const submitLoading = ref(false)
const singlePersonnel = ref(false)

const bindForm = reactive({
  personnel_id: '',
  personnel_name: '',
  department_id: ''
})

const bindRules = {
  personnel_id: [{ required: true, message: '请选择人员', trigger: 'change' }],
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

// 批量绑定对话框
const batchBindDialogVisible = ref(false)
const batchBindFormRef = ref(null)

const batchBindForm = reactive({
  bindMode: 'selection',
  filterName: '',
  department_id: ''
})

const batchBindRules = {
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }]
}

// 下拉列表数据
const departmentalList = ref([])
const personnelList = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPersonnelDepartmentList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取绑定列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList({ page: 1, pageSize: 1000 })
    if (res.code === 200) {
      departmentalList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

const fetchPersonnelOptions = async () => {
  try {
    const res = await getPersonnelList({ page: 1, pageSize: 1000 })
    if (res.code === 200) {
      personnelList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    personnel_name: '',
    department_name: ''
  })
  handleSearch()
}

const handlePageChange = (val) => {
  fetchData()
}

const handleCurrentChange = (currentPage) => {
  pagination.page = currentPage
  fetchData()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const removeSelection = (id) => {
  selectedRows.value = selectedRows.value.filter(row => row.personnel_id !== id)
}

const handleBind = () => {
  singlePersonnel.value = false
  Object.assign(bindForm, {
    personnel_id: '',
    personnel_name: '',
    department_id: ''
  })
  bindDialogVisible.value = true
}

const handleBindOne = (row) => {
  singlePersonnel.value = true
  Object.assign(bindForm, {
    personnel_id: row.personnel_id,
    personnel_name: row.personnel_name,
    department_id: ''
  })
  bindDialogVisible.value = true
}

const handleBatchBind = () => {
  Object.assign(batchBindForm, {
    bindMode: 'selection',
    filterName: '',
    department_id: ''
  })
  batchBindDialogVisible.value = true
}

const handleSubmitBind = async () => {
  const valid = await bindFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const res = await bindPersonnelToDepartment({
      personnel_id: bindForm.personnel_id,
      department_id: bindForm.department_id
    })
    if (res.code === 200 || res.code === 201) {
      ElMessage.success('绑定成功')
      bindDialogVisible.value = false
      fetchData()
    }
  } catch (error) {
    console.error('绑定失败:', error)
    ElMessage.error(error.message || '绑定失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSubmitBatchBind = async () => {
  const valid = await batchBindFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (batchBindForm.bindMode === 'selection' && selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要绑定的人员')
    return
  }

  submitLoading.value = true
  try {
    let personnelIds = []
    if (batchBindForm.bindMode === 'selection') {
      personnelIds = selectedRows.value.map(row => row.personnel_id)
    } else {
      const allPersonnel = personnelList.value.filter(p =>
        !batchBindForm.filterName || p.name.includes(batchBindForm.filterName)
      )
      personnelIds = allPersonnel.map(p => p.id)
    }

    const promises = personnelIds.map(id =>
      bindPersonnelToDepartment({
        personnel_id: id,
        department_id: batchBindForm.department_id
      })
    )

    await Promise.all(promises)
    ElMessage.success(`成功绑定 ${personnelIds.length} 个人员`)
    batchBindDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('批量绑定失败:', error)
    ElMessage.error(error.message || '批量绑定失败')
  } finally {
    submitLoading.value = false
  }
}

const handleUnbind = (row) => {
  ElMessageBox.confirm(
    `确定要将"${row.personnel_name}"从部门"${row.department_name}"中解绑吗？`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await unbindPersonnelFromDepartment(row.personnel_id)
      if (res.code === 200) {
        ElMessage.success('解绑成功')
        fetchData()
      }
    } catch (error) {
      console.error('解绑失败:', error)
      ElMessage.error(error.message || '解绑失败')
    }
  }).catch(() => {})
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchData()
  fetchDepartments()
  fetchPersonnelOptions()
})

defineExpose({ fetchData })
</script>

<style lang="scss" scoped>
.binding-panel {
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
