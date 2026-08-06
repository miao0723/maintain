<template>
  <div class="organizations-container">
    <el-card shadow="never">
      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd(null)">
          <el-icon><Plus /></el-icon>
          新增单位
        </el-button>
        <el-button @click="handleExpandAll">展开全部</el-button>
        <el-button @click="handleCollapseAll">折叠全部</el-button>
      </div>

      <!-- 单位树表格 -->
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
        <el-table-column prop="name" label="单位名称" min-width="200" />
        <el-table-column prop="code" label="单位代码" width="150" />
        <el-table-column prop="type" label="单位类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handleAdd(row)">新增子单位</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑单位' : '新增单位'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级单位">
          <el-tree-select
            v-model="form.parent_id"
            :data="organizationTree"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级单位（不选则为顶级）"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="单位名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="单位代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="单位类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择">
            <el-option label="公司" value="company" />
            <el-option label="部门" value="department" />
            <el-option label="项目组" value="project" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="form.notes" type="textarea" :rows="3" />
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
  getOrganizationList,
  createOrganization,
  updateOrganization,
  deleteOrganization
} from '@/api/organizations'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  parent_id: null,
  name: '',
  code: '',
  type: 'company',
  contact: '',
  phone: '',
  address: '',
  sort: 0,
  status: 1,
  notes: ''
})

const rules = {
  name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入单位代码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择单位类型', trigger: 'change' }]
}

const tableData = ref([])
const organizationTree = ref([])

const getTypeColor = (type) => {
  const map = { company: 'success', department: 'primary', project: 'warning' }
  return map[type] || 'info'
}

const getTypeText = (type) => {
  const map = { company: '公司', department: '部门', project: '项目组' }
  return map[type] || type
}

// 构建单位树
const buildOrganizationTree = (data) => {
  const map = {}
  const tree = []

  data.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })

  data.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      tree.push(map[item.id])
    }
  })

  return tree
}

// 构建树形选择器数据
const buildTreeSelect = (organizations, parent = null) => {
  const result = []
  organizations.forEach(org => {
    if (org.parent_id === parent?.id || (parent === null && !org.parent_id)) {
      const node = {
        id: org.id,
        name: org.name,
        children: []
      }
      const children = organizations.filter(item => item.parent_id === org.id)
      if (children.length > 0) {
        node.children = buildTreeSelect(children, org)
      }
      result.push(node)
    }
  })
  return result
}

// 获取单位列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOrganizationList({})
    if (res.code === 200) {
      // 后端返回格式：data.items 或 data.list 或 data
      const data = res.data || {}
      const list = data.items || data.list || data || []
      const organizations = Array.isArray(list) ? list : []
      tableData.value = buildOrganizationTree(organizations)
      organizationTree.value = buildTreeSelect(organizations)
    } else {
      ElMessage.error(res.message || '获取单位列表失败')
      tableData.value = []
      organizationTree.value = []
    }
  } catch (error) {
    console.error('获取单位列表失败:', error)
    ElMessage.error('获取单位列表失败')
    tableData.value = []
    organizationTree.value = []
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
    type: 'department',
    contact: '',
    phone: '',
    address: '',
    sort: 0,
    status: 1,
    notes: ''
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
    ElMessage.warning('该单位下有子单位，无法删除')
    return
  }

  ElMessageBox.confirm(`确定要删除单位"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteOrganization(row.id)
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
      res = await updateOrganization(form.id, form)
    } else {
      res = await createOrganization(form)
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
.organizations-container {
  .toolbar {
    margin-bottom: 20px;
  }
}
</style>
