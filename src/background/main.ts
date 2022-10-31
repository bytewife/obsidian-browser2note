import { onMessage, sendMessage } from 'webext-bridge'
import type { Tabs } from 'webextension-polyfill'
import { browserAction, commands } from "webextension-polyfill";

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

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
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
  } else if (command === 'Test Highlight') {
    let tabId = (await browser.tabs.query({active: true, currentWindow: true}))[0].id!
    sendMessage('test-highlight', { title: 'abc' }, { context: 'content-script', tabId })
  }
})
