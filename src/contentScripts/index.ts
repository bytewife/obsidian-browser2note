/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge'
import { createApp } from 'vue'
import App from './views/App.vue'
import { generateFragment } from './external/fragment-generation-utils'
import { browserAction } from "webextension-polyfill";
// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value

(() => {
  // Converts a browser window selection into a 'go to highlight`-style link.
  // Note: as of writing this, those links are not natively supported on Firefox.
  function getLinkToSelected(selection): string | null {
    const result = generateFragment(selection)
    const url = `${location.origin}${location.pathname}${location.search}`
    if (result.status === 0) {
      const fragment = result.fragment
      const prefix = fragment.prefix
        ? `${encodeURIComponent(fragment.prefix)}-,`
        : ''
      const suffix = fragment.suffix
        ? `,-${encodeURIComponent(fragment.suffix)}`
        : ''
      const textStart = encodeURIComponent(fragment.textStart)
      const textEnd = fragment.textEnd
        ? `,${encodeURIComponent(fragment.textEnd)}`
        : ''

      return `${url}#:~:text=${prefix}${textStart}${textEnd}${suffix}`
    }
    else {
      return null
    }
  }

  console.info('[obsidian-browser2note] Hello world from content script')

  // Grabs the highlight from the browser content and sends it to the popup.
  onMessage('highlight-input', async ({ data }) => {
    const tabId = data.tabId
    const highlightText = window.getSelection() ? window.getSelection()!.toString() : ''
    const url = getLinkToSelected(window.getSelection())
    sendMessage('highlight-to-textbox', { text: highlightText, url }, { context: 'popup', tabId })
  })

  // mount component to context window
  const container = document.createElement('div')
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  createApp(App).mount(root)
})()
