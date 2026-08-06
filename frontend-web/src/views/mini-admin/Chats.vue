<template>
  <div class="mini-page">
    <el-card shadow="never">
      <div class="page-header">
        <div>
          <h2>客服会话</h2>
          <p>查询 repair.chat_conversations / chat_messages，并支持人工接管备注与结束会话。</p>
        </div>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="会话ID / 用户ID / openid" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部">
            <el-option label="活跃" value="active" />
            <el-option label="已转人工" value="transferred" />
            <el-option label="已结束" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="id" label="会话ID" min-width="160" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="user_openid" label="OpenID" min-width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_message" label="最后一条消息" min-width="240" show-overflow-tooltip />
        <el-table-column prop="last_activity" label="最后活动" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="会话详情" width="1100px" destroy-on-close>
      <div class="detail-layout" v-loading="detailLoading">
        <div class="detail-side">
          <el-form :model="conversationForm" label-width="100px">
            <el-form-item label="会话ID">
              <el-input :model-value="conversationForm.id" disabled />
            </el-form-item>
            <el-form-item label="用户ID">
              <el-input :model-value="conversationForm.user_id" disabled />
            </el-form-item>
            <el-form-item label="OpenID">
              <el-input :model-value="conversationForm.user_openid" disabled />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="conversationForm.status" style="width: 100%">
                <el-option label="活跃" value="active" />
                <el-option label="已转人工" value="transferred" />
                <el-option label="已结束" value="completed" />
              </el-select>
            </el-form-item>
            <el-form-item label="结束原因">
              <el-input v-model="conversationForm.end_reason" placeholder="如：manual_close / timeout" />
            </el-form-item>
            <el-form-item label="会话摘要">
              <el-input v-model="conversationForm.summary" type="textarea" :rows="5" placeholder="填写人工处理摘要" />
            </el-form-item>
          </el-form>
        </div>

        <div class="detail-main">
          <div class="message-toolbar">
            <div class="message-count">消息数：{{ messages.length }}</div>
            <el-button type="primary" :loading="saving" @click="saveConversation">保存会话</el-button>
          </div>
          <div class="message-list">
            <div v-for="message in messages" :key="message.id" class="message-card">
              <div class="message-meta">
                <div>
                  <el-tag size="small" :type="senderTagType(message.sender_type)">
                    {{ senderText(message.sender_type) }}
                  </el-tag>
                  <span class="message-id">{{ message.id }}</span>
                </div>
                <div class="message-time">{{ message.created_at }}</div>
              </div>
              <div class="message-content">{{ message.content || '[空消息]' }}</div>
              <div class="message-extra">
                <span>类型：{{ message.message_type || 'text' }}</span>
                <span v-if="extractRemark(message)">备注：{{ extractRemark(message) }}</span>
                <el-button link type="primary" @click="remarkMessage(message)">备注</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMiniAdminChatDetail,
  getMiniAdminChats,
  remarkMiniAdminChatMessage,
  updateMiniAdminChat
} from '@/api/miniAdmin'

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const tableData = ref([])
const messages = ref([])

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const conversationForm = reactive({
  id: '',
  user_id: '',
  user_openid: '',
  status: 'active',
  end_reason: '',
  summary: ''
})

const resetConversation = () => {
  Object.assign(conversationForm, {
    id: '',
    user_id: '',
    user_openid: '',
    status: 'active',
    end_reason: '',
    summary: ''
  })
  messages.value = []
}

const statusText = (status) => ({
  active: '活跃',
  transferred: '已转人工',
  completed: '已结束'
}[status] || status || '-')

const statusTagType = (status) => ({
  active: 'success',
  transferred: 'warning',
  completed: 'info'
}[status] || 'info')

const senderText = (type) => ({
  user: '用户',
  ai: 'AI',
  human: '人工'
}[type] || type || '-')

const senderTagType = (type) => ({
  user: '',
  ai: 'warning',
  human: 'success'
}[type] || 'info')

const parseEntities = (entities) => {
  if (!entities) {
    return {}
  }
  if (typeof entities === 'object') {
    return entities
  }
  try {
    return JSON.parse(entities)
  } catch {
    return {}
  }
}

const extractRemark = (message) => parseEntities(message.entities).admin_remark || ''

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMiniAdminChats({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    })
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

const handleSizeChange = (pageSize) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  loadData()
}

const openDetail = async (row) => {
  dialogVisible.value = true
  detailLoading.value = true
  resetConversation()
  try {
    const res = await getMiniAdminChatDetail(row.id)
    const conversation = res.data?.conversation || {}
    Object.assign(conversationForm, {
      id: conversation.id || '',
      user_id: conversation.user_id || '',
      user_openid: conversation.user_openid || '',
      status: conversation.status || 'active',
      end_reason: conversation.end_reason || '',
      summary: conversation.summary || ''
    })
    messages.value = res.data?.messages || []
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

const saveConversation = async () => {
  saving.value = true
  try {
    await updateMiniAdminChat(conversationForm.id, {
      status: conversationForm.status,
      end_reason: conversationForm.end_reason,
      summary: conversationForm.summary
    })
    ElMessage.success('会话已更新')
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const remarkMessage = async (message) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入消息备注', '人工备注', {
      inputValue: extractRemark(message),
      confirmButtonText: '保存',
      cancelButtonText: '取消'
    })
    await remarkMiniAdminChatMessage(message.id, value)
    ElMessage.success('备注成功')
    await openDetail({ id: conversationForm.id })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '备注失败')
    }
  }
}

loadData()
</script>

<style scoped lang="scss">
.mini-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    p {
      margin: 8px 0 0;
      color: #64748b;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}

.detail-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.detail-side,
.detail-main {
  min-width: 0;
}

.message-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.message-list {
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.message-meta,
.message-extra {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 13px;
}

.message-content {
  margin: 10px 0;
  color: #0f172a;
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-id {
  margin-left: 8px;
}

@media (max-width: 960px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
