<template>
  <div class="image-upload">
    <div class="image-list">
      <div v-for="(url, index) in imageList" :key="index" class="image-item">
        <el-image :src="url" fit="cover" :preview-src-list="imageList" />
        <div v-if="!disabled" class="delete-btn" @click="handleDelete(index)">
          <el-icon><Close /></el-icon>
        </div>
      </div>
      <div v-if="!disabled && imageList.length < maxCount" class="upload-btn" @click="handleUpload">
        <el-icon><Plus /></el-icon>
        <span>上传图片</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { uploadFile } from '@/api/system'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 3
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const imageList = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const url = await uploadFile(file, (percent) => {
        ElMessage.info(`上传中...${percent}%`)
      })
      imageList.value = [...imageList.value, url]
      ElMessage.success('上传成功')
    } catch (error) {
      ElMessage.error('上传失败')
    }
  }
  input.click()
}

const handleDelete = (index) => {
  imageList.value.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.image-upload {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .image-item {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #dcdfe6;

    .el-image {
      width: 100%;
      height: 100%;
    }

    .delete-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      .el-icon {
        color: #fff;
        font-size: 14px;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.8);
      }
    }
  }

  .upload-btn {
    width: 100px;
    height: 100px;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #8c939d;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }

    .el-icon {
      font-size: 28px;
      margin-bottom: 5px;
    }

    span {
      font-size: 12px;
    }
  }
}
</style>
