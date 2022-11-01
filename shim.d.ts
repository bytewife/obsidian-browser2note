import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'sync-previous-filename': { filename: string }
    'sync-previous-line-number': { lineNumber: number }
    'highlight-input': { tabId: number }
    'tab-prev': { title: string | undefined }
    'highlight-to-textbox': { text: string, url: string | null }
    'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>
  }
}
