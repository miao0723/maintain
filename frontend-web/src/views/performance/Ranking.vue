<template>
  <div class="perf-ranking">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="维度">
          <el-radio-group v-model="filters.dimension" @change="fetchData">
            <el-radio-button value="engineer">按人员</el-radio-button>
            <el-radio-button value="team">按班组</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filters.date_range" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px;" />
        </el-form-item>
        <el-form-item label="班组" v-if="filters.dimension === 'engineer'">
          <el-select v-model="filters.team" placeholder="全部" clearable style="width: 140px;">
            <el-option v-for="t in teams" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序指标">
          <el-select v-model="filters.sort_by" style="width: 140px;" @change="fetchData">
            <el-option label="综合得分" value="score" />
            <el-option label="按时完成率" value="on_time_rate" />
            <el-option label="平均维修时长" value="avg_duration" />
            <el-option label="工单完成量" value="completed_count" />
            <el-option label="返修率" value="rework_rate" />
            <el-option label="一次修复率" value="first_fix_rate" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="filters.sort_dir === 'desc' ? 'SortDown' : 'SortUp'" @click="toggleDir">
            {{ filters.sort_dir === 'desc' ? '降序' : '升序' }}
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="handleReset"><el-icon><RefreshLeft /></el-icon>重置</el-button>
          <el-button type="success" @click="handleSnapshot" :loading="snapLoading"><el-icon><Camera /></el-icon>保存本期快照</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 排行表 -->
    <el-card shadow="never">
      <template #header>
        <div class="table-head">
          <span class="card-title">{{ filters.dimension === 'engineer' ? '维修人员绩效排行' : '维修班组绩效排行' }}</span>
          <span class="table-sub">
            共 {{ ranking.total }} 条 · 按「{{ sortLabel }}」{{ filters.sort_dir === 'desc' ? '从高到低' : '从低到高' }}
            <template v-if="filters.dimension === 'engineer'">
              · 达标线 {{ ranking.pass_score || 80 }} 分 · 最低样本 {{ ranking.min_orders || 3 }} 单
              <el-tag v-if="standardStat.qualified > 0" type="success" size="small" effect="plain">符合 {{ standardStat.qualified }}</el-tag>
              <el-tag v-if="standardStat.unqualified > 0" type="danger" size="small" effect="plain">不符合 {{ standardStat.unqualified }}</el-tag>
              <el-tag v-if="standardStat.insufficient > 0" type="info" size="small" effect="plain">样本不足 {{ standardStat.insufficient }}</el-tag>
            </template>
          </span>
        </div>
      </template>
      <el-table :data="ranking.list" v-loading="loading" border stripe :row-class-name="rowClass">
        <el-table-column prop="rank" label="排名" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.rank <= 3" :type="['', 'danger', 'warning', 'success'][row.rank]" effect="dark" size="small">No.{{ row.rank }}</el-tag>
            <span v-else>{{ row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="filters.dimension === 'engineer' ? '姓名' : '班组'" min-width="120">
          <template #default="{ row }">{{ filters.dimension === 'engineer' ? row.name : row.team }}</template>
        </el-table-column>
        <el-table-column prop="team" label="所属班组" width="110" v-if="filters.dimension === 'engineer'" />
        <el-table-column prop="level" label="等级" width="90" v-if="filters.dimension === 'engineer'">
          <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.level || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="人数" width="80" align="center" v-if="filters.dimension === 'team'">
          <template #default="{ row }">{{ row.engineer_count }}</template>
        </el-table-column>
        <el-table-column label="工单完成量" width="120" align="center" prop="metrics.completed_count" sortable :sort-by="r => r.metrics.completed_count" />
        <el-table-column label="按时完成率" width="120" align="center">
          <template #default="{ row }"><span :class="rateClass(row.metrics.on_time_rate)">{{ row.metrics.on_time_rate }}%</span></template>
        </el-table-column>
        <el-table-column label="平均维修时长" width="120" align="center">
          <template #default="{ row }">{{ row.metrics.avg_duration }} 天</template>
        </el-table-column>
        <el-table-column label="返修率" width="100" align="center">
          <template #default="{ row }"><span :class="rateClass(100 - row.metrics.rework_rate, true)">{{ row.metrics.rework_rate }}%</span></template>
        </el-table-column>
        <el-table-column label="一次修复率" width="110" align="center">
          <template #default="{ row }"><span :class="rateClass(row.metrics.first_fix_rate)">{{ row.metrics.first_fix_rate }}%</span></template>
        </el-table-column>
        <el-table-column label="平均评分" width="90" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.metrics.avg_review" disabled size="small" show-score score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column label="达标状态" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-tag v-if="row.standard?.is_standard" type="success" effect="dark" size="small">符合标准</el-tag>
            <el-tag v-else-if="row.standard?.insufficient" type="info" effect="plain" size="small">样本不足</el-tag>
            <el-tag v-else type="danger" effect="dark" size="small">不符合</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="综合得分" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <div class="score-cell">
              <el-progress type="circle" :percentage="Math.min(100, Math.round(row.score))" :width="46"
                :color="scoreColor(row.score)" :stroke-width="6" />
              <span class="score-num" :style="{ color: scoreColor(row.score) }">{{ row.score }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPerformanceRanking, getPerformanceTeams, generateSnapshot } from '@/api/performance'

const loading = ref(false)
const snapLoading = ref(false)
const teams = ref([])
const ranking = ref({ dimension: 'engineer', total: 0, list: [] })
const filters = reactive({
  dimension: 'engineer',
  date_range: [],
  team: '',
  sort_by: 'score',
  sort_dir: 'desc'
})

const sortLabel = computed(() => ({
  score: '综合得分', on_time_rate: '按时完成率', avg_duration: '平均维修时长',
  completed_count: '工单完成量', rework_rate: '返修率', first_fix_rate: '一次修复率'
}[filters.sort_by] || '综合得分'))

const scoreColor = (s) => (s >= 85 ? '#67C23A' : s >= 70 ? '#409EFF' : s >= 60 ? '#E6A23C' : '#F56C6C')
const rateClass = (v, inverse = false) => {
  // inverse: 值越低越好（如返修率）
  if (inverse) return v <= 10 ? 'rate-good' : v <= 20 ? 'rate-mid' : 'rate-bad'
  return v >= 90 ? 'rate-good' : v >= 75 ? 'rate-mid' : 'rate-bad'
}
const standardStat = computed(() => {
  const list = ranking.value.list || []
  return {
    qualified: list.filter(r => r.standard?.is_standard).length,
    unqualified: list.filter(r => !r.standard?.is_standard && !r.standard?.insufficient).length,
    insufficient: list.filter(r => r.standard?.insufficient).length
  }
})
const rowClass = ({ row }) => {
  if (row.standard && !row.standard.is_standard && !row.standard.insufficient) return 'fail-row'
  if (row.rank <= 3) return 'top-row'
  return ''
}

const toggleDir = () => { filters.sort_dir = filters.sort_dir === 'desc' ? 'asc' : 'desc'; fetchData() }

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPerformanceRanking({
      dimension: filters.dimension,
      start_date: filters.date_range?.[0] || '',
      end_date: filters.date_range?.[1] || '',
      team: filters.team,
      sort_by: filters.sort_by,
      sort_dir: filters.sort_dir
    })
    ranking.value = res.data
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filters.date_range = []
  filters.team = ''
  filters.sort_by = 'score'
  filters.sort_dir = 'desc'
  fetchData()
}

const handleSnapshot = async () => {
  snapLoading.value = true
  try {
    const periodLabel = (filters.date_range?.[0] || 'all') + '~' + (filters.date_range?.[1] || 'now')
    await generateSnapshot({
      start_date: filters.date_range?.[0] || '',
      end_date: filters.date_range?.[1] || '',
      team: filters.team,
      period_label: periodLabel
    })
    ElMessage.success('已生成本期绩效快照，可在「评分规则」页查看历史')
  } catch (e) {} finally {
    snapLoading.value = false
  }
}

onMounted(async () => {
  try { teams.value = await getPerformanceTeams().then(r => r.data || []) } catch (e) {}
  fetchData()
})
</script>

<style lang="scss" scoped>
.perf-ranking {
  .filter-card { margin-bottom: 16px; }
  .filter-form { margin-bottom: -10px; }
  .table-head { display: flex; align-items: baseline; gap: 12px; }
  .card-title { font-weight: 600; color: #303133; font-size: 15px; }
  .table-sub { color: #909399; font-size: 12px; }
  .score-cell { display: inline-flex; align-items: center; gap: 8px; }
  .score-num { font-weight: 700; font-size: 15px; }
  .rate-good { color: #67C23A; font-weight: 600; }
  .rate-mid { color: #E6A23C; font-weight: 600; }
  .rate-bad { color: #F56C6C; font-weight: 600; }
  :deep(.top-row) { background: #f7fbff; }
  :deep(.fail-row) { background: #fef0f0; }
  :deep(.fail-row:hover) > td { background: #fde2e2 !important; }
}
</style>
