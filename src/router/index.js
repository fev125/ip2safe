import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: {
      title: '管理后台'
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'IP 信息查询'
  
  // 检查管理后台的访问权限
  if (to.path === '/admin') {
    const token = localStorage.getItem('admin_token')
    if (!token && to.name === 'Admin') {
      // 如果没有登录且访问管理页面，允许访问（因为有内部登录验证）
      next()
    }
  }
  next()
})

export default router
