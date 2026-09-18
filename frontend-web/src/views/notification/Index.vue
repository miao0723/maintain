<template>
  <div class="notification-page">
    <el-card shadow="never" class="notification-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2>通知消息</h2>
            <span v-if="unreadCount > 0" class="unread-pill">
              {{ unreadCount > 99 ? '99+' : unreadCount }} 条未读
            </span>
          </div>
          <div class="header-right">
            <el-button type="primary" plain size="small" @click="handleMarkAllAsRead" :disabled="unreadCount === 0">
              <el-icon style="margin-right:4px"><Checked /></el-icon>
              全部标为已读
            </el-button>
            <el-button size="small" @click="fetchNotifications">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="notification-tabs">
        <el-tab-pane :label="`全部通知${total ? ` (${total})` : ''}`" name="all">
          <el-empty v-if="allNotifications.length === 0" description="暂无通知" />
          <div v-else class="notification-list">
            <div
              v-for="notification in allNotifications"
              :key="notification.id"
              :class="['notification-item', { unread: !notification.is_read }]"
              @click="openDetail(notification)"
            >
              <div :class="['notification-icon', typeColor(notification.type)]">
                <el-icon>
                  <component :is="noticeIcon(notification.type)" />
                </el-icon>
                <span v-if="!notification.is_read" class="icon-dot"></span>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">
                    <el-tag v-if="noticeTypeText(notification)" size="small" effect="plain" class="type-tag">
                      {{ noticeTypeText(notification) }}
                    </el-tag>
                    <el-tag
                      v-if="notification.priority >= 3"
                      :type="notification.priority >= 4 ? 'danger' : 'warning'"
                      size="small"
                      effect="dark"
                      class="priority-tag"
                    >
                      {{ noticePriorityText(notification) }}
                    </el-tag>
                    {{ notification.title }}
                  </span>
                  <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
                </div>
                <p class="notification-message">{{ notification.content }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="`未读通知${unreadCount ? ` (${unreadCount})` : ''}`" name="unread">
          <el-empty v-if="unreadNotifications.length === 0" description="暂无未读通知" />
          <div v-else class="notification-list">
            <div
              v-for="notification in unreadNotifications"
              :key="notification.id"
              class="notification-item unread"
              @click="openDetail(notification)"
            >
              <div :class="['notification-icon', typeColor(notification.type)]">
                <el-icon>
                  <component :is="noticeIcon(notification.type)" />
                </el-icon>
                <span class="icon-dot"></span>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">
                    <el-tag v-if="noticeTypeText(notification)" size="small" effect="plain" class="type-tag">
                      {{ noticeTypeText(notification) }}
                    </el-tag>
                    <el-tag
                      v-if="notification.priority >= 3"
                      :type="notification.priority >= 4 ? 'danger' : 'warning'"
                      size="small"
                      effect="dark"
                      class="priority-tag"
                    >
                      {{ noticePriorityText(notification) }}
                    </el-tag>
                    {{ notification.title }}
                  </span>
                  <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
                </div>
                <p class="notification-message">{{ notification.content }}</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 通知详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="通知详情"
      width="560px"
      :close-on-click-modal="true"
      @closed="onDetailClosed"
    >
      <div v-if="current" class="notification-detail">
        <div class="detail-header">
          <div :class="['detail-icon', typeColor(current.type)]">
            <el-icon><component :is="noticeIcon(current.type)" /></el-icon>
          </div>
          <div class="detail-head-text">
            <div class="detail-title">{{ current.title }}</div>
            <div class="detail-meta">
              <el-tag v-if="noticeTypeText(current)" size="small" effect="plain">{{ noticeTypeText(current) }}</el-tag>
              <el-tag
                :type="current.priority >= 4 ? 'danger' : current.priority >= 3 ? 'warning' : 'info'"
                size="small"
                effect="dark"
              >{{ noticePriorityText(current) }}</el-tag>
              <el-tag :type="current.is_read ? 'success' : 'danger'" size="small">
                {{ current.is_read ? '已读' : '未读' }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">通知时间</span>
            <span class="detail-value">{{ formatFullTime(current.created_at) }}</span>
          </div>
          <div v-if="current.is_read && current.read_at" class="detail-row">
            <span class="detail-label">已读时间</span>
            <span class="detail-value">{{ formatFullTime(current.read_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">通知内容</span>
            <span class="detail-value detail-content">{{ current.content }}</span>
          </div>
          <div v-if="relatedInfo" class="detail-row">
            <span class="detail-label">关联信息</span>
            <span class="detail-value">
              {{ relatedInfo.text }}
              <el-button
                v-if="relatedInfo.route"
                type="primary"
                link
                size="small"
                @click="goRelated(relatedInfo.route)"
              >查看 &raquo;</el-button>
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="current"
          :type="current.is_read ? 'warning' : 'success'"
          @click="toggleRead(current)"
        >
          {{ current.is_read ? '标为未读' : '标为已读' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Document, Tickets, Monitor, Box, View, Tools, Setting, Refresh, Checked } from '@element-plus/icons-vue'
import { getNotifications, markAsRead, markAllAsRead } from '@/api/notification'

const router = useRouter()

// 按通知类型着色：订单蓝 / 库存橙 / 维修绿 / 知识紫 / 系统灰
const typeColorMap = {
  order: 'c-blue', work_order: 'c-blue', repair: 'c-green', device: 'c-cyan',
  stock: 'c-orange', maintenance: 'c-orange', inspection: 'c-orange',
  knowledge: 'c-purple', contract: 'c-purple', system: 'c-gray'
}
const typeColor = (type) => typeColorMap[type] || 'c-blue'

const iconMap = {
  order: Tickets,
  knowledge: Document,
  device: Monitor,
  stock: Box,
  contract: Document,
  repair: Tools,
  maintenance: Setting,
  inspection: View,
  system: Bell
}
const noticeIcon = (type) => iconMap[type] || Bell

// 类型文本（优先用后端返回，否则本地兜底）
const typeTextMap = {
  work_order: '工单',
  work_order_assigned: '工单指派',
  work_order_accepted: '工单接受',
  work_order_started: '工单开始',
  work_order_completed: '工单完成',
  work_order_verified: '工单验收',
  work_order_closed: '工单关闭',
  stock_alert: '库存预警',
  stock_out: '零库存',
  stock_low: '低库存',
  maintenance_due: '保养到期',
  inspection_overdue: '巡检逾期',
  order: '订单',
  knowledge: '知识库',
  device: '设备',
  contract: '合同',
  repair: '维修',
  system: '系统'
}
const noticeTypeText = (n) => n.type_text || typeTextMap[n.type] || ''

const priorityTextMap = { 1: '低', 2: '普通', 3: '高', 4: '紧急' }
const noticePriorityText = (n) => n.priority_text || priorityTextMap[n.priority] || '普通'

const loading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const allNotifications = ref([])

// 详情弹窗状态
const detailVisible = ref(false)
const current = ref(null)

const unreadCount = computed(() => allNotifications.value.filter(n => !n.is_read).length)
const unreadNotifications = computed(() => allNotifications.value.filter(n => !n.is_read))

// 关联信息映射：根据 related_type 构造可读文本与跳转路由
const relatedInfo = computed(() => {
  const n = current.value
  if (!n || !n.related_type || !n.related_id) return null
  const id = n.related_id
  const map = {
    repair_orders: { text: `维修订单 #${id}`, route: { name: 'MiniprogramOrders' } },
    order: { text: `订单 #${id}`, route: { name: 'MiniprogramOrders' } },
    work_order: { text: `工单 #${id}`, route: { name: 'ProgressList' } },
    contract: { text: `合同 #${id}`, route: { name: 'ContractList' } },
    spare_part: { text: `配件 #${id}`, route: { name: 'Parts' } },
    device: { text: `设备 #${id}`, route: { name: 'Devices' } },
    maintenance_plan: { text: `保养计划 #${id}`, route: { name: 'Maintenance' } },
    knowledge: { text: `知识库 #${id}`, route: { name: 'KbCollections' } },
  }
  const info = map[n.related_type]
  return info ? { ...info, text: info.text } : { text: `${n.related_type} #${id}` }
})

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotifications({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      const data = res.data || {}
      allNotifications.value = data.items || data.list || []
      total.value = data.total || 0
    } else {
      ElMessage.error(res.message || '获取通知失败')
    }
  } catch (error) {
    console.error('获取通知失败:', error)
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

const openDetail = (notification) => {
  current.value = notification
  detailVisible.value = true
  // 打开详情时若为未读，自动标为已读
  if (!notification.is_read) {
    toggleRead(notification, true)
  }
}

const onDetailClosed = () => {
  current.value = null
}

const toggleRead = async (notification, silent = false) => {
  const targetRead = notification.is_read ? 0 : 1
  try {
    const res = await markAsRead(notification.id)
    if (res.code === 200) {
      notification.is_read = targetRead === 1
      if (!silent) {
        ElMessage.success(targetRead === 1 ? '已标为已读' : '已标为未读')
      }
    } else if (!silent) {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('标记失败:', error)
    if (!silent) ElMessage.error('操作失败')
  }
}

const goRelated = (route) => {
  detailVisible.value = false
  router.push(route)
}

const handleMarkAllAsRead = async () => {
  try {
    const res = await markAllAsRead()
    if (res.code === 200) {
      ElMessage.success('已全部标记为已读')
      fetchNotifications()
    } else {
      ElMessage.error(res.message || '标记失败')
    }
  } catch (error) {
    console.error('标记失败:', error)
    ElMessage.error('标记失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchNotifications()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchNotifications()
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time.replace(/-/g, '/'))
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatFullTime = (time) => {
  if (!time) return ''
  const date = new Date(time.replace(/-/g, '/'))
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style lang="scss" scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-page {
  padding: 20px;
  animation: slideIn 0.4s ease-out;

  .notification-card {
    :deep(.el-card__header) {
      padding: 16px 20px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        position: relative;
        font-size: 17px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin: 0;
        padding-left: 12px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          border-radius: 2px;
          background: linear-gradient(180deg, #409eff, #67c23a);
        }
      }

      .unread-pill {
        font-size: 12px;
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.1);
        border: 1px solid rgba(245, 108, 108, 0.28);
        border-radius: 999px;
        padding: 2px 10px;
        line-height: 18px;
      }
    }

    .header-right {
      display: flex;
      gap: 10px;
    }
  }

  .notification-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }

    :deep(.el-tabs__item) {
      font-weight: 500;
    }

    .notification-list {
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;
      padding-right: 4px;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    padding: 14px 16px;
    margin-bottom: 10px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-left: 3px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;

    &:hover {
      background: var(--el-fill-color-light);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
    }

    &.unread {
      border-left-color: #409eff;
      background: rgba(64, 158, 255, 0.04);

      .notification-title {
        font-weight: 600;
      }
    }

    .notification-icon {
      position: relative;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      margin-right: 14px;
      font-size: 19px;

      &.c-blue   { background: rgba(64, 158, 255, 0.12);  color: #409eff; }
      &.c-green  { background: rgba(103, 194, 58, 0.12);  color: #67c23a; }
      &.c-orange { background: rgba(230, 162, 60, 0.12);  color: #e6a23c; }
      &.c-purple { background: rgba(142, 91, 140, 0.12);  color: #9a6ecc; }
      &.c-cyan   { background: rgba(34, 184, 207, 0.12);  color: #22b8cf; }
      &.c-gray   { background: rgba(144, 147, 153, 0.14); color: #909399; }

      .icon-dot {
        position: absolute;
        top: -3px;
        right: -3px;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #f56c6c;
        border: 2px solid var(--el-bg-color);
      }
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;

        .notification-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;

          .type-tag {
            flex-shrink: 0;
          }
        }

        .notification-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }
      }

      .notification-message {
        font-size: 13px;
        color: var(--el-text-color-regular);
        line-height: 1.6;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}

// 详情弹窗
.notification-detail {
  .detail-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;

    .detail-icon {
      flex-shrink: 0;
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      font-size: 22px;

      &.c-blue   { background: rgba(64, 158, 255, 0.12);  color: #409eff; }
      &.c-green  { background: rgba(103, 194, 58, 0.12);  color: #67c23a; }
      &.c-orange { background: rgba(230, 162, 60, 0.12);  color: #e6a23c; }
      &.c-purple { background: rgba(142, 91, 140, 0.12);  color: #9a6ecc; }
      &.c-cyan   { background: rgba(34, 184, 207, 0.12);  color: #22b8cf; }
      &.c-gray   { background: rgba(144, 147, 153, 0.14); color: #909399; }
    }

    .detail-head-text {
      flex: 1;
      min-width: 0;

      .detail-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        line-height: 1.5;
      }

      .detail-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
  }

  .detail-body {
    .detail-row {
      display: flex;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px dashed var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        flex-shrink: 0;
        width: 72px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }

      .detail-value {
        flex: 1;
        color: var(--el-text-color-primary);
        font-size: 14px;
        line-height: 1.7;
        word-break: break-word;

        &.detail-content {
          white-space: pre-wrap;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .notification-page {
    padding: 15px;

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .header-right {
        width: 100%;
      }
    }

    .notification-list {
      min-height: 300px;
    }
  }
}

@media (max-width: 480px) {
  .notification-page {
    padding: 10px;

    .notification-item {
      flex-direction: column;
      padding: 12px;

      .notification-icon {
        margin-right: 0;
        margin-bottom: 12px;
      }
    }
  }
}
</style>
