import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import HomeView from '../views/HomeView.vue'
import ConfigView from '../views/ConfigView.vue'
import AboutView from '../views/AboutView.vue'
import PanelView from '../views/PanelView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: '努力背单词',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/config',
      name: "设置",
      component: ConfigView
    },
    {
      path: '/panel',
      name: '面板',
      component: PanelView
    }
  ]
})

export default router
