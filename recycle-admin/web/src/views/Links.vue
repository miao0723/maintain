<template>
  <div class="page-card" v-loading="loading">
    <div class="table-toolbar">
      <span class="card-title">采购链接管理</span>
      <span class="text-muted">按分类 / 机型维护外部采购与比价链接，支持一键跳转</span>
    </div>
    <div class="filter-bar">
      <el-select v-model="query.categoryId" placeholder="适用分类" clearable style="width:150px">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="链接名称/地址/型号关键词" clearable style="width:220px" @keyup.enter="load" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="load">查询</el-button>
      <div style="flex:1"></div>
      <el-button :icon="DataLine" @click="statsVisible = true">跳转统计</el-button>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增采购链接</el-button>
    </div>

    <el-table :data="list">
      <el-table-column prop="name" label="链接名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="链接地址" min-width="220">
        <template #default="{ row }">
          <span class="link-url" @click="jump(row)">{{ row.url }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="category_name" label="适用分类" width="110">
        <template #default="{ row }">{{ row.category_name || '通用' }}</template>
      </el-table-column>
      <el-table-column prop="model_keyword" label="适用型号" min-width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.model_keyword || '-' }}</template>
      </el-table-column>
      <el-table-column prop="price_range" label="参考价区间" width="110">
        <template #default="{ row }">{{ row.price_range || '-' }}</template>
      </el-table-column>
      <el-table-column prop="notes" label="备注" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.notes || '-' }}</template>
      </el-table-column>
      <el-table-column label="点击量" width="85" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="warning" round>{{ row.click_count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近跳转" width="145" show-overflow-tooltip>
        <template #default="{ row }">{{ row.last_click_at || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="72" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="jump(row)">跳转</el-button>
          <el-button size="small" link @click="openDialog(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'info' : 'success'" link @click="toggle(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑采购链接' : '新增采购链接'" width="520px">
      <el-form label-width="95px">
        <el-form-item label="链接名称"><el-input v-model="form.name" placeholder="如 爱回收-iPhone报价页" /></el-form-item>
        <el-form-item label="链接地址"><el-input v-model="form.url" placeholder="https://..." /></el-form-item>
        <el-form-item label="适用分类">
          <el-select v-model="form.categoryId" clearable placeholder="不选=通用" style="width:180px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联平台">
          <el-select v-model="form.platformId" clearable filterable placeholder="可选" style="width:180px">
            <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号关键词"><el-input v-model="form.modelKeyword" placeholder="如 iPhone 15" /></el-form-item>
        <el-form-item label="参考价区间"><el-input v-model="form.priceRange" placeholder="如 3000-5000" style="width:180px" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" style="width:120px" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="statsVisible" title="跳转点击统计（近30天）" size="520px">
      <div ref="statsChartEl" style="width:100%;height:280px"></div>
      <el-divider>最常跳转 TOP10</el-divider>
      <el-table :data="clickTop" size="small">
        <el-table-column type="index" label="#" width="44" />
        <el-table-column prop="target_name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{ row.target_type === 'platform' ? '平台' : '链接' }}</template>
        </el-table-column>
        <el-table-column prop="clicks" label="点击" width="70" align="center" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, DataLine } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getLinks, createLink, updateLink, deleteLink, clickLink, getClickStats, getCatalogTree, getPlatforms } from '../api'

const loading = ref(false)
const list = ref([])
const categories = ref([])
const platforms = ref([])
const query = reactive({ categoryId: '', keyword: '', status: '' })
const dialogVisible = ref(false)
const form = ref({})
const statsVisible = ref(false)
const clickTop = ref([])
const statsChartEl = ref(null)

async function load() {
  loading.value = true
  try {
    const res = await getLinks(query)
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  form.value = row
    ? {
        id: row.id, name: row.name, url: row.url, categoryId: row.category_id, platformId: row.platform_id,
        modelKeyword: row.model_keyword, priceRange: row.price_range, notes: row.notes, sortOrder: row.sort_order
      }
    : { id: null, name: '', url: '', categoryId: null, platformId: null, modelKeyword: '', priceRange: '', notes: '', sortOrder: 0 }
  dialogVisible.value = true
}

async function submit() {
  if (!form.value.name || !form.value.url) return ElMessage.warning('请填写名称和地址')
  if (form.value.id) {
    await updateLink(form.value.id, form.value)
  } else {
    await createLink(form.value)
  }
  ElMessage.success('已保存')
  dialogVisible.value = false
  load()
}

async function toggle(row) {
  await updateLink(row.id, { status: row.status === 1 ? 0 : 1 })
  ElMessage.success(row.status === 1 ? '已停用' : '已启用')
  load()
}

async function remove(row) {
  await ElMessageBox.confirm(`确定删除链接「${row.name}」？`, '提示', { type: 'warning' })
  await deleteLink(row.id)
  ElMessage.success('已删除')
  load()
}

async function jump(row) {
  try {
    const res = await clickLink(row.id)
    window.open(res.data.url, '_blank', 'noopener')
    row.click_count += 1
    row.last_click_at = new Date().toLocaleString('zh-CN')
  } catch (e) { /* 已提示 */ }
}

async function loadStats() {
  const res = await getClickStats()
  clickTop.value = res.data.top
  await nextTick()
  if (statsChartEl.value) {
    const chart = echarts.init(statsChartEl.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 24 },
      xAxis: { type: 'category', data: res.data.trend.map((r) => String(r.date).slice(5)) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, data: res.data.trend.map((r) => Number(r.clicks)), itemStyle: { color: '#e6a23c' } }]
    })
  }
}

onMounted(async () => {
  load()
  const [treeRes, pfRes] = await Promise.all([getCatalogTree(), getPlatforms({})])
  categories.value = treeRes.data
  platforms.value = pfRes.data
})

// 打开统计抽屉时加载
watch(statsVisible, (v) => { if (v) loadStats() })
</script>
