import { inject, provide, type InjectionKey } from 'vue'
import type { PluginConfig } from '../types'

export const PluginContextKey: InjectionKey<PluginConfig> = Symbol('PluginContext')

export function providePlugins(plugins: PluginConfig) {
  provide(PluginContextKey, plugins)
}

export function usePlugins(): PluginConfig {
  return inject(PluginContextKey, {})
}
