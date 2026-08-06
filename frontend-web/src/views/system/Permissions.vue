<template>
  <div class="permissions-container">
    <el-card shadow="never">
      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleExpandAll">展开全部</el-button>
        <el-button @click="handleCollapseAll">折叠全部</el-button>
        <el-button type="success" @click="handleAdd">新增权限</el-button>
      </div>

      <!-- 权限列表 -->
      <el-table
        :data="permissionData"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children' }"
        border
        stripe
        default-expand-all
      >
        <el-table-column prop="name" label="权限名称" min-width="250" />
        <el-table-column prop="code" label="权限代码" width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'menu' ? 'primary' : 'info'">
              {{ row.type === 'menu' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="200" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="form.parent_id"
            :data="permissionTree"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级权限（不选则为顶级）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="form.code" placeholder="如：users:view, users:create" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="menu">菜单</el-radio>
            <el-radio value="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="路由路径" prop="path" v-if="form.type === 'menu'">
          <el-input v-model="form.path" placeholder="如：/users" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="如：User" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
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
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission
} from '@/api/permissions'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  parent_id: null,
  name: '',
  code: '',
  type: 'menu',
  path: '',
  icon: '',
  sort: 0,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限代码', trigger: 'blur' }]
}

const permissionData = ref([])
const permissionTree = ref([])

// 获取权限列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPermissionList({})
    if (res.code === 200) {
      // 后端返回格式：data.items 或 data.list 或 data
      const data = res.data || {}
      const list = data.items || data.list || data || []
      const permissions = Array.isArray(list) ? list : []
      permissionData.value = buildPermissionTree(permissions)
      permissionTree.value = buildTreeSelect(permissions)
    } else {
      ElMessage.error(res.message || '获取权限列表失败')
      permissionData.value = []
      permissionTree.value = []
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
    permissionData.value = []
    permissionTree.value = []
  } finally {
    loading.value = false
  }
}

// 构建树形结构用于表格展示
const buildPermissionTree = (permissions) => {
  const map = {}
  const tree = []

  permissions.forEach(p => {
    map[p.id] = { ...p, children: [] }
  })

  permissions.forEach(p => {
    if (p.parent_id && map[p.parent_id]) {
      map[p.parent_id].children.push(map[p.id])
    } else {
      tree.push(map[p.id])
    }
  })

  return tree
}

// 构建树形结构用于下拉选择
const buildTreeSelect = (permissions, parent = null) => {
  const result = []
  permissions.forEach(p => {
    if (p.parent_id === parent?.id || (parent === null && !p.parent_id)) {
      const node = {
        id: p.id,
        name: p.name,
        children: []
      }
      const children = permissions.filter(item => item.parent_id === p.id)
      if (children.length > 0) {
        node.children = buildTreeSelect(children, p)
      }
      result.push(node)
    }
  })
  return result
}

const handleExpandAll = () => {
  // 展开所有节点 - Element Plus 表格默认已展开
  ElMessage.info('表格默认已全部展开')
}

const handleCollapseAll = () => {
  // 折叠所有节点 - 需要手动实现
  ElMessage.info('折叠功能暂不支持，请手动折叠')
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    parent_id: null,
    name: '',
    code: '',
    type: 'menu',
    path: '',
    icon: '',
    sort: 0,
    status: 1
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, { ...row })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除权限"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deletePermission(row.id)
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

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    let res
    if (isEdit.value) {
      res = await updatePermission(form.id, form)
    } else {
      res = await createPermission(form)
    }
    if (res.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.permissions-container {
  .toolbar {
    margin-bottom: 20px;
  }
}
</style>
