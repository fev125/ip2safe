import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Axios配置
import axios from 'axios'
import authService from './services/authService'

// 设置axios默认配置
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000'
axios.interceptors.request.use(config => {
  const token = authService.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
          accent: '#4CAF50',
        },
      },
    },
  },
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')
