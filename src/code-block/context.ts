import { inject, provide, type InjectionKey } from 'vue'

export interface CodeBlockContext {
  code: string
  language: string
  isIncomplete: boolean
}

export const CodeBlockContextKey: InjectionKey<CodeBlockContext> = Symbol('CodeBlockContext')

export function provideCodeBlockContext(ctx: CodeBlockContext) {
  provide(CodeBlockContextKey, ctx)
}

export function useCodeBlockContext(): CodeBlockContext | undefined {
  return inject(CodeBlockContextKey, undefined)
}
