<template>
  <div class="payment-config-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>支付方式管理（repair 库 system_config）</span>
          <el-button type="primary" :loading="saving" :disabled="!dirty" @click="handleSave">
            保存配置
          </el-button>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="启停状态保存到小程序系统配置表，小程序端与后台共用；商户密钥等敏感参数仍配置在服务器 backend/.env 中，不在本页管理。"
      />

      <!-- 支付方式列表 -->
      <div class="payment-methods">
        <div v-for="item in paymentMethods" :key="item.key" class="method-card">
          <div class="method-info">
            <div class="method-icon" :style="{ backgroundColor: item.color + '1A', color: item.color }">
              {{ item.emoji }}
            </div>
            <div>
              <div class="method-name">{{ item.label }}</div>
              <div class="method-desc">{{ item.key }} = {{ configValues[item.key] === '1' ? '启用' : '停用' }}</div>
            </div>
          </div>
          <div class="method-actions">
            <el-switch
              :model-value="configValues[item.key] === '1'"
              @update:model-value="(val) => toggleMethod(item.key, val)"
            />
          </div>
        </div>
      </div>

      <el-divider />

      <!-- 其他支付相关配置 -->
      <el-form label-width="140px" style="max-width: 520px">
        <el-form-item label="微信商户号">
          <el-input v-model="configValues.payment_wechat_mch_id" placeholder="如：1900000109" />
        </el-form-item>
        <el-form-item label="支付客服电话">
          <el-input v-model="configValues.payment_service_phone" placeholder="如：400-000-0000" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPaymentConfig, savePaymentConfig } from '@/api/paymentRecords'

// 支付方式卡片定义（启停状态读写 system_config）
const paymentMethods = [
  { key: 'payment_wechat_enabled', label: '微信支付（小程序）', emoji: '💬', color: '#07C160' },
  { key: 'payment_alipay_enabled', label: '支付宝', emoji: '🅰️', color: '#1677FF' },
  { key: 'payment_bank_enabled', label: '银行转账', emoji: '🏦', color: '#6366F1' },
  { key: 'payment_balance_enabled', label: '余额支付', emoji: '💰', color: '#F59E0B' }
]

const configValues = reactive({
  payment_wechat_enabled: '0',
  payment_alipay_enabled: '0',
  payment_bank_enabled: '0',
  payment_balance_enabled: '0',
  payment_wechat_mch_id: '',
  payment_service_phone: ''
})

const originalValues = ref({})
const saving = ref(false)

const dirty = computed(() => {
  return Object.keys(configValues).some((k) => configValues[k] !== originalValues.value[k])
})

const fetchConfig = async () => {
  try {
    const res = await getPaymentConfig()
    const items = res.data?.items || []
    for (const item of items) {
      configValues[item.key] = item.value
    }
    originalValues.value = { ...configValues }
  } catch (error) {
    console.error('加载支付配置失败:', error)
  }
}

const toggleMethod = (key, enabled) => {
  configValues[key] = enabled ? '1' : '0'
}

const handleSave = async () => {
  saving.value = true
  try {
    // 只提交有变化的键
    const values = {}
    for (const key of Object.keys(configValues)) {
      if (configValues[key] !== originalValues.value[key]) {
        values[key] = configValues[key]
      }
    }
    if (Object.keys(values).length === 0) return

    await savePaymentConfig(values)
    originalValues.value = { ...configValues }
    ElMessage.success('支付配置已保存')
  } catch (error) {
    console.error('保存配置失败:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<style lang="scss" scoped>
.payment-config-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .payment-methods {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;

    .method-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .method-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .method-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .method-name {
          font-weight: 600;
        }

        .method-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }
}
</style>
