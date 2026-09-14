<template>
  <div class="page-card" v-loading="loading">
    <div class="filter-bar">
      <el-select v-model="queryType" placeholder="平台类型" clearable style="width:140px">
        <el-option label="回收平台" value="recycle" />
        <el-option label="采购渠道" value="procurement" />
        <el-option label="比价参考" value="compare" />
      </el-select>
      <el-input v-model="keyword" placeholder="平台名称/说明" clearable style="width:200px" @keyup.enter="load" />
      <el-button type="primary" :icon="Search" @click="load">查询</el-button>
      <div style="flex:1"></div>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增平台</el-button>
    </div>

    <div class="platform-grid">
      <div v-for="p in list" :key="p.id" class="platform-card" :class="{ disabled: p.status !== 1 }">
        <div class="platform-head">
          <div class="platform-logo" :style="{ background: p.logo_color || '#5B9E8A' }">{{ p.logo_text || p.name[0] }}</div>
          <div style="flex:1">
            <div class="platform-name">
              {{ p.name }}
              <el-tag size="small" :type="typeTag(p.type)">{{ p.typeLabel }}</el-tag>
              <el-tag v-if="p.status !== 1" size="small" type="info">已停用</el-tag>
            </div>
            <div class="link-url" @click="jump(p)">{{ p.url || '未配置网址' }}</div>
          </div>
        </div>
        <div class="platform-desc">{{ p.description || '暂无说明' }}</div>
        <div class="platform-meta">
          <span v-if="p.service_mode"><el-icon><Van /></el-icon> {{ p.service_mode }}</span>
          <span v-if="p.settlement"><el-icon><Money /></el-icon> {{ p.settlement }}</span>
          <span v-if="p.commission_desc"><el-icon><Discount /></el-icon> {{ p.commission_desc }}</span>
        </div>
        <div class="platform-foot">
          <span class="click-count">跳转 {{ p.click_count }} 次</span>
          <div>
            <el-button size="small" type="primary" link @click="jump(p)">跳转平台</el-button>
            <el-button size="small" link @click="openDialog(p)">编辑</el-button>
            <el-button size="small" :type="p.status === 1 ? 'info' : 'success'" link @click="toggle(p)">
              {{ p.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" link @click="remove(p)">删除</el-button>
          </div>
        </div>
      </div>
      <el-empty v-if="list.length === 0" description="暂无平台数据" style="grid-column:1/-1" />
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑平台' : '新增平台'" width="520px">
      <el-form label-width="95px">
        <el-form-item label="平台名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="平台类型">
          <el-select v-model="form.type" style="width:200px">
            <el-option label="回收平台" value="recycle" />
            <el-option label="采购渠道" value="procurement" />
            <el-option label="比价参考" value="compare" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台网址"><el-input v-model="form.url" placeholder="https://..." /></el-form-item>
        <el-form-item label="字标/颜色">
          <el-input v-model="form.logoText" style="width:90px;margin-right:10px" />
          <el-color-picker v-model="form.logoColor" />
        </el-form-item>
        <el-form-item label="平台说明"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="服务方式"><el-input v-model="form.serviceMode" placeholder="上门/邮寄/到店" /></el-form-item>
        <el-form-item label="结算方式"><el-input v-model="form.settlement" placeholder="如 验机后打款" /></el-form-item>
        <el-form-item label="佣金费率"><el-input v-model="form.commissionDesc" placeholder="如 平台服务费1%" /></el-form-item>
        <el-form-item label="联系方式"><el-input v-model="form.contact" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" style="width:120px" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Van, Money, Discount } from '@element-plus/icons-vue'
import { getPlatforms, createPlatform, updatePlatform, deletePlatform, clickPlatform } from '../api'

const loading = ref(false)
const list = ref([])
const keyword = ref('')
const queryType = ref('')
const dialogVisible = ref(false)
const form = ref({})

const typeTag = (t) => ({ recycle: 'success', procurement: 'warning', compare: 'info' }[t] || 'info')

async function load() {
  loading.value = true
  try {
    const res = await getPlatforms({ type: queryType.value, keyword: keyword.value })
    list.value = res.data
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  form.value = row
    ? {
        id: row.id, name: row.name, url: row.url, type: row.type, logoText: row.logo_text,
        logoColor: row.logo_color, description: row.description, serviceMode: row.service_mode,
        settlement: row.settlement, commissionDesc: row.commission_desc, contact: row.contact,
        sortOrder: row.sort_order
      }
    : { id: null, name: '', url: '', type: 'recycle', logoText: '', logoColor: '#5B9E8A', description: '', serviceMode: '', settlement: '', commissionDesc: '', contact: '', sortOrder: 0 }
  dialogVisible.value = true
}

async function submit() {
  if (!form.value.name) return ElMessage.warning('请填写平台名称')
  if (form.value.id) {
    await updatePlatform(form.value.id, form.value)
  } else {
    await createPlatform(form.value)
  }
  ElMessage.success('已保存')
  dialogVisible.value = false
  load()
}

async function toggle(p) {
  await updatePlatform(p.id, { status: p.status === 1 ? 0 : 1 })
  ElMessage.success(p.status === 1 ? '已停用' : '已启用')
  load()
}

async function remove(p) {
  await ElMessageBox.confirm(`确定删除平台「${p.name}」？`, '提示', { type: 'warning' })
  await deletePlatform(p.id)
  ElMessage.success('已删除')
  load()
}

async function jump(p) {
  if (!p.url) return ElMessage.warning('该平台未配置网址')
  try {
    const res = await clickPlatform(p.id)
    window.open(res.data.url, '_blank', 'noopener')
    p.click_count += 1
  } catch (e) { /* 已提示 */ }
}

onMounted(load)
</script>

<style scoped>
.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
.platform-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.platform-card.disabled {
  opacity: 0.62;
}
.platform-head {
  display: flex;
  gap: 12px;
  align-items: center;
}
.platform-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.platform-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.platform-desc {
  font-size: 13px;
  color: #606266;
  min-height: 36px;
}
.platform-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}
.platform-meta span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.platform-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #ebeef5;
  padding-top: 8px;
}
</style>
