<template>
  <div class="single-image-upload">
    <div v-if="!disabled" class="upload-container">
      <!-- 图片预览区 -->
      <div v-if="imageUrl || uploadedPreview" class="image-preview-area">
        <el-image
          :src="getPreviewUrl()"
          fit="contain"
          :preview-src-list="[getPreviewUrl()]"
          preview-teleported
          class="preview-image"
        />
        <div class="preview-overlay">
          <el-button size="small" @click="showUrlDialog = true">
            <el-icon><Edit /></el-icon>
            修改URL
          </el-button>
          <el-button size="small" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>

      <!-- 上传占位符 -->
      <div v-else class="upload-placeholder" @click="handleUpload">
        <el-icon><Plus /></el-icon>
        <span>{{ placeholder }}</span>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
    </div>

    <!-- 禁用状态展示 -->
    <div v-else-if="imageUrl" class="image-preview-area disabled">
      <el-image :src="imageUrl" fit="contain" :preview-src-list="[imageUrl]" preview-teleported />
    </div>

    <!-- URL输入对话框 -->
    <el-dialog v-model="showUrlDialog" title="修改图片URL" width="500px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="当前URL">
          <el-input :value="imageUrl || '无'" disabled />
        </el-form-item>
        <el-form-item label="新URL">
          <el-input v-model="tempUrl" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item label="或上传">
          <el-button @click="handleUploadFromDialog">
            <el-icon><Upload /></el-icon>
            选择本地文件
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUrlDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUrlChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { uploadFile } from '@/api/system'
import { ElMessage } from 'element-plus'
import { Plus, Upload, Edit, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '上传图片'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'loading'])

const imageUrl = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fileInputRef = ref(null)
const uploadedPreview = ref('')
const tempUrl = ref('')
const showUrlDialog = ref(false)

// 获取预览URL（优先显示刚上传的本地预览）
const getPreviewUrl = () => {
  return uploadedPreview.value || imageUrl.value
}

// 处理文件上传
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('请上传图片文件')
    return
  }

  emit('loading', true)

  try {
    // 创建本地预览URL
    const localPreview = URL.createObjectURL(file)
    uploadedPreview.value = localPreview

    // 上传到服务器
    const res = await uploadFile(file, (percent) => {
      ElMessage.info(`上传中...${percent}%`)
    })

    // 上传成功后更新URL
    imageUrl.value = res.data.url || res.data

    // 延迟释放本地预览URL（等待图片加载）
    setTimeout(() => {
      if (uploadedPreview.value === localPreview) {
        URL.revokeObjectURL(localPreview)
        uploadedPreview.value = ''
      }
    }, 3000)

    ElMessage.success('上传成功')

    // 清空文件输入，允许重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
    uploadedPreview.value = ''
  } finally {
    emit('loading', false)
  }
}

// 触发文件选择对话框
const handleUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 从对话框中上传
const handleUploadFromDialog = () => {
  handleUpload()
}

// 删除图片
const handleDelete = () => {
  uploadedPreview.value = ''
  imageUrl.value = ''
  ElMessage.success('图片已删除')
}

// 处理URL修改
const handleUrlChange = () => {
  if (tempUrl.value.trim()) {
    imageUrl.value = tempUrl.value.trim()
    ElMessage.success('URL已更新')
  } else {
    ElMessage.warning('请输入有效的图片URL')
    return
  }
  showUrlDialog.value = false
  tempUrl.value = ''
}
</script>

<style lang="scss" scoped>
.single-image-upload {
  position: relative;
  display: inline-block;

  .upload-container {
    display: block;
  }

  .image-preview-area {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #dcdfe6;

    .preview-image {
      width: 100%;
      height: 100%;

      :deep(.el-image__inner) {
        width: 100%;
        height: 100%;
      }
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s;

      .el-button {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 8px 12px;

        &:hover {
          background: #fff;
        }
      }
    }

    &:hover .preview-overlay {
      opacity: 1;
    }

    &.disabled {
      cursor: default;
    }
  }

  .upload-placeholder {
    width: 150px;
    height: 150px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #8c939d;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      color: #409eff;
      background: #f0f9ff;
    }

    .el-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    span {
      font-size: 12px;
    }
  }
}
</style>
