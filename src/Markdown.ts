import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Plugin as UnifiedPlugin } from 'unified'
import type { Nodes } from 'hast'
import { hastToVue, type HastToVueOptions } from './hast-to-vue'
import type { VNode, Component } from 'vue'

export interface MarkdownOptions {
  remarkPlugins?: UnifiedPlugin[]
  rehypePlugins?: UnifiedPlugin[]
  components?: Record<string, Component>
  urlTransform?: (url: string, key: string, node: any) => string | null | undefined
  allowedElements?: string[]
  disallowedElements?: string[]
  allowElement?: (element: any, index: number, parent: any) => boolean
  unwrapDisallowed?: boolean
  skipHtml?: boolean
}

// Extend the default sanitize schema to allow data-* attributes and streamdown classes
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'className',
      'style',
      // Allow data-* attributes
      ['data*', /^data-/],
    ],
    code: [...(defaultSchema.attributes?.['code'] || []), 'className'],
  },
}

/**
 * Process a markdown string through the unified pipeline and return Vue VNodes.
 */
export function processMarkdown(
  markdown: string,
  options: MarkdownOptions = {},
): (VNode | string)[] {
  const {
    remarkPlugins = [],
    rehypePlugins = [],
    components = {},
    urlTransform,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
  } = options

  // Build the unified processor
  let processor = unified().use(remarkParse).use(remarkGfm)

  // Apply custom remark plugins
  for (const plugin of remarkPlugins) {
    if (Array.isArray(plugin)) {
      processor = processor.use(plugin[0], ...plugin.slice(1)) as any
    } else {
      processor = processor.use(plugin as any)
    }
  }

  // Convert to rehype (HTML AST)
  processor = processor.use(remarkRehype, { allowDangerousHtml: true }) as any

  // Apply rehype-raw to handle inline HTML
  processor = processor.use(rehypeRaw as any) as any

  // Apply sanitization
  processor = processor.use(rehypeSanitize as any, sanitizeSchema) as any

  // Apply custom rehype plugins
  for (const plugin of rehypePlugins) {
    if (Array.isArray(plugin)) {
      processor = processor.use(plugin[0], ...plugin.slice(1)) as any
    } else {
      processor = processor.use(plugin as any)
    }
  }

  // Parse and run the pipeline
  const mdast = processor.parse(markdown)
  const hast = processor.runSync(mdast) as Nodes

  // Convert HAST to Vue VNodes
  const vnodeOptions: HastToVueOptions = {
    components,
    urlTransform,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
  }

  return hastToVue(hast, vnodeOptions)
}

/**
 * Simple LRU-like processor cache.
 * Caches unified processor instances to avoid recreation on each render.
 */
const processorCache = new Map<string, ReturnType<typeof unified>>()
const MAX_CACHE_SIZE = 10

export function getCachedProcessor(key: string, factory: () => ReturnType<typeof unified>) {
  if (processorCache.has(key)) {
    return processorCache.get(key)!
  }

  if (processorCache.size >= MAX_CACHE_SIZE) {
    const firstKey = processorCache.keys().next().value
    if (firstKey !== undefined) {
      processorCache.delete(firstKey)
    }
  }

  const processor = factory()
  processorCache.set(key, processor)
  return processor
}
