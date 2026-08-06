<template>
  <div class="order-reviews-page">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_id" placeholder="请输入订单号" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="searchForm.user_id" placeholder="用户ID" clearable style="width: 120px" />
      </el-form-item>
      <el-form-item label="评分">
        <el-select v-model="searchForm.rating" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="r in [5,4,3,2,1]" :key="r" :label="r + ' 星'" :value="r" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" style="width:100%" border>
      <el-table-column prop="order_id" label="订单号" width="160" />
      <el-table-column prop="user_name" label="用户" width="140" />
      <el-table-column prop="rating" label="评分" width="100" align="center">
        <template #default="{ row }">
          <el-rate :model-value="row.rating" disabled show-score />
        </template>
      </el-table-column>
      <el-table-column prop="comment" label="评价内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="图片" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewImages(row.images_list || [])" v-if="row.images_list && row.images_list.length">
            查看 ({{ row.images_list.length }})
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ row }">
          <el-button type="text" @click="openDetail(row)">详情</el-button>
          <el-button type="text" @click="openReply(row)">回复</el-button>
          <el-button type="text" style="color:#f56c6c" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10,20,50,100]"
      layout="total, sizes, prev, pager, next, jumper"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />

    <el-dialog v-model="imageDialogVisible" title="评价图片" width="800px">
      <el-image
        v-for="(img, idx) in currentImages"
        :key="idx"
        :src="getFullImageUrl(img)"
        :preview-src-list="currentImages.map(item => getFullImageUrl(item))"
        style="width:100%;height:420px;margin-bottom:10px"
        preview-teleported
      />
    </el-dialog>

    <el-dialog v-model="detailVisible" title="评价详情" width="700px">
      <el-descriptions border column="1" v-if="detail">
        <el-descriptions-item label="订单号">{{ detail.order_id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.user_name }} ({{ detail.user_phone }})</el-descriptions-item>
        <el-descriptions-item label="评分"><el-rate :model-value="detail.rating" disabled show-score /></el-descriptions-item>
        <el-descriptions-item label="内容">{{ detail.comment }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ detail.created_at }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="detail?.images_list?.length" class="detail-images">
        <div class="image-list">
          <el-image
            v-for="(img, idx) in detail.images_list"
            :key="idx"
            :src="getFullImageUrl(img)"
            :preview-src-list="detail.images_list.map(item => getFullImageUrl(item))"
            style="width:120px;height:120px;margin:6px"
            preview-teleported
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible=false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="replyVisible" title="回复评价" width="600px">
      <el-form :model="replyForm">
        <el-form-item label="回复内容">
          <el-input type="textarea" v-model="replyForm.content" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible=false">取消</el-button>
        <el-button type="primary" @click="submitReply">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMiniAdminReviews,
  getMiniAdminReviewDetail,
  replyMiniAdminReview,
  deleteMiniAdminReview
} from '@/api/miniAdmin'
import {
  getOrderReviews,
  getOrderReviewDetail,
  replyOrderReview,
  deleteOrderReview,
  exportOrderReviews
} from '@/api/repairReview'
import { getMediaUrl } from '@/utils/media'

const route = useRoute()
const isMiniAdminRoute = computed(() => route.path.startsWith('/mini-admin'))

const loading = ref(false)
const tableData = ref([])
const searchForm = reactive({ order_id: '', user_id: '', rating: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

const imageDialogVisible = ref(false)
const currentImages = ref([])

const detailVisible = ref(false)
const detail = ref(null)
const replyVisible = ref(false)
const replyForm = reactive({ id: null, content: '' })

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.order_id) params.order_id = searchForm.order_id
    if (searchForm.user_id) params.user_id = searchForm.user_id
    if (searchForm.rating) params.rating = searchForm.rating

    const loader = isMiniAdminRoute.value
      ? (query) => getMiniAdminReviews(query)
      : (query) => getOrderReviews(query.page, query.pageSize, params)
    const res = await loader(Object.assign({ page: pagination.page, pageSize: pagination.limit }, params))
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleReset = () => { searchForm.order_id = ''; searchForm.user_id = ''; searchForm.rating = ''; handleSearch() }
const handleCurrentChange = (page) => { pagination.page = page; loadData() }
const handleSizeChange = (size) => { pagination.limit = size; pagination.page = 1; loadData() }

const viewImages = (images) => { currentImages.value = images || []; imageDialogVisible.value = true }

const openDetail = async (row) => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminReviewDetail : getOrderReviewDetail
    const res = await loader(row.id)
    if (res.code === 200 || res.code === 0) {
      detail.value = res.data
      detailVisible.value = true
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载详情失败')
  }
}

const openReply = (row) => {
  replyForm.id = row.id
  replyForm.content = ''
  replyVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.content || !replyForm.content.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  try {
    const submitter = isMiniAdminRoute.value ? replyMiniAdminReview : replyOrderReview
    const res = await submitter(replyForm.id, replyForm.content)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('回复已保存')
      replyVisible.value = false
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('回复失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该评价吗？', '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const submitter = isMiniAdminRoute.value ? deleteMiniAdminReview : deleteOrderReview
    const res = await submitter(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('删除失败')
  }
}

const handleExport = () => {
  const params = {}
  if (searchForm.order_id) params.order_id = searchForm.order_id
  if (searchForm.user_id) params.user_id = searchForm.user_id
  if (searchForm.rating) params.rating = searchForm.rating
  const qs = new URLSearchParams(params).toString()
  const url = isMiniAdminRoute.value
    ? `/api/mini-admin/reviews/export${qs ? ('?' + qs) : ''}`
    : exportOrderReviews(params)
  // 触发下载
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const getFullImageUrl = (img) => {
  return getMediaUrl(img)
}

onMounted(() => { loadData() })
</script>

<style scoped>
.order-reviews-page { .search-form { margin-bottom: 16px } .el-pagination { margin-top: 16px; justify-content: flex-end } }
</style>
