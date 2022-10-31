export interface ExtensionLocalSettings {
  version: string
  apiKey: string
  insecureMode?: boolean
}

export interface StatusResponse {
  status: string
  versions: {
    obsidian: string
    self: string
  }
  service: string
  authenticated: boolean
}
