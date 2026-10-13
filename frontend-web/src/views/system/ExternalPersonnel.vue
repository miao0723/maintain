<template>
  <div class="external-personnel">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">外部系统人员（同步）</span>
          <div class="actions">
            <el-input
              v-model="keyword"
              placeholder="按姓名检索"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
            <el-select v-model="isActive" placeholder="在职状态" style="width: 130px" @change="handleSearch">
              <el-option label="全部" :value="''" />
              <el-option label="在职" :value="1" />
              <el-option label="离职/停用" :value="0" />
            </el-select>
            <el-button type="primary" :loading="syncing" @click="handleSync">
              <el-icon><Refresh /></el-icon>
              立即同步
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
        title="手机号 / 身份证 / 地址等敏感字段已加密存储并脱敏展示；离职或停用人员会在本地置为禁用（不删除）。同步以外部系统 ID 为唯一键幂等更新。"
      />

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="ext_id" label="外部ID" width="90" />
        <el-table-column prop="employee_name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" min-width="120" />
        <el-table-column prop="position" label="岗位" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '在职' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wps_user_id" label="WPS用户ID" width="130" />
        <el-table-column label="手机号" min-width="120">
          <template #default="{ row }"><span>{{ row.phone }}</span></template>
        </el-table-column>
        <el-table-column label="身份证" min-width="150">
          <template #default="{ row }"><span>{{ row.id_card }}</span></template>
        </el-table-column>
        <el-table-column label="合同期限" width="220">
          <template #default="{ row }">
            {{ row.contract_start_date || '-' }} ~ {{ row.contract_end_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="annual_leave_days" label="年假(天)" width="90" align="right" />
        <el-table-column prop="synced_at" label="同步时间" width="170" />
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <span class="title">同步记录</span>
      </template>
      <el-table :data="logs" v-loading="logsLoading" border stripe>
        <el-table-column prop="id" label="#" width="60" />
        <el-table-column label="触发" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.trigger_type === 'manual' ? '' : 'warning'">
              {{ row.trigger_type === 'manual' ? '手动' : '定时' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'info'">
              {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '进行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拉取/成功/失败/禁用" min-width="200">
          <template #default="{ row }">
            {{ row.total }} / {{ row.success }} / {{ row.failed }} / {{ row.disabled }}
          </template>
        </el-table-column>
        <el-table-column prop="message" label="摘要" min-width="220" show-overflow-tooltip />
        <el-table-column prop="started_at" label="开始时间" width="170" />
        <el-table-column prop="finished_at" label="结束时间" width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  syncPersonnel,
  getExternalPersonnel,
  getSyncLogs
} from '@/api/externalPersonnel'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const isActive = ref('')
const loading = ref(false)
const syncing = ref(false)

const logs = ref([])
const logsLoading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    if (isActive.value !== '' && isActive.value !== null) params.is_active = isActive.value
    const res = await getExternalPersonnel(params)
    const data = res?.data || res || {}
    list.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    // request 层已统一提示
  } finally {
    loading.value = false
  }
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    const res = await getSyncLogs({ page: 1, page_size: 10 })
    const data = res?.data || res || {}
    logs.value = data.list || []
  } catch (e) { /* ignore */ } finally {
    logsLoading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const res = await syncPersonnel({ keyword: keyword.value || '' })
    const data = res?.data || res || {}
    ElMessage.success(
      `同步完成：拉取 ${data.total ?? 0}，成功 ${data.success ?? 0}，失败 ${data.failed ?? 0}，置禁用 ${data.disabled ?? 0}`
    )
    fetchList()
    fetchLogs()
  } catch (e) { /* request 层已提示 */ } finally {
    syncing.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchList()
}
function onPageChange(p) { page.value = p; fetchList() }
function onSizeChange(s) { pageSize.value = s; page.value = 1; fetchList() }

onMounted(() => {
  fetchList()
  fetchLogs()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-header .title { font-weight: 600; }
.card-header .actions { display: flex; gap: 10px; align-items: center; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
