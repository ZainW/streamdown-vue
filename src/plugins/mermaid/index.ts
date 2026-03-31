import type { StreamdownPlugin } from '../../types/plugin'
import { MermaidBlock } from './MermaidBlock'

export interface MermaidPluginOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
  config?: Record<string, any>
}

export function mermaid(options?: MermaidPluginOptions): StreamdownPlugin {
  void options
  return {
    name: 'mermaid',
    match: (node) => {
      if (node.tagName !== 'pre') return false
      const child = node.children?.[0]
      return (
        child?.type === 'element' &&
        child.tagName === 'code' &&
        Array.isArray(child.properties?.className) &&
        child.properties.className.some((c) => typeof c === 'string' && c === 'language-mermaid')
      )
    },
    component: MermaidBlock,
  }
}
