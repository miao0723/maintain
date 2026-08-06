<template>
  <div class="agreement-container">
    <el-card shadow="never">
      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑协议
        </el-button>
        <el-button type="success" @click="handlePreview">
          <el-icon><View /></el-icon>
          预览
        </el-button>
      </div>

      <!-- 协议内容 -->
      <div class="agreement-content" v-if="agreement">
        <h2>{{ agreement.title }}</h2>
        <div class="content" v-html="agreement.content"></div>
        <div class="meta">
          <p>最后更新时间：{{ formatTime(agreement.updated_at) }}</p>
          <p>更新人：{{ agreement.updater || '系统' }}</p>
          <p v-if="agreement.version">版本号：{{ agreement.version }}</p>
        </div>
      </div>
      <el-empty v-else description="暂无协议内容" />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑免责协议"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="协议标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入协议标题" />
        </el-form-item>
        <el-form-item label="协议编码" prop="code" v-if="isEdit">
          <el-input v-model="form.code" placeholder="请输入协议编码" disabled />
          <el-text type="info" size="small">协议编码创建后不可修改</el-text>
        </el-form-item>
        <el-form-item label="协议内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入协议内容，支持 HTML 格式"
          />
          <div class="html-tip">
            <el-text type="info" size="small">
              提示：支持 HTML 标签，如 &lt;h2&gt; 标题&lt;/h2&gt;、&lt;p&gt; 段落&lt;/p&gt; 等
            </el-text>
          </div>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如：1.0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker
            v-model="form.effective_date"
            type="date"
            placeholder="选择生效日期"
            value-format="YYYY-MM-DD"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewData.title || '协议预览'"
      width="800px"
    >
      <div class="preview-content" v-html="previewData.content"></div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, View } from '@element-plus/icons-vue'
import { getAgreement, saveAgreement, updateAgreement, previewAgreement } from '@/api/agreement'

const dialogVisible = ref(false)
const previewVisible = ref(false)
const formRef = ref(null)
const submitting = ref(false)
const isEdit = ref(false)

const agreement = ref(null)
const previewData = ref({ title: '', content: '' })

const form = reactive({
  id: null,
  title: '',
  code: '',
  content: '',
  version: '1.0',
  status: 1,
  effective_date: '',
  remark: ''
})

const rules = {
  title: [{ required: true, message: '请输入协议标题', trigger: 'blur' }],
  code: [{ required: true, message: '请输入协议编码', trigger: 'blur' }],
  content: [{ required: true, message: '请输入协议内容', trigger: 'blur' }]
}

const fetchData = async () => {
  try {
    const res = await getAgreement()
    if (res.code === 200) {
      agreement.value = res.data
    }
  } catch (error) {
    console.error('获取协议失败:', error)
  }
}

const handleEdit = async () => {
  if (agreement.value) {
    isEdit.value = true
    Object.assign(form, {
      id: agreement.value.id,
      title: agreement.value.title,
      code: agreement.value.code || '',
      content: agreement.value.content,
      version: agreement.value.version || '1.0',
      status: agreement.value.status,
      effective_date: agreement.value.effective_date || '',
      remark: agreement.value.remark || ''
    })
  } else {
    isEdit.value = false
    // 新建协议
    Object.assign(form, {
      id: null,
      title: '',
      code: 'repair_disclaimer',
      content: '',
      version: '1.0',
      status: 1,
      effective_date: '',
      remark: ''
    })
  }
  dialogVisible.value = true
}

const handlePreview = async () => {
  if (!agreement.value) {
    ElMessage.warning('暂无协议内容')
    return
  }

  try {
    const res = await previewAgreement(agreement.value.id)
    if (res.code === 200) {
      previewData.value = res.data
      previewVisible.value = true
    }
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let res
    if (isEdit.value && form.id) {
      res = await updateAgreement(form.id, form)
    } else {
      res = await saveAgreement(form)
    }

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.agreement-container {
  .toolbar {
    margin-bottom: 20px;
  }

  .agreement-content {
    h2 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 24px;
      color: #303133;
    }

    .content {
      min-height: 400px;
      line-height: 1.8;
      padding: 30px;
      background: #f5f7fa;
      border-radius: 4px;

      :deep(h2) {
        font-size: 20px;
        margin: 20px 0 15px 0;
        color: #303133;
      }

      :deep(h3) {
        font-size: 16px;
        margin: 15px 0 10px 0;
        color: #606266;
      }

      :deep(p) {
        margin-bottom: 12px;
        text-indent: 2em;
        color: #606266;
      }

      :deep(ul), :deep(ol) {
        margin: 10px 0;
        padding-left: 30px;
      }

      :deep(li) {
        margin-bottom: 8px;
      }
    }

    .meta {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #909399;
      font-size: 14px;

      p {
        margin: 5px 0;
      }
    }
  }

  .html-tip {
    margin-top: 5px;
  }

  .preview-content {
    max-height: 500px;
    overflow-y: auto;
    line-height: 1.8;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;

    :deep(h2) {
      font-size: 18px;
      margin: 15px 0 10px 0;
      text-align: center;
    }

    :deep(p) {
      margin-bottom: 10px;
      text-indent: 2em;
    }
  }
}
</style>
