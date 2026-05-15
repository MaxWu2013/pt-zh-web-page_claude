type BaseURL = {
  local?: string
  development: string
  alpha?: string
  beta?: string
  production: string
}

export type ServerEnv = keyof BaseURL

export type AppConfig = {
  readonly appName: string
  readonly domain: string
  readonly channel: 'oversea' | 'mainland'
  baseURL: BaseURL
  oss: string
  readonly download?: {
    readonly ios: string
    readonly android: string
  }
  readonly thinkingdata?: {
    appid: string
    devAppid: string
  }
}

export type User = {
  name: string
  uid: number
  icon: string
  token: string
  lan: string
  area: string
}

export type App = {
  config: AppConfig
  server_env: ServerEnv
  pkg: string
  web_proxy_port?: number
}
