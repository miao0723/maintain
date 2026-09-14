<template>
  <div class="page-card">
    <el-tabs v-model="activeTab">
      <!-- 系统参数 -->
      <el-tab-pane label="系统参数" name="params">
        <el-table :data="settings" v-loading="tabLoading" style="max-width:860px">
          <el-table-column prop="config_key" label="参数键" width="200" />
          <el-table-column label="参数值" min-width="220">
            <template #default="{ row }">
              <el-input v-if="row.config_key === 'recycle_notice'" v-model="row.config_value" type="textarea" :rows="2" />
              <el-switch v-else-if="row.config_key === 'ai_evaluate_enabled'" :model-value="row.config_value === '1'"
                @change="(v) => (row.config_value = v ? '1' : '0')" />
              <el-input v-else v-model="row.config_value" />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        </el-table>
        <div style="margin-top:14px">
          <el-button type="primary" :loading="saving" @click="saveParams">保存参数</el-button>
        </div>
      </el-tab-pane>

      <!-- 管理员管理 -->
      <el-tab-pane label="管理员管理" name="admins">
        <div style="margin-bottom:12px">
          <el-button type="primary" :icon="Plus" @click="openAdminDialog()">新增管理员</el-button>
        </div>
        <el-table :data="admins" v-loading="tabLoading" style="max-width:860px">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="username" label="账号" width="140" />
          <el-table-column prop="name" label="姓名" width="120">
            <template #default="{ row }">{{ row.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="角色" width="110">
            <template #default="{ row }">
              <el-tag :type="row.role === 'super' ? 'danger' : row.role === 'admin' ? 'success' : 'info'" size="small">
                {{ { super: '超级管理员', admin: '管理员', viewer: '只读' }[row.role] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_login_at" label="最近登录" width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openAdminDialog(row)">编辑</el-button>
              <el-button size="small" :type="row.status === 1 ? 'info' : 'success'" link @click="toggleAdmin(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" link @click="removeAdmin(row)" :disabled="row.id === myInfo.id">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 操作日志 -->
      <el-tab-pane label="操作日志" name="logs">
        <el-table :data="logs" v-loading="tabLoading" style="max-width:960px">
          <el-table-column prop="created_at" label="时间" width="155" show-overflow-tooltip />
          <el-table-column prop="admin_name" label="操作人" width="100" show-overflow-tooltip />
          <el-table-column label="模块" width="90">
            <template #default="{ row }">
              <el-tag size="small">{{ { order: '订单', catalog: '配价', platform: '平台', link: '链接', setting: '系统', auth: '登录' }[row.module] || row.module }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="120" show-overflow-tooltip />
          <el-table-column prop="detail" label="详情" min-width="300" show-overflow-tooltip />
        </el-table>
        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <el-pagination v-model:current-page="logPage" :page-size="20" :total="logTotal" layout="total, prev, pager, next" @current-change="loadLogs" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 管理员弹窗 -->
    <el-dialog v-model="adminVisible" :title="adminForm.id ? '编辑管理员' : '新增管理员'" width="440px">
      <el-form label-width="90px">
        <el-form-item label="登录账号" v-if="!adminForm.id"><el-input v-model="adminForm.username" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="adminForm.name" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="adminForm.role" style="width:200px">
            <el-option label="超级管理员" value="super" />
            <el-option label="管理员" value="admin" />
            <el-option label="只读账号" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item :label="adminForm.id ? '重置密码' : '密码'">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="至少6位，编辑时留空则不修改" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adminVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdmin">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSettings, saveSettings, getAdmins, createAdmin, updateAdmin, deleteAdmin, getOperationLogs } from '../api'

const myInfo = JSON.parse(localStorage.getItem('recycle_admin_info') || '{}')
const activeTab = ref('params')
const tabLoading = ref(false)
const saving = ref(false)

const settings = ref([])
const admins = ref([])
const logs = ref([])
const logTotal = ref(0)
const logPage = ref(1)

const adminVisible = ref(false)
const adminForm = reactive({ id: null, username: '', name: '', role: 'admin', password: '' })

async function loadParams() {
  tabLoading.value = true
  try {
    const res = await getSettings()
    settings.value = res.data
  } finally {
    tabLoading.value = false
  }
}

async function saveParams() {
  saving.value = true
  try {
    await saveSettings(settings.value.map((s) => ({ key: s.config_key, value: s.config_value, description: s.description })))
    ElMessage.success('参数已保存，小程序端即时生效')
  } finally {
    saving.value = false
  }
}

async function loadAdmins() {
  tabLoading.value = true
  try {
    const res = await getAdmins()
    admins.value = res.data
  } catch (e) {
    admins.value = []
  } finally {
    tabLoading.value = false
  }
}

function openAdminDialog(row) {
  Object.assign(adminForm, row
    ? { id: row.id, username: row.username, name: row.name, role: row.role, password: '' }
    : { id: null, username: '', name: '', role: 'admin', password: '' })
  adminVisible.value = true
}

async function submitAdmin() {
  if (!adminForm.id && (!adminForm.username || !adminForm.password)) return ElMessage.warning('请填写账号和密码')
  if (adminForm.id) {
    const data = { name: adminForm.name, role: adminForm.role }
    if (adminForm.password) data.password = adminForm.password
    await updateAdmin(adminForm.id, data)
  } else {
    await createAdmin(adminForm)
  }
  ElMessage.success('已保存')
  adminVisible.value = false
  loadAdmins()
}

async function toggleAdmin(row) {
  await updateAdmin(row.id, { status: row.status === 1 ? 0 : 1 })
  ElMessage.success(row.status === 1 ? '已禁用' : '已启用')
  loadAdmins()
}

async function removeAdmin(row) {
  await ElMessageBox.confirm(`确定删除管理员「${row.username}」？`, '提示', { type: 'warning' })
  await deleteAdmin(row.id)
  ElMessage.success('已删除')
  loadAdmins()
}

async function loadLogs() {
  tabLoading.value = true
  try {
    const res = await getOperationLogs({ page: logPage.value, pageSize: 20 })
    logs.value = res.data.list
    logTotal.value = res.data.total
  } finally {
    tabLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'params') loadParams()
  else if (tab === 'admins') loadAdmins()
  else if (tab === 'logs') loadLogs()
})

loadParams()
</script>
