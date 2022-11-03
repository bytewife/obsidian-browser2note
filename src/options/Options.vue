<script setup lang="ts">
import { apiKey, isSecureMode } from '~/logic/storage'

const apiKeyTemp = ref(apiKey.value)
browser.storage.local.get('apiKey').then((res) => apiKeyTemp.value = res.apiKey)

const isSecureModeTemp = ref(isSecureMode.value)
browser.storage.local.get('isSecureMode').then((res) => isSecureMode.value = res.isSecureMode)

async function syncApiKey() {
  browser.storage.local.set({ apiKey: apiKeyTemp.value })
}

async function syncIsSecureMode(event) {
  browser.storage.local.set({ isSecureMode: event.target.checked })
}
</script>
<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <img src="/assets/icon.svg" class="icon-btn mx-2 text-2xl" alt="extension icon">
    <div>Options</div>
    <p class="mt-2 opacity-50">
      This is the options page
    </p>

    <div>
      <div>Secure Mode <input v-model="isSecureModeTemp" type="checkbox" @input="syncIsSecureMode($event)"></div>
      <div>API Key <input v-model="apiKeyTemp" class="border border-gray-400 rounded px-2 py-1 mt-2" @input="syncApiKey"></div>
    </div>

    <div class="mt-4">
      Powered by Vite <pixelarticons-zap class="align-middle inline-block" />
    </div>
  </main>
</template>
