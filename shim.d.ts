import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'highlight-input': { tabId: number }
    'tab-prev': { title: string | undefined }
    'highlight-to-textbox': { text: string }
    'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>
  }
}
