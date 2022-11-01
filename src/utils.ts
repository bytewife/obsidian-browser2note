import { apiKey } from '~/logic'

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
  )
}

export async function readDirectory() {
  return readFromFile('')
}

export async function readFromFile(filename: string) {
  // TODO: Get secure mode working.
    console.log('filename ',filename)
  return obsidianRequest(
    apiKey.value,
    `/vault/${filename}`,
    { method: 'get' },
    true,
  )
    .then((res, err) => {
      if (err)
        console.error(`Error opening file: ${filename}. Check if it was removed.`, err)
      return res
    })
}

export async function writeFile(filename: string, text: string) {
  return obsidianRequest(
    apiKey.value,
      `/vault/${filename}`,
      { method: 'put', body: text },
      true,
  )
    .then((res, err) => {
      if (err)
        console.error(`Error opening file: ${filename}. Check if it was removed.`, err)
      return res
    })
}
