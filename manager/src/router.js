import Vue from 'vue'
import Router from 'vue-router'
import firebase from 'firebase/app'
import 'firebase/auth'

Vue.use(Router)

// export default new Router({
const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/pages',
      component: () => import('@/views/pages/Index'),
      children: [
        {
          name: 'Login',
          path: 'login',
          component: () => import('@/views/pages/Login'),
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/views/dashboard/Index'),
      children: [
        // Root level
        {
          name: '運営マネージャー',
          path: '',
          component: () => import('@/views/admin/Home'),
          meta: { requiresAuth: true },
        },
        {
          name: 'ShopList',
          path: 'ShopList',
          component: () => import('@/views/admin/ShopList'),
          meta: { requiresAuth: true },
        },
        {
          name: 'EventList',
          path: 'EventList',
          component: () => import('@/views/admin/EventList'),
          meta: { requiresAuth: true },
        },
        {
          name: 'Menu',
          path: 'ShopList/Menu',
          component: () => import('@/views/admin/Menu'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '*',
      component: () => import('@/views/pages/Index'),
      children: [
        {
          name: '404 Error',
          path: '',
          component: () => import('@/views/pages/Error'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  if (requiresAuth) {
    // このルートはログインされているかどうか認証が必要です。
    // もしされていないならば、ログインページにリダイレクトします。
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        next()
      } else {
        next({
          path: '/pages/login',
          query: { redirect: to.fullPath },
        })
      }
    })
  } else {
    next() // next() を常に呼び出すようにしてください!
  }
})

export default router
