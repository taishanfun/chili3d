import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { loadUiConfig } from "./uiConfig";

const uiConfig = await loadUiConfig();
createApp(App, { uiConfig }).mount("#host");
