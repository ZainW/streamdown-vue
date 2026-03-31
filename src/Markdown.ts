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
import type { StreamdownPlugin } from './types/plugin'

export interface MarkdownOptions {
  remarkPlugins?: UnifiedPlugin[]
  rehypePlugins?: UnifiedPlugin[]
  plugins?: StreamdownPlugin[]
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
    plugins = [],
    components = {},
    urlTransform,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
  } = options

  // Build a cache key from plugin configuration.
  // The processor is deterministic for a given set of plugins — only markdown content changes.
  const cacheKey = buildCacheKey(plugins, remarkPlugins, rehypePlugins)

  const processor = getCachedProcessor(cacheKey, () => {
    // Collect plugin pipeline extensions
    const pluginRemarkPlugins = plugins.flatMap((p) => p.remarkPlugins ?? [])
    const pluginRehypePlugins = plugins.flatMap((p) => p.rehypePlugins ?? [])

    // Merge sanitize schemas from plugins
    let mergedSanitizeSchema: any = sanitizeSchema
    for (const plugin of plugins) {
      if (plugin.sanitizeSchema) {
        mergedSanitizeSchema = mergeSanitizeSchema(mergedSanitizeSchema, plugin.sanitizeSchema)
      }
    }

    // Build the unified processor
    let proc = unified().use(remarkParse).use(remarkGfm)

    // Plugin remark extensions (after GFM)
    for (const plugin of pluginRemarkPlugins) {
      if (Array.isArray(plugin)) {
        proc = proc.use(plugin[0], ...plugin.slice(1)) as any
      } else {
        proc = proc.use(plugin as any)
      }
    }

    // Consumer remark plugins
    for (const plugin of remarkPlugins) {
      if (Array.isArray(plugin)) {
        proc = proc.use(plugin[0], ...plugin.slice(1)) as any
      } else {
        proc = proc.use(plugin as any)
      }
    }

    // Convert to rehype (HTML AST)
    proc = proc.use(remarkRehype, { allowDangerousHtml: true }) as any

    // Apply rehype-raw to handle inline HTML
    proc = proc.use(rehypeRaw as any) as any

    // Plugin rehype extensions (before sanitize)
    for (const plugin of pluginRehypePlugins) {
      if (Array.isArray(plugin)) {
        proc = proc.use(plugin[0], ...plugin.slice(1)) as any
      } else {
        proc = proc.use(plugin as any)
      }
    }

    // Apply sanitization with merged schema
    proc = proc.use(rehypeSanitize as any, mergedSanitizeSchema) as any

    // Consumer rehype plugins (after sanitize, backward compat)
    for (const plugin of rehypePlugins) {
      if (Array.isArray(plugin)) {
        proc = proc.use(plugin[0], ...plugin.slice(1)) as any
      } else {
        proc = proc.use(plugin as any)
      }
    }

    return proc
  })

  // Parse and run the pipeline (stateless — safe to reuse processor)
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
    plugins,
  }

  return hastToVue(hast, vnodeOptions)
}

/**
 * Merge a plugin's sanitize schema extension into the base schema.
 * Array-valued fields (like attribute lists) are concatenated.
 */
function mergeSanitizeSchema(base: Record<string, any>, extension: Record<string, any>) {
  const result = { ...base }
  for (const key of Object.keys(extension)) {
    if (key === 'attributes' && base.attributes) {
      result.attributes = { ...base.attributes }
      for (const tag of Object.keys(extension.attributes)) {
        result.attributes[tag] = [...(base.attributes[tag] || []), ...extension.attributes[tag]]
      }
    } else if (Array.isArray(base[key]) && Array.isArray(extension[key])) {
      result[key] = [...base[key], ...extension[key]]
    } else {
      result[key] = extension[key]
    }
  }
  return result
}

/**
 * Build a stable cache key from the plugin configuration.
 * Uses plugin names and plugin array lengths as a cheap identity check.
 */
function buildCacheKey(
  plugins: StreamdownPlugin[],
  remarkPlugins: UnifiedPlugin[],
  rehypePlugins: UnifiedPlugin[],
): string {
  const pluginNames = plugins.map((p) => p.name).join(',')
  const hasSanitize = plugins.some((p) => p.sanitizeSchema) ? 's' : ''
  return `${pluginNames}|r${remarkPlugins.length}|h${rehypePlugins.length}|${hasSanitize}`
}

/**
 * Simple LRU-like processor cache.
 * Caches unified processor instances to avoid recreation on each render.
 */
const processorCache = new Map<string, any>()
const MAX_CACHE_SIZE = 10

export function getCachedProcessor(key: string, factory: () => any) {
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
