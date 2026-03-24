// Main component
export { Streamdown } from './Streamdown'
export { Block } from './Block'

// Default components (for custom overrides)
export { defaultComponents } from './components'
export {
  H1, H2, H3, H4, H5, H6,
} from './components/headings'
export { P, Strong, Em, Del, Sub, Sup } from './components/text'
export { Ol, Ul, Li } from './components/lists'
export { A } from './components/links'
export { Blockquote } from './components/blockquote'
export { Code, Pre } from './components/code'
export { Img } from './components/image'
export { Hr } from './components/hr'
export {
  Table, Thead, Tbody, Tr, Th, Td,
} from './components/table'

// Code block components
export { CodeBlock } from './code-block/CodeBlock'
export { CodeBlockContainer } from './code-block/CodeBlockContainer'
export { CodeBlockHeader } from './code-block/CodeBlockHeader'
export { CodeBlockBody } from './code-block/CodeBlockBody'
export { CodeBlockCopyButton } from './code-block/CodeBlockCopyButton'
export { CodeBlockDownloadButton } from './code-block/CodeBlockDownloadButton'
export { CodeBlockSkeleton } from './code-block/CodeBlockSkeleton'
export { useCodeBlockContext, provideCodeBlockContext, CodeBlockContextKey } from './code-block/context'

// Icons
export { CopyIcon, CheckIcon, DownloadIcon } from './icons'

// Composables
export {
  useStreamdownContext,
  provideStreamdownContext,
  StreamdownContextKey,
} from './composables/useStreamdownContext'
export { usePlugins, providePlugins, PluginContextKey } from './composables/usePlugins'
export { useBlockIncomplete, provideBlockIncomplete, BlockIncompleteKey } from './composables/useBlockIncomplete'
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
