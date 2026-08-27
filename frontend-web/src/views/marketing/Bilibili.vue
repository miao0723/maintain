<template>
  <div class="page">
    <div class="hero">
      <div class="hero-content">
        <p>B站获客</p>
        <h2>长视频 · 稿件管理 · 粉丝运营</h2>
        <span>创建视频/专栏后可直接保存到素材库，素材库已预留发布入口。</span>
      </div>
      <div class="stats">
        <div class="box"><small>素材总数</small><b>{{ tableData.length }}</b></div>
        <div class="box"><small>总播放量</small><b>{{ formatNumber(totalViews) }}</b></div>
        <div class="box"><small>已发布</small><b>{{ publishedCount }}</b></div>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="素材库" name="library">
        <el-card shadow="never">
          <template #header>
            <div class="hd wrap">
              <span>B站素材库</span>
              <div class="actions">
                <el-input v-model="searchForm.title" placeholder="搜索标题 / 描述 / 标签" clearable @keyup.enter="handleSearch" />
                <el-select v-model="searchForm.status" clearable @change="handleSearch">
                  <el-option label="全部状态" value="" />
                  <el-option label="已发布" :value="1" />
                  <el-option label="待发布" :value="0" />
                </el-select>
                <el-button @click="handleSearch">搜索</el-button>
              </div>
            </div>
          </template>
          <el-table :data="tableData" v-loading="loading" border stripe>
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="video_url" label="视频链接" min-width="140">
              <template #default="{ row }">
                <el-link v-if="row.video_url" :href="row.video_url" target="_blank" type="primary">打开视频</el-link>
                <span v-else>暂无</span>
              </template>
            </el-table-column>
            <el-table-column prop="cover" label="封面" width="100">
              <template #default="{ row }">
                <el-image v-if="row.cover" :src="row.cover" fit="cover" style="width: 60px; height: 40px; border-radius: 4px;" preview-teleported :preview-src-list="[row.cover]" />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="tags" label="标签" min-width="150">
              <template #default="{ row }">
                <div class="tags">
                  <el-tag v-for="tag in normalizeTags(row.tags)" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="Number(row.status)===1?'success':'warning'" size="small">{{ Number(row.status)===1?'已发布':'待发布' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <a class="text-btn text-primary" @click="handleEdit(row)">编辑</a>
                <el-button link type="success" size="small" @click="handlePublish(row)">发布</el-button>
                <el-popconfirm title="确定删除?" @confirm="handleDelete(row)">
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10,20,50,100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchData"
            @current-change="fetchData"
          />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="稿件数据" name="analysis">
        <div class="grid four">
          <div class="box"><small>累计播放</small><b>{{ formatNumber(totalViews) }}</b></div>
          <div class="box"><small>累计点赞</small><b>{{ formatNumber(totalLikes) }}</b></div>
          <div class="box"><small>累计投币</small><b>{{ formatNumber(totalComments) }}</b></div>
          <div class="box"><small>累计三连</small><b>{{ formatNumber(totalShares) }}</b></div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑素材' : '新增素材'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="视频链接" prop="video_url">
          <el-input v-model="form.video_url" placeholder="请输入视频链接" />
        </el-form-item>
        <el-form-item label="封面图">
          <SingleImageUpload v-model="form.cover" placeholder="上传封面图" />
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入视频描述" />
        </el-form-item>
        <el-form-item label="话题标签">
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">已发布</el-radio>
            <el-radio :value="0">待发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDouyinList, createDouyin, updateDouyin, deleteDouyin, publishBilibili, getBilibiliPublishStatus } from '@/api/marketing'
import SingleImageUpload from '@/components/SingleImageUpload.vue'

const activeTab = ref('library')
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const tableData = ref([])

const searchForm = reactive({ title: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const form = reactive({ id: null, title: '', video_url: '', cover: '', description: '', tags: '', status: 0 })

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  video_url: [{ required: true, message: '请输入视频链接', trigger: 'blur' }]
}

const formatNumber = (n) => {
  const v = Number(n || 0)
  return v >= 10000 ? `${(v / 10000).toFixed(1)}万` : `${v}`
}

const normalizeTags = (t) => String(t || '').split(/[，,]/).map(v => v.trim()).filter(Boolean)

const totalViews = computed(() => tableData.value.reduce((s, i) => s + Number(i.views || 0), 0))
const totalLikes = computed(() => tableData.value.reduce((s, i) => s + Number(i.likes || 0), 0))
const totalComments = computed(() => tableData.value.reduce((s, i) => s + Number(i.comments || 0), 0))
const totalShares = computed(() => tableData.value.reduce((s, i) => s + Number(i.shares || 0), 0))
const publishedCount = computed(() => tableData.value.filter(i => Number(i.status) === 1).length)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDouyinList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      title: searchForm.title,
      keyword: searchForm.title,
      status: searchForm.status
    })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleEdit = (row) => {
  Object.assign(form, row)
  isEdit.value = true
  dialogVisible.value = true
}

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布到B站吗？', '提示', { type: 'warning' })
    const res = await publishBilibili(row.id)
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(res.message || '发布任务已提交')
      // 轮询发布状态
      pollPublishStatus(row.id)
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('发布失败')
    }
  }
}

const pollPublishStatus = async (id) => {
  let count = 0
  const check = async () => {
    try {
      const res = await getBilibiliPublishStatus(id)
      const st = res.data?.status
      if (st === 'success') {
        ElMessage.success('发布成功')
        fetchData()
      } else if (st === 'failed' || st === 'error') {
        ElMessage.error(res.data?.message || '发布失败')
      } else if (count >= 150) {
        ElMessage.warning('发布超时，请稍后刷新查看')
      } else {
        count++
        setTimeout(check, 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }
  setTimeout(check, 2000)
}

const handleDelete = async (row) => {
  try {
    await deleteDouyin(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    isEdit.value ? await updateDouyin(form.id, form) : await createDouyin(form)
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchData)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f6f8fc;
  color: #24324a;
}

.hero, .box, :deep(.el-card) {
  background: #fff;
  border: 1px solid #e6ebf5;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(34, 62, 120, .08);
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  padding: 28px;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(0, 161, 214, 0.1), rgba(0, 198, 255, 0.05));
  border-radius: 50%;
}

.hero .hero-content {
  position: relative;
  z-index: 1;
}

.hero p {
  font-size: 14px;
  color: #00a1d6;
  font-weight: 600;
  margin: 0 0 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.hero h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  background: linear-gradient(135deg, #24324a, #4a5568);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero span {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.stats, .four {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.four {
  grid-template-columns: repeat(4, 1fr);
}

.box {
  padding: 18px;
  position: relative;
  transition: transform .2s, box-shadow .2s;
}

.box:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(34, 62, 120, .12);
}

.box small {
  font-size: 13px;
  color: #8c9ab3;
  font-weight: 500;
}

.box b {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: #24324a;
}

.box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #00a1d6, #00c8ff);
  border-radius: 20px 0 0 20px;
}

.box:nth-child(2)::before {
  background: linear-gradient(180deg, #fb7299, #fc9dbb);
}

.box:nth-child(3)::before {
  background: linear-gradient(180deg, #ff6b6b, #ff8e8e);
}

.grid {
  display: grid;
  gap: 20px;
}

.hd, .wrap, .actions, .tags {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.tags :deep(.el-tag) {
  min-width: 6em;
  justify-content: center;
}

.hd {
  font-weight: 600;
  font-size: 15px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #edf1f7;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  --el-table-border-color: #e8eef7;
  --el-table-header-bg-color: #f8fbff;
  --el-table-row-hover-bg-color: #f6faff;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 600;
  color: #24324a;
}

:deep(.el-pagination) {
  margin-top: 20px;
  justify-content: flex-end;
}

:deep(.el-pagination .el-pager li) {
  background: #fff;
  border: 1px solid #d9e3f0;
  color: #24324a;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #00a1d6;
}

:deep(.el-pagination .el-pager li.is-active) {
  background: #00a1d6;
  border-color: #00a1d6;
  color: #fff;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: #fff;
  border: 1px solid #d9e3f0;
  color: #24324a;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  color: #00a1d6;
}

:deep(.el-pagination__total) {
  color: #666;
}

:deep(.el-pagination__sizes) {
  color: #666;
}

:deep(.el-pagination__jump) {
  color: #666;
}

:deep(.el-button--primary) {
  background: #00a1d6;
  border-color: #00a1d6;
}

:deep(.el-button--primary:hover) {
  background: #00b5e5;
  border-color: #00b5e5;
}

:deep(.el-tabs__item.is-active) {
  color: #00a1d6;
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background: #00a1d6;
}

@media (max-width: 1280px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .stats, .four {
    grid-template-columns: repeat(2, 1fr);
  }
}
/* 清除操作按钮的所有默认样式 */
:deep(.el-button--link),
:deep(.el-button.link),
:deep(.el-button--link:focus),
:deep(.el-button.link:focus),
:deep(.el-button--link:active),
:deep(.el-button.link:active),
:deep(.el-button--link.is-focus),
:deep(.el-button.link.is-focus) {
  background: transparent !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 2px 4px !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}
:deep(.el-button--link.type-primary),
:deep(.el-button--link[type="primary"]),
:deep(.el-button.link.type-primary),
:deep(.el-button.link[type="primary"]) {
  color: #00a1d6 !important;
}
:deep(.el-button--link.type-success),
:deep(.el-button--link[type="success"]),
:deep(.el-button.link.type-success),
:deep(.el-button.link[type="success"]) {
  color: #67c23a !important;
}
:deep(.el-button--link.type-warning),
:deep(.el-button--link[type="warning"]),
:deep(.el-button.link.type-warning),
:deep(.el-button.link[type="warning"]) {
  color: #e6a23c !important;
}
:deep(.el-button--link.type-danger),
:deep(.el-button--link[type="danger"]),
:deep(.el-button.link.type-danger),
:deep(.el-button.link[type="danger"]) {
  color: #f56c6c !important;
}
:deep(.el-button--link.type-info),
:deep(.el-button--link[type="info"]),
:deep(.el-button.link.type-info),
:deep(.el-button.link[type="info"]) {
  color: #909399 !important;
}
:deep(.el-button--link:hover),
:deep(.el-button.link:hover) {
  background: transparent !important;
  text-decoration: none !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
:deep(.el-button--link.is-disabled),
:deep(.el-button--link[disabled]),
:deep(.el-button.link.is-disabled),
:deep(.el-button.link[disabled]) {
  background: transparent !important;
  color: #c0c4cc !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
</style>