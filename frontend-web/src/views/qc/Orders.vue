<template>
  <div class="qc-orders-page">
    <!-- 汇总 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="4"><el-card shadow="never"><el-statistic title="待质检" :value="summary.pending" /></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><el-statistic title="质检中" :value="summary.in_progress" /></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><el-statistic title="复核中" :value="summary.review" /></el-card></el-col>
      <el-col :span="4"><el-card shadow="never"><el-statistic title="争议中" :value="summary.disputed" /></el-card></el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新建质检单（关联回收订单）
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="质检单号/订单号/型号" clearable style="width: 220px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="(label, key) in statusMap" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="定级成色">
        <el-select v-model="searchForm.graded_condition" placeholder="全部" clearable style="width: 120px">
          <el-option label="优" value="good" />
          <el-option label="良" value="normal" />
          <el-option label="中" value="fair" />
          <el-option label="差" value="poor" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker
          v-model="searchForm.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="qc_no" label="质检单号" width="170" fixed />
      <el-table-column prop="order_no" label="回收订单" width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.order_no || '-' }}</template>
      </el-table-column>
      <el-table-column prop="device_model" label="设备型号" width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.device_model || '-' }}</template>
      </el-table-column>
      <el-table-column prop="user_name" label="回收用户" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.user_name || '-' }}</template>
      </el-table-column>
      <el-table-column prop="template_name" label="质检模板" width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.template_name || '-' }}</template>
      </el-table-column>
      <el-table-column label="总分" width="90" align="center">
        <template #default="{ row }">{{ row.grade_score ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="定级成色" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.graded_condition" :type="conditionType(row.graded_condition)">
            {{ conditionText(row.graded_condition) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="建议回收价" width="110" align="right">
        <template #default="{ row }">
          <span v-if="row.final_price" style="color: #f56c6c; font-weight: 600">¥{{ Number(row.final_price).toFixed(2) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="success" @click="openReport(row.id)">报告</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 新建质检单 -->
    <el-dialog v-model="createVisible" title="新建质检单" width="560px">
      <el-form label-width="100px">
        <el-form-item label="回收订单" required>
          <el-select
            v-model="createForm.order_id"
            placeholder="搜索回收订单（订单号/型号/故障描述）"
            filterable
            remote
            :remote-method="searchRecycleOrders"
            :loading="orderSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="o in orderOptions"
              :key="o.id"
              :label="`${o.order_id}（${o.device_model || '未填型号'}）`"
              :value="o.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="质检模板" required>
          <el-select v-model="createForm.template_id" placeholder="选择质检模板" style="width: 100%">
            <el-option
              v-for="t in templateOptions"
              :key="t.id"
              :label="t.current_version ? `${t.name}（${t.current_version.version_no}）` : `${t.name}（未发布版本）`"
              :value="t.id"
              :disabled="!t.current_version"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 质检单详情（全流程） -->
    <el-dialog v-model="detailVisible" :title="`质检单 ${detail?.qc?.qc_no || ''}`" width="980px" top="4vh">
      <template v-if="detail">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border size="small" class="block">
          <el-descriptions-item label="回收订单">{{ detail.qc.order_no }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ detail.qc.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detail.qc.user_name || '-' }} {{ detail.qc.user_phone || '' }}</el-descriptions-item>
          <el-descriptions-item label="质检模板">{{ detail.qc.template_name }}</el-descriptions-item>
          <el-descriptions-item label="标准版本">
            {{ detail.standard ? `${detail.standard.version_no}（${detail.standard.published_at || ''}）` : '无（模板未发布版本）' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detail.qc.status)" size="small">{{ statusMap[detail.qc.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单预估价">¥{{ Number(detail.qc.estimated_price || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="定级总分">{{ detail.qc.grade_score ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="建议回收价">
            <span v-if="detail.qc.final_price" style="color: #f56c6c; font-weight: 600">¥{{ Number(detail.qc.final_price).toFixed(2) }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作条 -->
        <div class="block action-bar">
          <el-button v-if="detail.qc.status === 'pending'" type="primary" @click="handleStart">开始质检</el-button>
          <el-button v-if="canGrade" type="warning" @click="gradeVisible = true">提交定级</el-button>
          <el-button v-if="detail.qc.status === 'graded' || detail.qc.status === 'review'" type="success" @click="handleComplete">完结质检单</el-button>
          <el-button v-if="detail.qc.status === 'graded' || detail.qc.status === 'disputed'" @click="openReview('review')">发起复核</el-button>
          <el-button v-if="detail.qc.status === 'graded'" type="danger" plain @click="openReview('dispute')">发起争议</el-button>
        </div>

        <!-- 质检项结果 -->
        <h4 class="block-title">质检项{{ detail.qc.status === 'pending' ? '（开始质检后可录入）' : '' }}</h4>
        <el-table :data="gradeItems" border size="small" class="block">
          <el-table-column prop="name" label="检查项" min-width="120" />
          <el-table-column prop="category" label="分类" width="90">
            <template #default="{ row }">{{ row.category || '-' }}</template>
          </el-table-column>
          <el-table-column prop="check_method" label="方式" width="90">
            <template #default="{ row }">{{ row.check_method || '-' }}</template>
          </el-table-column>
          <el-table-column label="结果" width="150">
            <template #default="{ row }">
              <template v-if="grading">
                <el-select v-if="row.scoring_type === 'pass_fail'" v-model="row.input_result" placeholder="结果" size="small">
                  <el-option label="通过" value="pass" />
                  <el-option label="不通过" value="fail" />
                </el-select>
                <el-input-number v-else v-model="row.input_score" :min="0" :max="10" size="small" controls-position="right" placeholder="分值" />
              </template>
              <template v-else>
                <span v-if="resultOf(row.id)">{{ resultOf(row.id).result }} {{ resultOf(row.id).deduction ? `(-${resultOf(row.id).deduction})` : '' }}</span>
                <span v-else>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="故障/备注" min-width="150">
            <template #default="{ row }">
              <template v-if="grading">
                <el-input v-model="row.input_note" size="small" placeholder="故障描述" />
              </template>
              <template v-else>
                {{ resultOf(row.id)?.fault_note || '-' }}
              </template>
            </template>
          </el-table-column>
          <el-table-column label="扣分" width="120">
            <template #default="{ row }">
              <template v-if="grading">
                <el-input-number v-model="row.input_deduction" :min="0" :max="100" size="small" controls-position="right" />
              </template>
              <template v-else>-</template>
            </template>
          </el-table-column>
        </el-table>

        <!-- 定级提交 -->
        <el-dialog v-model="gradeVisible" title="提交定级" width="520px" append-to-body>
          <el-form label-width="100px">
            <el-form-item label="总分">
              <el-input-number v-model="gradeForm.grade_score" :min="0" :max="100" />
              <el-button link size="small" style="margin-left: 8px" @click="autoScore">按扣分自动计算</el-button>
            </el-form-item>
            <el-form-item label="定级成色">
              <el-select v-model="gradeForm.graded_condition" @change="applySuggestion" style="width: 100%">
                <el-option v-for="g in detail?.standard?.grades || []" :key="g.grade_key" :label="`${g.grade_name}（${g.min_score}-${g.max_score}分，系数${g.price_coefficient}）`" :value="g.grade_key" />
              </el-select>
            </el-form-item>
            <el-form-item label="建议回收价">
              <el-input-number v-model="gradeForm.final_price" :min="0" :precision="2" style="width: 200px" />
              <span v-if="suggestion" class="sug">基准 ¥{{ suggestion.base_price.toFixed(2) }} × 系数 {{ suggestion.coefficient }} = ¥{{ suggestion.suggested_price.toFixed(2) }}</span>
            </el-form-item>
            <el-form-item label="定级说明">
              <el-input v-model="gradeForm.grade_note" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="gradeVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="submitGrade">提交定级</el-button>
          </template>
        </el-dialog>

        <!-- 媒体 -->
        <h4 class="block-title">质检图片 / 视频</h4>
        <div class="block media-bar">
          <el-select v-model="mediaForm.type" style="width: 100px">
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
          </el-select>
          <el-input v-model="mediaForm.url" placeholder="媒体地址 URL（可先用系统上传接口获取地址）" style="width: 380px" />
          <el-input v-model="mediaForm.note" placeholder="备注" style="width: 160px" />
          <el-button type="primary" :disabled="!mediaForm.url" @click="submitMedia">添加</el-button>
        </div>
        <el-table :data="detail.media" border size="small" class="block" empty-text="暂无质检图片/视频">
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === 'video' ? 'warning' : 'success'" size="small">{{ row.type === 'video' ? '视频' : '图片' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="url" label="地址" min-width="240" show-overflow-tooltip />
          <el-table-column prop="note" label="备注" min-width="120">
            <template #default="{ row }">{{ row.note || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="openUrl(row.url)">查看</el-button>
              <el-button link type="danger" @click="removeMedia(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 复核/争议 -->
        <h4 class="block-title">复核 / 争议记录</h4>
        <div class="block">
          <el-table :data="detail.reviews" border size="small" empty-text="暂无复核/争议记录">
            <el-table-column label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'dispute' ? 'danger' : 'warning'" size="small">{{ row.type === 'dispute' ? '争议' : '复核' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'open' ? 'danger' : 'info'" size="small">
                  {{ reviewStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handler_remark" label="处理意见" min-width="150">
              <template #default="{ row }">{{ row.handler_remark || '-' }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="发起时间" width="160" />
            <el-table-column label="操作" width="200" v-if="detail.qc.status === 'review' || detail.qc.status === 'disputed'">
              <template #default="{ row }">
                <template v-if="row.status === 'open'">
                  <el-button link type="success" size="small" @click="handleResolve(row, 'agreed')">同意</el-button>
                  <el-button link type="danger" size="small" @click="handleResolve(row, 'rejected')">驳回</el-button>
                  <el-button link size="small" @click="handleResolve(row, 'resolved')">解决</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-dialog>

    <!-- 复核/争议发起 -->
    <el-dialog v-model="reviewVisible" :title="reviewForm.type === 'dispute' ? '发起争议' : '发起复核'" width="480px">
      <el-input v-model="reviewForm.reason" type="textarea" :rows="4" placeholder="请填写原因（如：对定级成色有异议）" />
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>

    <!-- 质检报告 -->
    <el-dialog v-model="reportVisible" title="质检报告" width="900px" top="4vh">
      <template v-if="report">
        <div class="report-head">
          <h3>质检报告 {{ report.report_no }}</h3>
          <el-button type="primary" size="small" @click="printReport">打印</el-button>
        </div>
        <el-descriptions :column="3" border size="small" class="block">
          <el-descriptions-item label="回收订单">{{ report.qc.order_no }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ report.qc.brand_name || '' }} {{ report.qc.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ report.qc.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标准版本">{{ report.standard?.version_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总分">{{ report.qc.grade_score ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="定级">{{ conditionText(report.qc.graded_condition) }}</el-descriptions-item>
          <el-descriptions-item label="建议回收价">¥{{ Number(report.qc.final_price || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="质检员">{{ report.qc.inspector_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ report.qc.graded_at || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="report.results" border size="small" class="block">
          <el-table-column prop="item_name" label="检查项" min-width="140" />
          <el-table-column prop="result" label="结果" width="100" align="center" />
          <el-table-column prop="fault_tag" label="故障标签" width="120">
            <template #default="{ row }">{{ row.fault_tag || '-' }}</template>
          </el-table-column>
          <el-table-column prop="fault_note" label="故障描述" min-width="180">
            <template #default="{ row }">{{ row.fault_note || '-' }}</template>
          </el-table-column>
          <el-table-column prop="deduction" label="扣分" width="80" align="right" />
        </el-table>
        <p class="block report-note">定级说明：{{ report.qc.grade_note || '无' }}</p>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMiniAdminOrders } from '@/api/miniAdmin'
import {
  completeQcOrder,
  createQcOrder,
  deleteQcMedia,
  getQcOrderDetail,
  getQcOrders,
  getQcPriceSuggestion,
  getQcReport,
  getQcTemplates,
  gradeQcOrder,
  resolveQcReview,
  saveQcMedia,
  saveQcReview,
  startQcOrder
} from '@/api/qc'

const statusMap = {
  pending: '待质检',
  in_progress: '质检中',
  graded: '已定级',
  review: '复核中',
  disputed: '争议中',
  completed: '已完成'
}

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const summary = ref({ pending: 0, in_progress: 0, review: 0, disputed: 0 })
const searchForm = reactive({ keyword: '', status: '', graded_condition: '', date_range: [] })
const pagination = reactive({ page: 1, limit: 15, total: 0 })

const statusType = (s) => ({ pending: 'info', in_progress: 'primary', graded: 'warning', review: 'warning', disputed: 'danger', completed: 'success' }[s] || 'info')
const conditionText = (c) => ({ good: '优', normal: '良', fair: '中', poor: '差' }[c] || c || '-')
const conditionType = (c) => ({ good: 'success', normal: 'primary', fair: 'warning', poor: 'danger' }[c] || 'info')
const reviewStatusText = (s) => ({ open: '待处理', agreed: '已同意', rejected: '已驳回', resolved: '已解决' }[s] || s)

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, page_size: pagination.limit }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.graded_condition) params.graded_condition = searchForm.graded_condition
    if (searchForm.date_range?.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    const res = await getQcOrders(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
    if (res.data?.summary) {
      summary.value = { ...summary.value, ...res.data.summary }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleReset = () => {
  Object.assign(searchForm, { keyword: '', status: '', graded_condition: '', date_range: [] })
  handleSearch()
}

// ============ 创建质检单 ============
const createVisible = ref(false)
const orderSearchLoading = ref(false)
const orderOptions = ref([])
const templateOptions = ref([])
const createForm = reactive({ order_id: '', template_id: '' })

const openCreateDialog = async () => {
  createForm.order_id = ''
  createForm.template_id = ''
  orderOptions.value = []
  createVisible.value = true
  try {
    const res = await getQcTemplates({ page: 1, page_size: 50, status: 1 })
    templateOptions.value = res.data?.list || []
  } catch (e) { console.error(e) }
}

const searchRecycleOrders = async (keyword) => {
  if (!keyword) { orderOptions.value = []; return }
  orderSearchLoading.value = true
  try {
    const res = await getMiniAdminOrders({ page: 1, pageSize: 20, order_type: 'recycle', keyword })
    orderOptions.value = res.data?.items || []
  } catch (e) {
    console.error(e)
  } finally {
    orderSearchLoading.value = false
  }
}

const submitCreate = async () => {
  if (!createForm.order_id || !createForm.template_id) {
    ElMessage.warning('请选择回收订单和质检模板')
    return
  }
  submitLoading.value = true
  try {
    await createQcOrder({ ...createForm })
    ElMessage.success('质检单已创建')
    createVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

// ============ 详情 / 全流程 ============
const detailVisible = ref(false)
const detail = ref(null)
const grading = ref(false)
const gradeVisible = ref(false)
const gradeForm = reactive({ grade_score: 0, graded_condition: '', final_price: 0, grade_note: '' })
const suggestion = ref(null)
const reviewVisible = ref(false)
const reviewForm = reactive({ type: 'review', reason: '' })
const mediaForm = reactive({ type: 'image', url: '', note: '' })

const canGrade = computed(() => ['in_progress', 'graded', 'review', 'disputed'].includes(detail.value?.qc?.status))

// 标准快照质检项 + 已有结果
const gradeItems = computed(() => {
  const items = detail.value?.standard?.items || []
  return items.map((it) => {
    const existing = detail.value.results.find((r) => r.qc_item_id === it.id)
    return {
      ...it,
      input_result: existing?.result === 'fail' ? 'fail' : 'pass',
      input_score: null,
      input_note: existing?.fault_note || '',
      input_deduction: existing ? Number(existing.deduction) : 0
    }
  })
})

const resultOf = (itemId) => detail.value?.results?.find((r) => r.qc_item_id === itemId)

const openDetail = async (id) => {
  grading.value = false
  const res = await getQcOrderDetail(id)
  detail.value = res.data
  detailVisible.value = true
}

const handleStart = async () => {
  try {
    const res = await startQcOrder(detail.value.qc.id)
    detail.value = res.data
    grading.value = true
    ElMessage.success('已开始质检，请逐项录入结果')
  } catch (e) { console.error(e) }
}

const autoScore = () => {
  gradeForm.grade_score = Math.max(0, 100 - gradeItems.value.reduce((sum, it) => sum + (Number(it.input_deduction) || 0), 0))
}

const applySuggestion = async (gradeKey) => {
  if (!gradeKey) return
  try {
    const res = await getQcPriceSuggestion(detail.value.qc.id, gradeKey)
    suggestion.value = res.data
    gradeForm.final_price = res.data.suggested_price
    autoScore()
  } catch (e) { console.error(e) }
}

const submitGrade = async () => {
  const results = gradeItems.value.map((it) => ({
    qc_item_id: it.id,
    item_name: it.name,
    result: it.scoring_type === 'pass_fail' ? (it.input_result || 'pass') : String(it.input_score ?? 0),
    fault_note: it.input_note || '',
    deduction: Number(it.input_deduction) || 0
  }))
  submitLoading.value = true
  try {
    const res = await gradeQcOrder(detail.value.qc.id, { ...gradeForm, results })
    detail.value = res.data
    grading.value = false
    gradeVisible.value = false
    suggestion.value = null
    ElMessage.success('定级已提交')
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const handleComplete = async () => {
  try {
    await ElMessageBox.confirm('确定完结该质检单？完结后不可再修改。', '提示', { type: 'warning' })
    const res = await completeQcOrder(detail.value.qc.id)
    detail.value = res.data
    ElMessage.success('质检单已完成')
    loadData()
  } catch (e) { /* 取消或失败 */ }
}

const submitMedia = async () => {
  submitLoading.value = true
  try {
    await saveQcMedia(detail.value.qc.id, { ...mediaForm })
    mediaForm.url = ''
    mediaForm.note = ''
    const res = await getQcOrderDetail(detail.value.qc.id)
    detail.value = res.data
    ElMessage.success('已添加')
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const removeMedia = async (mediaId) => {
  try {
    await ElMessageBox.confirm('确定删除该媒体记录？', '提示', { type: 'warning' })
    await deleteQcMedia(mediaId)
    const res = await getQcOrderDetail(detail.value.qc.id)
    detail.value = res.data
  } catch (e) { /* 取消或失败 */ }
}

const openReview = (type) => {
  reviewForm.type = type
  reviewForm.reason = ''
  reviewVisible.value = true
}

const submitReview = async () => {
  if (!reviewForm.reason.trim()) {
    ElMessage.warning('请填写原因')
    return
  }
  submitLoading.value = true
  try {
    await saveQcReview(detail.value.qc.id, { ...reviewForm })
    reviewVisible.value = false
    const res = await getQcOrderDetail(detail.value.qc.id)
    detail.value = res.data
    ElMessage.success('已提交')
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const handleResolve = async (row, status) => {
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt(
      status === 'agreed' ? '同意后质检单回到「已定级」，可重新提交定级。处理意见：' : '处理意见：',
      '处理确认',
      { inputPlaceholder: '处理意见（可空）' }
    )
    remark = value || ''
  } catch { return }
  try {
    const res = await resolveQcReview(row.id, { status, handler_remark: remark })
    detail.value = res.data
    ElMessage.success('已处理')
    loadData()
  } catch (e) { console.error(e) }
}

// ============ 报告 ============
const reportVisible = ref(false)
const report = ref(null)

const openReport = async (id) => {
  const res = await getQcReport(id)
  report.value = res.data
  reportVisible.value = true
}

const printReport = () => window.print()

const openUrl = (url) => {
  if (url) window.open(url, '_blank')
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.qc-orders-page {
  .summary-row {
    margin-bottom: 16px;
  }

  .search-form {
    margin-bottom: 12px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }

  .block {
    margin-bottom: 16px;
  }

  .block-title {
    margin: 18px 0 10px;
    font-size: 15px;
    font-weight: 600;
  }

  .action-bar {
    display: flex;
    gap: 8px;
  }

  .media-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sug {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }

  .report-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
    }
  }

  .report-note {
    color: #606266;
    font-size: 13px;
  }
}
</style>
