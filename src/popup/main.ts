import { createApp } from 'vue'
import PortalVue from 'portal-vue'
import VueMultiselect from 'vue-multiselect'
import App from './Popup.vue'
import '../styles'

const app = createApp(App)
app.use(PortalVue)
app.component(VueMultiselect)
app.mount('#app')
