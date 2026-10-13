import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import App from './App.vue'
import router from './router'
import { usePermStore } from './stores/permission'
import '@/styles/index.scss'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 按钮级权限指令：v-permission="'system.personnel.create'"
// 无权限时移除该元素（老板/超管恒 true）
app.directive('permission', {
  mounted(el, binding) {
    try {
      const perm = usePermStore()
      if (!perm.can(binding.value)) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } catch (e) { /* pinia 未就绪时默认保留 */ }
  }
})

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
