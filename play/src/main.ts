import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import elpUI from "@elp-ui/components";
const app = createApp(App);
app.use(elpUI);
app.mount("#app");
