<template>
  <div class="personnel-container">
    <el-card shadow="never">
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="姓名/工号/手机号" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.department_id" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="searchForm.position" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="工程师" value="engineer" />
            <el-option label="主管" value="supervisor" />
            <el-option label="经理" value="manager" />
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
          新增人员
        </el-button>
        <el-button type="success" @click="handleImport">批量导入</el-button>
        <el-button type="info" @click="handleExport">导出</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="code" label="工号" width="120" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.position === 'engineer'" type="info">工程师</el-tag>
            <el-tag v-else-if="row.position === 'supervisor'" type="warning">主管</el-tag>
            <el-tag v-else-if="row.position === 'manager'" type="success">经理</el-tag>
            <el-tag v-else>{{ row.position }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="entry_date" label="入职日期" width="110" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '在职' : '离职' }}
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
      :title="isEdit ? '编辑人员' : '新增人员'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department_id">
              <el-select v-model="form.department_id" placeholder="请选择">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="position">
              <el-select v-model="form.position" placeholder="请选择">
                <el-option label="工程师" value="engineer" />
                <el-option label="主管" value="supervisor" />
                <el-option label="经理" value="manager" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entry_date">
              <el-date-picker
                v-model="form.entry_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">在职</el-radio>
                <el-radio :value="0">离职</el-radio>
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
 

<!-- 导入对话框 -->
<el-dialog v-model="importDialogVisible" title="批量导入人员" width="600px">
  <el-upload
    ref="uploadRef"
    class="import-upload"
    drag
    action=""
    :auto-upload="false"
    :limit="1"
    :on-change="handleFileChange"
    :on-exceed="handleFileExceed"
    accept=".xlsx,.xls,.csv"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      将文件拖到此处，或<em>点击上传</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        支持 Excel (.xlsx, .xls) 或 CSV 文件，大小不超过 10MB<br>
        <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
      </div>
    </template>
  </el-upload>
  <template #footer>
    <el-button @click="importDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="handleUpload">确定</el-button>
  </template>
</el-dialog>

  <!-- 人员详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="人员详情" width="700px">
      <el-descriptions :column="2" border v-if="currentPerson">
        <el-descriptions-item label="姓名">{{ currentPerson.name }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ currentPerson.code }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentPerson.department_name }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ currentPerson.position }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentPerson.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentPerson.email }}</el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ currentPerson.entry_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentPerson.status === 1 ? 'success' : 'info'">
            {{ currentPerson.status === 1 ? '在职' : '离职' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentPerson.notes }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import {
  getPersonnelList,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  batchCreatePersonnel
} from '@/api/personnel'
import { getDepartmentList } from '@/api/departments'

const searchForm = reactive({
  keyword: '',
  department_id: '',
  position: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentPerson = ref(null)
const uploadFile = ref(null)
const uploadRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  code: '',
  department_id: '',
  position: '',
  phone: '',
  email: '',
  entry_date: '',
  status: 1,
  notes: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  code: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  department_id: [{ required: true, message: '请选择部门', trigger: 'change' }],
  position: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const departments = ref([])

// 获取人员列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPersonnelList({
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
      ElMessage.error(res.message || '获取人员列表失败')
      tableData.value = []
    }
  } catch (error) {
    console.error('获取人员列表失败:', error)
    ElMessage.error('获取人员列表失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList({})
    if (res.code === 200) {
      const data = res.data || {}
      const list = data.items || data.list || data || []
      departments.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('获取部门列表失败:', error)
    departments.value = []
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    department_id: '',
    position: ''
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
    department_id: '',
    position: '',
    phone: '',
    email: '',
    entry_date: '',
    status: 1,
    notes: ''
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, { ...row })
}

const handleView = (row) => {
  currentPerson.value = row
  detailDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除人员"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deletePersonnel(row.id)
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

const handleImport = () => {
  importDialogVisible.value = true
  uploadFile.value = null
  uploadRef.value?.clearFiles?.()
}

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const handleFileExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

const handleUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    const items = await parsePersonnelFile(uploadFile.value)
    if (items.length === 0) {
      ElMessage.warning('未识别到可导入的数据')
      return
    }

    const res = await batchCreatePersonnel(items)
    const { total, success, failed, errors } = res.data || {}

    if (failed > 0 && Array.isArray(errors) && errors.length > 0) {
      const errorText = errors.slice(0, 50).map(e => `第${e.row}行：${e.message}`).join('\n')
      ElMessage.warning(`导入完成：成功 ${success} 条，失败 ${failed} 条`)
      await ElMessageBox.alert(errorText, '导入失败明细（最多显示 50 条）', {
        type: 'warning',
        confirmButtonText: '知道了'
      })
    } else {
      ElMessage.success(`导入成功：共 ${success || total || items.length} 条`)
    }

    importDialogVisible.value = false
    uploadFile.value = null
    uploadRef.value?.clearFiles?.()
    fetchData()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  }
}

const handleExport = async () => {
  try {
    loading.value = true
    const all = await fetchAllPersonnel({ ...searchForm })
    if (!all.length) {
      ElMessage.warning('暂无可导出的数据')
      return
    }

    const rows = all.map((p) => {
      const departmentName = p.department_name || p.department?.name || ''
      return {
        id: p.id ?? '',
        name: p.name ?? '',
        code: p.code ?? '',
        department_id: p.department_id ?? '',
        department_name: departmentName,
        position: positionToLabel(p.position),
        phone: p.phone ?? '',
        email: p.email ?? '',
        entry_date: normalizeDate(p.entry_date),
        status: statusToLabel(p.status),
        notes: p.notes ?? '',
        created_at: normalizeDateTime(p.created_at),
        updated_at: normalizeDateTime(p.updated_at)
      }
    })

    const header = [
      ['ID', '姓名', '工号', '部门ID', '部门', '岗位', '手机号', '邮箱', '入职日期', '状态', '备注', '创建时间', '更新时间'],
      ...rows.map(r => [
        r.id,
        r.name,
        r.code,
        r.department_id,
        r.department_name,
        r.position,
        r.phone,
        r.email,
        r.entry_date,
        r.status,
        r.notes,
        r.created_at,
        r.updated_at
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(header)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '人员')
    downloadXlsx(workbook, `人员信息_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

const downloadTemplate = () => {
  const header = [
    ['姓名', '工号', '手机号', '部门', '岗位', '邮箱', '入职日期', '状态', '备注'],
    ['张三', 'PER001', '13800138000', '技术部', '经理', 'zhangsan@company.com', '2024-01-15', '在职', '技术部经理'],
    ['李四', 'PER002', '13800138001', '技术部', '工程师', 'lisi@company.com', '2024-03-20', '在职', '高级开发工程师']
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(header)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '模板')
  downloadXlsx(workbook, '人员导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

const fetchAllPersonnel = async (params) => {
  const pageSize = 1000
  let page = 1
  let all = []
  while (true) {
    const res = await getPersonnelList({ ...params, page, pageSize })
    const data = res.data || {}
    const items = data.items || []
    all = all.concat(items)
    const total = data.total ?? all.length
    if (all.length >= total || items.length < pageSize) break
    page += 1
    if (page > 5000) break
  }
  return all
}

const downloadXlsx = (workbook, filename) => {
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const normalizeHeader = (value) => {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .toLowerCase()
}

const headerToKey = (header) => {
  const h = normalizeHeader(header)
  const map = new Map([
    ['id', 'id'],
    ['姓名', 'name'],
    ['name', 'name'],
    ['工号', 'code'],
    ['code', 'code'],
    ['手机号', 'phone'],
    ['手机', 'phone'],
    ['phone', 'phone'],
    ['部门id', 'department_id'],
    ['department_id', 'department_id'],
    ['部门名称', 'department_name'],
    ['部门', 'department_name'],
    ['department', 'department_name'],
    ['department_name', 'department_name'],
    ['岗位', 'position'],
    ['position', 'position'],
    ['邮箱', 'email'],
    ['email', 'email'],
    ['入职日期', 'entry_date'],
    ['入职时间', 'entry_date'],
    ['entry_date', 'entry_date'],
    ['状态', 'status'],
    ['status', 'status'],
    ['备注', 'notes'],
    ['说明', 'notes'],
    ['notes', 'notes']
  ])
  return map.get(h) || map.get(header) || null
}

const positionToCode = (value) => {
  const v = String(value ?? '').trim().toLowerCase()
  if (['engineer', 'supervisor', 'manager'].includes(v)) return v
  if (v === '工程师') return 'engineer'
  if (v === '主管') return 'supervisor'
  if (v === '经理') return 'manager'
  return 'engineer'
}

const positionToLabel = (value) => {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'engineer') return '工程师'
  if (v === 'supervisor') return '主管'
  if (v === 'manager') return '经理'
  if (value === '工程师' || value === '主管' || value === '经理') return value
  return String(value ?? '')
}

const statusToCode = (value) => {
  const v = String(value ?? '').trim()
  if (v === '1' || v === '在职' || v.toLowerCase() === 'active') return 1
  if (v === '0' || v === '离职' || v.toLowerCase() === 'inactive') return 0
  const n = Number(v)
  if (n === 0 || n === 1) return n
  return 1
}

const statusToLabel = (value) => {
  if (value === 1 || value === '1' || value === '在职') return '在职'
  if (value === 0 || value === '0' || value === '离职') return '离职'
  return String(value ?? '')
}

const normalizeDate = (value) => {
  if (!value) return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD')
  const s = String(value)
  const d = dayjs(s)
  if (d.isValid()) return d.format('YYYY-MM-DD')
  return s
}

const normalizeDateTime = (value) => {
  if (!value) return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  const s = String(value)
  const d = dayjs(s)
  if (d.isValid()) return d.format('YYYY-MM-DD HH:mm:ss')
  return s
}

const isEmptyRow = (row) => {
  return row.every((c) => String(c ?? '').trim() === '')
}

const parsePersonnelFile = async (file) => {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('文件大小不能超过 10MB')
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  let workbook

  if (ext === 'csv') {
    const text = await file.text()
    workbook = XLSX.read(text, { type: 'string', cellDates: true })
  } else {
    const arrayBuffer = await file.arrayBuffer()
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  }

  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
  if (!matrix.length) return []

  const headerRow = matrix[0]
  const keyByIndex = headerRow.map(headerToKey)
  const items = []

  const departmentNameToId = new Map(
    (departments.value || []).map((d) => [String(d.name ?? '').trim(), d.id])
  )

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (!Array.isArray(row) || isEmptyRow(row)) continue

    const record = { __row: i + 1 }
    for (let c = 0; c < keyByIndex.length; c++) {
      const key = keyByIndex[c]
      if (!key) continue
      record[key] = row[c]
    }

    record.name = String(record.name ?? '').trim()
    record.code = String(record.code ?? '').trim()
    record.phone = String(record.phone ?? '').trim()
    record.email = String(record.email ?? '').trim()
    record.notes = String(record.notes ?? '').trim()
    record.position = positionToCode(record.position)
    record.status = statusToCode(record.status)
    record.entry_date = normalizeDate(record.entry_date)

    const departmentIdRaw = record.department_id
    if (departmentIdRaw !== undefined && departmentIdRaw !== null && String(departmentIdRaw).trim() !== '') {
      const id = Number(String(departmentIdRaw).trim())
      if (!Number.isNaN(id)) record.department_id = id
    } else {
      const deptName = String(record.department_name ?? '').trim()
      if (deptName) {
        const id = departmentNameToId.get(deptName)
        if (id !== undefined) record.department_id = id
        record.department_name = deptName
      }
    }

    if (record.name === '' && record.code === '' && record.phone === '') continue
    items.push(record)
  }

  const fileErrors = []
  const seenCodes = new Set()
  for (const r of items) {
    if (!r.name) fileErrors.push(`第${r.__row}行：缺少姓名`)
    if (!r.code) fileErrors.push(`第${r.__row}行：缺少工号`)
    if (!r.phone) fileErrors.push(`第${r.__row}行：缺少手机号`)
    if (r.phone && !/^1[3-9]\d{9}$/.test(r.phone)) fileErrors.push(`第${r.__row}行：手机号格式错误`)
    if (r.code) {
      if (seenCodes.has(r.code)) fileErrors.push(`第${r.__row}行：工号在文件中重复`)
      seenCodes.add(r.code)
    }
  }

  if (fileErrors.length) {
    const text = fileErrors.slice(0, 50).join('\n')
    throw new Error(fileErrors.length > 50 ? `${text}\n...` : text)
  }

  return items.map(({ __row, ...rest }) => ({ __row, ...rest }))
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    let res
    if (isEdit.value) {
      res = await updatePersonnel(form.id, form)
    } else {
      res = await createPersonnel(form)
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
  fetchDepartments()
})
</script>

<style lang="scss" scoped>
.personnel-container {
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
