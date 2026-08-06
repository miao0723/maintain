<template>
  <div class="binding-panel">
    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="用户姓名">
        <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="角色名称">
        <el-input v-model="searchForm.role_name" placeholder="请输入角色名" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
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
        分配角色
      </el-button>
      <el-button type="success" @click="handleBatchBind">
        <el-icon><Link /></el-icon>
        批量分配
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      v-loading="loading"
      border
      stripe
      row-key="user_id"
      @selection-change="handleSelectionChange"
      :expand-row-keys="expandedKeys"
      @expand-change="handleExpandChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-content">
            <el-text type="info">用户ID：{{ row.user_id }}</el-text>
            <el-divider direction="vertical" />
            <el-text type="info">手机号：{{ row.phone || '-' }}</el-text>
            <el-divider direction="vertical" />
            <el-text type="info">部门：{{ row.department_name || '-' }}</el-text>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="user_id" label="用户ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="real_name" label="真实姓名" width="120" />
      <el-table-column prop="department_name" label="所属部门" width="150" show-overflow-tooltip />
      <el-table-column prop="roles" label="已分配角色" min-width="300">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.id"
            :type="role.status === 'active' ? 'success' : 'info'"
            closable
            @close="handleUnbind(row.user_id, role)"
            style="margin-right: 5px; margin-bottom: 5px"
          >
            {{ role.name }}
          </el-tag>
          <el-text v-if="!row.roles || row.roles.length === 0" type="info">未分配角色</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="用户状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login" label="最后登录" width="160">
        <template #default="{ row }">
          {{ row.last_login ? formatTime(row.last_login) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleBindOne(row)">
            分配
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
      title="为用户分配角色"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="100px">
        <el-form-item label="选择用户" prop="user_id" v-if="!singleUser">
          <el-select
            v-model="bindForm.user_id"
            placeholder="请选择用户"
            filterable
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.real_name || user.username} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户信息" v-else>
          <el-text>{{ bindForm.real_name }} ({{ bindForm.username }})</el-text>
        </el-form-item>
        <el-form-item label="分配角色" prop="role_ids">
          <el-select
            v-model="bindForm.role_ids"
            multiple
            placeholder="请选择角色"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ role.name }}</span>
                <el-tag size="small" :type="role.status === 'active' ? 'success' : 'info'">
                  {{ role.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <el-text type="info" size="small" style="margin-top: 5px; display: block">
            提示：可以为用户分配多个角色，权限将取并集
          </el-text>
        </el-form-item>
        <el-form-item label="操作方式" v-if="singleUser">
          <el-radio-group v-model="bindForm.mode">
            <el-radio value="append">追加角色</el-radio>
            <el-radio value="replace">替换角色</el-radio>
          </el-radio-group>
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
      title="批量为用户分配角色"
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
        <el-form-item label="已选用户" v-if="batchBindForm.bindMode === 'selection'">
          <el-tag
            v-for="user in selectedRows"
            :key="user.user_id"
            closable
            @close="removeSelection(user.user_id)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ user.real_name || user.username }}
          </el-tag>
          <el-text v-if="selectedRows.length === 0" type="info">请先在表格中选择用户</el-text>
        </el-form-item>
        <el-form-item label="姓名筛选" v-if="batchBindForm.bindMode === 'filter'">
          <el-input v-model="batchBindForm.filterName" placeholder="支持模糊匹配" />
        </el-form-item>
        <el-form-item label="分配角色" prop="role_ids">
          <el-select
            v-model="batchBindForm.role_ids"
            multiple
            placeholder="请选择角色"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作方式">
          <el-radio-group v-model="batchBindForm.mode">
            <el-radio value="append">追加角色</el-radio>
            <el-radio value="replace">替换角色</el-radio>
          </el-radio-group>
          <el-text type="info" size="small" style="margin-left: 10px">
            追加：在现有角色基础上新增；替换：清空现有角色后分配
          </el-text>
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
  getUserRoleList,
  bindUserToRole,
  unbindUserFromRole,
  getUserList,
  getRoleList
} from '@/api/binding'

const searchForm = reactive({
  username: '',
  role_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])
const expandedKeys = ref([])

// 绑定对话框
const bindDialogVisible = ref(false)
const bindFormRef = ref(null)
const submitLoading = ref(false)
const singleUser = ref(false)

const bindForm = reactive({
  user_id: '',
  username: '',
  real_name: '',
  role_ids: [],
  mode: 'append'
})

const bindRules = {
  user_id: [{ required: true, message: '请选择用户', trigger: 'change' }],
  role_ids: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 批量绑定对话框
const batchBindDialogVisible = ref(false)
const batchBindFormRef = ref(null)

const batchBindForm = reactive({
  bindMode: 'selection',
  filterName: '',
  role_ids: [],
  mode: 'append'
})

const batchBindRules = {
  role_ids: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 下拉列表数据
const userList = ref([])
const roleList = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUserRoleList({
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

const fetchUsers = async () => {
  try {
    const res = await getUserList({ page: 1, pageSize: 1000, status: 'active' })
    if (res.code === 200) {
      userList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const fetchRoles = async () => {
  try {
    const res = await getRoleList({ page: 1, pageSize: 1000 })
    if (res.code === 200) {
      roleList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    role_name: '',
    status: ''
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

const handleExpandChange = (row, expandedRows) => {
  if (expandedRows.includes(row)) {
    expandedKeys.value = [row.user_id]
  } else {
    expandedKeys.value = []
  }
}

const removeSelection = (id) => {
  selectedRows.value = selectedRows.value.filter(row => row.user_id !== id)
}

const handleBind = () => {
  singleUser.value = false
  Object.assign(bindForm, {
    user_id: '',
    username: '',
    real_name: '',
    role_ids: [],
    mode: 'append'
  })
  bindDialogVisible.value = true
}

const handleBindOne = (row) => {
  singleUser.value = true
  Object.assign(bindForm, {
    user_id: row.user_id,
    username: row.username,
    real_name: row.real_name,
    role_ids: row.roles?.map(r => r.id) || [],
    mode: 'append'
  })
  bindDialogVisible.value = true
}

const handleBatchBind = () => {
  Object.assign(batchBindForm, {
    bindMode: 'selection',
    filterName: '',
    role_ids: [],
    mode: 'append'
  })
  batchBindDialogVisible.value = true
}

const handleSubmitBind = async () => {
  const valid = await bindFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (bindForm.role_ids.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }

  submitLoading.value = true
  try {
    const promises = bindForm.role_ids.map(roleId =>
      bindUserToRole({
        user_id: bindForm.user_id,
        role_id: roleId,
        mode: bindForm.mode
      })
    )

    await Promise.all(promises)
    ElMessage.success('角色分配成功')
    bindDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('角色分配失败:', error)
    ElMessage.error(error.message || '角色分配失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSubmitBatchBind = async () => {
  const valid = await batchBindFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (batchBindForm.role_ids.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }

  if (batchBindForm.bindMode === 'selection' && selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要分配角色的用户')
    return
  }

  submitLoading.value = true
  try {
    let userIds = []
    if (batchBindForm.bindMode === 'selection') {
      userIds = selectedRows.value.map(row => row.user_id)
    } else {
      const allUsers = userList.value.filter(u =>
        !batchBindForm.filterName ||
        (u.real_name && u.real_name.includes(batchBindForm.filterName)) ||
        u.username.includes(batchBindForm.filterName)
      )
      userIds = allUsers.map(u => u.id)
    }

    const promises = []
    userIds.forEach(userId => {
      batchBindForm.role_ids.forEach(roleId => {
        promises.push(
          bindUserToRole({
            user_id: userId,
            role_id: roleId,
            mode: batchBindForm.mode
          })
        )
      })
    })

    await Promise.all(promises)
    ElMessage.success(`成功为 ${userIds.length} 个用户分配角色`)
    batchBindDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('批量分配失败:', error)
    ElMessage.error(error.message || '批量分配失败')
  } finally {
    submitLoading.value = false
  }
}

const handleUnbind = (userId, role) => {
  ElMessageBox.confirm(
    `确定要移除用户对角色"${role.name}"的绑定吗？`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await unbindUserFromRole(userId, role.id)
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
  fetchUsers()
  fetchRoles()
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

  .expand-content {
    padding: 10px 20px;
    background: #f5f7fa;
  }
}
</style>
