<template>
  <div class="roles-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="角色名称/描述" clearable />
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
          新增角色
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色代码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handlePermissions(row)">权限配置</el-button>
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
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="form.code" placeholder="如：admin, manager, user" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="900px"
      @closed="handlePermissionDialogClosed"
    >
      <el-alert
        title="配置说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #default>
          <div style="font-size: 13px;">
            1. 勾选权限后可配置该权限的细粒度操作权限<br/>
            2. 权限配置保存后，用户登录时将只拥有其角色所配置的权限<br/>
            3. 子权限未勾选时，父权限的细粒度配置不会生效
          </div>
        </template>
      </el-alert>

      <div class="permission-config-container">
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          node-key="id"
          show-checkbox
          default-expand-all
          @check-change="handlePermissionCheckChange"
        >
          <template #default="{ data }">
            <div class="permission-node">
              <span class="permission-label">{{ data.name }}</span>
              <span v-if="data.type !== 'menu'" class="permission-type">
                <el-tag size="small" :type="data.type === 'button' ? 'warning' : 'info'">
                  {{ data.type === 'button' ? '按钮' : '接口' }}
                </el-tag>
              </span>
              <!-- 细粒度权限配置 -->
              <div v-if="isPermissionChecked(data)" class="permission-actions">
                <el-checkbox-group v-model="checkedPermissions[data.id]" size="small">
                  <el-checkbox-button value="canView">查看</el-checkbox-button>
                  <el-checkbox-button value="canEdit">编辑</el-checkbox-button>
                  <el-checkbox-button value="canDelete">删除</el-checkbox-button>
                </el-checkbox-group>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  saveRolePermissions
} from '@/api/roles'
import { getPermissionList } from '@/api/permissions'

const searchForm = reactive({
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
const permissionDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const permissionTreeRef = ref(null)
const currentRoleId = ref(null)

// 权限树配置
const treeProps = {
  label: 'name',
  children: 'children'
}

// 已勾选的权限细粒度配置
const checkedPermissions = ref({})

const form = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

// 权限树数据
const permissionTree = ref([])

// 获取角色列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRoleList({
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
      ElMessage.error(res.message || '获取角色列表失败')
      tableData.value = []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 获取权限树数据
const fetchPermissionTree = async () => {
  try {
    const res = await getPermissionList({})
    if (res.code === 200) {
      const data = res.data || {}
      const list = data.items || data.list || data || []
      permissionTree.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    permissionTree.value = []
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    description: '',
    status: 1
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, { ...row })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteRole(row.id)
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

const handlePermissions = async (row) => {
  currentRoleId.value = row.id
  permissionDialogVisible.value = true

  // 清空之前的权限配置
  checkedPermissions.value = {}

  // 先加载权限树
  await fetchPermissionTree()

  // 再获取角色已有的权限并勾选
  try {
    const res = await getRolePermissions(row.id)
    if (res.code === 200) {
      const permissions = res.data?.permissions || []
      const permissionIds = []

      // 处理每个权限的细粒度配置
      permissions.forEach(perm => {
        permissionIds.push(perm.id)
        // 解析细粒度权限
        const perms = perm.permissions || { canView: true }
        const actions = []
        if (perms.canView) actions.push('canView')
        if (perms.canEdit) actions.push('canEdit')
        if (perms.canDelete) actions.push('canDelete')

        if (actions.length > 0) {
          checkedPermissions.value[perm.id] = actions
        } else {
          // 默认至少有查看权限
          checkedPermissions.value[perm.id] = ['canView']
        }
      })

      // 使用 nextTick 确保树组件已渲染
      setTimeout(() => {
        if (permissionTreeRef.value) {
          permissionTreeRef.value.setCheckedKeys(permissionIds)
        }
      }, 200)
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
  }
}

const handleSavePermissions = async () => {
  const checkedKeys = permissionTreeRef.value?.getCheckedKeys() || []

  // 构建权限数据，包含细粒度配置
  const permissions = checkedKeys.map(id => {
    const actions = checkedPermissions.value[id] || ['canView']
    return {
      id: id,
      permissions: {
        canView: actions.includes('canView'),
        canEdit: actions.includes('canEdit'),
        canDelete: actions.includes('canDelete')
      }
    }
  })

  try {
    const res = await saveRolePermissions(currentRoleId.value, {
      permissions: permissions
    })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      permissionDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 检查权限是否被勾选
const isPermissionChecked = (data) => {
  if (!permissionTreeRef.value) return false
  const checkedKeys = permissionTreeRef.value.getCheckedKeys()
  return checkedKeys.includes(data.id)
}

// 权限勾选状态变化
const handlePermissionCheckChange = (data, checked) => {
  // 当取消勾选时，清除细粒度配置
  if (!checked) {
    delete checkedPermissions.value[data.id]
  } else if (!checkedPermissions.value[data.id]) {
    // 首次勾选时，默认只有查看权限
    checkedPermissions.value[data.id] = ['canView']
  }
}

// 权限对话框关闭时清理
const handlePermissionDialogClosed = () => {
  checkedPermissions.value = {}
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    let res
    if (isEdit.value) {
      res = await updateRole(form.id, form)
    } else {
      res = await createRole(form)
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
  fetchPermissionTree()
})
</script>

<style lang="scss" scoped>
.roles-container {
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

  .permission-config-container {
    max-height: 500px;
    overflow-y: auto;

    .permission-node {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;

      .permission-label {
        font-size: 14px;
        flex-shrink: 0;
      }

      .permission-type {
        flex-shrink: 0;
      }

      .permission-actions {
        margin-left: 15px;
        flex-shrink: 0;
      }
    }

    :deep(.el-tree-node__content) {
      height: 45px;
    }
  }
}
</style>
