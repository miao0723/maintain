<template>
  <div class="image-drag-upload" :class="{ 'is-disabled': disabled }">
    <div
      v-if="!disabled"
      class="upload-area"
      :class="{ 'is-dragover': isDragOver }"
      @dragenter.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="handleUploadClick"
    >
      <!-- 有图片时显示预览 -->
      <div v-if="imageUrl || uploadedPreview" class="image-preview-container">
        <el-image
          :src="getPreviewUrl()"
          fit="contain"
          :preview-src-list="[getPreviewUrl()]"
          preview-teleported
          class="preview-image"
        />
        <div class="preview-actions">
          <el-button-group>
            <el-button size="small" @click.stop="showUrlDialog = true">
              <el-icon><Edit /></el-icon>
              URL
            </el-button>
            <el-button size="small" @click.stop="handleDelete">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </el-button-group>
        </div>
        <div class="change-hint">
          <el-icon><Refresh /></el-icon>
          <span>点击或拖拽更换图片</span>
        </div>
      </div>

      <!-- 无图片时显示上传提示 -->
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <p class="primary-text">{{ placeholder }}</p>
          <p class="hint-text">点击上传或将图片拖拽至此</p>
        </div>
      </div>
    </div>

    <!-- 禁用状态 -->
    <div v-else-if="imageUrl" class="preview-only">
      <el-image :src="imageUrl" fit="contain" :preview-src-list="[imageUrl]" preview-teleported />
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- URL输入对话框 -->
    <el-dialog v-model="showUrlDialog" title="修改图片URL" width="500px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="当前URL">
          <el-input :value="imageUrl || '无'" disabled />
        </el-form-item>
        <el-form-item label="新URL">
          <el-input v-model="tempUrl" placeholder="请输入图片URL（支持http://或相对路径）" />
        </el-form-item>
        <el-form-item label="或上传">
          <el-button @click="handleUploadFromDialog">
            <el-icon><Upload /></el-icon>
            选择本地文件
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              <div style="font-size: 12px;">
                输入外部URL直接使用，或上传本地文件保存到服务器
              </div>
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleUrlDialogClose">取消</el-button>
        <el-button type="primary" @click="handleUrlChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { uploadFile } from '@/api/system'
import { ElMessage } from 'element-plus'
import { Upload, Edit, Delete, Refresh } from '@element-plus/icons-vue'

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
  },
  // 文件大小限制（MB）
  maxSize: {
    type: Number,
    default: 10
  },
  // 支持的图片类型
  acceptTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  }
})

const emit = defineEmits(['update:modelValue', 'loading', 'upload-success'])

const imageUrl = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fileInputRef = ref(null)
const uploadedPreview = ref('')
const tempUrl = ref('')
const showUrlDialog = ref(false)
const isDragOver = ref(false)

// 获取预览URL（优先显示刚上传的本地预览）
const getPreviewUrl = () => {
  return uploadedPreview.value || imageUrl.value
}

// 处理文件上传
const handleFileUpload = async (file) => {
  if (!file) return

  // 验证文件类型
  if (!props.acceptTypes.includes(file.type)) {
    ElMessage.error(`不支持的文件类型：${file.type}`)
    return
  }

  // 验证文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024
  if (file.size > maxSizeBytes) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return
  }

  emit('loading', true)

  try {
    // 创建本地预览URL
    const localPreview = URL.createObjectURL(file)
    uploadedPreview.value = localPreview

    // 上传到服务器
    const res = await uploadFile(file, (percent) => {
      // 可以在这里显示上传进度
    })

    // 上传成功后更新URL
    const newUrl = res.data.url || res.data
    imageUrl.value = newUrl

    // 释放本地预览URL（延迟以确保图片已加载）
    setTimeout(() => {
      if (uploadedPreview.value === localPreview) {
        URL.revokeObjectURL(localPreview)
        uploadedPreview.value = ''
      }
    }, 3000)

    ElMessage.success('图片上传成功')
    emit('upload-success', newUrl)

    // 清空文件输入，允许重复选择同一文件
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error(error.response?.data?.message || '上传失败，请重试')
    uploadedPreview.value = ''
  } finally {
    emit('loading', false)
  }
}

// 处理文件选择
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    await handleFileUpload(file)
  }
}

// 触发文件选择对话框
const handleUploadClick = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// 从对话框中上传
const handleUploadFromDialog = () => {
  handleUploadClick()
}

// 处理拖拽上传
const handleDrop = async (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    await handleFileUpload(file)
  }
}

// 删除图片
const handleDelete = () => {
  uploadedPreview.value = ''
  imageUrl.value = ''
  ElMessage.success('图片已删除')
}

// 处理URL修改
const handleUrlChange = () => {
  const url = tempUrl.value.trim()

  if (!url) {
    ElMessage.warning('请输入图片URL')
    return
  }

  // 验证URL格式
  if (!url.match(/^(https?:\/\/|\/)/)) {
    ElMessage.warning('URL格式不正确，请使用 http:// 或相对路径')
    return
  }

  imageUrl.value = url
  ElMessage.success('URL已更新')
  showUrlDialog.value = false
  tempUrl.value = ''
}

// 关闭URL对话框
const handleUrlDialogClose = () => {
  showUrlDialog.value = false
  tempUrl.value = ''
}

// 监听对话框打开，初始化临时URL
watch(showUrlDialog, (newVal) => {
  if (newVal) {
    tempUrl.value = imageUrl.value || ''
  }
})
</script>

<style lang="scss" scoped>
.image-drag-upload {
  display: inline-block;

  &.is-disabled {
    cursor: default;
  }

  .upload-area {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    &:hover {
      .change-hint {
        opacity: 1;
      }
    }

    &.is-dragover {
      border: 2px dashed #409eff;
      background: #f0f9ff;
    }
  }

  .image-preview-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: #f5f7fa;

    .preview-image {
      width: 100%;
      height: 100%;

      :deep(.el-image__inner) {
        width: 100%;
        height: 100%;
      }
    }

    .preview-actions {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
      display: flex;
      justify-content: center;

      .el-button-group {
        .el-button {
          background: rgba(255, 255, 255, 0.9);
          border: none;

          &:hover {
            background: #fff;
            transform: translateY(-2px);
          }
        }
      }
    }

    .change-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 12px 20px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;

      .el-icon {
        font-size: 24px;
      }

      span {
        font-size: 13px;
        text-align: center;
      }
    }
  }

  .upload-placeholder {
    width: 100%;
    height: 100%;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8c939d;
    transition: all 0.3s;
    background: #fafafa;

    .upload-icon {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 12px;
    }

    .upload-text {
      text-align: center;

      .primary-text {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin: 0 0 6px 0;
      }

      .hint-text {
        font-size: 12px;
        color: #909399;
        margin: 0;
      }
    }
  }

  .preview-only {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #dcdfe6;

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
