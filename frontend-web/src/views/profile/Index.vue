<template>
  <div class="profile-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">个人中心</div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            :before-upload="beforeAvatarUpload"
            :auto-upload="false"
          >
            <img v-if="form.avatar" :src="form.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon" :size="50"><Plus /></el-icon>
          </el-upload>
          <p class="avatar-tip">点击头像更换</p>
        </div>

        <!-- 基本信息 -->
        <div class="info-section">
          <el-divider content-position="left">基本信息</el-divider>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" disabled />
            </el-form-item>

            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="form.real_name" placeholder="请输入姓名" />
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>

            <el-form-item label="部门">
              <el-input v-model="form.department_name" disabled />
            </el-form-item>

            <el-form-item label="角色">
              <el-tag :type="getRoleType(form.role_type)">
                {{ getRoleName(form.role_type) }}
              </el-tag>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">
                保存修改
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <!-- 修改密码 -->
    <el-card shadow="never" class="password-card">
      <template #header>
        <div class="card-header">修改密码</div>
      </template>

      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password />
        </el-form-item>

        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="passwordLoading" @click="handlePasswordChange">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { updateUser } from '@/api/users'
import { changePassword } from '@/api/auth'

const authStore = useAuthStore()
const router = useRouter()

const formRef = ref(null)
const passwordFormRef = ref(null)
const loading = ref(false)
const passwordLoading = ref(false)

const form = reactive({
  id: null,
  username: '',
  real_name: '',
  phone: '',
  email: '',
  avatar: '',
  department_name: '',
  role_type: 4
})

const rules = {
  real_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  old_password: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getRoleName = (roleType) => {
  const roleMap = {
    1: '超级管理员',
    2: '管理员',
    3: '维修工程师',
    4: '普通用户'
  }
  return roleMap[roleType] || '未知'
}

const getRoleType = (roleType) => {
  const typeMap = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info'
  }
  return typeMap[roleType] || 'info'
}

const initForm = () => {
  const userInfo = authStore.userInfo || {}
  Object.assign(form, {
    id: userInfo.id || null,
    username: userInfo.username || '',
    real_name: userInfo.real_name || '',
    phone: userInfo.phone || '',
    email: userInfo.email || '',
    avatar: userInfo.avatar || '',
    department_name: userInfo.department_name || '',
    role_type: userInfo.role_type || 4
  })
}

const handleAvatarChange = (file) => {
  if (file.raw) {
    // 这里应该上传头像到服务器
    // 暂时使用本地预览
    const reader = new FileReader()
    reader.readAsDataURL(file.raw)
    reader.onload = () => {
      form.avatar = reader.result
    }
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await updateUser(form.id, form)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      // 更新store中的用户信息
      authStore.userInfo = { ...authStore.userInfo, ...form }
      localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo))
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  initForm()
  formRef.value?.clearValidate()
}

const handlePasswordChange = async () => {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  passwordLoading.value = true
  try {
    const res = await changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      await authStore.logout()
      router.push({ name: 'Login' })
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (error) {
    console.error('密码修改失败:', error)
    ElMessage.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  initForm()
})
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;

  .el-card {
    margin-bottom: 20px;
    animation: slideIn 0.3s ease-out;
  }

  .card-header {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .profile-content {
    display: flex;
    gap: 30px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    min-width: 200px;

    .avatar-uploader {
      .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 50%;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
        }
      }
    }

    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      margin-top: 46px;
      margin-bottom: 46px;
    }

    .avatar-tip {
      margin-top: 15px;
      font-size: 14px;
      color: #909399;
      text-align: center;
    }
  }

  .info-section {
    flex: 1;

    .el-divider {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .el-form {
      .el-form-item {
        margin-bottom: 20px;
      }
    }
  }

  .password-card {
    .el-form {
      max-width: 500px;
      margin: 0 auto;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .profile-container {
    padding: 15px;

    .avatar-section {
      width: 100%;
      min-width: auto;
    }
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 10px;

    .avatar-section {
      .avatar {
        width: 100px;
        height: 100px;
      }
    }
  }
}
</style>
