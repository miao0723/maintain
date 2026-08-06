<template>
  <div class="payment-config-container">
    <el-card shadow="never">
      <template #header>
        <span>支付配置管理</span>
      </template>

      <!-- 支付方式列表 -->
      <div class="payment-methods">
        <el-row :gutter="20">
          <el-col :span="8" v-for="method in paymentMethods" :key="method.code">
            <el-card shadow="hover" class="method-card">
              <div class="method-header">
                <div class="method-icon" :style="{ background: method.color }">
                  <el-icon :size="30">
                    <component :is="method.icon" />
                  </el-icon>
                </div>
                <div class="method-info">
                  <div class="method-name">{{ method.name }}</div>
                  <div class="method-status">
                    <el-tag :type="method.enabled ? 'success' : 'info'">
                      {{ method.enabled ? '已启用' : '未启用' }}
                    </el-tag>
                  </div>
                </div>
              </div>
              <div class="method-footer">
                <el-button type="primary" @click="handleConfig(method)">配置</el-button>
                <el-button
                  :type="method.enabled ? 'warning' : 'success'"
                  @click="handleToggleStatus(method)"
                >
                  {{ method.enabled ? '禁用' : '启用' }}
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 配置说明 -->
      <el-divider />
      <div class="config-tips">
        <h4>配置说明</h4>
        <ul>
          <li>微信支付：需要在微信商户平台获取商户号和API密钥</li>
          <li>支付宝：需要在支付宝开放平台创建应用并获取相关配置</li>
          <li>银行卡支付：需要配置支付网关信息</li>
          <li>余额支付：系统内置支付方式，无需额外配置</li>
        </ul>
      </div>
    </el-card>

    <!-- 配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`配置${currentMethod?.name}`"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <template v-if="currentMethod?.code === 'wechat'">
          <el-form-item label="商户号" prop="mch_id">
            <el-input v-model="form.mch_id" placeholder="请输入微信支付商户号" />
          </el-form-item>
          <el-form-item label="API密钥" prop="api_key">
            <el-input v-model="form.api_key" type="password" show-password placeholder="请输入API密钥" />
          </el-form-item>
          <el-form-item label="APPID" prop="app_id">
            <el-input v-model="form.app_id" placeholder="请输入微信APPID" />
          </el-form-item>
          <el-form-item label="证书路径" prop="cert_path">
            <el-input v-model="form.cert_path" placeholder="请输入证书路径" />
          </el-form-item>
        </template>

        <template v-if="currentMethod?.code === 'alipay'">
          <el-form-item label="应用ID" prop="app_id">
            <el-input v-model="form.app_id" placeholder="请输入支付宝应用ID" />
          </el-form-item>
          <el-form-item label="应用私钥" prop="private_key">
            <el-input v-model="form.private_key" type="textarea" :rows="3" placeholder="请输入应用私钥" />
          </el-form-item>
          <el-form-item label="支付宝公钥" prop="public_key">
            <el-input v-model="form.public_key" type="textarea" :rows="3" placeholder="请输入支付宝公钥" />
          </el-form-item>
          <el-form-item label="签名方式" prop="sign_type">
            <el-select v-model="form.sign_type" placeholder="请选择签名方式">
              <el-option label="RSA2" value="RSA2" />
              <el-option label="RSA" value="RSA" />
            </el-select>
          </el-form-item>
        </template>

        <template v-if="currentMethod?.code === 'bank'">
          <el-form-item label="支付网关" prop="gateway">
            <el-input v-model="form.gateway" placeholder="请输入支付网关地址" />
          </el-form-item>
          <el-form-item label="商户号" prop="mch_id">
            <el-input v-model="form.mch_id" placeholder="请输入商户号" />
          </el-form-item>
          <el-form-item label="终端号" prop="terminal_id">
            <el-input v-model="form.terminal_id" placeholder="请输入终端号" />
          </el-form-item>
        </template>

        <template v-if="currentMethod?.code === 'balance'">
          <el-form-item label="启用余额支付">
            <el-switch v-model="form.enabled" />
          </el-form-item>
          <el-form-item label="最低余额限制" prop="min_balance">
            <el-input-number v-model="form.min_balance" :min="0" :precision="2" />
            <span style="margin-left: 10px">元</span>
          </el-form-item>
          <el-form-item label="支付密码" prop="password_required">
            <el-switch v-model="form.password_required" active-text="需要" inactive-text="不需要" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const paymentMethods = ref([
  {
    code: 'wechat',
    name: '微信支付',
    icon: 'ChatDotRound',
    color: '#07C160',
    enabled: true
  },
  {
    code: 'alipay',
    name: '支付宝',
    icon: 'Wallet',
    color: '#1677FF',
    enabled: true
  },
  {
    code: 'bank',
    name: '银行卡支付',
    icon: 'CreditCard',
    color: '#6366F1',
    enabled: false
  },
  {
    code: 'balance',
    name: '余额支付',
    icon: 'Coin',
    color: '#F59E0B',
    enabled: true
  }
])

const dialogVisible = ref(false)
const formRef = ref(null)
const currentMethod = ref(null)

const form = reactive({
  mch_id: '',
  api_key: '',
  app_id: '',
  cert_path: '',
  private_key: '',
  public_key: '',
  sign_type: 'RSA2',
  gateway: '',
  terminal_id: '',
  enabled: true,
  min_balance: 0,
  password_required: true
})

const rules = {
  mch_id: [{ required: true, message: '请输入商户号', trigger: 'blur' }],
  api_key: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  app_id: [{ required: true, message: '请输入APPID', trigger: 'blur' }],
  gateway: [{ required: true, message: '请输入支付网关', trigger: 'blur' }]
}

const handleConfig = (method) => {
  currentMethod.value = method
  dialogVisible.value = true

  // TODO: 加载该支付方式的配置
  Object.assign(form, {
    mch_id: '',
    api_key: '',
    app_id: '',
    cert_path: '',
    private_key: '',
    public_key: '',
    sign_type: 'RSA2',
    gateway: '',
    terminal_id: '',
    enabled: true,
    min_balance: 0,
    password_required: true
  })
}

const handleToggleStatus = (method) => {
  method.enabled = !method.enabled
  ElMessage.success(`${method.name}已${method.enabled ? '启用' : '禁用'}`)
  // TODO: 调用API更新状态
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    // TODO: 调用API保存配置
    ElMessage.success('配置保存成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

onMounted(() => {
  // TODO: 加载支付方式列表和配置
})
</script>

<style lang="scss" scoped>
.payment-config-container {
  .payment-methods {
    margin-bottom: 20px;

    .method-card {
      margin-bottom: 20px;

      .method-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .method-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 15px;
        }

        .method-info {
          flex: 1;

          .method-name {
            font-size: 18px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 8px;
          }

          .method-status {
            font-size: 14px;
          }
        }
      }

      .method-footer {
        display: flex;
        gap: 10px;

        .el-button {
          flex: 1;
        }
      }
    }
  }

  .config-tips {
    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: #606266;

      li {
        margin-bottom: 8px;
      }
    }
  }
}
</style>
