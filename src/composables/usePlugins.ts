import { inject, provide, type InjectionKey } from 'vue'
import type { StreamdownPlugin } from '../types/plugin'

export const PluginContextKey: InjectionKey<Record<string, StreamdownPlugin>> =
  Symbol('PluginContext')

export function providePlugins(plugins: Record<string, StreamdownPlugin>) {
  provide(PluginContextKey, plugins)
}

export function usePlugins(): Record<string, StreamdownPlugin> {
  return inject(PluginContextKey, {})
}
