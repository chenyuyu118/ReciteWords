import { createApp, onMounted } from "vue";
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus, { ElMessage } from "element-plus";
import 'element-plus/dist/index.css'
import './assets/main.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import piniaPersist from 'pinia-plugin-persist'

const app = createApp(App)

const pinia = createPinia();
pinia.use(piniaPersist)
app.use(pinia)
app.use(router)
app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')





