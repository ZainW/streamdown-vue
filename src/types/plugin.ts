import type { Component, VNode } from 'vue'
import type { Plugin as UnifiedPlugin } from 'unified'
import type { Element } from 'hast'

export interface StreamdownPlugin {
  name: string
  match: (node: Element) => boolean
  component: Component
  remarkPlugins?: UnifiedPlugin[]
  rehypePlugins?: UnifiedPlugin[]
  sanitizeSchema?: Record<string, any>
}

export interface PluginComponentProps {
  node: Element
  children?: VNode[]
}
