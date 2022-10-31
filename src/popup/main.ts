import { createApp } from 'vue'
import PortalVue from 'portal-vue'
import App from './Popup.vue'
import '../styles'

const app = createApp(App)
app.use(PortalVue)
app.mount('#app')
