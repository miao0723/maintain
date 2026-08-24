import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes = [
{
  path: '/mini-admin/login',
  name: 'MiniAdminLogin',
  redirect: '/login',
  meta: { title: '小程序后台登录', requiresMiniAdminAuth: false }
},
{
  path: '/mini-admin',
  name: 'MiniAdminRoot',
  component: () => import('@/layout/MiniAdminLayout.vue'),
  redirect: '/mini-admin/dashboard',
  meta: { requiresMiniAdminAuth: true },
  children: [
    {
      path: 'dashboard',
      name: 'MiniAdminDashboard',
      component: () => import('@/views/mini-admin/Dashboard.vue'),
      meta: { title: '工作台', icon: 'DataBoard' }
    },
    {
      path: 'orders',
      name: 'MiniAdminOrders',
      component: () => import('@/views/repair/MiniprogramOrders.vue'),
      meta: { title: '订单管理', icon: 'Tickets' }
    },
    {
      path: 'progress',
      name: 'MiniAdminProgress',
      component: () => import('@/views/repair/MiniprogramProgress.vue'),
      meta: { title: '进度管理', icon: 'Clock' }
    },
    {
      path: 'progress-media',
      name: 'MiniAdminProgressMedia',
      component: () => import('@/views/repair/MiniprogramProgressMedia.vue'),
      meta: { title: '进度媒体', icon: 'Film' }
    },
    {
      path: 'progress-apply',
      name: 'MiniAdminProgressApply',
      component: () => import('@/views/repair/ProgressApply.vue'),
      meta: { title: '进度申请', icon: 'DocumentAdd' }
    },
    {
      path: 'reviews',
      name: 'MiniAdminReviews',
      component: () => import('@/views/repair/OrderReviews.vue'),
      meta: { title: '评价管理', icon: 'ChatDotRound' }
    },
    {
      path: 'users',
      name: 'MiniAdminUsers',
      component: () => import('@/views/mini-admin/Users.vue'),
      meta: { title: '用户管理', icon: 'User' }
    },
    {
      path: 'addresses',
      name: 'MiniAdminAddresses',
      component: () => import('@/views/mini-admin/ResourceCrudPage.vue'),
      meta: { title: '地址管理', icon: 'Location', resource: 'addresses' }
    },
    {
      path: 'units',
      name: 'MiniAdminUnits',
      component: () => import('@/views/mini-admin/ResourceCrudPage.vue'),
      meta: { title: '单位管理', icon: 'OfficeBuilding', resource: 'units' }
    },
    {
      path: 'brands',
      name: 'MiniAdminBrands',
      component: () => import('@/views/mini-admin/ResourceCrudPage.vue'),
      meta: { title: '品牌管理', icon: 'CollectionTag', resource: 'brands' }
    },
    {
      path: 'device-types',
      name: 'MiniAdminDeviceTypes',
      component: () => import('@/views/mini-admin/ResourceCrudPage.vue'),
      meta: { title: '设备类型', icon: 'Cpu', resource: 'device-types' }
    },
    {
      path: 'common-problems',
      name: 'MiniAdminCommonProblems',
      component: () => import('@/views/mini-admin/CommonProblems.vue'),
      meta: { title: '常见问题', icon: 'QuestionFilled' }
    },
    {
      path: 'chats',
      name: 'MiniAdminChats',
      component: () => import('@/views/mini-admin/Chats.vue'),
      meta: { title: '客服会话', icon: 'Service', resource: 'chats' }
    },
    {
      path: 'payments',
      name: 'MiniAdminPayments',
      component: () => import('@/views/mini-admin/Payments.vue'),
      meta: { title: '支付记录', icon: 'Wallet', resource: 'payments' }
    },
    {
      path: 'configs',
      name: 'MiniAdminConfigs',
      component: () => import('@/views/mini-admin/ResourceCrudPage.vue'),
      meta: { title: '系统配置', icon: 'Tools', resource: 'configs' }
    },
    {
      path: 'sync-logs',
      name: 'MiniAdminSyncLogs',
      component: () => import('@/views/mini-admin/SyncLogs.vue'),
      meta: { title: '同步日志', icon: 'Document', resource: 'sync-logs' }
    }
  ]
},
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/login/Login.vue'),
  meta: { title: '登录', requiresAuth: false }
},
{
  path: '/',
  name: 'Index',
  component: () => import('@/layout/Index.vue'),
  redirect: '/dashboard',
  meta: { requiresAuth: true },
  children: [
  // 首页
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
    meta: { title: '首页', icon: 'Odometer' }
  },
  // 1. 基础管理模块
  {
    path: 'basic',
    name: 'Basic',
    component: () => import('@/modules/BasicModule.vue'),
    meta: { title: '基础管理', icon: 'Setting' },
    redirect: '/basic/users',
    children: [
    {
      path: 'users',
      name: 'Users',
      component: () => import('@/views/system/Users.vue'),
      meta: { title: '用户管理', icon: 'User' }
    },
    {
      path: 'roles',
      name: 'Roles',
      component: () => import('@/views/system/Roles.vue'),
      meta: { title: '角色管理', icon: 'UserFilled' }
    },
    {
      path: 'permissions',
      name: 'Permissions',
      component: () => import('@/views/system/Permissions.vue'),
      meta: { title: '权限管理', icon: 'Lock' }
    },
    {
      path: 'personnel',
      name: 'Personnel',
      component: () => import('@/views/system/Personnel.vue'),
      meta: { title: '人员管理', icon: 'Avatar' }
    },
    {
      path: 'organizations',
      name: 'Organizations',
      component: () => import('@/views/system/Organizations.vue'),
      meta: { title: '单位管理', icon: 'OfficeBuilding' }
    },
    {
      path: 'logs',
      name: 'Logs',
      component: () => import('@/views/system/Logs.vue'),
      meta: { title: '日志管理', icon: 'Document' }
    },
    {
      path: 'params',
      name: 'Params',
      component: () => import('@/views/system/Params.vue'),
      meta: { title: '参数管理', icon: 'Operation' }
    }
    ]
  },
  // 2. 业务管理模块
  {
    path: 'business',
    name: 'Business',
    component: () => import('@/modules/BusinessModule.vue'),
    meta: { title: '业务管理', icon: 'Briefcase' },
    redirect: '/business/agreement',
    children: [
    {
      path: 'agreement',
      name: 'Agreement',
      component: () => import('@/views/business/Agreement.vue'),
      meta: { title: '免责协议管理', icon: 'Document' }
    },
    {
      path: 'content',
      name: 'Content',
      component: () => import('@/views/business/Content.vue'),
      meta: { title: '常见问题管理', icon: 'Edit' }
    },
    {
      path: 'binding',
      name: 'Binding',
      component: () => import('@/views/business/Binding.vue'),
      meta: { title: '绑定/解绑', icon: 'Link' }
    }
    ]
  },
  // 3. 引流模块
  {
    path: 'marketing',
    name: 'Marketing',
    component: () => import('@/modules/MarketingModule.vue'),
    meta: { title: '引流模块', icon: 'TrendCharts' },
    redirect: '/marketing/cases',
    children: [
    {
      path: 'cases',
      name: 'Cases',
      component: () => import('@/views/marketing/Cases.vue'),
      meta: { title: '成功案例', icon: 'Star' }
    },
    {
      path: 'service',
      name: 'CustomerService',
      component: () => import('@/views/marketing/Service.vue'),
      meta: { title: '人工客服', icon: 'Service' }
    },
    {
      path: 'douyin',
      name: 'Douyin',
      component: () => import('@/views/marketing/Douyin.vue'),
      meta: { title: '抖音获客', icon: 'VideoPlay' }
    },
    {
      path: 'xiaohongshu',
      name: 'Xiaohongshu',
      component: () => import('@/views/marketing/Xiaohongshu.vue'),
      meta: { title: '小红书获客', icon: 'Picture' }
    },
    {
      path: 'kuaishou',
      name: 'Kuaishou',
      component: () => import('@/views/marketing/Kuaishou.vue'),
      meta: { title: '快手获客', icon: 'VideoPlay' }
    },
    {
      path: 'bilibili',
      name: 'Bilibili',
      component: () => import('@/views/marketing/Bilibili.vue'),
      meta: { title: 'B站获客', icon: 'VideoPlay' }
    },
    {
      path: 'partners',
      name: 'Partners',
      component: () => import('@/views/marketing/Partners.vue'),
      meta: { title: '合作企业', icon: 'OfficeBuilding' }
    }
    ]
  },
  // 4. 维修业务模块
  {
    path: 'repair',
    name: 'Repair',
    component: () => import('@/modules/RepairModule.vue'),
    meta: { title: '维修业务', icon: 'Tools' },
    redirect: '/repair/categories',
    children: [
    {
      path: 'categories',
      name: 'Categories',
      component: () => import('@/views/repair/Categories.vue'),
      meta: { title: '机械种类管理', icon: 'Menu' }
    },
    {
      path: 'machines',
      name: 'Machines',
      component: () => import('@/views/repair/Machines.vue'),
      meta: { title: '机械名称管理', icon: 'Monitor' }
    },
    {
      path: 'orders',
      name: 'Orders',
      component: () => import('@/views/repair/OrderManagement.vue'),
      meta: { title: '订单管理', icon: 'Tickets' },
      redirect: '/repair/orders/miniprogram',
      children: [
      {
        path: 'miniprogram',
        name: 'MiniprogramOrders',
        component: () => import('@/views/repair/MiniprogramOrders.vue'),
        meta: { title: '小程序订单', icon: 'Iphone' }
      },
      {
        path: 'manual',
        name: 'ManualOrders',
        component: () => import('@/views/repair/ManualOrders.vue'),
        meta: { title: '手动创建订单', icon: 'Plus' }
      }
      ,
      {
        path: 'reviews',
        name: 'OrderReviews',
        component: () => import('@/views/repair/OrderReviews.vue'),
        meta: { title: '订单评价', icon: 'ChatDotRound' }
      }
      ]
    },
    {
      path: 'order-devices',
      name: 'OrderDevices',
      component: () => import('@/views/repair/OrderDevices.vue'),
      meta: { title: '设备信息', icon: 'Cpu' }
    },
    {
      path: 'test-report',
      name: 'TestReport',
      component: () => import('@/views/repair/TestReportManagement.vue'),
      meta: { title: '检测报告', icon: 'DocumentChecked' },
      redirect: '/repair/test-report/records',
      children: [
      {
        path: 'records',
        name: 'TestReportRecords',
        component: () => import('@/views/repair/TestReport.vue'),
        meta: { title: '检测记录', icon: 'List' }
      },
      {
        path: 'quote',
        name: 'RepairQuote',
        component: () => import('@/views/repair/RepairQuote.vue'),
        meta: { title: '维修报价单', icon: 'Money' }
      },
      {
        path: 'fee',
        name: 'DetectionFee',
        component: () => import('@/views/repair/DetectionFee.vue'),
        meta: { title: '检测费用', icon: 'Wallet' }
      }
      ]
    },
    {
      path: 'measure-report',
      name: 'MeasureReport',
      component: () => import('@/views/repair/TestReport.vue'),
      meta: { title: '测试报告', icon: 'DataAnalysis' }
    },
    {
      path: 'repair-report',
      name: 'RepairReport',
      component: () => import('@/views/repair/RepairReport.vue'),
      meta: { title: '维修报告', icon: 'Document' }
    },
    {
      path: 'contract',
      name: 'Contract',
      component: () => import('@/views/repair/ContractList.vue'),
      meta: { title: '合同管理', icon: 'Tickets' },
      redirect: '/repair/contract/list',
      children: [
      {
        path: 'list',
        name: 'ContractList',
        component: { render() { return null } },
        meta: { title: '合同列表', icon: 'List' }
      },
      {
        path: 'create',
        name: 'ContractCreate',
        component: () => import('@/views/repair/ContractCreate.vue'),
        meta: { title: '合同创建', icon: 'DocumentAdd' }
      },
      {
        path: 'templates',
        name: 'ContractTemplates',
        component: () => import('@/views/repair/ContractTemplates.vue'),
        meta: { title: '合同模板', icon: 'DocumentCopy' }
      }
      ]
    },
    {
      path: 'reminder',
      name: 'Reminder',
      component: () => import('@/views/repair/Reminder.vue'),
      meta: { title: '维修提醒', icon: 'Bell' }
    },
    {
      path: 'external',
      name: 'External',
      component: () => import('@/views/repair/External.vue'),
      meta: { title: '联动维修', icon: 'Connection' }
    },
    {
      path: 'progress',
      name: 'Progress',
      component: () => import('@/views/repair/ProgressManagement.vue'),
      meta: { title: '维修进度', icon: 'Clock' },
      redirect: '/repair/progress/list',
      children: [
      {
        path: 'list',
        name: 'ProgressList',
        component: () => import('@/views/repair/MiniprogramProgress.vue'),
        meta: { title: '订单进度', icon: 'List' }
      },
      {
        path: 'apply',
        name: 'ProgressApply',
        component: () => import('@/views/repair/ProgressApply.vue'),
        meta: { title: '进度申请', icon: 'DocumentAdd' }
      },
      {
        path: 'photo',
        name: 'ProgressPhoto',
        component: () => import('@/views/repair/ProgressPhoto.vue'),
        meta: { title: '进度照片', icon: 'Picture' }
      },
      {
        path: 'video',
        name: 'ProgressVideo',
        component: () => import('@/views/repair/ProgressVideo.vue'),
        meta: { title: '进度视频', icon: 'VideoPlay' }
      },
      {
        path: 'media',
        name: 'MiniprogramProgressMedia',
        component: () => import('@/views/repair/MiniprogramProgressMedia.vue'),
        meta: { title: '小程序进度媒体', icon: 'Film' }
      },
      ]
    }
    ]
  },
  // 5. 支付模块
  {
    path: 'payment',
    name: 'Payment',
    component: () => import('@/modules/PaymentModule.vue'),
    meta: { title: '支付模块', icon: 'Wallet' },
    redirect: '/payment/transfer',
    children: [
    {
      path: 'transfer',
      name: 'Transfer',
      component: () => import('@/views/payment/Transfer.vue'),
      meta: { title: '小程序订单分析', icon: 'DataAnalysis' }
    },
    {
      path: 'online',
      name: 'Online',
      component: () => import('@/views/payment/Online.vue'),
      meta: { title: '维修订单', icon: 'Iphone' }
    },
    {
      path: 'alipay-test',
      name: 'AlipayTest',
      component: () => import('@/views/payment/AlipayTest.vue'),
      meta: { title: '支付宝测试', icon: 'CreditCard' }
    },
    {
      path: 'invoice',
      name: 'Invoice',
      component: () => import('@/views/payment/Invoice.vue'),
      meta: { title: '发票管理', icon: 'Tickets' }
    }
    ]
  },
  // 6. 进销存模块
  {
    path: 'inventory',
    name: 'Inventory',
    component: () => import('@/modules/InventoryModule.vue'),
    meta: { title: '进销存', icon: 'Box' },
    redirect: '/inventory/parts',
    children: [
    {
      path: 'parts',
      name: 'Parts',
      component: () => import('@/views/inventory/Parts.vue'),
      meta: { title: '配件管理', icon: 'Goods' }
    },
    {
      path: 'suppliers',
      name: 'Suppliers',
      component: () => import('@/views/inventory/Suppliers.vue'),
      meta: { title: '供应商管理', icon: 'Van' }
    }
    ]
  },
  // 7. 查询统计模块
  {
    path: 'statistics',
    name: 'Statistics',
    component: () => import('@/modules/StatisticsModule.vue'),
    meta: { title: '查询统计', icon: 'DataAnalysis' },
    redirect: '/statistics/income',
    children: [
    {
      path: 'income',
      name: 'Income',
      component: () => import('@/views/statistics/Income.vue'),
      meta: { title: '收入统计', icon: 'TrendCharts' }
    },
    {
      path: 'expense',
      name: 'Expense',
      component: () => import('@/views/statistics/Expense.vue'),
      meta: { title: '开支统计', icon: 'DataLine' }
    },
    {
      path: 'order-stats',
      name: 'OrderStats',
      component: () => import('@/views/statistics/OrderStats.vue'),
      meta: { title: '订单统计', icon: 'Tickets' }
    },
    {
      path: 'timeout',
      name: 'Timeout',
      component: () => import('@/views/statistics/Timeout.vue'),
      meta: { title: '超时统计', icon: 'Clock' }
    }
    ]
  },
  // 8. 知识库模块
  {
    path: 'knowledge',
    name: 'Knowledge',
    component: () => import('@/modules/KnowledgeModule.vue'),
    meta: { title: '知识库', icon: 'Reading' },
    redirect: '/knowledge/collections',
    children: [
    {
      path: 'collections',
      name: 'KbCollections',
      component: () => import('@/views/knowledge/Collections.vue'),
      meta: { title: '知识库管理', icon: 'Folder' }
    },
    {
      path: 'collections/:id',
      name: 'KbDetail',
      component: () => import('@/views/knowledge/KnowledgeDetail.vue'),
      meta: { title: '知识库详情', icon: 'Document', hidden: true }
    },
    {
      path: 'chat',
      name: 'KbChat',
      component: () => import('@/views/knowledge/Chat.vue'),
      meta: { title: 'AI 对话', icon: 'ChatDotRound' }
    }
    ]
  },
  // 9. 系统智能体
  {
    path: 'agent',
    name: 'Agent',
    component: () => import('@/modules/AgentModule.vue'),
    meta: { title: 'Agent', icon: 'ChatDotSquare' },
    redirect: '/agent/index',
    children: [
    {
      path: 'index',
      name: 'AgentIndex',
      component: () => import('@/views/agent/Index.vue'),
      meta: { title: '系统智能体', icon: 'ChatDotSquare' }
    }
    ]
  },
  // 通知消息（隐藏菜单）
  {
    path: 'notifications',
    name: 'Notifications',
    component: () => import('@/views/notification/Index.vue'),
    meta: { title: '通知消息', icon: 'Bell', hidden: true }
  }
  ]
},
{
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '页面不存在' }
}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  NProgress.start()

  const authStore = useAuthStore()

  // 确保从 localStorage 加载认证信息
  if (!authStore.token && !authStore.userInfo) {
    authStore.loadAuthFromStorage()
  }

  console.log('路由守卫:', to.path)
  console.log('isLoggedIn:', authStore.isLoggedIn)
  console.log('token:', authStore.token)
  console.log('userInfo:', authStore.userInfo)

  const requiresMiniAdminAuth = to.matched.some(record => record.meta.requiresMiniAdminAuth === true)
  if (requiresMiniAdminAuth) {
    if (!authStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    next()
    return
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else if (to.name === 'MiniAdminLogin') {
    next(authStore.isLoggedIn
      ? { name: 'MiniAdminDashboard' }
      : { name: 'Login', query: { redirect: to.query.redirect || '/mini-admin/dashboard' } })
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
