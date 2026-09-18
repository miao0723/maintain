<template>
  <div v-loading="loading">
    <el-alert type="info" :closable="false" style="margin-bottom:14px"
      title="估价系数直接决定小程序端与快速估价的回收报价：最终价 = 型号基准价 × 二手基准系数 × 各因子系数连乘。系数越大回收价越高，右侧模拟器可实时验证调参效果。" />

    <!-- 核心参数卡 -->
    <div class="param-grid">
      <div class="page-card param-card">
        <div class="param-icon c-blue"><el-icon><Discount /></el-icon></div>
        <div class="param-body">
          <div class="param-label">二手基准系数（base_factor）</div>
          <div class="param-row">
            <el-input-number v-model="paramForm.base_factor" :min="0.1" :max="1" :step="0.05" :precision="2" size="small" />
            <el-button type="primary" size="small" :loading="paramSaving" @click="saveParam('base_factor', paramForm.base_factor)">保存</el-button>
          </div>
          <div class="param-note">即便全新设备也按此折扣回收，是估价的兜底折扣</div>
        </div>
      </div>
      <div class="page-card param-card">
        <div class="param-icon c-orange"><el-icon><Clock /></el-icon></div>
        <div class="param-body">
          <div class="param-label">配价有效期（天）</div>
          <div class="param-row">
            <el-input-number v-model="paramForm.price_valid_days" :min="1" :max="30" size="small" />
            <el-button type="primary" size="small" :loading="paramSaving" @click="saveParam('price_valid_days', paramForm.price_valid_days)">保存</el-button>
          </div>
          <div class="param-note">超期后小程序端需重新询价</div>
        </div>
      </div>
      <div class="page-card param-card">
        <div class="param-icon c-green"><el-icon><MagicStick /></el-icon></div>
        <div class="param-body">
          <div class="param-label">小程序 AI 估价</div>
          <div class="param-row">
            <el-switch v-model="paramForm.ai_evaluate_enabled" :loading="paramSaving"
              :active-value="1" :inactive-value="0"
              @change="(v) => saveParam('ai_evaluate_enabled', v)" />
            <span class="param-state">{{ paramForm.ai_evaluate_enabled === 1 ? '已开启' : '已关闭' }}</span>
          </div>
          <div class="param-note">开启后小程序端问答式估价由 AI 辅助判档</div>
        </div>
      </div>
    </div>

    <!-- 品类估价系数：全部回收品类各自的整体折算系数 -->
    <div class="page-card" style="margin-bottom:14px;padding:16px 18px">
      <div class="table-toolbar">
        <span class="card-title">品类估价系数</span>
        <span class="text-muted">每个回收品类的整体折算系数，参与估价模拟口径：最终价 = 基准价 × 二手基准系数 × 品类系数 × 各因子系数</span>
      </div>
      <div class="cat-grid">
        <div class="cat-card" v-for="c in categories" :key="c.id">
          <div class="cat-head">
            <span class="cat-icon">{{ c.icon || '📦' }}</span>
            <div class="cat-info">
              <div class="cat-name">{{ c.name }}</div>
              <div class="cat-meta">{{ c.models }} 个型号<template v-if="c.avgPrice"> · 均价 ¥{{ fmtMoney(c.avgPrice) }}</template></div>
            </div>
          </div>
          <div class="cat-op">
            <el-input-number v-model="c.factor" :min="0.1" :max="2" :step="0.05" :precision="2" size="small" />
            <el-button size="small" type="primary" plain :loading="c.saving" @click="saveCategoryFactor(c)">保存</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体：左系数配置 + 右模拟器 -->
    <div class="pricing-grid">
      <div class="page-card factors-card">
        <div class="table-toolbar">
          <span class="card-title">估价因子系数配置</span>
          <el-button type="primary" :icon="Refresh" @click="load">刷新</el-button>
        </div>
        <el-collapse v-model="activeFactors">
          <el-collapse-item v-for="factor in factors" :key="factor.key" :name="factor.key">
            <template #title>
              <span style="font-weight:600">{{ factor.name }}</span>
              <el-tag size="small" style="margin-left:8px">{{ factor.options.length }} 个选项</el-tag>
              <span class="factor-hint">{{ factorHint(factor.key) }}</span>
            </template>
            <el-table :data="factor.options" size="small">
              <el-table-column prop="label" label="选项文案" min-width="200" />
              <el-table-column label="价格系数" width="220">
                <template #default="{ row }">
                  <el-input-number v-model="row.rate" :min="0" :max="2" :step="0.05" :precision="2" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="折算" width="110">
                <template #default="{ row }">
                  <span class="rate-chip" :class="{ low: row.rate < 0.8 }">×{{ Number(row.rate).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column width="130" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="primary" link @click="saveRate(row)">保存</el-button>
                  <el-button size="small" type="danger" link @click="removeOption(factor, row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="factor-footer">
              <el-button size="small" :icon="Plus" @click="openCreate(factor)">新增选项</el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 全因子模拟器：调系数即时验证对报价的影响 -->
      <div class="simulator">
        <div class="sim-title"><el-icon><MagicStick /></el-icon> 报价模拟器</div>
        <p class="sim-tip">选型号与各因子档位，实时验证系数对回收价的影响</p>

        <!-- 热门机型推荐：点击直接带入模拟 -->
        <div class="hot-block" v-if="hotModels.length">
          <div class="hot-label"><el-icon><Star /></el-icon> 热门机型</div>
          <div class="hot-chips">
            <button
              v-for="m in hotModels"
              :key="m.id"
              class="hot-chip"
              :class="{ active: simModel?.id === m.id }"
              :title="`${m.brand_name} ${m.name} · 基准价 ¥${fmtMoney(m.base_price)}`"
              @click="pickHot(m)"
            >
              <span class="hot-name">{{ m.name }}</span>
              <span class="hot-price">¥{{ fmtMoney(m.base_price) }}</span>
            </button>
          </div>
          <div class="hot-refresh" @click="loadHot(true)">再换一批</div>
        </div>

        <el-select v-model="simModelId" filterable remote clearable placeholder="或输入型号搜索，如 iPhone 15"
          :remote-method="searchModels" :loading="searching" style="width:100%" @change="onSimModel">
          <el-option v-for="m in simModels" :key="m.id" :label="`${m.brand_name} ${m.name}`" :value="m.id" />
        </el-select>

        <template v-if="simModel">
          <div class="sim-base">
            <span>基准回收价</span>
            <b>¥{{ fmtMoney(simModel.base_price) }}</b>
          </div>

          <div class="sim-factor" v-for="f in factors" :key="f.key">
            <span class="sim-factor-name">{{ f.name }}</span>
            <el-select v-model="simPicks[f.key]" size="small" style="width:150px">
              <el-option v-for="o in f.options" :key="o.id" :label="`${o.label} ×${Number(o.rate).toFixed(2)}`" :value="o.id" />
            </el-select>
          </div>

          <div class="sim-result">
            <div class="sim-price">¥{{ fmtMoney(simPrice) }}</div>
            <div class="sim-caption">模拟回收价（综合折扣 {{ (simFactorTotal * 100).toFixed(1) }}%）</div>
          </div>

          <div class="sim-chain">
            <div class="chain-row"><span>基准价</span><b>¥{{ fmtMoney(simModel.base_price) }}</b></div>
            <div class="chain-row"><span>二手基准系数</span><b>× {{ baseFactor }}</b></div>
            <div class="chain-row">
              <span>品类系数{{ simCategoryName ? `（${simCategoryName}）` : '' }}</span>
              <b :class="{ low: simCategoryFactor < 1 }">× {{ simCategoryFactor.toFixed(2) }}</b>
            </div>
            <div class="chain-row" v-for="d in simDetails" :key="d.key">
              <span>{{ d.name }}</span>
              <b :class="{ low: d.rate < 1 }">× {{ Number(d.rate).toFixed(2) }}（{{ d.label }}）</b>
            </div>
          </div>
        </template>
        <div v-else class="sim-empty">
          <el-icon :size="40"><MagicStick /></el-icon>
          <p>选择型号后开始模拟</p>
        </div>
      </div>
    </div>

    <!-- 新增选项弹窗 -->
    <el-dialog v-model="createVisible" :title="`新增选项 - ${createForm.factorName}`" width="420px">
      <el-form label-width="80px">
        <el-form-item label="选项文案">
          <el-input v-model="createForm.label" placeholder="如：外屏碎裂但显示正常" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="价格系数">
          <el-input-number v-model="createForm.rate" :min="0" :max="2" :step="0.05" :precision="2" />
          <span class="text-muted" style="margin-left:10px">折算到回收价</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">确定新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Clock, Discount, MagicStick, Star } from '@element-plus/icons-vue'
import {
  getConditionRates, updateConditionRate, createConditionRate, deleteConditionRate,
  getSettings, saveSettings, getModels, getCategoryFactors, updateCategoryFactor
} from '../api'

const loading = ref(false)
const factors = ref([])
const activeFactors = ref([])
const baseFactor = ref(0.9)
const fmtMoney = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })

// ===== 核心参数 =====
const paramForm = ref({ base_factor: 0.9, price_valid_days: 3, ai_evaluate_enabled: 1 })
const paramSaving = ref(false)
const paramLabels = {
  base_factor: '二手基准系数',
  price_valid_days: '配价有效期',
  ai_evaluate_enabled: 'AI 估价开关'
}
async function saveParam(key, value) {
  paramSaving.value = true
  try {
    await saveSettings([{ key, value: String(value), description: paramLabels[key] }])
    if (key === 'base_factor') baseFactor.value = Number(value)
    ElMessage.success(`${paramLabels[key]}已更新`)
  } finally {
    paramSaving.value = false
  }
}

// ===== 因子说明 =====
const HINTS = {
  condition: '设备整体成色，影响最大',
  screen: '屏幕是残值核心部件',
  function: '功能故障折价明显',
  version: '国行最保值，有锁机折价大',
  accessories: '配件越全加成越高',
  'repair-history': '无拆无修最保值，大修折半'
}
const factorHint = (key) => HINTS[key] || ''

// ===== 新增/删除选项 =====
const createVisible = ref(false)
const creating = ref(false)
const createForm = ref({ factorKey: '', factorName: '', label: '', rate: 0.9 })
function openCreate(factor) {
  createForm.value = { factorKey: factor.key, factorName: factor.name, label: '', rate: 0.9 }
  createVisible.value = true
}
async function submitCreate() {
  if (!createForm.value.label.trim()) return ElMessage.warning('请填写选项文案')
  creating.value = true
  try {
    await createConditionRate({
      factor_key: createForm.value.factorKey,
      label: createForm.value.label.trim(),
      rate: createForm.value.rate
    })
    ElMessage.success('选项已新增')
    createVisible.value = false
    load()
  } finally {
    creating.value = false
  }
}
async function removeOption(factor, row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.label}」吗？删除后小程序估价不再出现该档位`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteConditionRate(row.id)
    ElMessage.success('选项已删除')
    load()
  } catch (e) {
    // 拦截器已提示
  }
}

async function saveRate(row) {
  await updateConditionRate(row.id, { label: row.label, rate: row.rate })
  ElMessage.success(`「${row.label}」系数已更新为 ${Number(row.rate).toFixed(2)}`)
}

// ===== 品类估价系数 =====
const categories = ref([])
async function loadCategories() {
  try {
    const res = await getCategoryFactors()
    categories.value = (res.data || []).map((c) => ({ ...c, saving: false }))
  } catch (e) {
    // 忽略
  }
}
async function saveCategoryFactor(c) {
  c.saving = true
  try {
    await updateCategoryFactor(c.id, Number(c.factor))
    ElMessage.success(`「${c.name}」品类系数已更新为 ${Number(c.factor).toFixed(2)}`)
  } finally {
    c.saving = false
  }
}
// 模拟器用：按型号所属品类取系数
const simCategoryFactor = computed(() => {
  if (!simModel.value) return 1
  const c = categories.value.find((x) => x.id === simModel.value.category_id)
  return c ? Number(c.factor) || 1 : 1
})
const simCategoryName = computed(() => {
  if (!simModel.value) return ''
  return categories.value.find((x) => x.id === simModel.value.category_id)?.name || ''
})

// ===== 模拟器 =====
const simModels = ref([])
const simModelId = ref(null)
const simModel = ref(null)
const searching = ref(false)
const simPicks = ref({})

// 热门机型推荐：优先热门，不足补普通；换一批时翻页
const hotModels = ref([])
let hotPage = 1
async function loadHot(rotate = false) {
  if (rotate) hotPage += 1
  try {
    let res = await getModels({ page: hotPage, pageSize: 6, hot: 1 })
    let list = res.data.list || []
    if (list.length < 6) {
      res = await getModels({ page: hotPage, pageSize: 6 })
      const seen = new Set(list.map((m) => m.id))
      list = list.concat((res.data.list || []).filter((m) => !seen.has(m.id)))
    }
    if (list.length === 0 && hotPage > 1) {
      hotPage = 1
      return loadHot(false)
    }
    hotModels.value = list.slice(0, 6)
  } catch (e) {
    // 忽略推荐加载失败
  }
}
function pickHot(m) {
  if (!simModels.value.some((x) => x.id === m.id)) simModels.value = [m, ...simModels.value].slice(0, 30)
  simModelId.value = m.id
  simModel.value = m
}

async function searchModels(keyword) {
  if (!keyword) { simModels.value = []; return }
  searching.value = true
  try {
    const res = await getModels({ keyword, page: 1, pageSize: 20 })
    simModels.value = res.data.list || []
  } finally {
    searching.value = false
  }
}
function onSimModel(id) {
  simModel.value = simModels.value.find((m) => m.id === id) || null
}

const simDetails = computed(() =>
  factors.value
    .filter((f) => simPicks.value[f.key] != null)
    .map((f) => {
      const opt = f.options.find((o) => o.id === simPicks.value[f.key])
      return opt ? { key: f.key, name: f.name, label: opt.label, rate: Number(opt.rate) } : null
    })
    .filter(Boolean)
)
const simFactorTotal = computed(() => simDetails.value.reduce((acc, d) => acc * d.rate, 1) * baseFactor.value * simCategoryFactor.value)
const simPrice = computed(() =>
  simModel.value ? Math.round(simModel.value.base_price * simFactorTotal.value) : 0
)

async function load() {
  loading.value = true
  try {
    const [rateRes, settingRes] = await Promise.all([getConditionRates(), getSettings()])
    factors.value = rateRes.data
    activeFactors.value = rateRes.data.map((f) => f.key)
    const map = Object.fromEntries(settingRes.data.map((s) => [s.config_key, s.config_value]))
    baseFactor.value = Number(map.base_factor || 0.9)
    paramForm.value = {
      base_factor: Number(map.base_factor || 0.9),
      price_valid_days: Number(map.price_valid_days || 3),
      ai_evaluate_enabled: map.ai_evaluate_enabled === '1' || map.ai_evaluate_enabled === undefined ? 1 : 0
    }
    // 模拟器默认选各组第一档
    for (const f of factors.value) {
      if (f.options?.length && simPicks.value[f.key] == null) simPicks.value[f.key] = f.options[0].id
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  loadHot(false)
  loadCategories()
})
</script>

<style scoped>
/* 核心参数卡 */
.param-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}
.param-card { display: flex; gap: 14px; padding: 16px 18px; }
.param-icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff;
}
.param-icon.c-blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.param-icon.c-orange { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
.param-icon.c-green { background: linear-gradient(135deg, #67c23a, #95d475); }
.param-body { flex: 1; min-width: 0; }
.param-label { font-size: 13px; font-weight: 600; color: #303133; }
.param-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.param-state { font-size: 13px; color: #67c23a; }
.param-note { font-size: 11px; color: #909399; margin-top: 6px; }

/* 品类估价系数卡片 */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.cat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px 14px;
  background: #fafbfc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.cat-card:hover {
  border-color: #b3e19d;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.1);
}
.cat-head { display: flex; align-items: center; gap: 10px; }
.cat-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.14), rgba(58, 157, 93, 0.08));
  border: 1px solid rgba(103, 194, 58, 0.25);
}
.cat-name { font-size: 14px; font-weight: 600; color: #303133; }
.cat-meta { font-size: 11px; color: #909399; margin-top: 2px; }
.cat-op { display: flex; align-items: center; gap: 8px; }
.cat-op .el-input-number { flex: 1; }

html.dark .cat-card {
  background: #1d1d1d;
  border-color: #333;
}
html.dark .cat-name { color: #e0e0e0; }

/* 主体布局 */
.pricing-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 14px;
  align-items: start;
}
.factors-card { padding: 16px 18px; }
.factor-hint { margin-left: 10px; font-size: 12px; color: #909399; }
.factor-footer { padding: 8px 4px 2px; border-top: 1px dashed #ebeef5; margin-top: 4px; }
.rate-chip {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  font-size: 12px; color: #67c23a; background: rgba(103, 194, 58, 0.1);
}
.rate-chip.low { color: #e6a23c; background: rgba(230, 162, 60, 0.1); }

/* 模拟器 */
.simulator {
  position: sticky;
  top: 12px;
  /* 吸顶面板高度不超过视口，超出部分转为内部滚动：
     底部（模拟价/折算链路）始终可达，不再被左侧长内容"顶走" */
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  /* 模拟器内滚到边界时不再连锁滚动左侧页面（滚动穿透隔离） */
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
  border-radius: 14px;
  padding: 20px;
  color: #fff;
  background: linear-gradient(150deg, #0f3b4c 0%, #155e75 55%, #1f7a5c 100%);
  box-shadow: 0 10px 26px rgba(15, 59, 76, 0.35);
}
.simulator::-webkit-scrollbar { width: 6px; }
.simulator::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 3px;
}
.simulator::-webkit-scrollbar-track { background: transparent; }
.sim-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; }
.sim-tip { font-size: 12px; opacity: 0.75; margin: 6px 0 12px; }

/* 热门机型推荐 chips */
.hot-block { margin-bottom: 12px; }
.hot-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: #fcd34d; margin-bottom: 8px;
}
.hot-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.hot-chip {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9px; padding: 6px 10px; cursor: pointer; color: #eaf6ff;
  transition: all 0.2s ease; line-height: 1.2; font-size: 12px;
}
.hot-chip:hover { background: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }
.hot-chip.active {
  border-color: #6ee7b7; background: rgba(110, 231, 183, 0.16);
  box-shadow: 0 0 12px rgba(110, 231, 183, 0.25);
}
.hot-chip .hot-name { font-weight: 600; }
.hot-chip .hot-price { color: #6ee7b7; font-variant-numeric: tabular-nums; font-size: 11px; }
.hot-refresh {
  margin-top: 8px; text-align: center; font-size: 11px; color: rgba(234, 246, 255, 0.6);
  cursor: pointer; transition: color 0.2s;
}
.hot-refresh:hover { color: #6ee7b7; }
.sim-base {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255, 255, 255, 0.1); border-radius: 8px;
  padding: 8px 12px; font-size: 13px; margin: 12px 0;
}
.sim-base b { font-size: 16px; color: #a7f3d0; }
.sim-factor { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
.sim-factor-name { font-size: 13px; opacity: 0.85; }
.sim-result { text-align: center; margin: 14px 0 6px; }
.sim-price {
  font-size: 36px; font-weight: 800; color: #a7f3d0;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 16px rgba(167, 243, 208, 0.4);
}
.sim-caption { font-size: 12px; opacity: 0.7; margin-top: 4px; }
.sim-chain {
  margin-top: 12px; background: rgba(255, 255, 255, 0.08);
  border-radius: 10px; padding: 4px 12px;
}
.chain-row {
  display: flex; justify-content: space-between; gap: 10px;
  padding: 7px 0; font-size: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
}
.chain-row:last-child { border-bottom: none; }
.chain-row span { opacity: 0.72; }
.chain-row b { font-variant-numeric: tabular-nums; text-align: right; }
.chain-row b.low { color: #fbbf24; }
.sim-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 36px 0; opacity: 0.55;
}
.sim-empty p { font-size: 13px; margin: 0; }

@media (max-width: 1100px) {
  .pricing-grid { grid-template-columns: 1fr; }
  /* 窄屏单列：取消吸顶与内部滚动，恢复常规文档流 */
  .simulator {
    position: static;
    max-height: none;
    overflow: visible;
    overscroll-behavior: auto;
  }
  .param-grid { grid-template-columns: 1fr; }
}

/* 暗色适配 */
html.dark .param-label { color: #e0e0e0; }
</style>
