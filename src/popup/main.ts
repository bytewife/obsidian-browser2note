import { createApp } from 'vue'
import PortalVue from 'portal-vue'
import VueMultiselect from 'vue-multiselect'
import ResizeTextarea from 'resize-textarea-vue3'
import App from './Popup.vue'
import '../styles'
import TextAreaResize from '~/components/TextAreaResize.vue'

const app = createApp(App)
app.use(PortalVue)
app.use(ResizeTextarea)
app.component(VueMultiselect)
app.mount('#app')
