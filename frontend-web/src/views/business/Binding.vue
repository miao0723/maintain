<template>
  <div class="binding-container">
    <el-card shadow="never">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 人员部门绑定 -->
        <el-tab-pane label="人员部门绑定" name="personnel-department">
          <PersonnelDepartmentBinding ref="personnelDepartmentRef" />
        </el-tab-pane>

        <!-- 工程师用户绑定 -->
        <el-tab-pane label="工程师用户绑定" name="engineer-user">
          <EngineerUserBinding ref="engineerUserRef" />
        </el-tab-pane>

        <!-- 用户角色绑定 -->
        <el-tab-pane label="用户角色绑定" name="user-role">
          <UserRoleBinding ref="userRoleRef" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PersonnelDepartmentBinding from './binding/PersonnelDepartmentBinding.vue'
import EngineerUserBinding from './binding/EngineerUserBinding.vue'
import UserRoleBinding from './binding/UserRoleBinding.vue'

const activeTab = ref('personnel-department')
const personnelDepartmentRef = ref(null)
const engineerUserRef = ref(null)
const userRoleRef = ref(null)

const handleTabChange = (tabName) => {
  // 标签切换时刷新数据
  if (tabName === 'personnel-department' && personnelDepartmentRef.value) {
    personnelDepartmentRef.value.fetchData()
  } else if (tabName === 'engineer-user' && engineerUserRef.value) {
    engineerUserRef.value.fetchData()
  } else if (tabName === 'user-role' && userRoleRef.value) {
    userRoleRef.value.fetchData()
  }
}
</script>

<style lang="scss" scoped>
.binding-container {
  padding: 20px;

  :deep(.el-tabs__content) {
    padding-top: 20px;
  }
}
</style>
