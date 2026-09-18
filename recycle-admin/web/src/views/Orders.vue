<template>
  <div class="page-card" v-loading="loading">
    <div class="table-toolbar">
      <span class="card-title">回收订单</span>
      <span class="text-muted">点击行查看详情，支持报价 / 流转 / 打印回收单</span>
    </div>

    <!-- 快捷状态筛选（带实时数量，一键切换常用视图） -->
    <div class="status-chips" style="margin-bottom:12px">
      <div class="status-chip" :class="{ active: !query.status }" @click="quickStatus('')">
        全部 <b>{{ summary.totalOrders ?? '—' }}</b>
      </div>
      <div class="status-chip" :class="{ active: query.status === 'pending' }" @click="quickStatus('pending')">
        待确认 <b>{{ summary.pendingCount ?? '—' }}</b>
      </div>
      <div class="status-chip" :class="{ active: query.status === 'quoted' }" @click="quickStatus('quoted')">
        已报价 <b>{{ summary.quotedCount ?? '—' }}</b>
      </div>
      <div class="status-chip" :class="{ active: query.status === 'processing' }" @click="quickStatus('processing')">
        处理中 <b>{{ summary.processingCount ?? '—' }}</b>
      </div>
      <div class="status-chip" :class="{ active: query.status === 'completed' }" @click="quickStatus('completed')">
        已完成 <b>{{ summary.completedCount ?? '—' }}</b>
      </div>
      <div class="status-chip" :class="{ active: query.status === 'cancelled' }" @click="quickStatus('cancelled')">
        已取消 <b>{{ summary.cancelledCount ?? '—' }}</b>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="订单号/型号/客户/手机号" clearable style="width:230px" @keyup.enter="loadList(1)" />
      <el-select v-model="query.status" placeholder="订单状态" clearable style="width:130px">
        <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
      </el-select>
      <el-select v-model="query.condition" placeholder="设备成色" clearable style="width:120px">
        <el-option label="优" value="good" />
        <el-option label="良" value="normal" />
        <el-option label="中" value="fair" />
        <el-option label="差" value="poor" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:250px" />
      <el-button type="primary" :icon="Search" @click="loadList(1)">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <div style="flex:1"></div>
      <el-button type="success" :icon="Download" @click="handleExport">导出CSV</el-button>
      <el-button type="primary" :icon="Plus" @click="openCreate">手动创建订单</el-button>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom:12px"
      :title="`共 ${total} 条回收订单，筛选范围已完成成交额 ¥${fmtMoney(completedAmount)}`" />

    <el-table :data="list" @row-click="(row) => openDetail(row.id)" style="cursor:pointer">
      <el-table-column prop="order_id" label="订单号" min-width="185" show-overflow-tooltip />
      <el-table-column prop="device_model" label="设备型号" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.device_model || '-' }}</template>
      </el-table-column>
      <el-table-column label="成色" width="60" align="center">
        <template #default="{ row }">{{ row.conditionLabel || '-' }}</template>
      </el-table-column>
      <el-table-column label="客户" min-width="100">
        <template #default="{ row }">
          <div>{{ row.real_name || row.nickname || '-' }}</div>
          <div class="text-muted">{{ row.phone || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="预估价" width="95" align="right">
        <template #default="{ row }"><span class="price-text">¥{{ fmtMoney(row.estimated_price) }}</span></template>
      </el-table-column>
      <el-table-column label="成交价" width="95" align="right">
        <template #default="{ row }">
          <span v-if="row.actual_price != null" class="price-text">¥{{ fmtMoney(row.actual_price) }}</span>
          <span v-else class="text-muted">未定</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ row.statusLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click.stop="openQuote(row)">报价</el-button>
          <el-button size="small" type="success" link @click.stop="openStatus(row)">流转</el-button>
          <el-button size="small" link @click.stop="openDetail(row.id)">详情</el-button>
          <el-button size="small" type="info" link @click.stop="printOrder(row)">打印</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[15, 30, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadList()"
        @size-change="loadList(1)"
      />
    </div>

    <!-- 订单详情 -->
    <el-drawer v-model="detailVisible" title="回收订单详情" size="480px">
      <template v-if="detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单号">{{ detail.order_id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detail.status)" size="small">{{ detail.statusLabel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ detail.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="成色">{{ detail.conditionLabel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务方式">{{ detail.service_type === 'home' ? '上门' : '到店' }}</el-descriptions-item>
          <el-descriptions-item label="预估价"><span class="price-text">¥{{ fmtMoney(detail.estimated_price) }}</span></el-descriptions-item>
          <el-descriptions-item label="成交价">
            <span v-if="detail.actual_price != null" class="price-text">¥{{ fmtMoney(detail.actual_price) }}</span>
            <span v-else class="text-muted">未定</span>
          </el-descriptions-item>
          <el-descriptions-item label="报价说明">{{ detail.quote_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ (detail.real_name || detail.nickname || '-') + (detail.phone ? `（${detail.phone}）` : '') }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{ detail.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="问题描述">{{ detail.custom_description || detail.problem_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ detail.completed_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.images && detail.images.length" style="margin-top:14px">
          <div class="text-muted" style="margin-bottom:6px">设备照片（点击放大）</div>
          <el-image v-for="(img, i) in detail.images" :key="i" :src="img" :preview-src-list="detail.images"
            fit="cover" style="width:86px;height:86px;border-radius:6px;margin:0 8px 8px 0" />
        </div>

        <!-- 电子回收凭证：设备合规回收存证，支持打印 -->
        <div class="eco-cert">
          <div class="cert-head">
            <span class="cert-title">♻ 电子回收凭证</span>
            <el-button size="small" type="success" plain @click="printOrder(detail)">打印凭证</el-button>
          </div>
          <div class="cert-rows">
            <div class="cert-row"><span>凭证编号</span><b>{{ detail.order_id }}</b></div>
            <div class="cert-row"><span>回收设备</span><b>{{ detail.device_model || '-' }}<template v-if="detail.conditionLabel">（{{ detail.conditionLabel }}）</template></b></div>
            <div class="cert-row"><span>回收客户</span><b>{{ detail.real_name || detail.nickname || '-' }}</b></div>
            <div class="cert-row"><span>成交金额</span><b class="price-text">¥{{ fmtMoney(detail.actual_price ?? detail.quote_price ?? detail.estimated_price) }}</b></div>
            <div class="cert-row eco"><span>本次减碳贡献</span><b>≈ {{ ecoPerDevice }} kg CO₂e</b></div>
          </div>
          <p class="cert-note">本凭证由回收综合服务平台生成，可作为设备已合规回收、数据已清除的电子存证。</p>
        </div>

        <div style="margin-top:18px;display:flex;gap:10px" v-if="!['completed','cancelled'].includes(detail.status)">
          <el-button type="primary" @click="openQuote(detail)">提交报价</el-button>
          <el-button type="success" @click="openStatus(detail)">状态流转</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 报价弹窗 -->
    <el-dialog v-model="quoteVisible" title="提交回收报价" width="430px">
      <el-form label-width="90px">
        <el-form-item label="设备型号">{{ quoteRow?.device_model || '-' }}</el-form-item>
        <el-form-item label="预估价">¥{{ fmtMoney(quoteRow?.estimated_price) }}</el-form-item>
        <el-form-item label="报价金额">
          <el-input-number v-model="quoteForm.price" :min="0" :precision="2" :step="100" style="width:200px" />
        </el-form-item>
        <el-form-item label="报价说明">
          <el-input v-model="quoteForm.description" type="textarea" :rows="3" placeholder="报价依据/验机说明等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quoteVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitQuote">确认报价</el-button>
      </template>
    </el-dialog>

    <!-- 状态流转弹窗 -->
    <el-dialog v-model="statusVisible" title="订单状态流转" width="430px">
      <el-form label-width="90px">
        <el-form-item label="当前状态">
          <el-tag :type="statusTag(statusRow?.status)">{{ statusRow?.statusLabel }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-radio-group v-model="statusForm.status">
            <el-radio-button v-for="s in nextStatuses" :key="s.value" :value="s.value" :disabled="s.value === statusRow?.status">
              {{ s.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="原因说明" v-if="statusForm.status === 'cancelled'">
          <el-input v-model="statusForm.reason" type="textarea" :rows="2" placeholder="取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitStatus">确认流转</el-button>
      </template>
    </el-dialog>

    <!-- 手动创建订单 -->
    <el-dialog v-model="createVisible" title="手动创建回收订单（线下登记）" width="480px">
      <el-form label-width="95px">
        <el-form-item label="选择客户">
          <el-select v-model="createForm.userId" filterable remote reserve-keyword :remote-method="searchUsers"
            :loading="userLoading" placeholder="输入昵称/姓名/手机号搜索" style="width:100%">
            <el-option v-for="u in userOptions" :key="u.id" :value="u.id"
              :label="`${u.real_name || u.nickname}（${u.phone || '无手机号'}）`" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="createForm.deviceModel" placeholder="如 iPhone 15 Pro Max 256G" />
        </el-form-item>
        <el-form-item label="成色">
          <el-select v-model="createForm.condition" style="width:160px">
            <el-option label="优" value="good" />
            <el-option label="良" value="normal" />
            <el-option label="中" value="fair" />
            <el-option label="差" value="poor" />
          </el-select>
        </el-form-item>
        <el-form-item label="预估回收价">
          <el-input-number v-model="createForm.estimatedPrice" :min="0" :precision="2" :step="100" style="width:160px" />
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="设备情况、来源等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitCreate">创建订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Download, Plus } from '@element-plus/icons-vue'
import { getOrders, getOrderDetail, quoteOrder, updateOrderStatus, createOrder, getUserOptions, getDashboard, getSettings } from '../api'

// 快捷状态筛选的实时数量（来自看板统计接口）
const summary = ref({})
async function loadSummary() {
  try {
    const res = await getDashboard()
    summary.value = res.data.summary || {}
  } catch (e) {
    // 数量加载失败不影响列表
  }
}
function quickStatus(status) {
  query.status = status
  loadList(1)
}

const route = useRoute()
const loading = ref(false)
const actionLoading = ref(false)
const list = ref([])
const total = ref(0)
const completedAmount = ref(0)
const dateRange = ref(null)
const query = reactive({ keyword: '', status: '', condition: '', page: 1, pageSize: 15 })

const statusMap = { pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中', completed: '已完成', review: '待评价', cancelled: '已取消' }
const statusTag = (s) => ({ pending: 'warning', quoted: 'primary', confirmed: 'info', processing: 'primary', completed: 'success', review: 'info', cancelled: 'danger' }[s] || 'info')
const fmtMoney = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })

async function loadList(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = { ...query }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    } else {
      delete params.startDate
      delete params.endDate
    }
    const res = await getOrders(params)
    list.value = res.data.list
    total.value = res.data.total
    completedAmount.value = res.data.completedAmount
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.keyword = ''
  query.status = ''
  query.condition = ''
  dateRange.value = null
  loadList(1)
}

function handleExport() {
  const params = {}
  if (query.keyword) params.keyword = query.keyword
  if (query.status) params.status = query.status
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  const token = localStorage.getItem('recycle_admin_token')
  const qs = new URLSearchParams(params).toString()
  window.open(`/api/orders/export/list?${qs}&token=${encodeURIComponent(token)}`, '_blank')
}

// ===== 详情 =====
const detailVisible = ref(false)
const detail = ref(null)
// 电子凭证减碳系数（系统设置 eco_co2_per_device，默认 25）
const ecoPerDevice = ref(25)
let ecoLoaded = false
async function openDetail(id) {
  detailVisible.value = true
  detail.value = null
  const res = await getOrderDetail(id)
  detail.value = res.data
  if (!ecoLoaded) {
    ecoLoaded = true
    try {
      const s = await getSettings()
      const eco = (s.data || []).find((x) => x.config_key === 'eco_co2_per_device')
      if (eco && Number(eco.config_value) > 0) ecoPerDevice.value = Number(eco.config_value)
    } catch (e) { /* 保持默认 */ }
  }
}

// ===== 回收单打印 =====
// 生成可打印的回收单据（设备信息 / 报价信息 / 双方签字栏），用于线下留存与客户确认
function printOrder(row) {
  const label = {
    pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中',
    completed: '已完成', review: '待评价', cancelled: '已取消'
  }[row.status] || row.status
  const cond = { good: '优', normal: '良', fair: '中', poor: '差', excellent: '优+', mint: '全新' }[row.device_condition] || (row.device_condition || '-')
  const money = (v) => (v === null || v === undefined || v === '' ? '-' : `¥${Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`)
  const esc = (v) => String(v ?? '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const rows = [
    ['订单编号', esc(row.order_id), '下单时间', esc(row.created_at)],
    ['客户', esc(row.real_name || row.nickname || '-'), '联系电话', esc(row.phone || '-')],
    ['设备型号', esc(row.device_model || '-'), '设备成色', esc(cond)],
    ['服务方式', row.service_type === 'home' ? '上门回收' : '到店回收', '订单状态', esc(label)],
    ['预估价格', money(row.estimated_price), '报价 / 成交价', money(row.quote_price ?? row.actual_price)]
  ]

  const win = window.open('', '_blank', 'width=820,height=680')
  win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>回收单 - ${esc(row.order_id)}</title>
<style>
  body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1f3d2b; padding: 36px 44px; }
  .head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #2d5a40; padding-bottom: 12px; }
  .head h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
  .head .no { font-size: 12px; color: #666; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 14px; }
  td, th { border: 1px solid #b7c9bd; padding: 9px 12px; text-align: left; }
  th { background: #f0f7f2; width: 110px; color: #2d5a40; font-weight: 600; }
  .note { margin-top: 16px; font-size: 12px; color: #666; line-height: 1.8; }
  .signs { display: flex; justify-content: space-between; margin-top: 56px; font-size: 14px; }
  .signs span { display: inline-block; width: 240px; border-top: 1px solid #333; padding-top: 6px; text-align: center; }
  @media print { @page { margin: 14mm; } }
</style>
</head>
<body>
  <div class="head">
    <h1>电子产品回收单</h1>
    <div class="no">电子产品回收综合服务平台 · 打印时间 ${new Date().toLocaleString('zh-CN')}</div>
  </div>
  <table>
    ${rows.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td><th>${r[2]}</th><td>${r[3]}</td></tr>`).join('\n')}
    <tr><th>设备情况说明</th><td colspan="3" style="height:64px">${esc(row.problem_description || row.custom_description || '')}</td></tr>
  </table>
  <div class="note">
    说明：本单一式两联，客户与平台各执一份；最终回收价格以工程师现场验机确认为准；
    请客户在交付前备份数据并退出设备账号。数据清除后不可恢复。
  </div>
  <div class="signs">
    <span>客户签字 / 日期</span>
    <span>回收员签字 / 日期</span>
  </div>
</body>
</html>`)
  win.document.close()
  win.focus()
  win.print()
}

// ===== 报价 =====
const quoteVisible = ref(false)
const quoteRow = ref(null)
const quoteForm = reactive({ price: 0, description: '' })
function openQuote(row) {
  quoteRow.value = row
  quoteForm.price = row.actual_price != null ? Number(row.actual_price) : Number(row.estimated_price || 0)
  quoteForm.description = row.quote_description || ''
  quoteVisible.value = true
}
async function submitQuote() {
  actionLoading.value = true
  try {
    await quoteOrder(quoteRow.value.id, { price: quoteForm.price, description: quoteForm.description })
    ElMessage.success('报价已提交，用户端将看到最新报价')
    quoteVisible.value = false
    detailVisible.value = false
    loadList()
  } finally {
    actionLoading.value = false
  }
}

// ===== 状态流转 =====
const statusVisible = ref(false)
const statusRow = ref(null)
const statusForm = reactive({ status: '', reason: '' })
const nextStatuses = [
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '取消' }
]
function openStatus(row) {
  statusRow.value = row
  statusForm.status = ''
  statusForm.reason = ''
  statusVisible.value = true
}
async function submitStatus() {
  if (!statusForm.status) return ElMessage.warning('请选择目标状态')
  actionLoading.value = true
  try {
    await updateOrderStatus(statusRow.value.id, { status: statusForm.status, reason: statusForm.reason })
    ElMessage.success('状态已更新')
    statusVisible.value = false
    detailVisible.value = false
    loadList()
  } finally {
    actionLoading.value = false
  }
}

// ===== 手动创建 =====
const createVisible = ref(false)
const userOptions = ref([])
const userLoading = ref(false)
const createForm = reactive({ userId: null, deviceModel: '', condition: 'normal', estimatedPrice: 0, description: '' })
function openCreate() {
  Object.assign(createForm, { userId: null, deviceModel: '', condition: 'normal', estimatedPrice: 0, description: '' })
  searchUsers('')
  createVisible.value = true
}
async function searchUsers(keyword) {
  userLoading.value = true
  try {
    const res = await getUserOptions(keyword || '')
    userOptions.value = res.data
  } finally {
    userLoading.value = false
  }
}
async function submitCreate() {
  if (!createForm.userId || !createForm.deviceModel) return ElMessage.warning('请选择客户并填写设备型号')
  actionLoading.value = true
  try {
    await createOrder(createForm)
    ElMessage.success('回收订单已创建')
    createVisible.value = false
    loadList(1)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadList()
  loadSummary()
  if (route.query.focus) openDetail(Number(route.query.focus))
})
</script>

<style scoped>
/* 电子回收凭证 */
.eco-cert {
  margin-top: 16px;
  border-radius: 12px;
  padding: 14px 16px;
  background: linear-gradient(150deg, #f0f9eb 0%, #e8f7ef 100%);
  border: 1px solid #d3edc8;
}
.cert-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.cert-title {
  font-size: 14px;
  font-weight: 700;
  color: #2d5a40;
}
.cert-rows {
  background: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  padding: 2px 12px;
}
.cert-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px dashed #dcebe1;
}
.cert-row:last-child { border-bottom: none; }
.cert-row span { color: #7d9384; }
.cert-row b { color: #303133; text-align: right; word-break: break-all; }
.cert-row.eco b { color: #3a9d5d; }
.cert-note {
  margin: 10px 2px 0;
  font-size: 11px;
  color: #8aa392;
}

html.dark .eco-cert {
  background: linear-gradient(150deg, #14261b 0%, #122019 100%);
  border-color: #2c4433;
}
html.dark .cert-rows { background: rgba(255, 255, 255, 0.05); }
html.dark .cert-row { border-bottom-color: #2c4433; }
html.dark .cert-row b { color: #e0e0e0; }
</style>
