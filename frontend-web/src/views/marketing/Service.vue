<template>
  <div class="service-container">
    <el-card shadow="never">
      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑客服配置
        </el-button>
      </div>

      <!-- 客服信息展示 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="客服电话">
          {{ serviceData.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="客服微信">
          {{ serviceData.wechat }}
        </el-descriptions-item>
        <el-descriptions-item label="客服QQ">
          {{ serviceData.qq }}
        </el-descriptions-item>
        <el-descriptions-item label="客服邮箱">
          {{ serviceData.email }}
        </el-descriptions-item>
        <el-descriptions-item label="工作时间" :span="2">
          {{ serviceData.work_time }}
        </el-descriptions-item>
        <el-descriptions-item label="客服二维码" :span="2">
          <el-image
            v-if="serviceData.qrcode"
            :src="serviceData.qrcode"
            :preview-src-list="[serviceData.qrcode]"
          preview-teleported
          :z-index="9999"
            fit="cover"
            style="width: 150px; height: 150px;"
          />
          <span v-else>未设置</span>
        </el-descriptions-item>
        <el-descriptions-item label="服务说明" :span="2">
          {{ serviceData.description }}
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="serviceData.status === 1 ? 'success' : 'danger'">
            {{ serviceData.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">
          {{ serviceData.updated_at }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑客服配置"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客服电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入客服电话" />
        </el-form-item>
        <el-form-item label="客服微信" prop="wechat">
          <el-input v-model="form.wechat" placeholder="请输入客服微信号" />
        </el-form-item>
        <el-form-item label="客服QQ" prop="qq">
          <el-input v-model="form.qq" placeholder="请输入客服QQ号" />
        </el-form-item>
        <el-form-item label="客服邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入客服邮箱" />
        </el-form-item>
        <el-form-item label="工作时间" prop="work_time">
          <el-input v-model="form.work_time" placeholder="例如：周一至周五 9:00-18:00" />
        </el-form-item>
        <el-form-item label="客服二维码" prop="qrcode">
          <SingleImageUpload v-model="form.qrcode" placeholder="上传客服二维码" />
        </el-form-item>
        <el-form-item label="服务说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入服务说明"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { getServiceConfig, updateServiceConfig } from '@/api/marketing'
import SingleImageUpload from '@/components/SingleImageUpload.vue'

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)

const serviceData = ref({
  phone: '',
  wechat: '',
  qq: '',
  email: '',
  work_time: '',
  qrcode: '',
  description: '',
  status: 1,
  updated_at: ''
})

const form = reactive({
  phone: '',
  wechat: '',
  qq: '',
  email: '',
  work_time: '',
  qrcode: '',
  description: '',
  status: 1
})

const rules = {
  phone: [{ required: true, message: '请输入客服电话', trigger: 'blur' }],
  work_time: [{ required: true, message: '请输入工作时间', trigger: 'blur' }]
}

const handleEdit = () => {
  Object.assign(form, serviceData.value)
  dialogVisible.value = true
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getServiceConfig()
    serviceData.value = res.data || {}
  } catch (error) {
    console.error('获取客服配置失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await updateServiceConfig(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.service-container {
  .toolbar {
    margin-bottom: 20px;
  }

  :deep(.el-descriptions) {
    .el-descriptions__label {
      width: 120px;
    }
  }
}
</style>
