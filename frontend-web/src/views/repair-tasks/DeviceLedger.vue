<template>
  <div class="page-wrap">
    <el-card shadow="never" class="top-card">
      <div class="top-bar">
        <div>
          <h3 class="page-title">设备台账</h3>
          <p class="page-sub">维修人员维护名下/常用设备，新增时可规划预计维修天数，系统会基于历史同类用时给出合理性建议。</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAdd">添加设备</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table :data="devices" v-loading="loading" border stripe empty-text="暂无设备，点击右上角添加">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="device_no" label="设备编号" width="110">
          <template #default="{ row }">{{ row.device_no || '—' }}</template>
        </el-table-column>
        <el-table-column prop="name" label="设备名称" min-width="140" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="area" label="所属区域" width="130" />
        <el-table-column prop="est_hours" label="规划工时" width="110">
          <template #default="{ row }">
            <span v-if="row.est_hours != null">{{ fmtDuration(row.est_hours) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="fault_desc" label="典型/常见故障" min-width="180" show-overflow-tooltip />
        <el-table-column label="归属" width="90">
          <template #default="{ row }">
            <el-tag :type="ownerType(row)" size="small">{{ ownerLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '在用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="openCreateOrder(row)">建维修单</el-button>
            <el-button link type="primary" :disabled="!canManage(row)" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :disabled="!canManage(row)" @click="doDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑设备弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑设备' : '添加设备'" width="560px">
      <el-form :model="form" label-width="92px" :rules="rules" ref="formRef">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="form.name" placeholder="如：中央空调主机" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-input v-model="form.type" placeholder="如：暖通设备" />
        </el-form-item>
        <el-form-item label="所属区域">
          <el-input v-model="form.area" placeholder="如：A栋机房" />
        </el-form-item>
        <el-form-item label="规划维修工时" prop="est_hours">
          <el-input-number v-model="form.est_hours" :min="0" :max="720" :step="0.5" :precision="1" />
          <span class="unit">小时</span>
          <span class="hint">预估完成该设备维修所需工时（小时），建单时自动带入</span>
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="form.fault_desc" type="textarea" :rows="3" placeholder="常见/典型故障描述，便于建单参考与工期评估" />
        </el-form-item>
      </el-form>

      <!-- 合理性评估卡片 -->
      <div class="est-box" v-if="estimate && form.est_hours > 0">
        <div class="est-head">
          <span class="est-title">工期合理性评估</span>
          <el-tag :type="estimate.level === 'success' ? 'success' : estimate.level === 'warning' ? 'warning' : estimate.level === 'danger' ? 'danger' : 'info'" size="small">
            {{ estimate.suggestion }}
          </el-tag>
        </div>
        <div class="est-body" v-if="estimate.reference_hours">
          参考基准 <b>{{ fmtDuration(estimate.reference_hours) }}</b>
          <template v-if="estimate.worker_count">（本人同类均值 {{ estimate.worker_avg }} 天 / {{ estimate.worker_count }} 单）</template>
          <template v-else-if="estimate.type_count">（同类设备均值 {{ estimate.type_avg }} 天 / {{ estimate.type_count }} 单）</template>
          <template v-else>（数据不足，使用默认参考）</template>
        </div>
        <div class="est-msg">{{ estimate.message }}</div>
      </div>
      <div class="est-box muted" v-else-if="form.est_hours > 0 && estimating">评估中…</div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 从设备快速新建维修工单（自动接单 → 维修中） -->
    <el-dialog v-model="orderDialogVisible" title="从设备新建维修工单" width="560px">
      <el-alert type="info" :closable="false" class="mb12"
        :title="`将为设备「${orderForm.device_name}」创建维修工单，并自动接单进入维修中。`"
        description="仅「本次故障」必填；图片、预计天数、优先级均为选填，创建后可补充。" />
      <el-form :model="orderForm" label-width="92px" ref="orderFormRef">
        <el-form-item label="设备">
          <span>{{ orderForm.device_name }}（{{ orderForm.device_area || '区域未填' }}）</span>
        </el-form-item>
        <el-form-item label="本次故障" prop="fault_desc" required>
          <el-input v-model="orderForm.fault_desc" type="textarea" :rows="2" placeholder="本次维修的具体故障描述（默认带入设备常见故障）（必填）" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="维修图片">
          <ImageUpload v-model="orderForm.images" :max-count="9" />
          <span class="hint">选填：最多 9 张，创建后可补充</span>
        </el-form-item>
        <el-form-item label="预计工时" prop="est_hours">
          <el-input-number v-model="orderForm.est_hours" :min="0.5" :max="720" :step="0.5" :precision="1" /> 小时
          <span class="optional-tag">选填</span>
          <span class="hint">按小时规划，系统会基于历史同类用时评估是否合理</span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="orderForm.priority" style="width:160px">
            <el-option label="普通（默认）" value="normal" />
            <el-option label="低" value="low" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
          <span class="optional-tag">选填</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="orderSubmitting" @click="submitOrder">创建并接单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { fmtDuration, DEFAULT_EST_HOURS } from '@/utils/duration'
import {
  getPerformanceDevices, createDevice, updateDevice, deleteDevice,
  getPerformanceContext, estimateRepair, createSelfWorkOrder
} from '@/api/performance'

const router = useRouter()

// 从设备快速建维修单
const orderDialogVisible = ref(false)
const orderSubmitting = ref(false)
const orderFormRef = ref()
const orderForm = ref({ device_id: null, device_name: '', device_area: '', fault_desc: '', images: [], est_hours: DEFAULT_EST_HOURS, priority: 'normal' })

const openCreateOrder = (row) => {
  orderForm.value = {
    device_id: row.id,
    device_name: row.name,
    device_area: row.area,
    fault_desc: row.fault_desc || '',
    images: [],
    est_hours: row.est_hours != null ? Number(row.est_hours) : DEFAULT_EST_HOURS,
    priority: 'normal'
  }
  orderDialogVisible.value = true
}

const submitOrder = async () => {
  if (!orderForm.value.fault_desc) {
    ElMessage.warning('请填写本次故障描述')
    return
  }
  orderSubmitting.value = true
  try {
    await createSelfWorkOrder({ ...orderForm.value })
    ElMessage.success('工单已创建并接单（维修中），可在「我的工单」查看')
    orderDialogVisible.value = false
    router.push('/repair-tasks/my-tasks')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建失败')
  } finally {
    orderSubmitting.value = false
  }
}

const devices = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const myEngineerId = ref(null)

const form = ref({
  id: null, name: '', type: '', area: '', fault_desc: '', est_hours: DEFAULT_EST_HOURS
})
const rules = {
  name: [{ required: true, message: '请填写设备名称', trigger: 'blur' }]
}

// 合理性评估
const estimate = ref(null)
const estimating = ref(false)
let estTimer = null
const fetchEstimate = () => {
  if (form.value.est_hours <= 0) { estimate.value = null; return }
  estimating.value = true
  clearTimeout(estTimer)
  estTimer = setTimeout(async () => {
    try {
      const res = await estimateRepair({
        type: form.value.type,
        fault_desc: form.value.fault_desc,
        est_hours: form.value.est_hours
      })
      estimate.value = res.data || null
    } catch (e) {
      estimate.value = null
    } finally {
      estimating.value = false
    }
  }, 400)
}
watch(() => [form.value.type, form.value.fault_desc, form.value.est_hours], fetchEstimate)

const ownerLabel = (row) => {
  if (row.engineer_id && row.engineer_id === myEngineerId.value) return '我的'
  if (!row.engineer_id || row.engineer_id === 0) return '共享'
  return '他人'
}
const ownerType = (row) => {
  const l = ownerLabel(row)
  return l === '我的' ? 'primary' : l === '共享' ? 'info' : 'warning'
}
const canManage = (row) => {
  // 管理员(myEngineerId 为 null)可管理全部；工人可管理自己或共享设备
  if (myEngineerId.value === null) return true
  return !row.engineer_id || row.engineer_id === 0 || row.engineer_id === myEngineerId.value
}

const loadDevices = async () => {
  loading.value = true
  try {
    const res = await getPerformanceDevices({ keyword: '' })
    devices.value = res.data || []
  } catch (e) {
    ElMessage.error('加载设备失败')
  } finally {
    loading.value = false
  }
}

const loadContext = async () => {
  try {
    const res = await getPerformanceContext()
    myEngineerId.value = res.data?.engineer?.id ?? null
  } catch (e) {}
}

const openAdd = () => {
  isEdit.value = false
  form.value = { id: null, name: '', type: '', area: '', fault_desc: '', est_hours: DEFAULT_EST_HOURS }
  estimate.value = null
  dialogVisible.value = true
}

const openEdit = (row) => {
  isEdit.value = true
  form.value = {
    id: row.id, name: row.name, type: row.type, area: row.area,
    fault_desc: row.fault_desc, est_hours: row.est_hours != null ? Number(row.est_hours) : DEFAULT_EST_HOURS
  }
  estimate.value = null
  dialogVisible.value = true
  fetchEstimate()
}

const submit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateDevice(form.value.id, { ...form.value })
        ElMessage.success('设备已更新')
      } else {
        await createDevice({ ...form.value })
        ElMessage.success('设备已添加')
      }
      dialogVisible.value = false
      await loadDevices()
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '保存失败')
    } finally {
      submitting.value = false
    }
  })
}

const doDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除设备「${row.name}」？该操作不可恢复。`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteDevice(row.id)
    ElMessage.success('设备已删除')
    await loadDevices()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  loadContext()
  loadDevices()
})
</script>

<style lang="scss" scoped>
.page-wrap { display: flex; flex-direction: column; gap: 16px; }
.top-card .top-bar { display: flex; justify-content: space-between; align-items: center; }
.page-title { margin: 0 0 6px; font-size: 18px; }
.page-sub { margin: 0; color: var(--c-text-secondary); font-size: 13px; }
.list-card { min-height: 320px; }
.unit { margin-left: 8px; color: var(--c-text-secondary); }
.hint { margin-left: 10px; color: var(--c-text-muted); font-size: 12px; }
.optional-tag {
  margin-left: 8px; padding: 0 6px; font-size: 11px; color: var(--c-text-secondary);
  background: var(--c-bg-muted); border-radius: 3px; line-height: 18px; display: inline-block;
}
.est-box {
  margin-top: 10px; padding: 12px 14px; border: 1px solid var(--c-border-light); border-radius: 8px; background: var(--c-bg-muted);
}
.est-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.est-title { font-weight: 600; font-size: 14px; }
.est-body { font-size: 13px; color: var(--c-text-regular); margin-bottom: 6px; }
.est-msg { font-size: 13px; color: var(--c-text-regular); line-height: 1.6; }
.muted { color: var(--c-text-muted); }
</style>
