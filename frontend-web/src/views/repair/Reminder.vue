<template>
  <div class="reminder-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon-box">
          <el-icon size="24"><Bell /></el-icon>
        </div>
        <div class="header-text">
          <h2 class="page-title">维修超时提醒</h2>
          <p class="page-subtitle">维修天数大于设定天数且未完成的订单（数据来自小程序）</p>
        </div>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card shadow="hover" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号" class="form-item">
          <el-input
            v-model="searchForm.order_id"
            placeholder="请输入订单号"
            clearable
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="订单状态" class="form-item">
          <el-select v-model="searchForm.status" placeholder="全部" clearable class="search-select">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="维修中" value="processing" />
            <el-option label="待验收" value="review" />
          </el-select>
        </el-form-item>
        <el-form-item label="超时天数≥" class="form-item">
          <el-input-number v-model="searchForm.days" :min="1" :max="60" controls-position="right" />
        </el-form-item>
        <el-form-item class="form-item btn-group">
          <el-button type="primary" @click="handleSearch" class="btn-search">查询</el-button>
          <el-button @click="handleReset" class="btn-reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover" class="table-card">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        :title="`共 ${pagination.total} 个超时未完成订单`"
        description="以下订单已维修超过设定天数仍未完成，请尽快跟进或发送提醒给管理员。"
        style="margin-bottom: 16px"
      />
      <el-table
        :data="tableData"
        stripe
        v-loading="loading"
        class="data-table"
      >
        <el-table-column prop="order_id" label="订单号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="user_name" label="客户" min-width="110" show-overflow-tooltip />
        <el-table-column prop="user_phone" label="手机号" min-width="130" />
        <el-table-column prop="device_model" label="设备型号" min-width="160" show-overflow-tooltip />
        <el-table-column prop="brand_name" label="品牌" min-width="110" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="140" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" min-width="160" />
        <el-table-column prop="repair_days" label="已维修天数" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="danger" effect="plain">{{ row.repair_days }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button link type="warning" size="small" @click="handleSendReminder(row)">发送提醒</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          class="pagination"
        />
      </div>
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px" class="form-dialog">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="订单号" :span="2">{{ detailData.order_id }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detailData.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ detailData.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ detailData.brand_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)" size="small" round>{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="进度">{{ detailData.progress || 0 }}%</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ detailData.created_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="已维修天数" :span="2">
          <el-tag type="danger" effect="plain">{{ detailData.repair_days }} 天（未完成）</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="warning" @click="handleSendReminder(detailData)">发送提醒</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 发送提醒对话框 -->
    <el-dialog v-model="reminderVisible" title="发送维修超时提醒" width="640px" class="form-dialog">
      <el-form :model="reminderForm" label-width="92px" v-loading="reminderLoading">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          :title="`订单 ${reminderForm.order_id} · 已维修 ${reminderForm.repair_days} 天`"
          style="margin-bottom: 16px"
        />
        <el-form-item label="收件人">
          <el-input
            v-model="reminderForm.to"
            placeholder="留空则使用系统默认邮箱（.env 的 toaddrs）"
            clearable
          />
        </el-form-item>
        <el-form-item label="邮件主题" required>
          <el-input v-model="reminderForm.subject" placeholder="邮件主题" />
        </el-form-item>
        <el-form-item label="发送格式">
          <el-radio-group v-model="reminderForm.format">
            <el-radio value="text">纯文本</el-radio>
            <el-radio value="html">富文本(HTML)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒内容">
          <el-input
            v-model="reminderForm.message"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="请填写需要告知管理员的提醒内容，将随订单信息一并发出"
          />
        </el-form-item>
        <el-form-item label="邮件预览">
          <div class="mail-preview">
            <div class="mail-preview-title">主题：{{ reminderForm.subject || '—' }}</div>
            <div class="mail-preview-meta">
              <span>收件人：{{ reminderForm.to || '系统默认邮箱' }}</span>
              <span>格式：{{ reminderForm.format === 'html' ? '富文本' : '纯文本' }}</span>
            </div>
            <div class="mail-preview-body">
              <div>订单号：{{ reminderForm.order_id }}</div>
              <div>客户：{{ reminderForm.user_name }}（{{ reminderForm.user_phone }}）</div>
              <div>设备：{{ reminderForm.device_model }} {{ reminderForm.brand_name }}</div>
              <div>当前状态：{{ getStatusText(reminderForm.status) }}</div>
              <div>维修进度：{{ reminderForm.progress }}%</div>
              <div>下单时间：{{ reminderForm.created_at }}</div>
              <div>已维修天数：{{ reminderForm.repair_days }} 天</div>
              <div v-if="reminderForm.message" class="mail-preview-admin">
                管理员提醒：{{ reminderForm.message }}
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reminderVisible = false">取消</el-button>
          <el-button type="warning" :loading="reminderLoading" @click="submitReminder">发送提醒</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import {
  getOverdueRepairOrders,
  sendOrderRepairReminder
} from '@/api/repairReminder'

const loading = ref(false)
const detailVisible = ref(false)
const detailData = ref(null)
const reminderVisible = ref(false)
const reminderLoading = ref(false)
const reminderForm = reactive({
  id: null,
  order_id: '',
  user_name: '',
  user_phone: '',
  device_model: '',
  brand_name: '',
  status: '',
  progress: 0,
  created_at: '',
  repair_days: 0,
  to: '',
  subject: '',
  message: '',
  format: 'text'
})

const searchForm = reactive({
  order_id: '',
  status: '',
  days: 3
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const getStatusType = (status) => {
  const map = {
    pending: 'info', quoted: 'warning', confirmed: 'primary',
    processing: 'warning', review: 'primary', completed: 'success', cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理', quoted: '待确认报价', confirmed: '已确认报价',
    processing: '维修中', review: '待验收', completed: '已完成', cancelled: '已取消'
  }
  return map[status] || status
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      days: searchForm.days
    }
    if (searchForm.order_id) params.order_id = searchForm.order_id
    if (searchForm.status) params.status = searchForm.status

    const res = await getOverdueRepairOrders(params)
    if (res.code === 200 || res.code === 0) {
      const data = res.data || {}
      tableData.value = data.list || data.items || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    console.error('获取超时订单提醒失败', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.order_id = ''
  searchForm.status = ''
  searchForm.days = 3
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleView = (row) => {
  detailData.value = row
  detailVisible.value = true
}

const handleSendReminder = (row) => {
  if (!row || !row.id) return
  reminderForm.id = row.id
  reminderForm.order_id = row.order_id
  reminderForm.user_name = row.user_name
  reminderForm.user_phone = row.user_phone
  reminderForm.device_model = row.device_model
  reminderForm.brand_name = row.brand_name
  reminderForm.status = row.status
  reminderForm.progress = row.progress || 0
  reminderForm.created_at = row.created_at
  reminderForm.repair_days = row.repair_days
  reminderForm.to = ''
  reminderForm.message = ''
  reminderForm.format = 'text'
  reminderForm.subject = `[维修超时提醒] 订单 ${row.order_id} 已维修 ${row.repair_days} 天未完成`
  reminderVisible.value = true
}

const submitReminder = async () => {
  if (!reminderForm.subject.trim()) {
    ElMessage.warning('请填写邮件主题')
    return
  }
  reminderLoading.value = true
  try {
    const res = await sendOrderRepairReminder(reminderForm.id, {
      to: reminderForm.to,
      subject: reminderForm.subject,
      message: reminderForm.message,
      format: reminderForm.format
    })
    if (res.code === 200 || res.code === 0) {
      ElMessage.success(res.message || '提醒已发送')
      reminderVisible.value = false
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    reminderLoading.value = false
  }
}

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.reminder-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 85px);
}

// 页面头部 - 蓝白渐变
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #1890ff 0%, #36a3f7 50%, #79bbff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.3);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 6px 28px rgba(24, 144, 255, 0.35);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon-box {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 14px;
      color: #fff;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-text {
      .page-title {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.5px;
      }
      .page-subtitle {
        margin: 6px 0 0;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 400;
      }
    }
  }
}

// 搜索卡片
.search-card {
  margin-bottom: 16px;
  border-radius: 10px;
  border: none;

  :deep(.el-card__body) {
    padding: 18px 20px;
  }

  .search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;

    .form-item {
      margin-bottom: 0;
      margin-right: 0;

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #595959;
      }
    }

    .search-input {
      width: 170px;

      :deep(.el-input__wrapper) {
        border-radius: 6px;
        box-shadow: 0 0 0 1px #d9d9d9 inset;

        &:hover {
          box-shadow: 0 0 0 1px #1890ff inset;
        }

        &.is-focus {
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) inset;
        }
      }
    }

    .search-select {
      width: 130px;

      :deep(.el-select__wrapper) {
        border-radius: 6px;
      }
    }

    .btn-group {
      margin-left: auto;
    }

    .btn-search {
      border-radius: 6px;
      padding: 9px 18px;
      background: #1890ff;
      border-color: #1890ff;

      &:hover {
        background: #40a9ff;
        border-color: #40a9ff;
      }
    }

    .btn-reset {
      border-radius: 6px;
      padding: 9px 18px;

      &:hover {
        color: #1890ff;
        border-color: #1890ff;
      }
    }
  }
}

// 表格卡片
.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .data-table {
    :deep(.el-table__header-wrapper) {
      th {
        background: linear-gradient(to bottom, #f8fafc, #f1f5f9) !important;
        color: #475569;
        font-weight: 600;
        font-size: 13px;
        letter-spacing: 0.3px;
      }
    }

    :deep(.el-table__body-wrapper) {
      .el-table__row {
        transition: all 0.3s;

        &:hover > td {
          background: linear-gradient(to right, #f0f7ff, #e6f7ff) !important;
        }
      }
    }
  }

  .action-btns {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;

    .el-button {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 4px;
      min-width: 38px;
      font-weight: 500;
      transition: all 0.2s;
      flex-shrink: 0;

      &.el-button--primary {
        background: #e6f7ff;
        color: #1890ff;
        border-color: #91d5ff;

        &:hover {
          background: #1890ff;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }
      }

      &.el-button--warning {
        background: #fff7e6;
        color: #fa8c16;
        border-color: #ffd591;

        &:hover {
          background: #fa8c16;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(250, 140, 22, 0.3);
        }
      }
    }
  }

  .pagination-wrap {
    padding: 16px 4px 4px;
    display: flex;
    justify-content: flex-end;
    background: linear-gradient(to bottom, #fafafa, #f5f7fa);
    border-top: 1px solid #f0f0f0;
    border-radius: 0 0 12px 12px;

    .pagination {
      :deep(.el-pager li) {
        border-radius: 8px;
        margin: 0 4px;
        font-weight: 500;
        transition: all 0.3s;

        &:hover {
          background: #e6f7ff;
        }

        &.is-active {
          background: #1890ff;
          color: #fff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
        }
      }

      :deep(.btn-prev),
      :deep(.btn-next) {
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          background: #e6f7ff;
        }
      }
    }
  }
}

// 对话框样式
.form-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(135deg, #1890ff 0%, #36a3f7 100%);
    border-bottom: none;

    .el-dialog__title {
      color: #fff;
      font-weight: 600;
      font-size: 18px;
      letter-spacing: 0.5px;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #fff;
      font-size: 18px;
      transition: all 0.3s;

      &:hover {
        color: #e6f7ff;
        transform: rotate(90deg);
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px 28px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 8px;

    .el-button {
      border-radius: 8px;
      padding: 10px 24px;
      font-weight: 500;
      transition: all 0.3s;

      &.el-button--warning {
        background: #fa8c16;
        border-color: #fa8c16;
        color: #fff;

        &:hover {
          background: #ffa940;
          border-color: #ffa940;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(250, 140, 22, 0.4);
        }
      }

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

// el-descriptions 样式
:deep(.el-descriptions) {
  .el-descriptions__label {
    background: linear-gradient(to bottom, #fafafa, #f5f7fa);
    font-weight: 600;
    color: #595959;
    font-size: 13px;
  }

  .el-descriptions__content {
    color: #262626;
    font-size: 13px;
    font-weight: 500;
  }
}

// 邮件预览
.mail-preview {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;

  .mail-preview-title {
    padding: 10px 14px;
    font-weight: 600;
    color: #262626;
    background: #f0f2f5;
    border-bottom: 1px solid #e8e8e8;
    font-size: 13px;
  }

  .mail-preview-meta {
    display: flex;
    gap: 24px;
    padding: 8px 14px;
    font-size: 12px;
    color: #8c8c8c;
    border-bottom: 1px dashed #e8e8e8;
  }

  .mail-preview-body {
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.9;
    color: #595959;

    .mail-preview-admin {
      margin-top: 8px;
      padding: 10px 12px;
      background: #fff7e6;
      border-left: 4px solid #fa8c16;
      border-radius: 6px;
      color: #874d00;
      white-space: pre-wrap;
    }
  }
}
</style>
