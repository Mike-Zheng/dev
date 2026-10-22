import { createApp } from 'vue'
import '@fontsource-variable/noto-sans'
import '@fontsource-variable/noto-sans-tc'
import './style.css'
import App from './App.vue'
import { router } from './router'
import './tools'

createApp(App).use(router).mount('#app')
