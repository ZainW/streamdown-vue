import type { Component } from 'vue'
import type { Plugin as UnifiedPlugin } from 'unified'
import type { RemendOptions as _RemendOptions } from 'remend'

// Re-export remend's options type under our own name to avoid DTS bundling issues
export type RemendOptions = _RemendOptions

export type StreamdownMode = 'streaming' | 'static'
export type CaretStyle = 'block' | 'circle'
export type TextDirection = 'auto' | 'ltr' | 'rtl'
export type AnimationSep = 'word' | 'char'

export interface AnimateOptions {
  animation?: string
  duration?: number
  easing?: string
  sep?: AnimationSep
}

export interface ControlsConfig {
  code?: {
    copy?: boolean
    download?: boolean
  }
  table?: {
    copy?: boolean
    download?: boolean
    fullscreen?: boolean
  }
}

export interface CustomRendererProps {
  code: string
  language: string
  isIncomplete: boolean
}

export interface CustomRenderer {
  language: string | string[]
  component: Component
}

export type { StreamdownPlugin, PluginComponentProps } from './plugin'

/** @deprecated Use Record<string, StreamdownPlugin> instead */
export type PluginConfig = Record<string, import('./plugin').StreamdownPlugin>

export interface StreamdownProps {
  content: string
  mode?: StreamdownMode
  isAnimating?: boolean
  animated?: boolean | AnimateOptions
  caret?: CaretStyle
  dir?: TextDirection
  parseIncompleteMarkdown?: boolean
  remend?: RemendOptions
  normalizeHtmlIndentation?: boolean
  components?: Record<string, Component>
  shikiTheme?: [any, any]
  controls?: ControlsConfig | boolean
  plugins?: PluginConfig
  icons?: Record<string, Component>
  translations?: Record<string, string>
  prefix?: string
  allowedElements?: string[]
  disallowedElements?: string[]
  allowElement?: (element: any, index: number, parent: any) => boolean
  unwrapDisallowed?: boolean
  skipHtml?: boolean
  urlTransform?: (url: string, key: string, node: any) => string | null | undefined
  allowedTags?: Record<string, string[]>
  literalTagContent?: string[]
  rehypePlugins?: UnifiedPlugin[]
  remarkPlugins?: UnifiedPlugin[]
}

export interface StreamdownContext {
  controls: ControlsConfig
  isAnimating: boolean
  mode: StreamdownMode
  shikiTheme: [any, any]
  prefix: string
}

export interface BlockProps {
  content: string
  isLastBlock: boolean
  isAnimating: boolean
  components: Record<string, Component>
  remarkPlugins: UnifiedPlugin[]
  rehypePlugins: UnifiedPlugin[]
  urlTransform?: (url: string, key: string, node: any) => string | null | undefined
  allowedElements?: string[]
  disallowedElements?: string[]
  allowElement?: (element: any, index: number, parent: any) => boolean
  unwrapDisallowed?: boolean
  skipHtml?: boolean
}

export type ComponentMap = Record<string, Component>
