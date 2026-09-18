import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 暗色模式变量（<html class="dark"> 时生效），配合 styles/dark.css
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './styles/dark.css'
import { initTheme } from './utils/theme'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')

// 初始化主题（与维修后台共用 'theme' 键，同源自动同步）
initTheme()
