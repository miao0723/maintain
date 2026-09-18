<template>
  <div class="catalog-wrap">
    <!-- 左侧：分类/品牌树 -->
    <div class="page-card tree-panel">
      <div class="table-toolbar">
        <span class="card-title">设备分类</span>
        <el-button size="small" type="primary" :icon="Plus" @click="openCategoryDialog()">新增分类</el-button>
      </div>
      <el-input v-model="treeKeyword" placeholder="搜索分类/品牌" clearable size="small" style="margin-bottom:10px" />
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'name', children: 'children' }"
        node-key="key"
        highlight-current
        default-expand-all
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <span @click="handleNodeClick(data)">{{ data.icon ? data.icon + ' ' : '' }}{{ data.name }}</span>
            <span style="display:flex;align-items:center;gap:4px">
              <span v-if="data.type === 'category'" class="text-muted">({{ data.brandCount }}品牌)</span>
              <span v-if="data.type === 'brand'" class="text-muted">({{ data.modelCount }}款)</span>
              <el-icon class="tree-edit" @click.stop="handleTreeEdit(data)"><Edit /></el-icon>
            </span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 右侧：型号配价表 -->
    <div class="page-card model-panel">
      <div class="filter-bar">
        <el-input v-model="modelQuery.keyword" placeholder="型号名称/规格" clearable style="width:200px" @keyup.enter="loadModels(1)" />
        <el-select v-model="modelQuery.status" placeholder="状态" clearable style="width:110px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadModels(1)">查询</el-button>
        <div style="flex:1"></div>
        <el-button :icon="Download" @click="exportCatalog">导出配价</el-button>
        <el-button :icon="Clock" @click="openPriceLogs">调价记录</el-button>
        <el-button type="warning" :icon="Operation" :disabled="selection.length === 0" @click="batchVisible = true">
          批量调价{{ selection.length ? `(${selection.length})` : '' }}
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openModelDialog()">新增型号</el-button>
        <el-button :icon="Plus" @click="openBrandDialog()">新增品牌</el-button>
      </div>

      <el-alert type="info" :closable="false" style="margin-bottom:10px"
        :title="currentScopeLabel + '，共 ' + modelTotal + ' 个型号。基准价为该型号的最高回收报价，小程序估价以此为基准按成色系数折算。'" />

      <el-table :data="models" @selection-change="(v) => (selection = v)">
        <el-table-column type="selection" width="42" />
        <el-table-column prop="category_name" label="分类" width="100" show-overflow-tooltip />
        <el-table-column prop="brand_name" label="品牌" width="110" show-overflow-tooltip />
        <el-table-column prop="name" label="型号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="specs" label="规格" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.specs || '-' }}</template>
        </el-table-column>
        <el-table-column label="基准回收价" width="125" align="right">
          <template #default="{ row }"><span class="price-text">¥{{ fmtMoney(row.base_price) }}</span></template>
        </el-table-column>
        <el-table-column label="市场参考价" width="115" align="right">
          <template #default="{ row }">{{ row.market_price != null ? '¥' + fmtMoney(row.market_price) : '-' }}</template>
        </el-table-column>
        <el-table-column label="热门" width="60" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.hot === 1" @change="(v) => toggleHot(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" link @click="openPriceDialog(row)">调价</el-button>
            <el-button size="small" type="success" link @click="openTrend(row)">走势</el-button>
            <el-button size="small" type="primary" link @click="openModelDialog(row)">编辑</el-button>
            <el-button size="small" type="info" link @click="toggleStatus(row)">{{ row.status === 1 ? '下架' : '上架' }}</el-button>
            <el-button size="small" type="danger" link @click="removeModel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <el-pagination v-model:current-page="modelQuery.page" v-model:page-size="modelQuery.pageSize"
          :total="modelTotal" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next"
          @current-change="loadModels()" @size-change="loadModels(1)" />
      </div>
    </div>

    <!-- 分类弹窗 -->
    <el-dialog v-model="categoryVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="430px">
      <el-form label-width="80px">
        <el-form-item label="分类编码" v-if="!categoryForm.id">
          <el-input v-model="categoryForm.code" placeholder="如 phone / laptop（唯一）" />
        </el-form-item>
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="如 手机回收" />
        </el-form-item>
        <el-form-item label="图标(emoji)"><el-input v-model="categoryForm.icon" placeholder="📱" style="width:100px" /></el-form-item>
        <el-form-item label="主题色">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="categoryForm.sortOrder" :min="0" style="width:120px" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="categoryForm.id" type="danger" :icon="Delete" @click="removeCategory">删除分类</el-button>
        <el-button @click="categoryVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- 品牌弹窗 -->
    <el-dialog v-model="brandVisible" :title="brandForm.id ? '编辑品牌' : '新增品牌'" width="430px">
      <el-form label-width="80px">
        <el-form-item label="所属分类" v-if="!brandForm.id">
          <el-select v-model="brandForm.categoryId" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌名称"><el-input v-model="brandForm.name" /></el-form-item>
        <el-form-item label="品牌字标"><el-input v-model="brandForm.logoText" placeholder="如 华 / A" style="width:110px" /></el-form-item>
        <el-form-item label="品牌色"><el-color-picker v-model="brandForm.logoColor" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="brandForm.id" type="danger" :icon="Delete" @click="removeBrand">删除品牌</el-button>
        <el-button @click="brandVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBrand">保存</el-button>
      </template>
    </el-dialog>

    <!-- 型号弹窗 -->
    <el-dialog v-model="modelVisible" :title="modelForm.id ? '编辑型号' : '新增型号'" width="460px">
      <el-form label-width="95px">
        <el-form-item label="分类/品牌" v-if="!modelForm.id">
          <el-cascader v-model="modelForm.catBrand" :options="cascaderOptions" placeholder="选择分类与品牌" style="width:100%" />
        </el-form-item>
        <el-form-item label="型号名称"><el-input v-model="modelForm.name" placeholder="如 iPhone 15 Pro Max" /></el-form-item>
        <el-form-item label="规格说明"><el-input v-model="modelForm.specs" placeholder="如 A17 Pro · 6.1英寸" /></el-form-item>
        <el-form-item label="基准回收价">
          <el-input-number v-model="modelForm.basePrice" :min="0" :precision="0" :step="100" />
        </el-form-item>
        <el-form-item label="市场参考价">
          <el-input-number v-model="modelForm.marketPrice" :min="0" :precision="0" :step="100" />
        </el-form-item>
        <el-form-item label="热门机型"><el-switch v-model="modelForm.hot" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modelVisible = false">取消</el-button>
        <el-button type="primary" @click="submitModel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 单型号调价 -->
    <el-dialog v-model="priceVisible" title="型号调价" width="430px">
      <el-form label-width="95px">
        <el-form-item label="型号">{{ priceForm.modelName }}</el-form-item>
        <el-form-item label="当前基准价"><span class="price-text">¥{{ fmtMoney(priceForm.oldPrice) }}</span></el-form-item>
        <el-form-item label="新基准价">
          <el-input-number v-model="priceForm.newPrice" :min="0" :precision="0" :step="100" />
        </el-form-item>
        <el-form-item label="调价原因">
          <el-input v-model="priceForm.reason" placeholder="如 市场行情上涨" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="priceVisible = false">取消</el-button>
        <el-button type="warning" :loading="priceSubmitting" @click="submitPrice">确认调价</el-button>
      </template>
    </el-dialog>

    <!-- 批量调价 -->
    <el-dialog v-model="batchVisible" :title="`批量调价（已选 ${selection.length} 个型号）`" width="440px">
      <el-form label-width="95px">
        <el-form-item label="调价方式">
          <el-radio-group v-model="batchForm.mode">
            <el-radio-button value="percent">按比例</el-radio-button>
            <el-radio-button value="fixed">固定价格</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="batchForm.mode === 'percent' ? '调整比例(%)' : '统一价格(元)'">
          <el-input-number v-model="batchForm.value" :step="batchForm.mode === 'percent' ? 5 : 100" />
          <div class="text-muted" v-if="batchForm.mode === 'percent'">正数上调，负数下调，如 -5 表示下调5%</div>
        </el-form-item>
        <el-form-item label="调价原因">
          <el-input v-model="batchForm.reason" placeholder="如 全线机型行情调整" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="warning" :loading="priceSubmitting" @click="submitBatch">确认批量调价</el-button>
      </template>
    </el-dialog>

    <!-- 型号价格走势 -->
    <el-dialog v-model="trendVisible" :title="`价格走势 - ${trendModel?.name || ''}`" width="680px">
      <div v-loading="trendLoading" class="trend-box">
        <div ref="trendChartEl" class="trend-chart"></div>
        <div v-if="!trendLoading && trendLogs.length === 0" class="trend-empty">该型号暂无调价记录</div>
      </div>
      <template #footer>
        <span class="text-muted" style="margin-right:12px">共 {{ trendLogs.length }} 次调价</span>
        <el-button @click="trendVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 调价记录 -->
    <el-drawer v-model="logsVisible" title="配价调整记录" size="560px">
      <el-table :data="priceLogs" size="small">
        <el-table-column prop="created_at" label="时间" width="150" show-overflow-tooltip />
        <el-table-column prop="model_name" label="型号" min-width="130" show-overflow-tooltip />
        <el-table-column label="价格变动" width="170">
          <template #default="{ row }">
            ¥{{ fmtMoney(row.old_price) }} → <span class="price-text">¥{{ fmtMoney(row.new_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="110" show-overflow-tooltip />
        <el-table-column prop="admin_name" label="操作人" width="90" show-overflow-tooltip />
      </el-table>
      <div style="display:flex;justify-content:flex-end;margin-top:10px">
        <el-pagination v-model:current-page="logPage" :page-size="20" :total="logTotal" layout="prev, pager, next"
          @current-change="openPriceLogs" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Clock, Operation, Delete, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { chartTheme } from '../utils/theme'
import {
  getCatalogTree, getModels, createCategory, updateCategory, deleteCategory,
  createBrand, updateBrand, deleteBrand, createModel, updateModel, updateModelPrice,
  deleteModel, batchPrice, getPriceLogs, exportCatalogUrl
} from '../api'

// 导出当前配价库全量 CSV（带 BOM，Excel 可直接打开）
function exportCatalog() {
  window.open(exportCatalogUrl(), '_blank')
}

const fmtMoney = (v) => Number(v || 0).toLocaleString('zh-CN')

// ===== 左侧树 =====
const treeRef = ref(null)
const treeKeyword = ref('')
const categories = ref([])
const treeData = ref([])
const scope = reactive({ categoryId: '', brandId: '' })
const currentScopeLabel = computed(() => {
  if (scope.brandId) return '当前范围：指定品牌'
  if (scope.categoryId) return '当前范围：指定分类'
  return '当前范围：全部型号'
})

watch(treeKeyword, (v) => treeRef.value && treeRef.value.filter(v))

function filterNode(value, data) {
  if (!value) return true
  return data.name.includes(value)
}

async function loadTree() {
  const res = await getCatalogTree()
  categories.value = res.data
  treeData.value = res.data.map((c) => ({
    key: `c-${c.id}`,
    id: c.id,
    type: 'category',
    name: c.name,
    icon: c.icon,
    brandCount: c.brands.length,
    children: c.brands.map((b) => ({
      key: `b-${b.id}`,
      id: b.id,
      type: 'brand',
      name: b.name,
      modelCount: b.models.length
    }))
  }))
}

function handleNodeClick(data) {
  if (data.type === 'category') {
    scope.categoryId = data.id
    scope.brandId = ''
  } else {
    scope.brandId = data.id
  }
  loadModels(1)
}

/** 树节点编辑按钮：分类 → 分类弹窗；品牌 → 品牌弹窗 */
function handleTreeEdit(data) {
  if (data.type === 'category') {
    const cat = categories.value.find((c) => c.id === data.id)
    if (cat) openCategoryDialog(cat)
  } else {
    const brand = categories.value.flatMap((c) => c.brands).find((b) => b.id === data.id)
    if (brand) {
      Object.assign(brandForm, {
        id: brand.id, categoryId: brand.category_id, name: brand.name,
        logoText: brand.logo_text, logoColor: brand.logo_color
      })
      brandVisible.value = true
    }
  }
}

// ===== 型号列表 =====
const models = ref([])
const modelTotal = ref(0)
const selection = ref([])
const modelQuery = reactive({ keyword: '', status: '', page: 1, pageSize: 20 })

async function loadModels(page) {
  if (page) modelQuery.page = page
  const params = { ...modelQuery }
  if (scope.brandId) params.brandId = scope.brandId
  else if (scope.categoryId) params.categoryId = scope.categoryId
  else {
    delete params.brandId
    delete params.categoryId
  }
  const res = await getModels(params)
  models.value = res.data.list
  modelTotal.value = res.data.total
}

// ===== 分类 CRUD =====
const categoryVisible = ref(false)
const categoryForm = reactive({ id: null, code: '', name: '', icon: '', color: '#5B9E8A', sortOrder: 0 })
function openCategoryDialog(row) {
  Object.assign(categoryForm, row
    ? { id: row.id, code: row.code, name: row.name, icon: row.icon, color: row.color, sortOrder: row.sort_order }
    : { id: null, code: '', name: '', icon: '', color: '#5B9E8A', sortOrder: 0 })
  categoryVisible.value = true
}
async function submitCategory() {
  if (!categoryForm.name || (!categoryForm.id && !categoryForm.code)) return ElMessage.warning('请填写编码和名称')
  if (categoryForm.id) {
    await updateCategory(categoryForm.id, categoryForm)
  } else {
    await createCategory(categoryForm)
  }
  ElMessage.success('已保存')
  categoryVisible.value = false
  loadTree()
  loadModels(1)
}
async function removeCategory() {
  await ElMessageBox.confirm('删除分类前需先清空其下品牌与型号，确认继续？', '提示', { type: 'warning' })
  try {
    await deleteCategory(categoryForm.id)
    ElMessage.success('已删除')
    categoryVisible.value = false
    scope.categoryId = ''
    loadTree()
    loadModels(1)
  } catch (e) { /* 已提示 */ }
}

// ===== 品牌 CRUD =====
const brandVisible = ref(false)
const brandForm = reactive({ id: null, categoryId: '', name: '', logoText: '', logoColor: '#666666' })
function openBrandDialog() {
  Object.assign(brandForm, { id: null, categoryId: scope.categoryId || (categories.value[0]?.id ?? ''), name: '', logoText: '', logoColor: '#666666' })
  brandVisible.value = true
}
async function submitBrand() {
  if (!brandForm.name) return ElMessage.warning('请填写品牌名称')
  if (brandForm.id) {
    await updateBrand(brandForm.id, brandForm)
  } else {
    if (!brandForm.categoryId) return ElMessage.warning('请选择所属分类')
    await createBrand(brandForm)
  }
  ElMessage.success('已保存')
  brandVisible.value = false
  loadTree()
  loadModels(1)
}
async function removeBrand() {
  await ElMessageBox.confirm('删除品牌前需先清空其下型号，确认继续？', '提示', { type: 'warning' })
  try {
    await deleteBrand(brandForm.id)
    ElMessage.success('已删除')
    brandVisible.value = false
    scope.brandId = ''
    loadTree()
    loadModels(1)
  } catch (e) { /* 已提示 */ }
}

// ===== 型号 CRUD =====
const modelVisible = ref(false)
const modelForm = reactive({ id: null, catBrand: [], name: '', specs: '', basePrice: 0, marketPrice: 0, hot: false })
const cascaderOptions = computed(() =>
  categories.value.map((c) => ({
    value: c.id,
    label: c.name,
    children: c.brands.map((b) => ({ value: b.id, label: b.name }))
  }))
)
function openModelDialog(row) {
  if (row) {
    Object.assign(modelForm, {
      id: row.id, catBrand: [], name: row.name, specs: row.specs,
      basePrice: Number(row.base_price), marketPrice: row.market_price != null ? Number(row.market_price) : 0,
      hot: row.hot === 1
    })
  } else {
    Object.assign(modelForm, {
      id: null, catBrand: scope.brandId ? [scope.categoryId, scope.brandId] : [],
      name: '', specs: '', basePrice: 0, marketPrice: 0, hot: false
    })
  }
  modelVisible.value = true
}
async function submitModel() {
  if (!modelForm.name) return ElMessage.warning('请填写型号名称')
  if (modelForm.id) {
    await updateModel(modelForm.id, {
      name: modelForm.name, specs: modelForm.specs, basePrice: modelForm.basePrice,
      marketPrice: modelForm.marketPrice || null, hot: modelForm.hot
    })
  } else {
    if (modelForm.catBrand.length !== 2) return ElMessage.warning('请选择分类与品牌')
    await createModel({
      brandId: modelForm.catBrand[1], name: modelForm.name, specs: modelForm.specs,
      basePrice: modelForm.basePrice, marketPrice: modelForm.marketPrice || null, hot: modelForm.hot ? 1 : 0
    })
  }
  ElMessage.success('已保存')
  modelVisible.value = false
  loadModels()
  loadTree()
}
async function toggleHot(row, value) {
  await updateModel(row.id, { hot: value ? 1 : 0 })
  row.hot = value ? 1 : 0
}
async function toggleStatus(row) {
  await updateModel(row.id, { status: row.status === 1 ? 0 : 1 })
  row.status = row.status === 1 ? 0 : 1
  ElMessage.success(row.status === 1 ? '已上架' : '已下架')
}
async function removeModel(row) {
  await ElMessageBox.confirm(`确定删除型号「${row.name}」？`, '提示', { type: 'warning' })
  await deleteModel(row.id)
  ElMessage.success('已删除')
  loadModels()
  loadTree()
}

// ===== 调价 =====
const priceVisible = ref(false)
const priceSubmitting = ref(false)
const priceForm = reactive({ id: null, modelName: '', oldPrice: 0, newPrice: 0, reason: '' })
function openPriceDialog(row) {
  Object.assign(priceForm, { id: row.id, modelName: `${row.brand_name} ${row.name}`, oldPrice: Number(row.base_price), newPrice: Number(row.base_price), reason: '' })
  priceVisible.value = true
}
async function submitPrice() {
  priceSubmitting.value = true
  try {
    await updateModelPrice(priceForm.id, { basePrice: priceForm.newPrice, reason: priceForm.reason })
    ElMessage.success('调价成功')
    priceVisible.value = false
    loadModels()
  } catch (e) {
    if (e && e.needConfirm) {
      try {
        await ElMessageBox.confirm(e.message, '调价二次确认', { type: 'warning', confirmButtonText: '继续调价' })
        priceSubmitting.value = true
        await updateModelPrice(priceForm.id, { basePrice: priceForm.newPrice, reason: priceForm.reason, force: true })
        ElMessage.success('调价成功')
        priceVisible.value = false
        loadModels()
      } catch (_) { /* 取消 */ }
    }
  } finally {
    priceSubmitting.value = false
  }
}

const batchVisible = ref(false)
const batchForm = reactive({ mode: 'percent', value: -5, reason: '' })
async function submitBatch() {
  priceSubmitting.value = true
  try {
    await batchPrice({ modelIds: selection.value.map((m) => m.id), mode: batchForm.mode, value: batchForm.value, reason: batchForm.reason })
    ElMessage.success('批量调价完成')
    batchVisible.value = false
    loadModels()
  } finally {
    priceSubmitting.value = false
  }
}

// ===== 调价记录 =====
const logsVisible = ref(false)
const priceLogs = ref([])
const logTotal = ref(0)
const logPage = ref(1)
async function openPriceLogs() {
  logsVisible.value = true
  const res = await getPriceLogs({ page: logPage.value, pageSize: 20 })
  priceLogs.value = res.data.list
  logTotal.value = res.data.total
}

// ===== 型号价格走势 =====
const trendVisible = ref(false)
const trendLoading = ref(false)
const trendModel = ref(null)
const trendLogs = ref([])
const trendChartEl = ref(null)
let trendChart = null

async function openTrend(row) {
  trendModel.value = row
  trendVisible.value = true
  trendLoading.value = true
  trendLogs.value = []
  try {
    const res = await getPriceLogs({ modelId: row.id, page: 1, pageSize: 100 })
    trendLogs.value = res.data.list || []
    await nextTick()
    renderTrend()
  } finally {
    trendLoading.value = false
  }
}

function renderTrend() {
  if (!trendChartEl.value) return
  const t = chartTheme()
  const logs = trendLogs.value
  // 首次调价前没有 old_price，用当前基准价补出终点；序列含 old→new 两点使折线连续
  const points = []
  if (logs.length === 1 && logs[0].old_price == null) {
    points.push({ label: '初始定价', price: Number(logs[0].new_price), date: logs[0].created_at })
  } else {
    for (const l of logs) {
      if (l.old_price != null) points.push({ label: '调前', price: Number(l.old_price), date: l.created_at })
      points.push({ label: '调后', price: Number(l.new_price), date: l.created_at, reason: l.reason })
    }
  }

  trendChart = trendChart || echarts.init(trendChartEl.value)
  trendChart.setOption({
    grid: { left: 56, right: 24, top: 30, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.tooltipText },
      formatter: (ps) => {
        const p = ps[0]
        const reason = p.data.reason ? `<br/>原因：${p.data.reason}` : ''
        return `${p.axisValue}<br/>¥${Number(p.value).toLocaleString()}${reason}`
      }
    },
    xAxis: {
      type: 'category',
      data: points.map((p, i) => (i === points.length - 1 ? '当前' : String(p.date).slice(5, 16))),
      axisLine: { lineStyle: { color: t.axisLine } },
      axisLabel: { color: t.axisLabel, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { color: t.axisLabel, formatter: '¥{value}' },
      splitLine: { lineStyle: { color: t.splitLine } }
    },
    series: [{
      type: 'line',
      data: points.map((p) => ({ value: p.price, reason: p.reason })),
      smooth: true,
      symbolSize: 7,
      itemStyle: { color: '#67c23a' },
      lineStyle: { width: 3, color: '#67c23a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.25)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.02)' }
        ])
      },
      markLine: trendModel.value
        ? {
            symbol: 'none',
            silent: true,
            lineStyle: { color: '#e6a23c', type: 'dashed' },
            label: { color: '#e6a23c', formatter: '当前基准 ¥' + fmtMoney(trendModel.value.base_price) },
            data: [{ yAxis: Number(trendModel.value.base_price) }]
          }
        : undefined
    }]
  })
}

// 主题切换时重绘走势图配色
const onTrendTheme = () => trendVisible.value && renderTrend()
onMounted(() => window.addEventListener('theme-changed', onTrendTheme))
onBeforeUnmount(() => {
  window.removeEventListener('theme-changed', onTrendTheme)
  trendChart && trendChart.dispose()
})

onMounted(() => {
  loadTree()
  loadModels()
})
</script>

<style scoped>
.trend-box {
  position: relative;
  min-height: 300px;
}
.trend-chart {
  width: 100%;
  height: 300px;
}
.trend-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}
.catalog-wrap {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 14px;
  height: calc(100vh - 108px);
}
.tree-panel {
  overflow-y: auto;
}
.model-panel {
  overflow-y: auto;
}
.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 13px;
}
.tree-edit {
  cursor: pointer;
  color: #c0c4cc;
  font-size: 13px;
}
.tree-edit:hover {
  color: #409eff;
}
@media (max-width: 900px) {
  .catalog-wrap {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
