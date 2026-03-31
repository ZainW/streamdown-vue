// Main component
export { Streamdown } from './Streamdown'
export { Block } from './Block'

// Default components (for custom overrides)
export { defaultComponents } from './components'
export { H1, H2, H3, H4, H5, H6 } from './components/headings'
export { P, Strong, Em, Del, Sub, Sup } from './components/text'
export { Ol, Ul, Li } from './components/lists'
export { A } from './components/links'
export { Blockquote } from './components/blockquote'
export { Code } from './components/code'
export { Img } from './components/image'
export { Hr } from './components/hr'
export { Table, Thead, Tbody, Tr, Th, Td } from './components/table'

// Code plugin (re-exported for convenience, also available from 'streamdown-vue3/code')
export { code } from './plugins/code'

// Composables
export {
  useStreamdownContext,
  provideStreamdownContext,
  StreamdownContextKey,
} from './composables/useStreamdownContext'
export { usePlugins, providePlugins, PluginContextKey } from './composables/usePlugins'
export {
  useBlockIncomplete,
  provideBlockIncomplete,
  BlockIncompleteKey,
} from './composables/useBlockIncomplete'
export { usePrefixCn, PrefixKey } from './composables/usePrefixCn'

// Utilities
export { cn, createCn, defaultUrlTransform, save } from './lib/utils'
export { parseMarkdownIntoBlocks } from './lib/parse-blocks'
export { detectTextDirection } from './lib/detect-direction'
export { hasIncompleteCodeFence, hasTable } from './lib/incomplete-code-utils'
export { createAnimatePlugin } from './lib/animate'
export { processMarkdown } from './Markdown'
export { hastToVue } from './hast-to-vue'

// Types
export type {
  StreamdownProps,
  StreamdownContext,
  StreamdownMode,
  CaretStyle,
  TextDirection,
  AnimateOptions,
  AnimationSep,
  RemendOptions,
  ControlsConfig,
  CustomRendererProps,
  CustomRenderer,
  PluginConfig,
  BlockProps,
  ComponentMap,
} from './types'
export type { StreamdownPlugin, PluginComponentProps } from './types/plugin'
