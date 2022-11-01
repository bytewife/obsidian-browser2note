import { onMessage, sendMessage } from 'webext-bridge'
import type { Tabs } from 'webextension-polyfill'
import { browserAction, commands } from 'webextension-polyfill'
import { selectedFileCached, selectedLineNumberCached } from "~/logic";

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

// Handle shortcuts.
commands.onCommand.addListener(async (command) => {
  // console.log(browser.tabs.executeScript(tabId, {file: '../../dist/contentScripts/index.global.js'}).then(
  //   (res) => {
  //     console.log(res)
  //   }
  // ))
  // eslint-disable-next-line no-console
  console.log('Command:', command)
  if (command === 'Open Note Prompt') {
    browserAction.openPopup()
  }
  else if (command === 'Test Highlight') {
    const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
    sendMessage('highlight-input', { tabId }, { context: 'content-script', tabId })
  }
})

// Cache selected file settings from previous popup.
let selectedFileTemp = ''
let selectedLineNumberTemp = -1
onMessage('sync-previous-filename', async ({ data }) => {
  selectedFileTemp = data.filename
})

onMessage('sync-previous-line-number', async ({ data }) => {
  selectedLineNumberTemp = data.lineNumber
})

browser.runtime.onConnect.addListener((externalPort) => {
  externalPort.onDisconnect.addListener(() => {
    selectedFileCached.value = selectedFileTemp
    selectedLineNumberCached.value = selectedLineNumberTemp
  })
})

