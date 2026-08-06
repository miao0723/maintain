<template>
  <div class="contract-create-container">
    <!-- 顶部标题区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>创建维修合同</h2>
        <p class="subtitle">通过合同模板快速生成标准合同文档</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleBack" :icon="Back">返回</el-button>
        <el-button v-if="currentStep === 2" type="primary" :icon="Document" @click="handleExportPDF">导出PDF</el-button>
      </div>
    </div>

    <!-- 步骤进度条 -->
    <div class="step-progress">
      <div class="steps-wrapper">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{ active: currentStep === index, completed: currentStep > index }"
          @click="currentStep > index && (currentStep = index)"
        >
          <div class="step-indicator">
            <el-icon v-if="currentStep > index"><Check /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <span class="step-label">{{ step.label }}</span>
            <span class="step-desc">{{ step.desc }}</span>
          </div>
          <div v-if="index < steps.length - 1" class="step-connector" :class="{ active: currentStep > index }"></div>
        </div>
      </div>
    </div>

    <!-- ===== Step 1: 选择模板 ===== -->
    <div v-show="currentStep === 0" class="step-content animate-fade-in">
      <div class="section-header">
        <el-icon><Collection /></el-icon>
        <span>选择合同模板</span>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="templateList.length === 0 && !templatesLoading" description="暂无可用模板，请先创建合同模板">
        <el-button type="primary" @click="goToTemplates">去创建模板</el-button>
      </el-empty>

      <!-- 模板列表 -->
      <div v-loading="templatesLoading" class="template-grid" v-else>
        <div
          v-for="template in templateList"
          :key="template.id"
          class="template-card"
          :class="{ selected: selectedTemplateId === template.id }"
          @click="selectedTemplateId = template.id"
        >
          <div class="template-check">
            <el-icon v-if="selectedTemplateId === template.id" class="checked-icon"><CircleCheckFilled /></el-icon>
            <el-icon v-else class="unchecked-icon"><CircleCheck /></el-icon>
          </div>
          <div class="template-icon" :class="template.type">
            <el-icon><CollectionTag /></el-icon>
          </div>
          <div class="template-body">
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc">{{ template.description || '暂无描述' }}</p>
            <div class="template-meta">
              <el-tag size="small" :type="getTypeTag(template.type)">{{ getTypeText(template.type) }}</el-tag>
              <span class="variable-count">{{ getVariableCount(template) }} 个变量</span>
            </div>
          </div>
          <el-button class="preview-btn" size="small" @click.stop="handlePreviewTemplate(template)">预览模板</el-button>
        </div>
      </div>
    </div>

    <!-- ===== Step 2: 填写信息 ===== -->
    <div v-show="currentStep === 1" class="step-content animate-fade-in">
      <el-form :model="contractData" :rules="formRules" ref="formRef" label-position="top" class="create-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </div>
          <div class="form-grid">
            <el-form-item label="合同编号" prop="contract_number">
              <el-input v-model="contractData.contract_number" placeholder="自动生成或手动输入" clearable>
                <template #prefix><el-icon><Document /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="签订日期" prop="sign_date">
              <el-date-picker
                v-model="contractData.sign_date"
                type="date"
                placeholder="选择签订日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </div>

        <!-- 客户信息 -->
        <div class="form-section">
          <div class="section-header">
            <el-icon><UserFilled /></el-icon>
            <span>客户信息</span>
          </div>
          <div class="form-grid">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="contractData.customer_name" placeholder="请输入客户名称" />
            </el-form-item>
            <el-form-item label="客户电话" prop="customer_phone">
              <el-input v-model="contractData.customer_phone" placeholder="请输入客户电话" />
            </el-form-item>
          </div>
        </div>

        <!-- 服务信息 - 维修合同 -->
        <div v-if="selectedTemplate?.type === 'repair_contract'" class="form-section">
          <div class="section-header">
            <el-icon><Tools /></el-icon>
            <span>服务信息</span>
          </div>
          <div class="form-grid">
            <el-form-item label="机械类型" prop="machine_type">
              <el-input v-model="contractData.machine_type" placeholder="请输入机械类型" />
            </el-form-item>
            <el-form-item label="合同金额（元）" prop="annual_fee">
              <el-input-number v-model="contractData.annual_fee" :min="0" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </div>
          <el-form-item label="服务内容" prop="service_content" class="full-width">
            <el-input v-model="contractData.service_content" type="textarea" :rows="4" placeholder="请输入服务内容" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker v-model="contractData.start_date" type="date" placeholder="选择开始日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker v-model="contractData.end_date" type="date" placeholder="选择结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </div>
        </div>

        <!-- 产品信息 - 交易合同 -->
        <div v-if="selectedTemplate?.type === 'trade_contract'" class="form-section">
          <div class="section-header">
            <el-icon><Goods /></el-icon>
            <span>产品信息</span>
          </div>
          <div class="form-grid">
            <el-form-item label="产品名称" prop="product_name">
              <el-input v-model="contractData.product_name" placeholder="请输入产品名称" />
            </el-form-item>
            <el-form-item label="规格型号" prop="product_spec">
              <el-input v-model="contractData.product_spec" placeholder="请输入规格型号" />
            </el-form-item>
          </div>
          <div class="form-grid form-grid-3">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="contractData.quantity" :min="1" :step="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="单价（元）" prop="unit_price">
              <el-input-number v-model="contractData.unit_price" :min="0" :precision="2" :step="10" style="width: 100%" @change="calcTotalAmount" />
            </el-form-item>
            <el-form-item label="总金额">
              <el-input :model-value="'¥ ' + Number(totalAmount || 0).toFixed(2)" disabled>
                <template #prefix><el-icon><Money /></el-icon></template>
              </el-input>
            </el-form-item>
          </div>
          <div class="form-grid">
            <el-form-item label="交货日期" prop="delivery_date">
              <el-date-picker v-model="contractData.delivery_date" type="date" placeholder="选择交货日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="交货地点" prop="delivery_place">
              <el-input v-model="contractData.delivery_place" placeholder="请输入交货地点" />
            </el-form-item>
          </div>
          <div class="form-grid">
            <el-form-item label="质量要求" prop="quality_standard">
              <el-input v-model="contractData.quality_standard" type="textarea" :rows="3" placeholder="请输入质量要求及技术标准" />
            </el-form-item>
            <el-form-item label="验收方式" prop="acceptance_method">
              <el-input v-model="contractData.acceptance_method" type="textarea" :rows="3" placeholder="请输入验收方式" />
            </el-form-item>
          </div>
          <el-form-item label="付款方式" prop="payment_method" class="full-width">
            <el-input v-model="contractData.payment_method" type="textarea" :rows="2" placeholder="请输入付款方式" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="违约责任" prop="liability_terms">
              <el-input v-model="contractData.liability_terms" type="textarea" :rows="3" placeholder="请输入违约责任条款" />
            </el-form-item>
            <el-form-item label="争议解决" prop="dispute_resolution">
              <el-input v-model="contractData.dispute_resolution" type="textarea" :rows="3" placeholder="请输入争议解决方式" />
            </el-form-item>
          </div>
          <el-form-item label="签订地点" prop="sign_place">
            <el-input v-model="contractData.sign_place" placeholder="请输入签订地点" />
          </el-form-item>
        </div>

        <!-- 公司信息 -->
        <div class="form-section">
          <div class="section-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>公司信息</span>
          </div>
          <div class="form-grid">
            <el-form-item label="公司名称" prop="company_name">
              <el-input v-model="contractData.company_name" placeholder="请输入公司名称" />
            </el-form-item>
            <el-form-item label="公司电话" prop="company_phone">
              <el-input v-model="contractData.company_phone" placeholder="请输入公司电话" />
            </el-form-item>
          </div>
          <el-form-item label="公司地址" prop="company_address" class="full-width">
            <el-input v-model="contractData.company_address" placeholder="请输入公司地址" />
          </el-form-item>
        </div>

        <!-- 自定义变量 -->
        <div v-if="customVariables.length > 0" class="form-section">
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            <span>自定义信息</span>
          </div>
          <div class="form-grid">
            <el-form-item v-for="v in customVariables" :key="v.key" :label="v.label || v.key">
              <el-input v-model="contractData[v.key]" :placeholder="'请输入' + (v.label || v.key)" />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <!-- ===== Step 3: 预览导出 ===== -->
    <div v-show="currentStep === 2" class="step-content animate-fade-in">
      <div class="preview-toolbar">
        <div class="toolbar-left">
          <el-icon><View /></el-icon>
          <span>合同预览</span>
        </div>
        <div class="toolbar-right">
          <el-button size="small" @click="handleCopyContent">复制内容</el-button>
          <el-button type="primary" :icon="Document" @click="handleExportPDF">导出PDF</el-button>
        </div>
      </div>
      <div class="contract-paper" ref="previewRef">
        <div class="paper-header">
          <h1 class="contract-title">{{ selectedTemplate?.name || '合同' }}</h1>
          <div class="contract-number">编号：{{ contractData.contract_number }}</div>
        </div>
        <div class="paper-content">
          <div v-html="renderedContent" class="rendered-content"></div>
        </div>
        <div class="paper-footer">
          <p>本合同由 CMMS 维修管理系统 自动生成</p>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <el-button v-if="currentStep > 0" @click="handlePrevStep" :icon="ArrowLeft">上一步</el-button>
      <div class="spacer"></div>
      <el-button v-if="currentStep < 2" type="primary" @click="handleNextStep">
        {{ currentStep === 0 ? '选择此模板' : currentStep === 1 ? '预览合同' : '' }}
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
    </div>

    <!-- 模板预览对话框 -->
    <el-dialog v-model="templatePreviewVisible" title="模板内容预览" width="800px" top="5vh">
      <div class="dialog-template-preview-paper">
        <div class="dialog-template-preview" v-html="formatContractPreview(templatePreviewText, { showTitle: true })"></div>
      </div>
      <template #footer>
        <el-button @click="templatePreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Back, Document, ArrowLeft, ArrowRight, Check, CircleCheckFilled, CircleCheck,
  Collection, CollectionTag, InfoFilled, UserFilled, Tools, Goods, Money,
  OfficeBuilding, Setting, View
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getContractTemplateList, getContractTemplateDetail, createContractAndExportPDF } from '@/api/contractTemplate'

const router = useRouter()
const currentStep = ref(0)
const templateList = ref([])
const templatesLoading = ref(false)
const selectedTemplateId = ref(null)
const selectedTemplate = ref(null)
const formRef = ref(null)
const templatePreviewVisible = ref(false)
const templatePreviewText = ref('')
const previewRef = ref(null)

const steps = [
  { label: '选择模板', desc: '选择合适的合同模板' },
  { label: '填写信息', desc: '填写合同所需信息' },
  { label: '预览导出', desc: '预览并导出PDF' }
]

const contractData = reactive({
  contract_number: '',
  customer_name: '',
  customer_phone: '',
  machine_type: '',
  service_content: '',
  annual_fee: 0,
  start_date: '',
  end_date: '',
  sign_date: new Date().toISOString().split('T')[0],
  company_name: '',
  company_phone: '',
  company_address: '',
  product_name: '',
  product_spec: '',
  quantity: 1,
  unit_price: 0,
  total_amount: 0,
  delivery_date: '',
  delivery_place: '',
  payment_method: '',
  quality_standard: '',
  acceptance_method: '',
  liability_terms: '',
  dispute_resolution: '',
  buyer_sign: '',
  seller_sign: '',
  sign_place: ''
})

const formRules = {
  contract_number: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  sign_date: [{ required: true, message: '请选择签订日期', trigger: 'change' }],
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }]
}

const customVariables = ref([])

const totalAmount = computed(() => {
  return (contractData.quantity || 0) * (contractData.unit_price || 0)
})

const calcTotalAmount = () => {
  contractData.total_amount = totalAmount.value
}

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formatContractPreview = (content = '', options = {}) => {
  const { showTitle = false } = options
  if (!content) return ''
  const lines = content.split('\n').map(line => line.trimEnd())
  return lines.map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return '<div class="preview-spacer"></div>'
    }
    if (showTitle && index === 0 && /合同|协议/.test(trimmed)) {
      return `<h2 class="preview-title">${escapeHtml(trimmed)}</h2>`
    }
    if (/^[一二三四五六七八九十]+、/.test(trimmed)) {
      return `<h3 class="preview-section">${escapeHtml(trimmed)}</h3>`
    }
    if (/^\d+\./.test(trimmed)) {
      return `<p class="preview-clause">${escapeHtml(trimmed)}</p>`
    }
    if (/^甲方|^乙方|^合同编号|^签订地点|^签订日期|^联系电话|^联系地址|^产品名称|^规格型号|^数量|^单价|^合同总价/.test(trimmed)) {
      return `<p class="preview-meta">${escapeHtml(trimmed)}</p>`
    }
    return `<p class="preview-paragraph">${escapeHtml(trimmed)}</p>`
  }).join('')
}

const renderedContent = computed(() => {
  if (!selectedTemplate.value || !selectedTemplate.value.content) return ''
  let content = selectedTemplate.value.content
  const variables = selectedTemplate.value.variables || []
  variables.forEach(v => {
    const key = v.key
    const value = contractData[key] !== undefined && contractData[key] !== ''
      ? contractData[key] : (v.default || '')
    const regex = new RegExp(`{{${key}}}`, 'g')
    content = content.replace(regex, String(value))
  })
  return formatContractPreview(content)
})

const getTypeText = (type) => {
  const map = {
    repair_contract: '维修合同',
    service_agreement: '服务协议',
    confidentiality: '保密协议',
    trade_contract: '交易合同'
  }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = {
    repair_contract: 'primary',
    service_agreement: 'success',
    confidentiality: 'warning',
    trade_contract: 'danger'
  }
  return map[type] || 'info'
}

const getVariableCount = (template) => {
  return template.variables ? template.variables.length : 0
}

const fetchTemplates = async () => {
  templatesLoading.value = true
  try {
    const res = await getContractTemplateList(1, 100, {})
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      const data = res.data || {}
      templateList.value = data.items || data.list || []
    }
  } catch (error) {
    console.error('获取模板列表失败', error)
    ElMessage.error('获取模板列表失败')
  } finally {
    templatesLoading.value = false
  }
}

const handleNextStep = async () => {
  if (currentStep.value === 0) {
    if (!selectedTemplateId.value) {
      ElMessage.warning('请选择一个模板')
      return
    }
    const template = templateList.value.find(t => t.id === selectedTemplateId.value)
    if (template) {
      selectedTemplate.value = template
      const commonKeys = [
        'contract_number', 'customer_name', 'customer_phone', 'machine_type',
        'service_content', 'annual_fee', 'start_date', 'end_date', 'sign_date',
        'company_name', 'company_phone', 'company_address',
        'product_name', 'product_spec', 'quantity', 'unit_price', 'total_amount',
        'delivery_date', 'delivery_place', 'payment_method', 'quality_standard',
        'acceptance_method', 'liability_terms', 'dispute_resolution',
        'buyer_sign', 'seller_sign', 'sign_place'
      ]
      const variables = template.variables || []
      customVariables.value = variables.filter(v => !commonKeys.includes(v.key))
      customVariables.value.forEach(v => {
        if (!contractData[v.key]) {
          contractData[v.key] = v.default || ''
        }
      })
      if (!contractData.contract_number) {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        contractData.contract_number = `HT${date}${random}`
      }
      if (template.type === 'trade_contract') {
        contractData.start_date = ''
        contractData.end_date = ''
      }
    }
  } else if (currentStep.value === 1) {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    if (selectedTemplate.value?.type === 'trade_contract') {
      contractData.total_amount = totalAmount.value
    }
  }
  currentStep.value++
}

const handlePrevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const handleBack = () => router.back()

const goToTemplates = () => router.push('/repair/contract/templates')

const handlePreviewTemplate = async (template) => {
  try {
    const res = await getContractTemplateDetail(template.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      templatePreviewText.value = res.data.content
      templatePreviewVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

const handleCopyContent = async () => {
  try {
    const text = renderedContent.value.replace(/<br>/g, '\n')
    await navigator.clipboard.writeText(text)
    ElMessage.success('内容已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const handleExportPDF = async () => {
  try {
    ElMessage.info('正在生成PDF，请稍候...')
    const data = {
      template_id: selectedTemplate.value.id,
      contract_data: { ...contractData }
    }
    const response = await createContractAndExportPDF(data)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `维修合同_${contractData.contract_number}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('合同已保存，PDF导出成功')
  } catch (error) {
    console.error('导出PDF失败:', error)
    ElMessage.error('导出PDF失败')
  }
}

onMounted(() => { fetchTemplates() })
</script>

<style lang="scss" scoped>
.contract-create-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;

    .header-left {
      h2 {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 600;
        color: #1a1a2e;
      }
      .subtitle {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  // ===== 步骤进度条 =====
  .step-progress {
    background: #fff;
    border-radius: 12px;
    padding: 28px 40px;
    margin-bottom: 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .steps-wrapper {
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    .step-item {
      display: flex;
      align-items: center;
      cursor: default;
      flex: 1;
      max-width: 280px;

      &.completed {
        cursor: pointer;
        .step-indicator {
          background: #67c23a;
          border-color: #67c23a;
          color: #fff;
        }
        .step-label { color: #67c23a; }
      }
      &.active {
        .step-indicator {
          background: #409eff;
          border-color: #409eff;
          color: #fff;
          box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
        }
        .step-label { color: #409eff; font-weight: 600; }
        .step-desc { color: #409eff; }
      }

      .step-indicator {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 600;
        border: 2px solid #dcdfe6;
        color: #909399;
        background: #fff;
        flex-shrink: 0;
        transition: all 0.3s;
      }

      .step-info {
        margin-left: 12px;
        .step-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #606266;
          transition: color 0.3s;
        }
        .step-desc {
          display: block;
          font-size: 12px;
          color: #c0c4cc;
          margin-top: 2px;
          transition: color 0.3s;
        }
      }

      .step-connector {
        flex: 1;
        height: 2px;
        background: #e4e7ed;
        margin: 0 24px;
        margin-top: 17px;
        min-width: 40px;
        transition: background 0.3s;
        &.active { background: #67c23a; }
      }
    }
  }

  // ===== 区块标题 =====
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    .el-icon {
      font-size: 20px;
      color: #409eff;
    }
  }

  // ===== Step 1: 模板选择 =====
  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
  }

  .template-card {
    background: #fff;
    border: 2px solid #ebeef5;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;

    &:hover {
      border-color: #c6e2ff;
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: #409eff;
      background: linear-gradient(135deg, #f0f9ff 0%, #fff 60%);
      box-shadow: 0 4px 20px rgba(64, 158, 255, 0.15);
    }

    .template-check {
      position: absolute;
      top: 12px;
      right: 12px;
      .checked-icon { font-size: 22px; color: #409eff; }
      .unchecked-icon { font-size: 22px; color: #dcdfe6; }
    }

    .template-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;

      &.repair_contract { background: #ecf5ff; color: #409eff; }
      &.service_agreement { background: #f0f9eb; color: #67c23a; }
      &.confidentiality { background: #fdf6ec; color: #e6a23c; }
      &.trade_contract { background: #fef0f0; color: #f56c6c; }
    }

    .template-body {
      flex: 1;
      min-width: 0;

      .template-name {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
      .template-desc {
        margin: 0 0 10px;
        font-size: 13px;
        color: #909399;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .template-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        .variable-count {
          font-size: 12px;
          color: #c0c4cc;
        }
      }
    }

    .preview-btn {
      width: 100%;
      margin-top: 0;
    }
  }

  // ===== Step 2: 表单 =====
  .create-form {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 24px;
      margin-bottom: 4px;
    }

    .form-grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .full-width {
      margin-bottom: 6px;
    }

    :deep(.el-form-item) {
      margin-bottom: 18px;
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      padding-bottom: 6px;
    }

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #dcdfe6 inset;
      border-radius: 8px;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 0 0 1px #409eff inset; }
    }

    :deep(.el-input.is-focused .el-input__wrapper),
    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #409eff inset;
    }

    :deep(.el-textarea__inner) {
      box-shadow: 0 0 0 1px #dcdfe6 inset;
      border-radius: 8px;
      &:focus { box-shadow: 0 0 0 1px #409eff inset; }
    }

    :deep(.el-input-number .el-input__wrapper) {
      border-radius: 8px;
    }

    :deep(.el-date-editor .el-input__wrapper) {
      border-radius: 8px;
    }
  }

  // ===== Step 3: 预览 =====
  .preview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    border-radius: 12px 12px 0 0;
    padding: 16px 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .contract-paper {
    background:
      linear-gradient(180deg, rgba(186, 162, 111, 0.12), rgba(186, 162, 111, 0) 130px),
      linear-gradient(90deg, rgba(122, 94, 48, 0.04), rgba(255, 255, 255, 0) 12%, rgba(255, 255, 255, 0) 88%, rgba(122, 94, 48, 0.04)),
      #fffdf8;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    min-height: 500px;
    border: 1px solid #d9ccad;

    .paper-header {
      text-align: center;
      padding: 40px 56px 24px;
      border-bottom: 1px solid #d8c9a6;

      .contract-title {
        margin: 0 0 10px;
        font-size: 30px;
        font-weight: 700;
        color: #2f2415;
        letter-spacing: 8px;
      }
      .contract-number {
        font-size: 13px;
        color: #7d6b4d;
        letter-spacing: 1px;
      }
    }

    .paper-content {
      padding: 36px 56px 42px;
      min-height: 400px;

      .rendered-content {
        line-height: 1.95;
        font-size: 15px;
        color: #2c241b;
        font-family: 'SimSun', 'STSong', 'Noto Serif SC', serif;
        letter-spacing: 0.3px;
      }

      .rendered-content :deep(.preview-section) {
        margin: 22px 0 10px;
        font-size: 17px;
        font-weight: 700;
        text-indent: 0;
      }

      .rendered-content :deep(.preview-meta) {
        margin: 0 0 8px;
        text-indent: 0;
      }

      .rendered-content :deep(.preview-paragraph),
      .rendered-content :deep(.preview-clause) {
        margin: 0 0 12px;
        text-indent: 2em;
      }

      .rendered-content :deep(.preview-spacer) {
        height: 12px;
      }
    }

    .paper-footer {
      text-align: center;
      padding: 16px 48px 24px;
      border-top: 1px solid #eadfca;
      p {
        margin: 0;
        font-size: 12px;
        color: #9c8b6f;
      }
    }
  }

  // ===== 底部操作栏 =====
  .bottom-actions {
    display: flex;
    align-items: center;
    margin-top: 24px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .spacer { flex: 1; }
  }

  // 模板预览对话框
  .dialog-template-preview {
    color: #2c241b;
    font-family: 'SimSun', 'STSong', 'Noto Serif SC', serif;
    line-height: 1.9;

    :deep(.preview-title) {
      margin: 0 0 18px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 6px;
    }

    :deep(.preview-section) {
      margin: 18px 0 10px;
      font-size: 16px;
      font-weight: 700;
    }

    :deep(.preview-meta) {
      margin: 0 0 8px;
    }

    :deep(.preview-paragraph),
    :deep(.preview-clause) {
      margin: 0 0 10px;
      text-indent: 2em;
    }

    :deep(.preview-spacer) {
      height: 10px;
    }
  }

  .dialog-template-preview-paper {
    max-height: 500px;
    overflow-y: auto;
    padding: 28px 32px;
    background: linear-gradient(180deg, #fcfbf7 0%, #fff 100%);
    border: 1px solid #ddd1b0;
    border-radius: 8px;
  }
}

// 动画
.animate-fade-in {
  animation: fadeInUp 0.35s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式
@media (max-width: 768px) {
  .contract-create-container {
    padding: 16px;

    .page-header {
      flex-direction: column;
      gap: 12px;
    }

    .step-progress {
      padding: 20px 16px;
      .step-item .step-info .step-desc { display: none; }
      .step-connector { margin: 0 12px; min-width: 20px; }
    }

    .template-grid {
      grid-template-columns: 1fr;
    }

    .form-grid {
      grid-template-columns: 1fr !important;
    }

    .contract-paper {
      .paper-content { padding: 24px 20px; }
      .paper-header { padding: 28px 20px 16px; }
    }
  }
}
</style>
