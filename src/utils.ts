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
  return obsidianRequest(
    await browser.storage.local.get('apiKey').then((result) => result.apiKey),
    `/vault/${filename}`,
    { method: 'get' },
    await browser.storage.local.get('isSecureMode').then((result) => result.isSecureMode),
  )
}

export async function writeFile(filename: string, text: string) {
  return obsidianRequest(
    await browser.storage.local.get('apiKey').then((result) => result.apiKey),
      `/vault/${filename}`,
      { method: 'put', body: text },
      await browser.storage.local.get('isSecureMode').then((result) => result.isSecureMode),
  )
    .then((res, err) => {
      if (err)
        console.error(`Error opening file: ${filename}. Check if it was removed.`, err)
      return res
    })
}
