# 前端开发指南

本文档介绍CMMS前端开发的规范和最佳实践。

---

## 📋 目录

- [项目结构](#项目结构)
- [编码规范](#编码规范)
- [开发流程](#开发流程)
- [组件开发](#组件开发)
- [状态管理](#状态管理)
- [性能优化](#性能优化)

---

## 🏗️ 项目结构

### 目录说明

```
frontend-web/
├── src/
│   ├── api/               # API接口封装
│   │   ├── request.js    # axios实例
│   │   ├── auth.js       # 认证接口
│   │   └── ...
│   ├── components/       # 公共组件
│   │   └── ...
│   ├── layout/           # 布局组件
│   │   └── Index.vue     # 主布局
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── stores/           # Pinia状态管理
│   │   └── auth.js
│   ├── styles/           # 全局样式
│   │   └── index.scss
│   ├── views/            # 页面组件
│   │   ├── login/        # 登录页
│   │   ├── dashboard/    # 仪表盘
│   │   └── ...
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

---

## 📝 编码规范

### Vue风格指南

遵循 [Vue官方风格指南](https://cn.vuejs.org/v2/style-guide/)。

#### 组件命名

```vue
<!-- 组件文件名：PascalCase -->
<!-- WorkOrderList.vue -->

<script>
export default {
  name: 'WorkOrderList' // PascalCase
}
</script>
```

#### 模板命名

```html
<!-- kebab-case -->
<work-order-list />
<device-card />
```

#### 变量命名

```javascript
// camelCase
const workOrderList = []
const currentPage = 1
const isLoading = false

// 常量：UPPER_SNAKE_CASE
const MAX_COUNT = 100
const API_BASE_URL = 'https://api.example.com'
```

### JavaScript规范

#### 使用const/let

```javascript
// ✅ 推荐
const apiUrl = 'https://api.example.com'
let currentPage = 1

// ❌ 避免
var apiUrl = 'https://api.example.com'
var currentPage = 1
```

#### 使用箭头函数

```javascript
// ✅ 推荐
const getData = async () => {
  const data = await api.getData()
  return data
}

// ❌ 避免
function getData() {
  return api.getData().then(function(data) {
    return data
  })
}
```

#### 使用模板字符串

```javascript
// ✅ 推荐
const message = `工单号：${orderNo}`

// ❌ 避免
const message = '工单号：' + orderNo
```

### CSS规范

#### 使用SCSS

```scss
// ✅ 推荐
.work-order-card {
  &__header {
    // ...
  }

  &__body {
    // ...
  }
}
```

#### BEM命名

```scss
/* Block */
.work-order-card {}

/* Element */
.work-order-card__header {}

/* Modifier */
.work-order-card--highlighted {}
```

---

## 🔄 开发流程

### 1. 创建API接口

```javascript
// src/api/workorder.js
import request from './request'

/**
 * 获取工单列表
 */
export function getWorkOrderList(params) {
  return request({
    url: '/workorders',
    method: 'get',
    params
  })
}

/**
 * 创建工单
 */
export function createWorkOrder(data) {
  return request({
    url: '/workorders',
    method: 'post',
    data
  })
}
```

### 2. 创建Pinia Store

```javascript
// src/stores/workorder.js
import { defineStore } from 'pinia'
import { getWorkOrderList } from '@/api/workorder'

export const useWorkOrderStore = defineStore('workorder', {
  state: () => ({
    list: [],
    current: null,
    loading: false
  }),

  getters: {
    totalCount: (state) => state.list.length
  },

  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getWorkOrderList(params)
        this.list = res.list || []
      } finally {
        this.loading = false
      }
    }
  }
})
```

### 3. 创建页面组件

```vue
<template>
  <div class="workorder-page">
    <el-card>
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="工单号">
          <el-input v-model="searchForm.order_no" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="order_no" label="工单号" />
        <el-table-column prop="fault_type" label="故障类型" />
        <!-- ... -->
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getWorkOrderList } from '@/api/workorder'

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  order_no: '',
  status: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getWorkOrderList(searchForm)
    tableData.value = res.list || []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.workorder-page {
  // ...
}
</style>
```

### 4. 配置路由

```javascript
// src/router/index.js
{
  path: 'workorders',
  name: 'WorkOrders',
  component: () => import('@/views/workorder/Index.vue'),
  meta: { title: '维修工单', icon: 'Tickets' }
}
```

---

## 🧩 组件开发

### 组件Props

```vue
<script setup>
// 定义Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>
```

### 组件Emits

```vue
<script setup>
// 定义Emits
const emit = defineEmits(['update', 'delete', 'change'])

// 使用emit
const handleChange = (value) => {
  emit('change', value)
}
</script>
```

### 组件Slots

```vue
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">
        <h3>{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
```

### 组件Expose

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

// 暴露给父组件
defineExpose({
  increment,
  count
})
</script>
```

---

## 🗃️ 状态管理

### Pinia Store定义

```javascript
// src/stores/auth.js
import { defineStore } from 'pinia'
import { login, logout } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.userInfo?.role_type
  },

  actions: {
    async login(username, password) {
      const res = await login({ username, password })
      this.token = res.token
      this.userInfo = res.user

      localStorage.setItem('token', res.token)
      localStorage.setItem('userInfo', JSON.stringify(res.user))
    },

    async logout() {
      await logout()
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
```

### Store使用

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 访问state
console.log(authStore.token)

// 访问getters
console.log(authStore.isLoggedIn)

// 调用actions
authStore.login('username', 'password')
</script>
```

---

## ⚡ 性能优化

### 1. 路由懒加载

```javascript
// ✅ 推荐
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')

// ❌ 避免
import Dashboard from '@/views/dashboard/Dashboard.vue'
```

### 2. 组件懒加载

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
</script>
```

### 3. 计算属性缓存

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps(['list'])

// ✅ 使用computed
const totalCount = computed(() => props.list.length)

// ❌ 避免在template中使用复杂表达式
</script>
```

### 4. 列表虚拟滚动

```vue
<!-- 对于大列表使用虚拟滚动 -->
<el-table-v2
  :columns="columns"
  :data="data"
  :width="700"
  :height="400"
/>
```

### 5. 防抖和节流

```javascript
import { debounce } from 'lodash-es'

// 防抖
const search = debounce((keyword) => {
  // 搜索逻辑
}, 300)
```

---

## 🎨 UI开发

### Element Plus使用

```vue
<template>
  <!-- 按钮 -->
  <el-button type="primary">主要按钮</el-button>
  <el-button type="success">成功按钮</el-button>
  <el-button type="warning">警告按钮</el-button>
  <el-button type="danger">危险按钮</el-button>

  <!-- 表单 -->
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
  </el-form>

  <!-- 表格 -->
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="age" label="年龄" />
  </el-table>

  <!-- 对话框 -->
  <el-dialog v-model="visible" title="标题">
    <p>内容</p>
  </el-dialog>
</template>
```

### 图标使用

```vue
<script setup>
import { Icon } from '@element-plus/icons-vue'
</script>

<template>
  <!-- 直接使用 -->
  <el-icon><Icon /></el-icon>

  <!-- 动态使用 -->
  <el-icon>
    <component :is="iconName" />
  </el-icon>
</template>
```

---

## 📊 ECharts使用

### 基础图表

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)
let chart = null

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption({
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: [120, 200, 150] }]
  })
})

onUnmounted(() => {
  chart?.dispose()
})
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>
```

### 响应式图表

```javascript
// 监听窗口大小变化
window.addEventListener('resize', () => {
  chart?.resize()
})
```

---

## 🔧 调试技巧

### 1. Vue DevTools

安装 [Vue DevTools](https://devtools.vuejs.org/) 浏览器插件。

### 2. Console调试

```javascript
// 输出数据
console.log(data)

// 输出表格
console.table(array)

// 分组输出
console.group('Group')
console.log('Info')
console.groupEnd()
```

### 3. 网络调试

```javascript
// 在request拦截器中添加日志
request.interceptors.request.use(config => {
  console.log('Request:', config)
  return config
})
```

---

## 📚 参考资源

- [Vue 3文档](https://cn.vuejs.org/)
- [Element Plus文档](https://element-plus.org/)
- [Pinia文档](https://pinia.vuejs.org/)
- [Vue Router文档](https://router.vuejs.org/)
- [Vite文档](https://cn.vitejs.dev/)
- [ECharts文档](https://echarts.apache.org/)
