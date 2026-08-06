<template>
  <div class="departments-container">
    <el-card shadow="never">
      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd(null)">
          <el-icon><Plus /></el-icon>
          新增部门
        </el-button>
        <el-button @click="handleExpandAll">展开全部</el-button>
        <el-button @click="handleCollapseAll">折叠全部</el-button>
      </div>

      <!-- 部门树表格 -->
      <el-table
        :data="tableData"
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        stripe
        default-expand-all
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="code" label="部门代码" width="150" />
        <el-table-column prop="leader" label="负责人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleAdd(row)">新增子部门</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级部门" prop="parent_id">
          <el-tree-select
            v-model="form.parent_id"
            :data="departmentTree"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级部门（不选则为顶级部门）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="部门代码" prop="code">
          <el-input v-model="form.code" placeholder="如：tech, sales" />
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-input v-model="form.leader" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
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
  getDepartmentList,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '@/api/departments'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  parent_id: null,
  name: '',
  code: '',
  leader: '',
  phone: '',
  sort: 0,
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入部门代码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

const tableData = ref([])
const departmentTree = ref([])

// 构建部门树
const buildDepartmentTree = (departments) => {
  const map = {}
  const tree = []

  departments.forEach(dept => {
    map[dept.id] = { ...dept, children: [] }
  })

  departments.forEach(dept => {
    if (dept.parent_id && map[dept.parent_id]) {
      map[dept.parent_id].children.push(map[dept.id])
    } else {
      tree.push(map[dept.id])
    }
  })

  return tree
}

// 构建树形选择器数据
const buildTreeSelect = (departments, parent = null) => {
  const result = []
  departments.forEach(dept => {
    if (dept.parent_id === parent?.id || (parent === null && !dept.parent_id)) {
      const node = {
        id: dept.id,
        name: dept.name,
        children: []
      }
      const children = departments.filter(item => item.parent_id === dept.id)
      if (children.length > 0) {
        node.children = buildTreeSelect(children, dept)
      }
      result.push(node)
    }
  })
  return result
}

// 获取部门列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDepartmentList({})
    if (res.code === 200) {
      // 后端返回格式：data.items 或 data.list 或 data
      const data = res.data || {}
      const list = data.items || data.list || data || []
      const departments = Array.isArray(list) ? list : []
      tableData.value = buildDepartmentTree(departments)
      departmentTree.value = buildTreeSelect(departments)
    } else {
      ElMessage.error(res.message || '获取部门列表失败')
      tableData.value = []
      departmentTree.value = []
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取部门列表失败')
    tableData.value = []
    departmentTree.value = []
  } finally {
    loading.value = false
  }
}

const handleExpandAll = () => {
  ElMessage.info('表格默认已全部展开')
}

const handleCollapseAll = () => {
  ElMessage.info('折叠功能暂不支持，请手动折叠')
}

const handleAdd = (row) => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(form, {
    id: null,
    parent_id: row ? row.id : null,
    name: '',
    code: '',
    leader: '',
    phone: '',
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
  const hasChildren = row.children && row.children.length > 0
  if (hasChildren) {
    ElMessage.warning('该部门下有子部门，无法删除')
    return
  }

  ElMessageBox.confirm(`确定要删除部门"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteDepartment(row.id)
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
      res = await updateDepartment(form.id, form)
    } else {
      res = await createDepartment(form)
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
.departments-container {
  .toolbar {
    margin-bottom: 20px;
  }
}
</style>
