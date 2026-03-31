import type { StreamdownPlugin } from '../../types/plugin'
import type { Element } from 'hast'
import { CodePluginAdapter } from './CodePluginAdapter'

function hasCodeChild(node: Element): boolean {
  const child = node.children?.[0]
  return child?.type === 'element' && child.tagName === 'code'
}

export function code(): StreamdownPlugin {
  return {
    name: 'code',
    match: (node) => node.tagName === 'pre' && hasCodeChild(node),
    component: CodePluginAdapter,
  }
}

// Re-export components for consumers who need to customize
export { CodeBlock } from './components/CodeBlock'
export { CodeBlockContainer } from './components/CodeBlockContainer'
export { CodeBlockHeader } from './components/CodeBlockHeader'
export { CodeBlockBody } from './components/CodeBlockBody'
export { CodeBlockSkeleton } from './components/CodeBlockSkeleton'
export { CodeBlockCopyButton } from './components/CodeBlockCopyButton'
export { CodeBlockDownloadButton } from './components/CodeBlockDownloadButton'
export { useCodeBlockContext, provideCodeBlockContext, CodeBlockContextKey } from './context'
export { CopyIcon, CheckIcon, DownloadIcon } from './icons/index'
