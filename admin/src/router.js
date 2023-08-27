import Vue from 'vue'
import Router from 'vue-router'
import firebase from 'firebase/app'
import 'firebase/auth'

Vue.use(Router)

// export default new Router({
const router = new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/pages',
      component: () => import('@/views/pages/Index'),
      children: [
        // {
        //   name: 'Lock',
        //   path: 'lock',
        //   component: () => import('@/views/pages/Lock'),
        // },
        {
          name: 'Login',
          path: 'login',
          component: () => import('@/views/pages/Login'),
        },
        // {
        //   name: 'Pricing',
        //   path: 'pricing',
        //   component: () => import('@/views/pages/Pricing'),
        // },
        // {
        //   name: 'Register',
        //   path: 'register',
        //   component: () => import('@/views/pages/Register'),
        // },
      ],
    },
    {
      path: '/',
      component: () => import('@/views/dashboard/Index'),
      children: [
        // Dashboard
        // {
        //   name: 'HOME',
        //   path: '',
        //   component: () => import('@/views/dashboard/Dashboard'),
        //   meta: { requiresAuth: true },
        // },
        // // Pages
        // {
        //   name: 'RTL',
        //   path: 'pages/rtl',
        //   component: () => import('@/views/dashboard/pages/Rtl'),
        // },
        // {
        //   name: 'User Profile',
        //   path: 'pages/user',
        //   component: () => import('@/views/dashboard/pages/UserProfile'),
        // },
        // {
        //   name: 'Timeline',
        //   path: 'pages/timeline',
        //   component: () => import('@/views/dashboard/pages/Timeline'),
        // },
        // // Components
        // {
        //   name: 'Buttons',
        //   path: 'components/buttons',
        //   component: () => import('@/views/dashboard/component/Buttons'),
        // },
        // {
        //   name: 'Grid System',
        //   path: 'components/grid-system',
        //   component: () => import('@/views/dashboard/component/Grid'),
        // },
        // {
        //   name: 'Tabs',
        //   path: 'components/tabs',
        //   component: () => import('@/views/dashboard/component/Tabs'),
        // },
        // {
        //   name: 'Notifications',
        //   path: 'components/notifications',
        //   component: () => import('@/views/dashboard/component/Notifications'),
        // },
        // {
        //   name: 'Icons',
        //   path: 'components/icons',
        //   component: () => import('@/views/dashboard/component/Icons'),
        // },
        // {
        //   name: 'Typography',
        //   path: 'components/typography',
        //   component: () => import('@/views/dashboard/component/Typography'),
        // },
        // // Forms
        // {
        //   name: 'Regular Forms',
        //   path: 'forms/regular',
        //   component: () => import('@/views/dashboard/forms/RegularForms'),
        // },
        // {
        //   name: 'Extended Forms',
        //   path: 'forms/extended',
        //   component: () => import('@/views/dashboard/forms/ExtendedForms'),
        // },
        // {
        //   name: 'Validation Forms',
        //   path: 'forms/validation',
        //   component: () => import('@/views/dashboard/forms/ValidationForms'),
        // },
        // {
        //   name: 'Wizard',
        //   path: 'forms/wizard',
        //   component: () => import('@/views/dashboard/forms/Wizard'),
        // },
        // // Tables
        {
          name: 'Regular Tables',
          path: 'tables/regular-tables',
          component: () => import('@/views/dashboard/tables/RegularTables'),
        },
        {
          name: 'Extended Tables',
          path: 'tables/extended-tables',
          component: () => import('@/views/dashboard/tables/ExtendedTables'),
        },
        {
          name: 'Data Tabels',
          path: 'tables/data-tables',
          component: () => import('@/views/dashboard/tables/DataTables'),
        },
        // // Maps
        // {
        //   name: 'Google Maps',
        //   path: 'maps/google-maps',
        //   component: () => import('@/views/dashboard/maps/GoogleMaps'),
        // },
        // {
        //   name: 'Full Screen Map',
        //   path: 'maps/full-screen-map',
        //   component: () => import('@/views/dashboard/maps/FullScreenMap'),
        // },
        // Root level
        {
          name: 'ぼくデリ店舗管理画面',
          path: '',
          component: () => import('@/views/admin/Home'),
          meta: { requiresAuth: true },
        },
        // {
        //   name: 'Login',
        //   path: 'login',
        //   component: () => import('@/views/pages/Login'),
        // },
        {
          name: '店舗設定',
          path: 'SHOP',
          component: () => import('@/views/admin/Shop'),
          meta: { requiresAuth: true },
        },
        {
          name: 'メニュー設定',
          path: 'MENU',
          component: () => import('@/views/admin/Menu'),
          meta: { requiresAuth: true },
        },
        {
          name: 'オプション設定',
          path: 'Option',
          component: () => import('@/views/admin/Option'),
          meta: { requiresAuth: true },
        },
        {
          name: 'オプション編集',
          path: 'OptionEdit',
          component: () => import('@/views/admin/OptionEdit'),
          meta: { requiresAuth: true },
        },
        {
          name: '注文一覧',
          path: 'ORDER',
          component: () => import('@/views/admin/Order'),
          meta: { requiresAuth: true },
        },
        {
          name: 'AnalyticsOrder',
          path: 'AnalyticsOrder',
          component: () => import('@/views/admin/AnalyticsOrder'),
          meta: { requiresAuth: true },
        },
        {
          name: 'AnalyticsCart',
          path: 'AnalyticsCart',
          component: () => import('@/views/admin/AnalyticsCart'),
          meta: { requiresAuth: true },
        },
        // {
        //   name: 'Widgets',
        //   path: 'widgets',
        //   component: () => import('@/views/dashboard/Widgets'),
        //   meta: { requiresAuth: true },
        // },
        // {
        //   name: 'Charts',
        //   path: 'charts',
        //   component: () => import('@/views/dashboard/Charts'),
        //   meta: { requiresAuth: true },
        // },
        // {
        //   name: 'Calendar',
        //   path: 'calendar',
        //   component: () => import('@/views/dashboard/Calendar'),
        // },
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
