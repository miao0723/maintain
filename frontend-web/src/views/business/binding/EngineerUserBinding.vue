<template>
  <div class="binding-panel">
    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="用户姓名">
        <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="绑定状态">
        <el-select v-model="searchForm.bound" placeholder="全部" clearable style="width: 120px">
          <el-option label="已绑定" :value="true" />
          <el-option label="未绑定" :value="false" />
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
        创建工程师
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border stripe>
      <el-table-column prop="user_id" label="用户ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="real_name" label="真实姓名" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="engineer_id" label="工程师ID" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.engineer_id" type="success">{{ row.engineer_id }}</el-tag>
          <el-tag v-else type="info">-</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="skill_level" label="技能等级" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.skill_level" :type="getSkillLevelType(row.skill_level)">
            {{ getSkillLevelText(row.skill_level) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="specialties" label="专长领域" min-width="180">
        <template #default="{ row }">
          <div class="specialties-wrapper">
            <template v-if="row.specialties && row.specialties.length > 0">
              <el-tag
                v-for="(spec, idx) in row.specialties"
                :key="idx"
                size="small"
                :type="getSpecialtyType(spec)"
              >
                {{ spec }}
              </el-tag>
            </template>
            <span v-else class="empty-text">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="work_years" label="工作年限" width="90" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '在岗' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bound_at" label="绑定时间" width="160">
        <template #default="{ row }">
          {{ row.bound_at ? formatTime(row.bound_at) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-if="row.engineer_id"
              link
              type="primary"
              @click="handleEdit(row)"
              size="small"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.engineer_id"
              link
              type="danger"
              @click="handleUnbind(row)"
              size="small"
            >
              解绑
            </el-button>
            <el-button v-else link type="primary" @click="handleBindOne(row)" size="small">
              绑定
            </el-button>
          </div>
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

    <!-- 绑定/编辑对话框 -->
    <el-dialog
      v-model="bindDialogVisible"
      :title="isEdit ? '编辑工程师信息' : '绑定用户为工程师'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="100px">
        <el-form-item label="用户" v-if="!isEdit">
          <el-select
            v-model="bindForm.user_id"
            placeholder="请选择用户"
            filterable
            style="width: 100%"
            disabled
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
          <el-text>{{ bindForm.username }} ({{ bindForm.real_name }})</el-text>
        </el-form-item>
        <el-form-item label="技能等级" prop="skill_level">
          <el-select v-model="bindForm.skill_level" placeholder="请选择" style="width: 100%">
            <el-option :value="1" label="初级" />
            <el-option :value="2" label="中级" />
            <el-option :value="3" label="高级" />
            <el-option :value="4" label="专家" />
          </el-select>
        </el-form-item>
        <el-form-item label="专长领域" prop="specialties">
          <el-select
            v-model="bindForm.specialties"
            multiple
            placeholder="请选择专长领域"
            style="width: 100%"
          >
            <el-option label="电气" value="电气" />
            <el-option label="机械" value="机械" />
            <el-option label="空调" value="空调" />
            <el-option label="管道" value="管道" />
            <el-option label="电梯" value="电梯" />
            <el-option label="消防" value="消防" />
          </el-select>
        </el-form-item>
        <el-form-item label="工作年限" prop="work_years">
          <el-input-number v-model="bindForm.work_years" :min="0" :max="50" style="width: 100%" />
        </el-form-item>
        <el-form-item label="专业认证">
          <el-input v-model="bindForm.certification" placeholder="如：电工证、焊工证等" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bindForm.status">
            <el-radio :value="1">在岗</el-radio>
            <el-radio :value="2">休假</el-radio>
            <el-radio :value="3">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBind" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Link } from '@element-plus/icons-vue'
import {
  getEngineerUserList,
  bindEngineerToUser,
  unbindEngineerFromUser,
  getUserList
} from '@/api/binding'

const searchForm = reactive({
  username: '',
  bound: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const loading = ref(false)
const isEdit = ref(false)

//// 绑定对话框
const bindDialogVisible = ref(false)
const bindFormRef = ref(null)
const submitLoading = ref(false)

const bindForm = reactive({
  user_id: null,
  username: '',
  real_name: '',
  engineer_id: null,
  skill_level: 3,
  specialties: [],
  work_years: 0,
  certification: '',
  status: 1
})

const bindRules = {
  user_id: [{ required: true, message: '请选择用户', trigger: 'change' }],
  skill_level: [{ required: true, message: '请选择技能等级', trigger: 'change' }]
}

const userList = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getEngineerUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    if (res.code === 200) {
      // 解析 specialties JSON 字符串为数组
      const list = (res.data.list || []).map(item => {
        let specialties = item.specialties || []
        // 如果是字符串，尝试解析为 JSON
        if (typeof specialties === 'string') {
          try {
            specialties = JSON.parse(specialties)
          } catch (e) {
            specialties = []
          }
        }
        return { ...item, specialties }
      })
      tableData.value = list
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取绑定列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchUserOptions = async () => {
  try {
    const res = await getUserList({ page: 1, pageSize: 1000 })
    if (res.code === 200) {
      userList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    bound: ''
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

const handleBind = () => {
  isEdit.value = false
  Object.assign(bindForm, {
    user_id: null,
    username: '',
    real_name: '',
    engineer_id: null,
    skill_level: 3,
    specialties: [],
    work_years: 0,
    certification: '',
    status: 1
  })
  bindDialogVisible.value = true
}

const handleBindOne = (row) => {
  isEdit.value = false
  Object.assign(bindForm, {
    user_id: row.user_id,
    username: row.username,
    real_name: row.real_name,
    engineer_id: null,
    skill_level: 3,
    specialties: [],
    work_years: 0,
    certification: '',
    status: 1
  })
  bindDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(bindForm, {
    user_id: row.user_id,
    username: row.username,
    real_name: row.real_name,
    engineer_id: row.engineer_id,
    skill_level: row.skill_level || 3,
    specialties: row.specialties || [],
    work_years: row.work_years || 0,
    certification: row.certification || '',
    status: row.status || 1
  })
  bindDialogVisible.value = true
}

const handleSubmitBind = async () => {
  const valid = await bindFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = {
      user_id: bindForm.user_id,
      skill_level: bindForm.skill_level,
      specialties: bindForm.specialties,
      work_years: bindForm.work_years,
      certification: bindForm.certification,
      status: bindForm.status
    }

    const res = await bindEngineerToUser(data)
    if (res.code === 200 || res.code === 201) {
      ElMessage.success(isEdit.value ? '更新成功' : '绑定成功')
      bindDialogVisible.value = false
      fetchData()
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleUnbind = (row) => {
  ElMessageBox.confirm(
    `确定要解绑工程师"${row.real_name}"吗？解绑后将无法执行工程师相关操作。`,
    '提示',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      const res = await unbindEngineerFromUser(row.engineer_id)
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

const getSkillLevelText = (level) => {
  const map = {
    1: '初级',
    2: '中级',
    3: '高级',
    4: '专家'
  }
  return map[level] || '-'
}

const getSkillLevelType = (level) => {
  const map = {
    1: 'info',
    2: '',
    3: 'warning',
    4: 'danger'
  }
  return map[level] || 'info'
}

const getSpecialtyType = (specialty) => {
  const map = {
    '电气': 'primary',
    '机械': 'success',
    '空调': 'info',
    '管道': 'warning',
    '电梯': 'danger',
    '消防': ''
  }
  return map[specialty] || ''
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
  fetchUserOptions()
})

defineExpose({ fetchData })
</script>

<style lang="scss" scoped>
.binding-panel {
  .search:form {
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

:deep(.action-buttons) {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  white-space: nowrap !important;

  .el-button {
    padding: 2px 8px !important;
    height: auto !important;
    line-height: 1.5 !important;
    font-size: 13px !important;
    margin: 0 !important;
  }
}

:deep(.specialties-wrapper) {
  display: flex !important;
  gap: 6px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  padding: 4px 0 !important;

  .el-tag {
    margin-right: 0 !important;
  }

  .empty-text {
    color: var(--el-text-color-placeholder);
  }
}
</style>
