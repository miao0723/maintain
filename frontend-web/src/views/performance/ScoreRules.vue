<template>
  <div class="perf-rules">
    <!-- 评分规则配置 -->
    <el-card shadow="never" class="rule-card">
      <template #header>
        <div class="head">
          <span class="card-title">绩效评分规则（权重配置）</span>
          <div class="head-actions">
            <el-tag :type="weightSum === 100 ? 'success' : 'danger'" effect="plain">
              权重合计：{{ weightSum }}%（建议 100%）
            </el-tag>
            <template v-if="canManage">
              <el-button type="primary" :loading="saving" @click="handleSave"><el-icon><Check /></el-icon>保存权重</el-button>
              <el-button @click="handleReset"><el-icon><RefreshLeft /></el-icon>恢复默认</el-button>
            </template>
            <el-tag v-else type="info" effect="plain">只读（仅老板可配置）</el-tag>
          </div>
        </div>
      </template>

      <el-alert
        v-if="weightSum !== 100"
        type="warning" :closable="false" show-icon
        title="当前启用项权重合计不等于 100%，系统会按比例归一化计算综合得分，不影响排名，但建议调整为 100% 以保证得分直观。"
        class="rule-tip" />

      <!-- 达标判定配置 -->
      <el-card shadow="never" class="cfg-card">
        <template #header><span class="card-title">达标判定配置（老板观察人员是否符合标准）</span></template>
        <el-form :inline="true" :model="perfConfig" class="cfg-form">
          <el-form-item label="达标分数线">
            <el-input-number v-model="perfConfig.pass_score" :min="0" :max="100" :step="1" controls-position="right" style="width: 130px;" />
            <span class="cfg-unit">分 · 综合得分 ≥ 该值方可达标</span>
          </el-form-item>
          <el-form-item label="最低样本量">
            <el-input-number v-model="perfConfig.min_orders" :min="1" :max="50" :step="1" controls-position="right" style="width: 130px;" />
            <span class="cfg-unit">单 · 闭环工单低于该值不评级</span>
          </el-form-item>
          <el-form-item v-if="canManage">
            <el-button type="primary" :loading="cfgSaving" @click="handleSaveConfig"><el-icon><Check /></el-icon>保存达标线</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-table :data="rules" border>
        <el-table-column prop="indicator_name" label="考核指标" min-width="130" />
        <el-table-column label="方向" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.direction === 'higher' ? 'success' : 'warning'" effect="plain">
              {{ row.direction === 'higher' ? '越高越好' : '越低越好' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="基准值" width="120" align="center">
          <template #default="{ row }">{{ row.target_value }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="达标基准" width="130" align="center">
          <template #default="{ row }">
            <span :class="row.direction === 'lower' ? 'pass-lower' : 'pass-higher'">
              {{ row.direction === 'lower' ? '≤ ' : '≥ ' }}{{ row.pass_value }}{{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="权重(%)" width="220" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.weight" :min="0" :max="100" :step="1" :disabled="!row.enabled"
              controls-position="right" style="width: 140px;" />
          </template>
        </el-table-column>
        <el-table-column label="启用" width="90" align="center">
          <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">{{ ruleDesc(row.indicator_key) }}</template>
        </el-table-column>
      </el-table>

      <div class="formula">
        <strong>综合得分公式：</strong>
        综合得分 = Σ(指标归一化分 × 权重) ÷ Σ(启用项权重)，其中单项归一化分按「方向 + 基准值」映射到 0–100 分。
      </div>
    </el-card>

    <!-- 历史绩效快照 -->
    <el-card shadow="never" class="snap-card">
      <template #header>
        <div class="head">
          <span class="card-title">历史绩效快照（可追溯）</span>
          <div class="head-actions">
            <template v-if="canManage">
              <el-input v-model="newPeriod" placeholder="周期标签，如 2026-Q3" style="width: 180px;" />
              <el-button type="success" :loading="genLoading" @click="handleGenerate"><el-icon><Camera /></el-icon>生成快照</el-button>
            </template>
            <el-select v-model="snapPeriod" placeholder="选择周期" clearable style="width: 180px;" @change="fetchSnapshots">
              <el-option v-for="p in periods" :key="p" :label="p" :value="p" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="snapshots" v-loading="snapLoading" border stripe>
        <el-table-column prop="dimension" label="维度" width="90" align="center">
          <template #default="{ row }"><el-tag size="small">{{ row.dimension === 'team' ? '班组' : '人员' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="ref_name" label="姓名 / 班组" min-width="120" />
        <el-table-column prop="team" label="所属班组" width="100" />
        <el-table-column prop="rank" label="排名" width="70" align="center" />
        <el-table-column label="综合得分" width="100" align="center">
          <template #default="{ row }"><span :style="{ color: scoreColor(row.score), fontWeight: 700 }">{{ row.score }}</span></template>
        </el-table-column>
        <el-table-column prop="completed_count" label="完成量" width="80" align="center" />
        <el-table-column prop="on_time_rate" label="按时完成率" width="110" align="center">
          <template #default="{ row }">{{ row.on_time_rate }}%</template>
        </el-table-column>
        <el-table-column prop="avg_duration" label="平均时长" width="120" align="center">
          <template #default="{ row }">{{ fmtDuration(row.avg_duration) }}</template>
        </el-table-column>
        <el-table-column prop="rework_rate" label="返修率" width="90" align="center">
          <template #default="{ row }">{{ row.rework_rate }}%</template>
        </el-table-column>
        <el-table-column prop="first_fix_rate" label="一次修复率" width="110" align="center">
          <template #default="{ row }">{{ row.first_fix_rate }}%</template>
        </el-table-column>
        <el-table-column prop="avg_review" label="平均评分" width="90" align="center" />
        <el-table-column prop="created_at" label="生成时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getScoreRules, updateScoreRules, resetScoreRules, getSnapshots, generateSnapshot, getPerfConfig, savePerfConfig } from '@/api/performance'
import { fmtDuration } from '@/utils/duration'
import { usePermStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'

// 规则/配置/快照管理仅老板/超管（HR 等只读账号只可查看）
const permStore = usePermStore()
const authStore = useAuthStore()
const canManage = computed(() => permStore.isBoss || authStore.isAdmin)

const saving = ref(false)
const rules = ref([])
const weightSum = computed(() => rules.value.filter(r => r.enabled).reduce((s, r) => s + (Number(r.weight) || 0), 0))

// 达标判定配置
const cfgSaving = ref(false)
const perfConfig = reactive({ pass_score: 80, min_orders: 3 })
const loadConfig = async () => {
  try {
    const res = await getPerfConfig()
    const d = res.data || {}
    if (d.pass_score != null) perfConfig.pass_score = Number(d.pass_score)
    if (d.min_orders != null) perfConfig.min_orders = Number(d.min_orders)
  } catch (e) {}
}
const handleSaveConfig = async () => {
  cfgSaving.value = true
  try {
    await savePerfConfig({ pass_score: perfConfig.pass_score, min_orders: perfConfig.min_orders })
    ElMessage.success('达标线已保存')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    cfgSaving.value = false
  }
}

const ruleDesc = (key) => ({
  avg_review: '验收人评分（1-5 分）的平均值，是最贴近“做得好不好”的权威质量信号，权重最高。',
  on_time_rate: '统计周期内实际完成天数不超过预计天数的工单占比，衡量交付准时性。',
  qualified_rate: '被判定为“符合”的工单占比，衡量交付是否一次合格。',
  first_fix_rate: '零返修工单占比，越高越好，反映一次做好的稳定性。',
  completed_count: '统计周期内完成（含已超时但已闭环）的工单数量，衡量工作量（权重适度，避免只拼量）。',
  rework_rate: '返修次数与完成工单数的比值，越低越好；与一次修复率重复，默认停用。',
  avg_duration: '闭环工单平均实际维修时长（小时）；不同设备工时不同、横向不可比，时效已由按时完成率覆盖，默认停用。'
}[key] || '')

const scoreColor = (s) => (s >= 85 ? '#67C23A' : s >= 70 ? '#409EFF' : s >= 60 ? '#E6A23C' : '#F56C6C')

const handleSave = async () => {
  saving.value = true
  try {
    const payload = rules.value.map(r => ({ id: r.id, weight: Number(r.weight), enabled: r.enabled ? 1 : 0 }))
    await updateScoreRules(payload)
    ElMessage.success('权重已保存')
  } finally {
    saving.value = false
  }
}

const handleReset = async () => {
  try {
    rules.value = await resetScoreRules().then(r => r.data)
    ElMessage.success('已恢复默认权重')
  } catch (e) {}
}

// 快照
const snapLoading = ref(false)
const snapshots = ref([])
const periods = ref([])
const snapPeriod = ref('')
const newPeriod = ref('')

const fetchSnapshots = async () => {
  snapLoading.value = true
  try {
    const res = await getSnapshots({ period_label: snapPeriod.value })
    snapshots.value = res.data
  } finally {
    snapLoading.value = false
  }
}
const fetchPeriods = async () => {
  try { periods.value = await getSnapshots().then(r => [...new Set(r.data.map(s => s.period_label))]) } catch (e) {}
}

const genLoading = ref(false)
const handleGenerate = async () => {
  genLoading.value = true
  try {
    await generateSnapshot({ period_label: newPeriod.value || undefined })
    ElMessage.success('快照已生成')
    newPeriod.value = ''
    await fetchPeriods()
    await fetchSnapshots()
  } finally {
    genLoading.value = false
  }
}

onMounted(async () => {
  try { rules.value = await getScoreRules().then(r => r.data) } catch (e) {}
  await loadConfig()
  await fetchPeriods()
  await fetchSnapshots()
})
</script>

<style lang="scss" scoped>
.perf-rules {
  .rule-card { margin-bottom: 16px; }
  .cfg-card { margin-bottom: 16px; }
  .cfg-form { margin-bottom: -10px; }
  .cfg-unit { color: var(--c-text-secondary); font-size: 12px; margin-left: 8px; }
  .pass-higher { color: var(--c-success); font-weight: 600; }
  .pass-lower { color: var(--c-warning); font-weight: 600; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .card-title { font-weight: 600; color: var(--c-text-primary); font-size: 15px; }
  .head-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .rule-tip { margin-bottom: 14px; }
  .formula { margin-top: 16px; padding: 12px 14px; background: var(--c-bg-soft); border-radius: 8px; color: var(--c-text-regular); font-size: 13px; line-height: 1.6; }
}
</style>
