<template>
  <div class="contract-templates-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>合同模板管理</span>
          <div>
            <el-button type="success" :icon="Document" @click="handleImportOpen">从PDF导入</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增模板</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-section">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="模板名称">
            <el-input v-model="searchForm.name" placeholder="请输入模板名称" clearable />
          </el-form-item>
          <el-form-item label="模板类型">
            <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
              <el-option label="维修合同" value="repair_contract" />
              <el-option label="服务协议" value="service_agreement" />
              <el-option label="保密协议" value="confidentiality" />
              <el-option label="交易合同" value="trade_contract" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column prop="type" label="模板类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="variables" label="可用变量" width="200">
          <template #default="{ row }">
            <el-tag v-for="v in row.variables" :key="v.key" size="small" style="margin-right: 4px">
              {{ v.key }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑合同模板' : '新增合同模板'"
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择模板类型" style="width: 100%">
                <el-option label="维修合同" value="repair_contract" />
                <el-option label="服务协议" value="service_agreement" />
                <el-option label="保密协议" value="confidentiality" />
                <el-option label="交易合同" value="trade_contract" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
        </el-form-item>

        <el-divider>模板内容（支持使用变量，格式：{{变量名}}）</el-divider>

        <el-form-item label="模板内容" prop="content">
          <div class="template-editor">
            <div class="editor-toolbar">
              <div class="toolbar-row">
                <span class="hint">可用变量：</span>
                <el-tag
                  v-for="v in commonVariables"
                  :key="v.key"
                  size="small"
                  @click="insertVariable(v.key)"
                  style="cursor: pointer; margin-right: 6px"
                >
                  {{ v.label }} ({{ v.key }})
                </el-tag>
              </div>
              <div class="toolbar-row toolbar-actions">
                <span class="hint">正式模板：</span>
                <el-button size="small" @click="applyFormalTemplate('repair_contract')">维修合同范本</el-button>
                <el-button size="small" @click="applyFormalTemplate('trade_contract')">交易合同范本</el-button>
              </div>
            </div>
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="15"
              placeholder="请输入模板内容，可以使用 {{变量名}} 格式插入变量"
              style="font-family: monospace"
            />
          </div>
        </el-form-item>

        <el-form-item label="自定义变量" prop="custom_variables">
          <el-button type="primary" size="small" @click="addCustomVariable" :icon="Plus">添加变量</el-button>
          <div v-if="formData.custom_variables && formData.custom_variables.length > 0" style="margin-top: 10px">
            <div v-for="(v, index) in formData.custom_variables" :key="index" style="display: flex; gap: 10px; margin-bottom: 8px; align-items: center">
              <el-input v-model="v.key" placeholder="变量名" style="flex: 1" />
              <el-input v-model="v.label" placeholder="变量标签" style="flex: 1" />
              <el-input v-model="v.default" placeholder="默认值" style="flex: 1" />
              <el-button type="danger" size="small" @click="removeCustomVariable(index)">删除</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="模板详情" width="800px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="模板名称" :span="2">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="模板类型">{{ getTypeText(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detailData.description }}</el-descriptions-item>
        <el-descriptions-item label="可用变量" :span="2">
          <el-tag v-for="v in detailData.variables" :key="v.key" style="margin-right: 6px">
            {{ v.label }} ({{ v.key }})
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模板内容" :span="2">
          <div class="template-preview-paper">
            <div class="template-preview-content" v-html="formatContractPreview(detailData.content)"></div>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 从PDF导入合同模板对话框 -->
    <el-dialog v-model="importVisible" title="从 PDF 导入合同模板" width="900px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="导入方式">
          <el-radio-group v-model="importMode">
            <el-radio label="pdf">上传 PDF 合同</el-radio>
            <el-radio label="paste">粘贴合同文本</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="PDF 文件" v-if="importMode === 'pdf'">
          <el-upload
            drag
            accept=".pdf"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :disabled="importLoading"
            :on-change="handlePdfChange"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将 PDF 合同拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持文本型 PDF（可选中文字层）。扫描件 / 图片型 PDF 暂不支持自动识别，建议改用"粘贴合同文本"。
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="合同文本" v-if="importMode === 'paste'">
          <div style="width: 100%">
            <el-input
              v-model="pasteText"
              type="textarea"
              :rows="6"
              placeholder="请粘贴合同全文（从 PDF 阅读器中复制文本），系统将自动识别字段"
            />
            <el-button type="primary" size="small" :loading="importLoading" @click="handleParseText" style="margin-top: 8px">
              解析文本
            </el-button>
          </div>
        </el-form-item>

        <template v-if="importResult && importResult.fields && importResult.fields.length">
          <el-divider>识别到的字段（勾选需要作为模板变量的字段）</el-divider>
          <el-form-item label="字段">
            <el-checkbox-group v-model="importFieldKeys">
              <el-checkbox v-for="f in importResult.fields" :key="f.key" :label="f.key" border>
                {{ f.label }} <span style="color: #999">→ {{ f.key }}</span>
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>
        <el-alert
          v-else-if="importResult"
          type="info"
          :closable="false"
          title="未自动识别到字段，您可直接在下方编辑合同内容并手动添加 {{变量名}} 占位符。"
          style="margin-bottom: 12px"
        />

        <el-divider>模板设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称">
              <el-input v-model="importForm.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板类型">
              <el-select v-model="importForm.type" style="width: 100%">
                <el-option label="维修合同" value="repair_contract" />
                <el-option label="服务协议" value="service_agreement" />
                <el-option label="保密协议" value="confidentiality" />
                <el-option label="交易合同" value="trade_contract" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="importForm.description" type="textarea" :rows="2" placeholder="模板描述（选填）" />
        </el-form-item>
        <el-form-item label="合同内容">
          <el-input
            v-model="importResult.content"
            type="textarea"
            :rows="12"
            style="font-family: monospace"
            placeholder="在此编辑合同内容，使用 {{变量名}} 作为占位符"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">创建模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, UploadFilled } from '@element-plus/icons-vue'
import {
  getContractTemplateList,
  getContractTemplateDetail,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  importContractTemplatePdf,
  parseContractTemplateText
} from '@/api/contractTemplate'

const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const commonVariables = [
  { key: 'contract_number', label: '合同编号', default: '' },
  { key: 'customer_name', label: '客户名称', default: '' },
  { key: 'customer_phone', label: '客户电话', default: '' },
  { key: 'machine_type', label: '机械类型', default: '' },
  { key: 'service_content', label: '服务内容', default: '' },
  { key: 'annual_fee', label: '合同金额', default: '0' },
  { key: 'start_date', label: '开始日期', default: '' },
  { key: 'end_date', label: '结束日期', default: '' },
  { key: 'sign_date', label: '签订日期', default: '' },
  { key: 'company_name', label: '公司名称', default: '' },
  { key: 'company_address', label: '公司地址', default: '' },
  { key: 'company_phone', label: '公司电话', default: '' }
]

const searchForm = reactive({
  name: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: null,
  name: '',
  type: 'repair_contract',
  description: '',
  content: '',
  custom_variables: []
})

const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const detailData = ref(null)
const tableData = ref([])

const getTypeText = (type) => {
  const map = {
    repair_contract: '维修合同',
    service_agreement: '服务协议',
    confidentiality: '保密协议',
    trade_contract: '交易合同'
  }
  return map[type] || type
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.type) params.type = searchForm.type

    const res = await getContractTemplateList(pagination.page, pagination.pageSize, params)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      const data = res.data || {}
      tableData.value = data.items || data.list || []
      pagination.total = data.total || 0
    }
  } catch (error) {
    console.error('获取合同模板列表失败', error)
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
  searchForm.name = ''
  searchForm.type = ''
  handleSearch()
}

const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.type = 'repair_contract'
  formData.description = ''
  formData.content = getDefaultTemplateContent(formData.type)
  formData.custom_variables = []
}

const getDefaultTemplateContent = (type = 'repair_contract') => {
  if (type === 'trade_contract') {
    return `工业设备买卖合同

合同编号：{{contract_number}}
签订地点：{{sign_place}}
签订日期：{{sign_date}}

甲方（买方）：{{customer_name}}
联系电话：{{customer_phone}}

乙方（卖方）：{{company_name}}
联系电话：{{company_phone}}
联系地址：{{company_address}}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方在平等、自愿、诚实信用的基础上，就设备买卖事项达成如下协议，以资共同遵照履行。

一、合同标的
产品名称：{{product_name}}
规格型号：{{product_spec}}
数量：{{quantity}}
单价：人民币 {{unit_price}} 元
合同总价：人民币 {{total_amount}} 元

二、质量标准与技术要求
1. 乙方提供的产品应符合国家现行标准、行业标准及双方确认的技术要求。
2. 乙方应保证所供产品为合法合规、来源正当且适于合同约定用途的合格产品。
3. 具体质量要求如下：
{{quality_standard}}

三、交付安排
1. 交货日期：{{delivery_date}}
2. 交货地点：{{delivery_place}}
3. 交付方式：乙方按约定完成运输、交付及必要的随货资料移交。

四、验收方式
1. 甲方应在合理期限内依据合同约定对货物进行验收。
2. 验收标准及方式如下：
{{acceptance_method}}

五、结算与付款
双方同意按照如下方式进行结算与付款：
{{payment_method}}

六、违约责任
{{liability_terms}}

七、争议解决
{{dispute_resolution}}

八、附则
1. 本合同未尽事宜，由双方另行协商解决，必要时可签署补充协议。
2. 补充协议与本合同具有同等法律效力。
3. 本合同自双方签字或盖章之日起生效。
4. 本合同一式贰份，甲乙双方各执壹份，具有同等法律效力。

甲方（盖章/签字）：{{buyer_sign}}
签署日期：{{sign_date}}

乙方（盖章/签字）：{{seller_sign}}
签署日期：{{sign_date}}`
  }

  return `设备维修服务合同

合同编号：{{contract_number}}
签订日期：{{sign_date}}

甲方（委托方）：{{customer_name}}
联系电话：{{customer_phone}}

乙方（服务方）：{{company_name}}
联系电话：{{company_phone}}
联系地址：{{company_address}}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方就设备维修服务事项，经友好协商，订立本合同，以资共同遵守。

一、服务标的与内容
1. 服务设备类型：{{machine_type}}
2. 服务内容：
{{service_content}}

二、服务期限
本合同履行期限自 {{start_date}} 起至 {{end_date}} 止。具体实施进度由双方结合项目实际情况另行确认。

三、合同价款与结算
1. 本合同总金额为人民币 {{annual_fee}} 元。
2. 甲方应按照双方约定的付款节点及时向乙方支付合同价款。
3. 乙方在收到相应款项后，应按约履行维修、调试、交付及必要的售后服务义务。

四、双方权利与义务
1. 甲方应按约提供维修现场条件、基础资料及必要协助。
2. 乙方应根据维修规范和工艺要求组织实施维修服务，确保作业过程安全、规范、可追溯。
3. 乙方在维修过程中如发现新增故障或需更换重要部件，应及时书面或通过系统向甲方确认。

五、质量要求与验收
1. 乙方应保证所提供维修服务符合行业规范及双方确认的技术标准。
2. 维修完成后，双方应依据约定内容组织验收；验收合格后视为本阶段服务完成。
3. 对维修后约定的质保事项，乙方应在合理期限内承担相应责任。

六、违约责任
1. 任何一方未按本合同约定履行义务的，应承担相应违约责任，并赔偿给对方造成的实际损失。
2. 甲方逾期付款的，应按双方约定承担延期付款责任。
3. 乙方无正当理由延期履行或维修质量不符合约定的，应及时整改并承担相应责任。

七、争议解决
因履行本合同发生争议的，双方应先行协商解决；协商不成的，可依法向有管辖权的人民法院提起诉讼。

八、其他约定
1. 本合同未尽事宜，由双方另行协商确定，并可签署补充协议。
2. 补充协议与本合同具有同等法律效力。
3. 本合同自双方签字或盖章之日起生效。
4. 本合同一式贰份，甲乙双方各执壹份，具有同等法律效力。

甲方（盖章/签字）：____________________
乙方（盖章/签字）：____________________

签署日期：{{sign_date}}`
}

const applyFormalTemplate = (type) => {
  formData.type = type
  formData.content = getDefaultTemplateContent(type)
}

const formatContractPreview = (content = '') => {
  if (!content) return ''
  const lines = content.split('\n').map(line => line.trimEnd())
  return lines.map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return '<div class="preview-spacer"></div>'
    }
    if (index === 0 && /合同|协议/.test(trimmed)) {
      return `<h2 class="preview-title">${trimmed}</h2>`
    }
    if (/^[一二三四五六七八九十]+、/.test(trimmed)) {
      return `<h3 class="preview-section">${trimmed}</h3>`
    }
    if (/^\d+\./.test(trimmed)) {
      return `<p class="preview-clause">${trimmed}</p>`
    }
    if (/^甲方|^乙方|^合同编号|^签订地点|^签订日期|^联系电话|^联系地址|^产品名称|^规格型号|^数量|^单价|^合同总价/.test(trimmed)) {
      return `<p class="preview-meta">${trimmed}</p>`
    }
    return `<p class="preview-paragraph">${trimmed}</p>`
  }).join('')
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  try {
    const res = await getContractTemplateDetail(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      const data = res.data
      Object.assign(formData, data)
      if (!formData.custom_variables) {
        formData.custom_variables = []
      }
      isEdit.value = true
      dialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

const handleView = async (row) => {
  try {
    const res = await getContractTemplateDetail(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      detailData.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该合同模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await deleteContractTemplate(row.id)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const insertVariable = (key) => {
  const variable = `{{${key}}}`
  if (formData.content) {
    formData.content += variable
  } else {
    formData.content = variable
  }
}

const addCustomVariable = () => {
  if (!formData.custom_variables) {
    formData.custom_variables = []
  }
  formData.custom_variables.push({ key: '', label: '', default: '' })
}

const removeCustomVariable = (index) => {
  formData.custom_variables.splice(index, 1)
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 合并所有变量
  const allVariables = [...commonVariables]
  if (formData.custom_variables && formData.custom_variables.length > 0) {
    formData.custom_variables.forEach(v => {
      if (v.key) {
        allVariables.push({
          key: v.key,
          label: v.label || v.key,
          default: v.default || ''
        })
      }
    })
  }
  formData.variables = allVariables

  try {
    if (isEdit.value) {
      const res = await updateContractTemplate(formData.id, formData)
      if (res.code === 200 || res.code === 0 || res.code === 201) {
        ElMessage.success('模板更新成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      const res = await createContractTemplate(formData)
      if (res.code === 200 || res.code === 0 || res.code === 201) {
        ElMessage.success('模板创建成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('提交错误:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// ===== 从 PDF 导入 =====
const importVisible = ref(false)
const importMode = ref('pdf')
const importLoading = ref(false)
const pasteText = ref('')
const importResult = ref({ raw_text: '', content: '', fields: [] })
const importFieldKeys = ref([])
const importForm = reactive({
  name: '',
  type: 'repair_contract',
  description: ''
})

const handleImportOpen = () => {
  importVisible.value = true
  importMode.value = 'pdf'
  pasteText.value = ''
  importResult.value = { raw_text: '', content: '', fields: [] }
  importFieldKeys.value = []
  importForm.name = ''
  importForm.type = 'repair_contract'
  importForm.description = ''
}

const handlePdfChange = async (file) => {
  const raw = file.raw
  if (!raw) return
  if (raw.type !== 'application/pdf' && !raw.name.toLowerCase().endsWith('.pdf')) {
    ElMessage.error('仅支持 PDF 文件')
    return
  }
  importLoading.value = true
  try {
    const res = await importContractTemplatePdf(raw)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      applyImportResult(res.data)
    } else {
      ElMessage.error(res.message || 'PDF 解析失败')
    }
  } catch (error) {
    ElMessage.error(error.message || 'PDF 解析失败')
  } finally {
    importLoading.value = false
  }
}

const handleParseText = async () => {
  if (!pasteText.value.trim()) {
    ElMessage.warning('请先粘贴合同文本')
    return
  }
  importLoading.value = true
  try {
    const res = await parseContractTemplateText(pasteText.value)
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      applyImportResult(res.data)
    } else {
      ElMessage.error(res.message || '文本解析失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '文本解析失败')
  } finally {
    importLoading.value = false
  }
}

const applyImportResult = (data) => {
  importResult.value = {
    raw_text: data.raw_text || '',
    content: data.content || '',
    fields: data.fields || []
  }
  importFieldKeys.value = (data.fields || []).map((f) => f.key)
  if (data.fields && data.fields.length) {
    ElMessage.success(`已识别 ${data.fields.length} 个字段，请确认后创建模板`)
  } else {
    ElMessage.info('未自动识别到字段，您可手动编辑合同内容')
  }
}

const handleImportSubmit = async () => {
  if (!importForm.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (!importResult.value.content.trim()) {
    ElMessage.warning('合同内容不能为空')
    return
  }

  // 选中字段作为变量，并补充内容中出现的其他占位符
  const variables = (importResult.value.fields || [])
    .filter((f) => importFieldKeys.value.includes(f.key))
    .map((f) => ({ key: f.key, label: f.label, default: '' }))

  const keySet = new Set(variables.map((v) => v.key))
  const extraKeys = (importResult.value.content.match(/\{\{(\w+)\}\}/g) || [])
    .map((m) => m.replace(/[{}]/g, ''))
    .filter((k) => !keySet.has(k))
  extraKeys.forEach((k) => variables.push({ key: k, label: k, default: '' }))

  importLoading.value = true
  try {
    const res = await createContractTemplate({
      name: importForm.name.trim(),
      type: importForm.type,
      description: importForm.description,
      content: importResult.value.content,
      variables,
      custom_variables: []
    })
    if (res.code === 200 || res.code === 0 || res.code === 201) {
      ElMessage.success('模板创建成功')
      importVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    importLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// 当模板类型改变时，自动切换默认模板内容（仅新建时）
watch(() => formData.type, (newType) => {
  if (!isEdit.value && dialogVisible.value) {
    formData.content = getDefaultTemplateContent(newType)
  }
})
</script>

<style lang="scss" scoped>
.contract-templates-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-section {
    margin-bottom: 20px;
  }

  .pagination-section {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .template-editor {
    width: 100%;

    .editor-toolbar {
      padding: 10px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .toolbar-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
      }

      .toolbar-actions {
        padding-top: 6px;
        border-top: 1px dashed #d7deea;
      }

      .hint {
        color: #606266;
        font-size: 14px;
        margin-right: 10px;
      }
    }
  }

  .template-preview-paper {
    max-height: 420px;
    overflow-y: auto;
    padding: 28px 32px;
    background: linear-gradient(180deg, #fcfbf7 0%, #fff 100%);
    border: 1px solid #ddd1b0;
    border-radius: 8px;
  }

  .template-preview-content {
    color: #2b2417;
    font-family: 'SimSun', 'STSong', 'Noto Serif SC', serif;
    line-height: 1.9;

    :deep(.preview-title) {
      margin: 0 0 18px;
      text-align: center;
      font-size: 24px;
      letter-spacing: 5px;
      font-weight: 700;
    }

    :deep(.preview-section) {
      margin: 18px 0 10px;
      font-size: 16px;
      font-weight: 700;
    }

    :deep(.preview-meta) {
      margin: 0 0 8px;
      font-size: 14px;
    }

    :deep(.preview-paragraph),
    :deep(.preview-clause) {
      margin: 0 0 10px;
      font-size: 14px;
      text-indent: 2em;
    }

    :deep(.preview-spacer) {
      height: 10px;
    }
  }
}
</style>
