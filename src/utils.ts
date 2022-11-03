import { apiKey, isSecureMode } from '~/logic'

// This file contains various web utils, which interact with the Obsidian local REST API plugin.

// Borrowed from `coddingtonbear/obsidian-web`.
export async function obsidianRequest(
  apiKey: string,
  path: string,
  options: RequestInit,
  insecureMode: boolean,
): ReturnType<typeof fetch> {
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${apiKey}`,
    },
    method: options.method?.toUpperCase(),
    mode: 'cors',
  }

  return fetch(
      `http${insecureMode ? '' : 's'}://127.0.0.1:${
          insecureMode ? '27123' : '27124'
      }${path}`,
      requestOptions,
  ).then((response) => {
    return response
  })
}

export async function readDirectory() {
  return readFromFile('')
}

export async function readFromFile(filename: string) {
  // TODO: Get secure mode working.
  return obsidianRequest(
    await browser.storage.local.get('apiKey').then((result) => result.apiKey),
    `/vault/${filename}`,
    { method: 'get' },
    !isSecureMode.value,
  )
}

export async function writeFile(filename: string, text: string) {
  return obsidianRequest(
      await browser.storage.local.get('apiKey').then((result) => result.apiKey),
      `/vault/${filename}`,
      { method: 'put', body: text },
      !isSecureMode.value,
  )
    .then((res, err) => {
      if (err)
        console.error(`Error opening file: ${filename}. Check if it was removed.`, err)
      return res
    })
}
