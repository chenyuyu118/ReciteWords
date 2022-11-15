import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ConfigView from "../views/ConfigView.vue";
import PanelView from "../views/PanelView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "努力背单词",
      component: HomeView
    },
    {
      path: "/config",
      name: "设置",
      component: ConfigView
    },
    {
      path: "/panel",
      name: "面板",
      component: PanelView
    }
  ]
});

export default router;
