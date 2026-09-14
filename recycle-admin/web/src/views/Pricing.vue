<template>
  <div v-loading="loading">
    <el-alert type="info" :closable="false" style="margin-bottom:14px"
      title="估价系数直接决定小程序端回收估价结果：最终价 = 型号基准价 × 二手基准系数 × 各因子系数。系数越大回收价越高。" />

    <div class="chart-grid">
      <div class="page-card" style="grid-column:1/-1">
        <div class="table-toolbar">
          <span style="font-weight:600">估价因子系数配置</span>
          <el-button type="primary" :icon="Refresh" @click="load">刷新</el-button>
        </div>
        <el-collapse v-model="activeFactors">
          <el-collapse-item v-for="factor in factors" :key="factor.key" :name="factor.key">
            <template #title>
              <span style="font-weight:600">{{ factor.name }}</span>
              <el-tag size="small" style="margin-left:8px">{{ factor.options.length }} 个选项</el-tag>
            </template>
            <el-table :data="factor.options" size="small">
              <el-table-column prop="label" label="选项文案" min-width="180" />
              <el-table-column label="价格系数" width="240">
                <template #default="{ row }">
                  <el-input-number v-model="row.rate" :min="0" :max="2" :step="0.05" :precision="2" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="说明" min-width="160">
                <template #default>
                  <span class="text-muted">×{{ row.rate }} 折算到回收价</span>
                </template>
              </el-table-column>
              <el-table-column width="100" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="primary" link @click="saveRate(row)">保存</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <div class="page-card" style="margin-top:14px">
      <div class="table-toolbar"><span style="font-weight:600">估价示例</span></div>
      <el-form inline>
        <el-form-item label="选择型号">
          <el-select v-model="demoModelId" filterable placeholder="搜索型号" style="width:260px">
            <el-option v-for="m in demoModels" :key="m.id" :value="m.id" :label="`${m.brand_name} ${m.name}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="成色">
          <el-select v-model="demoCondition" style="width:140px">
            <el-option v-for="o in conditionOptions" :key="o.value" :label="o.label" :value="Number(o.rate)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <span>预估回收价：<span class="price-text" style="font-size:18px">¥{{ demoPrice }}</span></span>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getConditionRates, updateConditionRate, getSettings, getModels } from '../api'

const loading = ref(false)
const factors = ref([])
const activeFactors = ref([])
const baseFactor = ref(0.9)
const demoModels = ref([])
const demoModelId = ref(null)
const demoCondition = ref(0.9)

const conditionOptions = computed(() => {
  const factor = factors.value.find((f) => f.key === 'condition')
  return factor ? factor.options : []
})

const demoPrice = computed(() => {
  const model = demoModels.value.find((m) => m.id === demoModelId.value)
  if (!model) return '0'
  return Math.round(Number(model.base_price) * baseFactor.value * demoCondition.value).toLocaleString('zh-CN')
})

async function load() {
  loading.value = true
  try {
    const [rateRes, settingRes, modelRes] = await Promise.all([
      getConditionRates(),
      getSettings(),
      getModels({ pageSize: 100, hot: 1 })
    ])
    factors.value = rateRes.data
    activeFactors.value = rateRes.data.map((f) => f.key)
    const bf = settingRes.data.find((s) => s.config_key === 'base_factor')
    baseFactor.value = Number(bf ? bf.config_value : 0.9)
    // 热门机型不足时补充普通机型
    let models = modelRes.data.list
    if (models.length < 20) {
      const more = await getModels({ pageSize: 100 })
      const seen = new Set(models.map((m) => m.id))
      models = models.concat(more.data.list.filter((m) => !seen.has(m.id)))
    }
    demoModels.value = models
  } finally {
    loading.value = false
  }
}

async function saveRate(row) {
  await updateConditionRate(row.id, { label: row.label, rate: row.rate })
  ElMessage.success(`「${row.label}」系数已更新为 ${row.rate}`)
}

onMounted(load)
</script>
