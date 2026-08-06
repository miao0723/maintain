<template>
  <div class="mini-page">
    <el-alert :title="title" type="info" :closable="false" style="margin-bottom: 16px" />
    <el-table :data="tableData" v-loading="loading" border>
      <el-table-column
        v-for="column in columns"
        :key="column"
        :prop="column"
        :label="column"
        min-width="140"
        show-overflow-tooltip
      />
    </el-table>
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="loadData"
      @size-change="loadData"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getMiniAdminAddresses,
  getMiniAdminUnits,
  getMiniAdminBrands,
  getMiniAdminDeviceTypes,
  getMiniAdminChats,
  getMiniAdminPayments,
  getMiniAdminConfigs,
  getMiniAdminSyncLogs
} from '@/api/miniAdmin'

const route = useRoute()
const loading = ref(false)
const tableData = ref([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const configMap = {
  addresses: { title: '地址管理', loader: getMiniAdminAddresses },
  units: { title: '单位管理', loader: getMiniAdminUnits },
  brands: { title: '品牌管理', loader: getMiniAdminBrands },
  'device-types': { title: '设备类型', loader: getMiniAdminDeviceTypes },
  chats: { title: '客服会话', loader: getMiniAdminChats },
  payments: { title: '支付记录', loader: getMiniAdminPayments },
  configs: { title: '系统配置', loader: getMiniAdminConfigs },
  'sync-logs': { title: '同步日志', loader: getMiniAdminSyncLogs }
}

const pageConfig = computed(() => configMap[route.meta.resource] || { title: '列表页', loader: async () => ({ data: { items: [], total: 0 } }) })
const title = computed(() => pageConfig.value.title)
const columns = computed(() => {
  const first = tableData.value[0]
  return first ? Object.keys(first).slice(0, 8) : []
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await pageConfig.value.loader({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    tableData.value = res.data?.items || []
    pagination.value.total = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.mini-page {
  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
