<template>
  <div class="page">
    <div class="box header">
      <div class="hd">
        <span>发布账号管理</span>
        <el-tag :type="health.online ? 'success' : 'danger'" effect="light" size="small">
          {{ health.online ? '发布服务在线' : '发布服务离线' }}
        </el-tag>
      </div>
      <div class="actions">
        <span v-if="health.version" class="muted">v{{ health.version }} · {{ health.browserChannel }}</span>
        <el-button type="primary" link @click="loadAccounts" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="!health.online"
      type="warning"
      :closable="false"
      show-icon
      title="自动发布服务未启动"
      description="请在 Windows 宿主机上双击运行 publisher-service/start.bat 启动服务，再回来刷新。"
    />

    <el-card class="box" shadow="never">
      <el-table :data="accounts" v-loading="loading" empty-text="暂无账号信息">
        <el-table-column prop="label" label="平台" width="140">
          <template #default="{ row }">
            <strong>{{ row.label }}</strong>
            <div class="muted">{{ row.platform }}</div>
          </template>
        </el-table-column>

        <el-table-column label="登录状态" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.logged_in" type="success" effect="light">已登录</el-tag>
            <el-tag v-else type="info" effect="light">未登录</el-tag>
            <div v-if="row.nickname" class="muted">@{{ row.nickname }}</div>
            <div v-if="row.last_check_at" class="muted">校验：{{ row.last_check_at }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="message" label="说明" min-width="200">
          <template #default="{ row }">
            <span :class="{ 'muted': !row.logged_in }">{{ row.message || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="队列" width="90" align="center">
          <template #default="{ row }">
            <el-badge :value="row.queue_size" :hidden="!row.queue_size" type="warning">
              <span class="muted">待发</span>
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="!health.online || row.busy"
              @click="startLogin(row)"
            >扫码登录</el-button>
            <el-button
              size="small"
              :disabled="!health.online"
              @click="checkAccount(row)"
            >校验登录态</el-button>
            <el-button
              type="danger"
              size="small"
              link
              :disabled="!health.online || !row.logged_in"
              @click="logout(row)"
            >退出</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 扫码登录弹窗 -->
    <el-dialog
      v-model="loginVisible"
      title="扫码登录"
      width="360px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="cancelLogin"
    >
      <div v-if="loginRow" class="login-body">
        <div class="login-platform">平台：<strong>{{ loginRow.label }}</strong></div>

        <div class="qr-wrap">
          <img v-if="loginQr" :src="loginQr" class="qr" alt="二维码" />
          <div v-else class="qr-placeholder">正在拉起浏览器…</div>
        </div>

        <div class="login-status" :class="loginStateClass">{{ loginMessage }}</div>

        <el-progress
          v-if="loginStatus === 'waiting_scan'"
          :percentage="loginProgress"
          :show-text="false"
          :duration="loginTimeoutMs"
          :indeterminate="true"
        />
      </div>

      <template #footer>
        <el-button @click="cancelLogin">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPublisherHealth,
  getPublisherAccounts,
  startPublisherLogin,
  getPublisherLoginStatus,
  cancelPublisherLogin,
  checkPublisherAccount,
  logoutPublisher
} from '@/api/marketing'

const accounts = ref([])
const loading = ref(false)
const health = reactive({ online: false, version: '', browserChannel: '' })

// 扫码登录弹窗状态
const loginVisible = ref(false)
const loginRow = ref(null)
const loginStatus = ref('')
const loginMessage = ref('')
const loginQr = ref('')
const loginSession = ref('')
let loginTimer = null
const loginTimeoutMs = 300000 // 进度条动画时长，仅视觉反馈

const loginStateClass = computed(() => {
  if (loginStatus.value === 'success') return 'ok'
  if (loginStatus.value === 'failed' || loginStatus.value === 'expired') return 'err'
  return ''
})

const loadHealth = async () => {
  try {
    const res = await getPublisherHealth()
    if (res.code === 0 && res.data) {
      health.online = true
      health.version = res.data.version || ''
      health.browserChannel = res.data.browser_channel || ''
    } else {
      health.online = false
    }
  } catch (e) {
    health.online = false
  }
}

const loadAccounts = async () => {
  loading.value = true
  try {
    const res = await getPublisherAccounts()
    if (res.code === 0 && Array.isArray(res.data)) {
      accounts.value = res.data
    } else {
      accounts.value = []
    }
  } catch (e) {
    accounts.value = []
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  await loadHealth()
  await loadAccounts()
}

const startLogin = async (row) => {
  try {
    const res = await startPublisherLogin(row.platform)
    if (res.code !== 0) {
      ElMessage.error(res.message || '发起登录失败')
      return
    }
    loginRow.value = row
    loginSession.value = res.data.session_id
    loginQr.value = ''
    loginStatus.value = res.data.status || 'pending'
    loginMessage.value = res.data.message || '正在准备…'
    loginVisible.value = true
    pollLogin()
  } catch (e) {
    ElMessage.error('发起登录失败')
  }
}

const pollLogin = () => {
  if (loginTimer) clearInterval(loginTimer)
  loginTimer = setInterval(async () => {
    try {
      const res = await getPublisherLoginStatus(loginRow.value.platform, loginSession.value)
      if (res.code !== 0) {
        loginMessage.value = res.message || '登录会话已失效'
        loginStatus.value = 'failed'
        stopPoll()
        return
      }
      const d = res.data || {}
      loginStatus.value = d.status
      loginMessage.value = d.message || ''
      loginQr.value = d.qrcode || ''
      if (d.status === 'success') {
        loginMessage.value = '登录成功' + (d.nickname ? '：' + d.nickname : '')
        stopPoll()
        ElMessage.success('登录成功')
        setTimeout(() => { loginVisible.value = false }, 800)
        loadAccounts()
      } else if (d.status === 'failed' || d.status === 'expired') {
        stopPoll()
      }
    } catch (e) {
      // 网络抖动时继续轮询
    }
  }, 1500)
}

const stopPoll = () => {
  if (loginTimer) {
    clearInterval(loginTimer)
    loginTimer = null
  }
}

const cancelLogin = async () => {
  stopPoll()
  if (loginRow.value && loginSession.value) {
    try {
      await cancelPublisherLogin(loginRow.value.platform, loginSession.value)
    } catch (e) { /* 忽略 */ }
  }
  loginVisible.value = false
  loginRow.value = null
  loginSession.value = ''
  loginQr.value = ''
}

const checkAccount = async (row) => {
  try {
    const res = await checkPublisherAccount(row.platform)
    if (res.code === 0 && res.data) {
      ElMessage.success(res.data.message || (res.data.logged_in ? '登录有效' : '未登录'))
    } else {
      ElMessage.warning((res.data && res.data.message) || res.message || '校验失败')
    }
  } catch (e) {
    ElMessage.error('校验失败')
  } finally {
    loadAccounts()
  }
}

const logout = async (row) => {
  try {
    const res = await logoutPublisher(row.platform)
    if (res.code === 0) {
      ElMessage.success('已退出登录')
    } else {
      ElMessage.error(res.message || '退出失败')
    }
  } catch (e) {
    ElMessage.error('退出失败')
  } finally {
    loadAccounts()
  }
}

onMounted(refresh)
onBeforeUnmount(stopPoll)
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
.header .hd { display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 16px; }
.header .actions { display: flex; align-items: center; gap: 12px; }
.muted { color: #8c9ab3; font-size: 12px; }
.login-body { text-align: center; }
.login-platform { margin-bottom: 12px; }
.qr-wrap {
  width: 220px; height: 220px; margin: 0 auto 12px;
  border: 1px dashed #d9e3f0; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; background: #fafcff;
}
.qr { width: 200px; height: 200px; object-fit: contain; }
.qr-placeholder { color: #8c9ab3; font-size: 13px; }
.login-status { margin: 8px 0; font-size: 14px; color: #24324a; }
.login-status.ok { color: #67c23a; font-weight: 600; }
.login-status.err { color: #f56c6c; font-weight: 600; }
</style>
