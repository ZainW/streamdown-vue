import { inject, type InjectionKey } from 'vue'
import { cn, createCn } from '../lib/utils'
import type { ClassValue } from 'clsx'

export const PrefixKey: InjectionKey<string> = Symbol('Prefix')

export function usePrefixCn(): (...inputs: ClassValue[]) => string {
  const prefix = inject(PrefixKey, '')
  return prefix ? createCn(prefix) : cn
}
