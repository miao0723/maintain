<template>
  <div class="alipay-test-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon size="28"><Coin /></el-icon>
        <div>
          <h2>支付宝支付测试</h2>
          <p>体验版沙箱环境测试</p>
        </div>
      </div>
      <el-tag type="warning">沙箱环境</el-tag>
    </div>

    <!-- 测试功能区 -->
    <el-row :gutter="20">
      <!-- 左侧：创建支付 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>创建支付订单</span>
            </div>
          </template>

          <el-form :model="payForm" label-width="100px" class="pay-form">
            <el-form-item label="订单标题">
              <el-input v-model="payForm.subject" placeholder="如：维修服务费" />
            </el-form-item>
            <el-form-item label="订单金额">
              <el-input-number v-model="payForm.amount" :min="0.01" :precision="2" :step="0.01" />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="商品描述">
              <el-input v-model="payForm.body" type="textarea" :rows="2" placeholder="商品描述信息" />
            </el-form-item>
            <el-form-item label="订单编号">
              <el-input v-model="payForm.out_trade_no" placeholder="系统自动生成" disabled>
                <template #append>
                  <el-button @click="generateOrderNo">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createPayment" :loading="creating" style="width: 100%">
                <el-icon><CreditCard /></el-icon>
                创建支付订单
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：支付结果/历史 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>支付状态查询</span>
            </div>
          </template>

          <el-form :model="queryForm" label-width="100px">
            <el-form-item label="订单编号">
              <el-input v-model="queryForm.out_trade_no" placeholder="请输入订单编号" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="queryPaymentStatus" :loading="querying">
                <el-icon><Search /></el-icon>
                查询支付状态
              </el-button>
              <el-button type="primary" @click="mockPay" :loading="mocking" v-if="payResult?.mock_mode || !payUrl">
                <el-icon><CreditCard /></el-icon>
                模拟支付
              </el-button>
              <el-button type="warning" @click="mockCancel" :loading="cancelling" v-if="payResult?.mock_mode && payResult?.status === 'pending'">
                <el-icon><CircleClose /></el-icon>
                取消订单
              </el-button>
              <el-button type="info" @click="mockRefund" :loading="refunding" v-if="payResult?.mock_mode && payResult?.status === 'paid'">
                <el-icon><RefreshLeft /></el-icon>
                模拟退款
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 支付结果展示 -->
          <el-divider content-position="left">支付结果</el-divider>

          <div v-if="payResult" class="result-box" :class="payResult.status">
            <div class="result-header">
              <el-icon v-if="payResult.status === 'paid'" size="32" color="#67C23A"><CircleCheck /></el-icon>
              <el-icon v-else-if="payResult.status === 'pending'" size="32" color="#E6A23C"><Clock /></el-icon>
              <el-icon v-else size="32" color="#909399"><CircleClose /></el-icon>
              <span class="result-status">{{ payResult.status_text }}</span>
            </div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="订单编号">{{ payResult.out_trade_no }}</el-descriptions-item>
              <el-descriptions-item label="支付宝交易号">{{ payResult.trade_no || '-' }}</el-descriptions-item>
              <el-descriptions-item label="订单金额">¥{{ payResult.total_amount }}</el-descriptions-item>
              <el-descriptions-item label="买家账号">{{ payResult.buyer_logon_id || '-' }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ payResult.gmt_payment || '-' }}</el-descriptions-item>
              <el-descriptions-item label="退款金额" v-if="payResult.status === 'refunded'">¥{{ payResult.refund_amount || '-' }}</el-descriptions-item>
              <el-descriptions-item label="退款时间" v-if="payResult.status === 'refunded'">{{ payResult.refund_at || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <el-empty v-else description="暂无支付结果" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 支付链接展示 -->
<el-card v-if="payUrl || payResult?.mock_mode" shadow="never" class="pay-url-card">
      <template #header>
        <div class="card-header">
          {{ payResult?.mock_mode ? '模拟模式提示' : '支付链接' }}
          <el-button v-if="payUrl" link type="primary" @click="copyPayUrl">
            <el-icon><CopyDocument /></el-icon>复制
          </el-button>
        </div>
      </template>
      <div class="pay-url-box">
        <el-input v-model="payUrl" readonly>
          <template #append>
            <el-button @click="openPayUrl">{{ payResult?.mock_mode ? '打开模拟收银台' : '打开支付页面' }}</el-button>
          </template>
        </el-input>
        <p class="pay-tip">
          <el-icon><InfoFilled /></el-icon>
          {{ payResult?.mock_mode ? '打开本地模拟支付宝收银台，完成确认支付或取消订单' : '复制链接到浏览器打开，或点击“打开支付页面”进行测试支付' }}
        </p>
      </div>
    </el-card>
<div v-else-if="payResult?.mock_mode" class="mock-tip">
    <el-alert type="info" :closable="false">
      <template #title>
        <div>
          <p><strong>当前为模拟测试模式</strong></p>
          <p v-if="payResult?.mock_test_info?.instruction">{{ payResult.mock_test_info.instruction }}</p>
          <p class="mock-account">
            测试账号：{{ payResult?.mock_test_info?.sandbox_account || 'sandboxbt01@sandbox.com' }}
            <br>密码：{{ payResult?.mock_test_info?.sandbox_password || '111111' }}
          </p>
          <p class="mock-note">注：沙箱环境已下线，此为本地模拟数据</p>
        </div>
      </template>
    </el-alert>
  </div>

    <!-- 支付历史记录 -->
    <el-card shadow="never" class="history-card">
      <template #header>
        <div class="card-header">
          <span>支付测试历史</span>
          <el-button link type="danger" @click="clearHistory" v-if="payHistory.length > 0">
            清空
          </el-button>
        </div>
      </template>

      <el-table :data="payHistory" border stripe v-if="payHistory.length > 0">
        <el-table-column prop="out_trade_no" label="订单编号" width="180" />
        <el-table-column prop="subject" label="商品标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="total_amount" label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewHistoryDetail(row)">查看</el-button>
            <el-button link type="success" size="small" @click="queryHistoryPayment(row)" :loading="row.querying">
              刷新状态
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无支付记录" :image-size="80" />
    </el-card>

    <!-- 使用说明 -->
    <el-card shadow="never" class="guide-card">
      <template #header>
        <div class="card-header">
          <span>使用说明</span>
        </div>
      </template>
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          <div class="guide-content">
            <p><strong>支付宝测试流程：</strong></p>
            <ol>
              <li>填写订单信息（标题、金额、描述）</li>
              <li>点击"创建支付订单"生成支付链接</li>
              <li>点击"打开支付页面"进入模拟收银台</li>
              <li>在收银台完成“确认支付”或“取消订单”</li>
              <li>返回当前页点击"查询支付状态"刷新结果</li>
            </ol>
            <p class="tip">注意：当前默认是项目内真实流程模拟，不会调用正式支付宝扣款。</p>
          </div>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, CreditCard, Search, CopyDocument, InfoFilled, CircleCheck, CircleClose, Clock } from '@element-plus/icons-vue'

// 支付表单
const payForm = reactive({
  subject: '',
  amount: 0.01,
  body: '',
  out_trade_no: ''
})

// 查询表单
const queryForm = reactive({
  out_trade_no: ''
})

// 状态
const creating = ref(false)
const querying = ref(false)
const mocking = ref(false)
const cancelling = ref(false)
const refunding = ref(false)
const payUrl = ref('')
const payResult = ref(null)
const payHistory = ref([])

// 生成订单编号
const generateOrderNo = () => {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.getTime().toString().slice(-6)
  payForm.out_trade_no = `TEST${dateStr}${timeStr}`
}

// 创建支付订单
const createPayment = async () => {
  if (!payForm.subject) {
    ElMessage.warning('请填写订单标题')
    return
  }
  if (!payForm.amount || payForm.amount <= 0) {
    ElMessage.warning('请填写正确的金额')
    return
  }
  if (!payForm.out_trade_no) {
    generateOrderNo()
  }

  creating.value = true
  try {
    // 调用后端API创建支付订单
    const response = await fetch('/api/payment/alipay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: payForm.subject,
        total_amount: payForm.amount,
        body: payForm.body,
        out_trade_no: payForm.out_trade_no
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      payUrl.value = result.data.pay_url || result.data.qr_code
      payResult.value = {
        out_trade_no: payForm.out_trade_no,
        subject: payForm.subject,
        total_amount: payForm.amount,
        status: 'pending',
        status_text: '待支付',
        create_time: new Date().toLocaleString(),
          mock_mode: result.data.mock_mode,
          mock_test_info: result.data.mock_test_info
      }

      // 添加到历史记录
      addToHistory({ ...payResult.value })
        // 显示沙箱测试信息
        if (result.data.mock_test_info) {
          ElMessage.info('当前为模拟支付模式，点击“打开支付页面”进入模拟收银台')
        }

      ElMessage.success('支付订单创建成功')

      // 如果是URL形式，自动打开
      if (payUrl.value && payUrl.value.startsWith('http')) {
        // 不自动打开，让用户手动点击
      }
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建支付订单失败:', error)
    ElMessage.error('创建支付订单失败，请检查后端服务')
  } finally {
    creating.value = false
  }
}

// 查询支付状态
const queryPaymentStatus = async () => {
  const tradeNo = queryForm.out_trade_no || payForm.out_trade_no
  if (!tradeNo) {
    ElMessage.warning('请输入订单编号')
    return
  }

  querying.value = true
  try {
    const response = await fetch(`/api/payment/alipay/query?out_trade_no=${encodeURIComponent(tradeNo)}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      const data = result.data
      let status = 'pending'
      let statusText = '等待支付'
      if (data.trade_status === 'TRADE_SUCCESS' || data.trade_status === 'TRADE_FINISHED') {
        status = 'paid'
        statusText = '支付成功'
      } else if (data.trade_status === 'TRADE_CLOSED' && data.refund_amount) {
        status = 'refunded'
        statusText = '已退款'
      } else if (data.trade_status === 'TRADE_CLOSED') {
        status = 'cancelled'
        statusText = '已取消'
      }

      payResult.value = {
        out_trade_no: data.out_trade_no || tradeNo,
        trade_no: data.trade_no,
        subject: data.subject,
        total_amount: data.total_amount,
        buyer_logon_id: data.buyer_logon_id,
        status,
        status_text: statusText,
        gmt_payment: data.gmt_payment,
        refund_amount: data.refund_amount,
        refund_at: data.refund_at,
        mock_mode: data.mock_mode,
        create_time: payResult.value?.create_time || new Date().toLocaleString()
      }

      // 更新历史记录
      updateHistoryStatus(payResult.value)

      ElMessage.success('查询成功')
    } else {
      ElMessage.error(result.message || '查询失败')
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
    ElMessage.error('查询失败，请检查后端服务')
  } finally {
    querying.value = false
  }
}

// 添加到历史记录
const addToHistory = (record) => {
  const exists = payHistory.value.find(h => h.out_trade_no === record.out_trade_no)
  if (!exists) {
    payHistory.value.unshift(record)
  }
}

// 更新历史记录状态
const updateHistoryStatus = (record) => {
  const index = payHistory.value.findIndex(h => h.out_trade_no === record.out_trade_no)
  if (index !== -1) {
    payHistory.value[index] = { ...payHistory.value[index], ...record }
  }
}

// 查看历史详情
const viewHistoryDetail = (row) => {
  payResult.value = row
  queryForm.out_trade_no = row.out_trade_no
}

// 刷新历史支付状态
const queryHistoryPayment = async (row) => {
  row.querying = true
  queryForm.out_trade_no = row.out_trade_no
  await queryPaymentStatus()
  row.querying = false
}

// 模拟支付
const mockPay = async () => {
  const tradeNo = queryForm.out_trade_no || payForm.out_trade_no
  if (!tradeNo) {
    ElMessage.warning('请先创建支付订单')
    return
  }

  mocking.value = true
  try {
    const response = await fetch('/api/payment/alipay/mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        out_trade_no: tradeNo
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      const data = result.data
      payResult.value = {
        out_trade_no: data.out_trade_no,
        trade_no: data.trade_no,
        total_amount: data.total_amount,
        buyer_logon_id: 'sandboxbt01@sandbox.com',
        status: 'paid',
        status_text: '支付成功',
        gmt_payment: data.gmt_payment,
        create_time: payResult.value?.create_time || new Date().toLocaleString()
      }

      updateHistoryStatus(payResult.value)
      ElMessage.success('模拟支付成功')
    } else {
      ElMessage.error(result.message || '模拟支付失败')
    }
  } catch (error) {
    console.error('模拟支付失败:', error)
    ElMessage.error('模拟支付失败，请检查后端服务')
  } finally {
    mocking.value = false
  }
}

// 模拟取消
const mockCancel = async () => {
  const tradeNo = queryForm.out_trade_no || payForm.out_trade_no
  if (!tradeNo) {
    ElMessage.warning('请先创建支付订单')
    return
  }

  cancelling.value = true
  try {
    const response = await fetch('/api/payment/alipay/mock-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        out_trade_no: tradeNo
      })
    })

    if (!response) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      payResult.value = {
        out_trade_no: tradeNo,
        status: 'cancelled',
        status_text: '已取消',
        create_time: payResult.value?.create_time || new Date().toLocaleString()
      }

      updateHistoryStatus(payResult.value)
      ElMessage.success('订单取消成功')
    } else {
      ElMessage.error(result.message || '取消失败')
    }
  } catch (error) {
    console.error('取消订单失败:', error)
    ElMessage.error('取消订单失败，请检查后端服务')
  } finally {
    cancelling.value = false
  }
}

// 模拟退款
const mockRefund = async () => {
  const tradeNo = queryForm.out_trade_no || payForm.out_trade_no
  if (!tradeNo) {
    ElMessage.warning('请先创建支付订单')
    return
  }

  refunding.value = true
  try {
    const response = await fetch('/api/payment/alipay/mock-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        out_trade_no: tradeNo
      })
    })

    if (!response) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (result.code === 200 || result.code === 0) {
      payResult.value = {
        out_trade_no: tradeNo,
        status: 'refunded',
        status_text: '已退款',
        refund_amount: result.data.refund_amount,
        create_time: payResult.value?.create_time || new Date().toLocaleString()
      }

      updateHistoryStatus(payResult.value)
      ElMessage.success('模拟退款成功')
    } else {
      ElMessage.error(result.message || '退款失败')
    }
  } catch (error) {
    console.error('退款失败:', error)
    ElMessage.error('退款失败，请检查后端服务')
  } finally {
    refunding.value = false
  }
}

// 复制支付链接
const copyPayUrl = () => {
  if (payUrl.value) {
    navigator.clipboard.writeText(payUrl.value)
    ElMessage.success('链接已复制')
  }
}

// 打开支付链接
const openPayUrl = () => {
  if (payUrl.value) {
    window.open(payUrl.value, '_blank')
  }
}

// 清空历史
const clearHistory = () => {
  payHistory.value = []
  payResult.value = null
  ElMessage.success('历史记录已清空')
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    paid: 'success',
    pending: 'warning',
    cancelled: 'info',
    refunded: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  generateOrderNo()
})
</script>

<style lang="scss" scoped>
.alipay-test-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 85px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1677ff 0%, #4090e0 100%);
  border-radius: 12px;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #fff;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.8;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.pay-form {
  .unit {
    margin-left: 8px;
    color: #606266;
  }
}

.pay-url-card {
  margin-top: 20px;

  .pay-url-box {
    .pay-tip {
      margin-top: 12px;
      color: #909399;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}
.mock-tip {
  margin-top: 10px;

  .mock-account {
    margin: 10px 0;
    padding: 10px;
    background: #f0f9eb;
    border-radius: 4px;
    color: #67c23a;
  }

  .mock-note {
    color: #e6a23c;
    font-size: 12px;
    margin-top: 8px;
  }
}

.history-card {
  margin-top: 20px;

  .amount {
    color: #f56c6c;
    font-weight: 600;
  }
}

.guide-card {
  margin-top: 20px;

  .guide-content {
    line-height: 1.8;

    ol {
      margin: 10px 0;
      padding-left: 20px;
    }

    .tip {
      color: #e6a23c;
      margin-top: 10px;
    }
  }
}

.result-box {
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;

  &.paid {
    background: #f0f9eb;
  }

  &.pending {
    background: #fdf6ec;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    .result-status {
      font-size: 18px;
      font-weight: 600;
    }
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      width: 120px;
    }
  }
}
</style>
