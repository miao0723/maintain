<template>
  <div v-loading="loading">
    <div class="page-card">
      <div class="table-toolbar">
        <span class="card-title">操作日志</span>
        <span class="text-muted">记录后台全部写操作（登录 / 报价 / 调价 / 配置），供审计追溯</span>
      </div>
      <div class="filter-bar">
        <el-select v-model="query.module" placeholder="全部模块" clearable style="width:150px" @change="loadList(1)">
          <el-option v-for="m in moduleOptions" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="搜索操作人 / 操作内容"
          clearable
          style="width:220px"
          @keyup.enter="loadList(1)"
          @clear="loadList(1)"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width:260px"
          @change="loadList(1)"
        />
        <el-button type="primary" @click="loadList(1)">
          <el-icon style="margin-right:4px"><Search /></el-icon>查询
        </el-button>
        <el-button @click="resetQuery">重置</el-button>
        <span class="text-muted" style="margin-left:auto">记录后台全部写操作，供审计追溯</span>
      </div>

      <el-table :data="list" size="default">
        <el-table-column prop="created_at" label="时间" width="170" />
        <el-table-column prop="admin_name" label="操作人" width="120" show-overflow-tooltip />
        <el-table-column label="模块" width="100">
          <template #default="{ row }">
            <el-tag :type="moduleTag(row.module)" size="small">{{ moduleLabel(row.module) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="130" show-overflow-tooltip />
        <el-table-column prop="detail" label="内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="140" show-overflow-tooltip />
      </el-table>

      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList()"
          @size-change="loadList(1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getOpLogs } from '../api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dateRange = ref(null)
const query = ref({ module: '', keyword: '', startDate: '', endDate: '', page: 1, pageSize: 20 })

const moduleOptions = [
  { value: 'order', label: '回收订单' },
  { value: 'catalog', label: '设备配价库' },
  { value: 'platform', label: '回收平台' },
  { value: 'link', label: '采购链接' },
  { value: 'setting', label: '系统设置' },
  { value: 'auth', label: '登录认证' }
]
const moduleLabel = (m) => moduleOptions.find((o) => o.value === m)?.label || m
const moduleTag = (m) =>
  ({ order: 'primary', catalog: 'success', platform: 'warning', link: 'warning', setting: 'info', auth: 'danger' }[m] || 'info')

async function loadList(page) {
  if (page) query.value.page = page
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value || ['', '']
    const res = await getOpLogs({
      ...query.value,
      startDate: startDate || '',
      endDate: endDate || ''
    })
    list.value = res.data.list || []
    total.value = Number(res.data.total) || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.value = { module: '', keyword: '', startDate: '', endDate: '', page: 1, pageSize: 20 }
  dateRange.value = null
  loadList(1)
}

onMounted(() => loadList(1))
</script>
