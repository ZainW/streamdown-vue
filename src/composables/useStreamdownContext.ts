import { inject, provide, computed, type InjectionKey, type ComputedRef } from 'vue'
import type { StreamdownContext } from '../types'

const defaultContext: StreamdownContext = {
  controls: { code: { copy: true, download: true }, table: { copy: true, download: true } },
  isAnimating: false,
  mode: 'streaming',
  shikiTheme: ['github-light', 'github-dark'],
  prefix: '',
}

export const StreamdownContextKey: InjectionKey<ComputedRef<StreamdownContext>> = Symbol('StreamdownContext')

export function provideStreamdownContext(ctx: ComputedRef<StreamdownContext>) {
  provide(StreamdownContextKey, ctx)
}

export function useStreamdownContext(): StreamdownContext {
  const ref = inject(StreamdownContextKey, undefined)
  return ref ? ref.value : defaultContext
}
