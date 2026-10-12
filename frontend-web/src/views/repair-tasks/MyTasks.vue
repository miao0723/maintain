<template>
  <div class="page-wrap">
    <el-card shadow="never" class="top-card">
      <div class="top-bar">
        <div>
          <h3 class="page-title">{{ adminView ? '全部工单（管理视角）' : '我的工单' }}</h3>
          <p class="page-sub">{{ adminView
            ? '当前账号为管理员/老板（未关联维修人员档案），此处展示全部维修人员的作业工单，可查看进度与完成情况。'
            : '创建维修工单并规划完成时间，维修结束后自评并提交，由管理员/老板验收评分并判定是否符合。可查看详情、编辑（维修中）与删除（未完结）。' }}</p>
        </div>
        <el-button v-if="!adminView" type="primary" :icon="Plus" @click="openCreate">新建工单</el-button>
      </div>
    </el-card>

    <!-- 管理视角提示条（管理员未关联档案：展示全员作业，不做工人操作） -->
    <el-alert
      v-if="adminView"
      type="info"
      show-icon
      :closable="false"
      class="admin-tip"
      title="管理视角：正在查看全部维修人员的工单"
      description="管理员账号未关联维修人员档案，因此不提供「新建工单 / 编辑 / 提交完成」等工人操作；验收评分与合格判定请到「绩效考核 → 工单明细」。" />

    <el-card shadow="never" class="list-card">
      <el-table :data="orders" v-loading="loading" border stripe :row-class-name="rowClassName" :empty-text="adminView ? '暂无工单' : '暂无工单，点击右上角新建'">
        <el-table-column prop="order_no" label="工单编号" width="150" />
        <el-table-column v-if="adminView" label="维修人员" width="110">
          <template #default="{ row }">
            <span>{{ row.engineer_name || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="device_name" label="设备" min-width="120" />
        <el-table-column prop="area" label="区域" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预计/实际天数" width="130">
          <template #default="{ row }">
            <span>{{ row.est_days != null ? row.est_days : '—' }} / <b :class="row.actual_days != null && row.actual_days > row.est_days ? 'over' : ''">{{ row.actual_days != null ? row.actual_days : '—' }}</b></span>
          </template>
        </el-table-column>
        <el-table-column label="是否符合" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.is_qualified === 1" type="success" size="small">符合</el-tag>
            <el-tag v-else-if="row.is_qualified === 0" type="danger" size="small">不符合</el-tag>
            <span v-else class="muted">待判定</span>
          </template>
        </el-table-column>
        <el-table-column prop="report_time" label="报修时间" width="160" />
        <el-table-column label="操作" :width="adminView ? 90 : 290" fixed="right">
          <template #default="{ row }">
            <el-button link type="info" @click="openDetail(row)">详情</el-button>
            <template v-if="!adminView">
              <el-button link type="primary" :disabled="!['to_repair','processing'].includes(row.status)" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" :disabled="!['pending','processing','to_repair'].includes(row.status)" @click="doDelete(row)">删除</el-button>
              <el-button link type="primary" :disabled="row.status === 'completed' || row.status === 'timeout'" @click="openDeliver(row)">提交完成</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="pageSize"
          v-model:current-page="page"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <!-- 新建工单弹窗 -->
    <el-dialog v-model="createVisible" title="新建维修工单" width="580px">
      <el-form :model="cForm" label-width="96px" :rules="cRules" ref="cFormRef">
        <el-form-item label="选择设备" prop="device_id">
          <el-select v-model="cForm.device_id" filterable placeholder="选择已有设备" style="width:100%" :disabled="createNewDevice" @change="onPickDevice">
            <el-option v-for="d in deviceOptions" :key="d.id" :label="`${d.name}（${d.area || '区域未填'}）`" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="createNewDevice" @change="onToggleNewDevice">或新建设备</el-checkbox>
        </el-form-item>
        <template v-if="createNewDevice">
          <el-form-item label="设备名称" prop="device_name">
            <el-input v-model="cForm.device_name" placeholder="如：中央空调主机" />
          </el-form-item>
          <el-form-item label="设备类型"><el-input v-model="cForm.device_type" placeholder="如：暖通设备" /></el-form-item>
          <el-form-item label="所属区域"><el-input v-model="cForm.device_area" placeholder="如：A栋机房" /></el-form-item>
          <el-form-item label="故障描述"><el-input v-model="cForm.device_fault" type="textarea" :rows="2" /></el-form-item>
        </template>
        <el-form-item label="本次故障" prop="fault_desc">
          <el-input v-model="cForm.fault_desc" type="textarea" :rows="2" placeholder="本次维修的具体故障描述" />
        </el-form-item>
        <el-form-item label="预计天数" prop="est_days">
          <el-input-number v-model="cForm.est_days" :min="0.5" :max="60" :step="0.5" :precision="1" /> 天
          <span class="hint">先规划几天能完成，系统会评估是否合理</span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="cForm.priority" style="width:160px">
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select v-model="cForm.status" style="width:160px">
            <el-option label="待维修" value="to_repair" />
            <el-option label="维修中" value="processing" />
          </el-select>
          <span class="hint">待维修：已建单但暂未开始；维修中：创建即接单并开始</span>
        </el-form-item>
      </el-form>

      <div class="est-box" v-if="createEstimate && cForm.est_days > 0">
        <div class="est-head">
          <span class="est-title">工期合理性评估</span>
          <el-tag :type="lvl(createEstimate.level)" size="small">{{ createEstimate.suggestion }}</el-tag>
        </div>
        <div class="est-body" v-if="createEstimate.reference_days">
          参考基准 <b>{{ createEstimate.reference_days }}</b> 天
          <template v-if="createEstimate.worker_count">（本人同类均值 {{ createEstimate.worker_avg }} 天 / {{ createEstimate.worker_count }} 单）</template>
          <template v-else-if="createEstimate.type_count">（同类设备均值 {{ createEstimate.type_avg }} 天 / {{ createEstimate.type_count }} 单）</template>
          <template v-else>（数据不足，使用默认参考）</template>
        </div>
        <div class="est-msg">{{ createEstimate.message }}</div>
      </div>

      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">{{ cForm.status === 'to_repair' ? '创建工单' : '创建并接单' }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑工单弹窗 -->
    <el-dialog v-model="editVisible" title="编辑工单" width="560px">
      <el-form :model="eForm" label-width="96px" ref="eFormRef">
        <el-form-item label="设备">
          <span>{{ eRow?.device_name || '—' }}（{{ eRow?.device_area || '区域未填' }}）</span>
        </el-form-item>
        <el-form-item label="本次故障" prop="fault_desc">
          <el-input v-model="eForm.fault_desc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="预计天数" prop="est_days">
          <el-input-number v-model="eForm.est_days" :min="0.5" :max="60" :step="0.5" :precision="1" /> 天
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="eForm.priority" style="width:160px">
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="eForm.remark" type="textarea" :rows="2" placeholder="补充说明" />
        </el-form-item>
      </el-form>

      <div class="est-box" v-if="editEstimate && eForm.est_days > 0">
        <div class="est-head">
          <span class="est-title">工期合理性评估</span>
          <el-tag :type="lvl(editEstimate.level)" size="small">{{ editEstimate.suggestion }}</el-tag>
        </div>
        <div class="est-body" v-if="editEstimate.reference_days">
          参考基准 <b>{{ editEstimate.reference_days }}</b> 天
          <template v-if="editEstimate.worker_count">（本人同类均值 {{ editEstimate.worker_avg }} 天 / {{ editEstimate.worker_count }} 单）</template>
          <template v-else-if="editEstimate.type_count">（同类设备均值 {{ editEstimate.type_avg }} 天 / {{ editEstimate.type_count }} 单）</template>
          <template v-else>（数据不足，使用默认参考）</template>
        </div>
        <div class="est-msg">{{ editEstimate.message }}</div>
      </div>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 提交完成 / 交付验收 弹窗 -->
    <el-dialog v-model="deliverVisible" title="提交完成 / 交付验收" width="480px">
      <el-alert type="info" :closable="false" class="mb12"
        title="交付后工单进入「待验收」，由管理员/老板验收评分并判定是否符合。" />
      <el-form :model="dForm" label-width="90px" ref="dFormRef">
        <el-form-item label="完成说明" prop="completion_note">
          <el-input v-model="dForm.completion_note" type="textarea" :rows="3" placeholder="本次维修完成情况、处理措施、遗留问题等" />
        </el-form-item>
        <el-form-item label="我的评分（自评）">
          <el-rate v-model="dForm.self_score" :max="5" />
          <span class="hint">给这次维修自评（1-5分），仅供参考，不计入绩效</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliverVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDeliver">提交完成</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="工单详情" size="460px">
      <el-descriptions :column="1" border v-if="detail">
        <el-descriptions-item label="工单编号">{{ detail.order_no }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ detail.device_name }}（{{ detail.device_area }}）</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ detail.device_type || '—' }}</el-descriptions-item>
        <el-descriptions-item label="维修人员">{{ detail.engineer_name }} / {{ detail.engineer_team }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMeta(detail.status).type" size="small">{{ statusMeta(detail.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="本次故障">{{ detail.fault_desc || '—' }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ priorityLabel(detail.priority) }}</el-descriptions-item>
        <el-descriptions-item label="预计天数">{{ detail.est_days != null ? detail.est_days + ' 天' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="实际天数">{{ detail.actual_days != null ? detail.actual_days + ' 天' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="是否符合">
          <el-tag v-if="detail.is_qualified === 1" type="success" size="small">符合</el-tag>
          <el-tag v-else-if="detail.is_qualified === 0" type="danger" size="small">不符合</el-tag>
          <span v-else class="muted">待判定</span>
        </el-descriptions-item>
        <el-descriptions-item label="报修时间">{{ detail.report_time }}</el-descriptions-item>
        <el-descriptions-item label="接单时间">{{ detail.accept_time || '—' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detail.complete_time || '—' }}</el-descriptions-item>
        <el-descriptions-item label="自评分数">{{ detail.self_score != null ? detail.self_score + ' 分' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="完成说明">{{ detail.completion_note || '—' }}</el-descriptions-item>
        <el-descriptions-item label="验收评分">{{ detail.review_score != null ? detail.review_score + ' 分' : '—' }}</el-descriptions-item>
        <el-descriptions-item label="验收评价">{{ detail.review_comment || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getMyWorkOrders, getPerformanceDevices, createSelfWorkOrder,
  deliverWorkOrder, updateSelfWorkOrder, deleteSelfWorkOrder,
  estimateRepair
} from '@/api/performance'
import { useMenuBadgeStore } from '@/stores/menuBadge'

const orders = ref([])
const loading = ref(false)
const total = ref(0)
// 账号未关联维修人员档案（管理员/老板等）：后端返回的是管理视角全量工单
const noProfile = ref(false)
// 管理视角：展示全部维修人员的工单，隐藏工人专属操作
const adminView = ref(false)
const page = ref(1)
const pageSize = ref(10)

const route = useRoute()
const router = useRouter()
const menuBadgeStore = useMenuBadgeStore()

// 从提醒徽标「前往处理」带 order_id 跳来时，高亮并自动打开该工单详情
const highlightId = ref(null)
const rowClassName = ({ row }) => (row.id === highlightId.value ? 'badge-target-row' : '')
const focusOrderFromQuery = () => {
  const qid = route.query.order_id
  if (qid == null) return
  const id = Number(qid)
  const row = orders.value.find(o => o.id === id)
  if (row) {
    highlightId.value = id
    openDetail(row)
  }
}

const deviceOptions = ref([])
const createVisible = ref(false)
const submitting = ref(false)
const createNewDevice = ref(false)
const cFormRef = ref()
const cForm = ref({
  device_id: '', device_name: '', device_type: '', device_area: '', device_fault: '',
  fault_desc: '', est_days: 3, priority: 'normal', status: 'processing'
})
const cRules = {
  fault_desc: [{ required: true, message: '请填写本次故障', trigger: 'blur' }]
}
const createEstimate = ref(null)

// 编辑
const editVisible = ref(false)
const eFormRef = ref()
const eRow = ref(null)
const eForm = ref({ fault_desc: '', est_days: 3, priority: 'normal', remark: '' })
const editEstimate = ref(null)

// 交付
const deliverVisible = ref(false)
const dRow = ref(null)
const dFormRef = ref()
const dForm = ref({ completion_note: '', self_score: 5 })

// 详情
const detailVisible = ref(false)
const detail = ref(null)

const statusMap = {
  pending: { label: '待接单', type: 'info' },
  to_repair: { label: '待维修', type: 'warning' },
  processing: { label: '维修中', type: 'primary' },
  waiting: { label: '待验收', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  timeout: { label: '已超时', type: 'danger' }
}
const statusMeta = (s) => statusMap[s] || { label: s, type: 'info' }
const priorityLabel = (p) => ({ low: '低', normal: '普通', high: '高', urgent: '紧急' }[p] || '普通')
const lvl = (l) => (l === 'success' ? 'success' : l === 'warning' ? 'warning' : l === 'danger' ? 'danger' : 'info')

// 工期合理性评估（带防抖）
let estTimer = null
const fetchEstimate = (target, formObj) => {
  if (!formObj.est_days || formObj.est_days <= 0) { target.value = null; return }
  clearTimeout(estTimer)
  estTimer = setTimeout(async () => {
    try {
      const res = await estimateRepair({
        type: currentEstType(formObj),
        fault_desc: formObj.fault_desc,
        est_days: formObj.est_days
      })
      target.value = res.data || null
    } catch (e) { target.value = null }
  }, 400)
}
const currentEstType = (formObj) => {
  if (createNewDevice.value) return formObj.device_type || ''
  const d = deviceOptions.value.find(x => x.id === formObj.device_id)
  return d?.type || ''
}
watch(() => [cForm.value.device_id, cForm.value.device_type, cForm.value.fault_desc, cForm.value.est_days, createNewDevice.value],
  () => fetchEstimate(createEstimate, cForm.value))
watch(() => [eForm.value.fault_desc, eForm.value.est_days],
  () => fetchEstimate(editEstimate, eForm.value))

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getMyWorkOrders({ page: page.value, page_size: pageSize.value })
    orders.value = res.data.list || []
    total.value = res.data.pagination?.total || 0
    // 后端对未关联档案的账号返回全量工单 + admin_view 标记（管理视角，不再抛异常）
    noProfile.value = !!res.data.no_profile
    adminView.value = !!res.data.admin_view
    // 带 order_id 跳来时，定位并高亮目标工单
    focusOrderFromQuery()
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || ''
    // 兜底：若后端仍以异常形式返回"未关联档案"，同样按管理视角处理，不弹报错
    if (msg.includes('未关联维修人员档案') || msg.includes('未绑定') || msg.includes('档案')) {
      noProfile.value = true
      adminView.value = true
      orders.value = []
      total.value = 0
    } else {
      ElMessage.error('加载工单失败')
    }
  } finally {
    loading.value = false
  }
}

const loadDevices = async () => {
  try {
    const res = await getPerformanceDevices({ keyword: '' })
    deviceOptions.value = res.data || []
  } catch (e) {}
}

const openCreate = async () => {
  cForm.value = { device_id: '', device_name: '', device_type: '', device_area: '', device_fault: '', fault_desc: '', est_days: 3, priority: 'normal', status: 'processing' }
  createNewDevice.value = false
  createEstimate.value = null
  createVisible.value = true
  await loadDevices()
}

// 从模块顶部「新建工单」按钮带 query 进入时，自动弹出建单框
watch(() => route.query.create, (v) => {
  if (v === '1') {
    openCreate()
    router.replace({ query: {} })
  }
}, { immediate: true })

// 从提醒「前往处理」带 order_id 跳来（组件已挂载、query 变化）时，重新定位
watch(() => route.query.order_id, () => {
  if (orders.value.length) focusOrderFromQuery()
})

const onToggleNewDevice = (val) => {
  if (val) cForm.value.device_id = ''
}
const onPickDevice = (id) => {
  const d = deviceOptions.value.find(x => x.id === id)
  if (d) {
    if (d.est_days != null) cForm.value.est_days = Number(d.est_days)
    if (!cForm.value.fault_desc && d.fault_desc) cForm.value.fault_desc = d.fault_desc
  }
}

const submitCreate = async () => {
  if (!createNewDevice.value && !cForm.value.device_id) {
    ElMessage.warning('请选择设备，或勾选新建设备')
    return
  }
  if (createNewDevice.value && !cForm.value.device_name) {
    ElMessage.warning('请填写新建设备名称')
    return
  }
  submitting.value = true
  try {
    const payload = { ...cForm.value }
    if (createNewDevice.value) payload.device_id = 0
    await createSelfWorkOrder(payload)
    ElMessage.success(cForm.value.status === 'to_repair' ? '工单已创建（待维修）' : '工单已创建并接单（维修中）')
    createVisible.value = false
    await loadOrders()
    menuBadgeStore.fetch() // 工单状态变化后即时刷新侧边栏提醒徽标
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const openEdit = (row) => {
  eRow.value = row
  eForm.value = {
    fault_desc: row.fault_desc || '',
    est_days: row.est_days != null ? Number(row.est_days) : 3,
    priority: row.priority || 'normal',
    remark: row.remark || ''
  }
  editEstimate.value = null
  editVisible.value = true
  fetchEstimate(editEstimate, eForm.value)
}

const submitEdit = async () => {
  submitting.value = true
  try {
    await updateSelfWorkOrder(eRow.value.id, { ...eForm.value })
    ElMessage.success('工单已更新')
    editVisible.value = false
    await loadOrders()
    menuBadgeStore.fetch() // 工单状态变化后即时刷新侧边栏提醒徽标
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const doDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除工单 ${row.order_no}？删除后不可恢复（已交付/完成的工单不可删）。`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteSelfWorkOrder(row.id)
    ElMessage.success('工单已删除')
    await loadOrders()
    menuBadgeStore.fetch() // 工单状态变化后即时刷新侧边栏提醒徽标
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

const openDeliver = (row) => {
  dRow.value = row
  dForm.value = { completion_note: '', self_score: 5 }
  deliverVisible.value = true
}

const submitDeliver = async () => {
  submitting.value = true
  try {
    await deliverWorkOrder(dRow.value.id, { ...dForm.value })
    ElMessage.success('已提交完成，待管理员验收评分')
    deliverVisible.value = false
    await loadOrders()
    menuBadgeStore.fetch() // 提交完成后该工单进入待验收，即时刷新徽标（不再计入待办提醒）
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const openDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.page-wrap { display: flex; flex-direction: column; gap: 16px; }
.top-card .top-bar { display: flex; justify-content: space-between; align-items: center; }
.page-title { margin: 0 0 6px; font-size: 18px; }
.page-sub { margin: 0; color: #888; font-size: 13px; }
.list-card { min-height: 320px; }
.no-profile-card { margin-bottom: 16px; }
.np-title { font-size: 15px; font-weight: 600; color: #303133; margin: 0 0 8px; }
.np-desc { font-size: 13px; color: #909399; line-height: 1.7; margin: 0 0 4px; }
.admin-tip { margin-bottom: 16px; }
.pager { margin-top: 14px; text-align: right; }
.over { color: #f56c6c; }
.muted { color: #aaa; }
// 从提醒「前往处理」跳来时高亮目标工单行
:deep(.badge-target-row) > td {
  background-color: #fff7e6 !important;
}
.hint { margin-left: 10px; color: #aaa; font-size: 12px; }
.est-box {
  margin-top: 10px; padding: 12px 14px; border: 1px solid #ebeef5; border-radius: 8px; background: #fafafa;
}
.est-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.est-title { font-weight: 600; font-size: 14px; }
.est-body { font-size: 13px; color: #555; margin-bottom: 6px; }
.est-msg { font-size: 13px; color: #666; line-height: 1.6; }
</style>
