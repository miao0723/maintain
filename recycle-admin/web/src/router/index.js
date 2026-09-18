import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '数据看板', icon: 'Odometer' } },
      { path: 'screen', name: 'Screen', component: () => import('../views/Screen.vue'), meta: { title: '数据大屏', icon: 'DataLine' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '回收订单', icon: 'List' } },
      { path: 'catalog', name: 'Catalog', component: () => import('../views/Catalog.vue'), meta: { title: '设备配价库', icon: 'PriceTag' } },
      { path: 'platforms', name: 'Platforms', component: () => import('../views/Platforms.vue'), meta: { title: '回收平台管理', icon: 'Shop' } },
      { path: 'links', name: 'Links', component: () => import('../views/Links.vue'), meta: { title: '采购链接管理', icon: 'Link' } },
      { path: 'pricing', name: 'Pricing', component: () => import('../views/Pricing.vue'), meta: { title: '估价配置', icon: 'SetUp' } },
      { path: 'logs', name: 'Logs', component: () => import('../views/Logs.vue'), meta: { title: '操作日志', icon: 'Notebook' } },
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '系统设置', icon: 'Setting' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  // BASE_URL 由 vite base 配置注入，子路径部署时路由自动带上前缀
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('recycle_admin_token')
  if (to.path !== '/login' && !token) {
    // 记录原始目标，登录（含 SSO 自动登录）后原路返回
    next({ path: '/login', query: to.path === '/' ? {} : { redirect: to.fullPath } })
  } else {
    document.title = to.meta.title ? `${to.meta.title} - 回收综合服务平台` : '回收综合服务平台'
    next()
  }
})

export default router
