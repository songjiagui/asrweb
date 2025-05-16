import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus';
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import store from './store'

createApp(App).use(store).use(router).use(ElementPlus, {
    locale: zhCn,
  }).mount('#app')
