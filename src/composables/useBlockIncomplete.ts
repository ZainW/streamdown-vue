import { inject, provide, type InjectionKey, type Ref } from 'vue'

export const BlockIncompleteKey: InjectionKey<Ref<boolean>> = Symbol('BlockIncomplete')

export function provideBlockIncomplete(isIncomplete: Ref<boolean>) {
  provide(BlockIncompleteKey, isIncomplete)
}

export function useBlockIncomplete(): Ref<boolean> | undefined {
  return inject(BlockIncompleteKey, undefined)
}
