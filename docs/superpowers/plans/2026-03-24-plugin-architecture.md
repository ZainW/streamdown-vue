# Plugin Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make streamdown-vue3 tree-shakeable by extracting code block rendering into a `code` plugin and adding a new `mermaid` plugin, both exposed via sub-path exports.

**Architecture:** Single package with multiple Vite entry points. Plugins implement a `StreamdownPlugin` interface with `match`/`component`/pipeline hooks. Core checks plugins during HAST→Vue conversion; unmatched nodes fall through to native HTML tags. Plugins are passed via `HastToVueOptions` (not provide/inject) to pure functions, and via provide/inject for Vue components.

**Tech Stack:** Vue 3, Vite (multi-entry lib mode), unified/remark/rehype, Shiki (optional), Mermaid (optional)

**Spec:** `docs/superpowers/specs/2026-03-24-plugin-architecture-design.md`

---

### Task 1: Define StreamdownPlugin type

**Files:**
- Create: `src/types/plugin.ts`
- Modify: `src/types/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create the plugin type file**

```ts
// src/types/plugin.ts
import type { Component } from 'vue'
import type { Plugin as UnifiedPlugin } from 'unified'
import type { Element } from 'hast'

export interface StreamdownPlugin {
  name: string
  match: (node: Element) => boolean
  component: Component
  remarkPlugins?: UnifiedPlugin[]
  rehypePlugins?: UnifiedPlugin[]
  sanitizeSchema?: Partial<import('rehype-sanitize').Options>
}

export interface PluginComponentProps {
  node: Element
  children?: import('vue').VNode[]
}
```

- [ ] **Step 2: Update types/index.ts — replace old PluginConfig**

In `src/types/index.ts`, replace the `PluginConfig` interface (lines 43-49) with a re-export of the new type. Keep `PluginConfig` as a deprecated alias for now (removed in a later task):

```ts
// Replace the old PluginConfig interface with:
import type { StreamdownPlugin } from './plugin'

/** @deprecated Use Record<string, StreamdownPlugin> instead */
export type PluginConfig = Record<string, StreamdownPlugin>
```

Also re-export `StreamdownPlugin` and `PluginComponentProps`:
```ts
export type { StreamdownPlugin, PluginComponentProps } from './plugin'
```

Update `StreamdownProps.plugins` type from `PluginConfig` to `Record<string, StreamdownPlugin>`.

- [ ] **Step 3: Update src/index.ts exports**

Add to the type exports section:
```ts
export type { StreamdownPlugin, PluginComponentProps } from './types/plugin'
```

- [ ] **Step 4: Run typecheck to verify no breakage**

Run: `pnpm typecheck`
Expected: PASS (PluginConfig alias preserves backward compat)

- [ ] **Step 5: Commit**

```bash
git add src/types/plugin.ts src/types/index.ts src/index.ts
git commit -m "feat: define StreamdownPlugin interface"
```

---

### Task 2: Add plugin support to hast-to-vue.ts

**Files:**
- Modify: `src/hast-to-vue.ts:5-14` (HastToVueOptions interface)
- Modify: `src/hast-to-vue.ts:125-179` (nodeToVue function, element case)
- Test: `src/__tests__/hast-to-vue.test.ts`

- [ ] **Step 1: Write failing test for plugin matching**

Add to `src/__tests__/hast-to-vue.test.ts`:

```ts
import type { StreamdownPlugin } from '../types/plugin'

describe('plugin matching', () => {
  it('uses plugin component when match returns true', () => {
    const CustomCodeBlock = defineComponent({
      props: { node: { type: Object, required: true } },
      setup(props) {
        return () => h('div', { class: 'custom-code' }, 'plugin matched')
      },
    })

    const plugin: StreamdownPlugin = {
      name: 'test',
      match: (node) => node.tagName === 'pre',
      component: CustomCodeBlock,
    }

    const element: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [{ type: 'text', value: 'code' }],
    }

    const result = hastToVue(element, { plugins: [plugin] })
    expect(result.length).toBe(1)
    const vnode = result[0]
    if (typeof vnode !== 'string') {
      expect(vnode.type).toBe(CustomCodeBlock)
      expect(vnode.props?.node).toBe(element)
    }
  })

  it('falls through to default when no plugin matches', () => {
    const plugin: StreamdownPlugin = {
      name: 'test',
      match: () => false,
      component: defineComponent({ setup: () => () => h('div') }),
    }

    const element: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Hello' }],
    }

    const result = hastToVue(element, { plugins: [plugin] })
    expect(result.length).toBe(1)
    const vnode = result[0]
    if (typeof vnode !== 'string') {
      expect(vnode.type).toBe('p')
    }
  })

  it('matches plugins in reverse order (last wins)', () => {
    const First = defineComponent({
      props: { node: Object },
      setup: () => () => h('div', 'first'),
    })
    const Second = defineComponent({
      props: { node: Object },
      setup: () => () => h('div', 'second'),
    })

    const plugins: StreamdownPlugin[] = [
      { name: 'first', match: (n) => n.tagName === 'pre', component: First },
      { name: 'second', match: (n) => n.tagName === 'pre', component: Second },
    ]

    const element: Element = {
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [],
    }

    const result = hastToVue(element, { plugins })
    const vnode = result[0]
    if (typeof vnode !== 'string') {
      expect(vnode.type).toBe(Second) // last plugin wins
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- -t 'plugin matching'`
Expected: FAIL — `plugins` not in HastToVueOptions

- [ ] **Step 3: Add plugins to HastToVueOptions**

In `src/hast-to-vue.ts`, add to the imports:
```ts
import type { StreamdownPlugin } from './types/plugin'
```

Add to `HastToVueOptions` interface (after `passNode`):
```ts
plugins?: StreamdownPlugin[]
```

- [ ] **Step 4: Implement plugin matching in nodeToVue**

In the `'element'` case of `nodeToVue` (after `shouldIncludeElement` check, before line 147), add plugin matching:

```ts
// Check plugins in reverse order (last registered wins)
if (options.plugins?.length) {
  for (let i = options.plugins.length - 1; i >= 0; i--) {
    const plugin = options.plugins[i]
    if (plugin.match(element)) {
      const children = childrenToVue(element.children as Nodes[], element, options)
      return h(plugin.component, { node: element }, children.length > 0 ? children : undefined)
    }
  }
}

// Existing component resolution
const component = options.components?.[element.tagName] ?? element.tagName
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- -t 'plugin matching'`
Expected: PASS

- [ ] **Step 6: Run full test suite to verify no regressions**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/hast-to-vue.ts src/__tests__/hast-to-vue.test.ts
git commit -m "feat: add plugin matching to HAST-to-Vue conversion"
```

---

### Task 3: Add plugin pipeline support to Markdown.ts

**Files:**
- Modify: `src/Markdown.ts:12-22` (MarkdownOptions interface)
- Modify: `src/Markdown.ts:43-105` (processMarkdown function)

- [ ] **Step 1: Write failing test**

Add to `src/__tests__/hast-to-vue.test.ts` (or a new `src/__tests__/plugin-pipeline.test.ts`):

```ts
import { processMarkdown } from '../Markdown'
import type { StreamdownPlugin } from '../types/plugin'
import { defineComponent, h } from 'vue'

describe('plugin pipeline integration', () => {
  it('passes plugins to hastToVue', () => {
    const TestComponent = defineComponent({
      props: { node: Object },
      setup: () => () => h('div', { 'data-test': 'plugin-rendered' }),
    })

    const plugin: StreamdownPlugin = {
      name: 'test',
      match: (node) => node.tagName === 'pre',
      component: TestComponent,
    }

    const result = processMarkdown('```\ncode\n```', { plugins: [plugin] })
    // The pre element should be handled by the plugin
    expect(result.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- -t 'plugin pipeline'`
Expected: FAIL — `plugins` not in MarkdownOptions

- [ ] **Step 3: Update MarkdownOptions and processMarkdown**

Add to `MarkdownOptions` interface:
```ts
plugins?: StreamdownPlugin[]
```

Add import:
```ts
import type { StreamdownPlugin } from './types/plugin'
```

In `processMarkdown`, after destructuring options, add:
```ts
const { plugins = [], ...rest } = options
```

Restructure the pipeline to split plugin vs consumer rehype plugins. The current rehypePlugins from options are consumer-provided (after sanitize). Plugin rehype go before sanitize:

```ts
// Collect plugin pipeline extensions
const pluginRemarkPlugins = plugins.flatMap((p) => p.remarkPlugins ?? [])
const pluginRehypePlugins = plugins.flatMap((p) => p.rehypePlugins ?? [])

// Merge sanitize schemas from plugins (array-concatenating for attributes)
let mergedSanitizeSchema = sanitizeSchema
for (const plugin of plugins) {
  if (plugin.sanitizeSchema) {
    mergedSanitizeSchema = mergeSanitizeSchema(mergedSanitizeSchema, plugin.sanitizeSchema)
  }
}

// Build pipeline
let processor = unified().use(remarkParse).use(remarkGfm)

// Plugin remark extensions (after GFM)
for (const plugin of pluginRemarkPlugins) { /* apply */ }

// Consumer remark plugins
for (const plugin of remarkPlugins) { /* apply (existing code) */ }

processor = processor.use(remarkRehype, { allowDangerousHtml: true })
processor = processor.use(rehypeRaw)

// Plugin rehype extensions (before sanitize)
for (const plugin of pluginRehypePlugins) { /* apply */ }

// Sanitize with merged schema
processor = processor.use(rehypeSanitize, mergedSanitizeSchema)

// Consumer rehype plugins (after sanitize, backward compat)
for (const plugin of rehypePlugins) { /* apply (existing code) */ }
```

Add a `mergeSanitizeSchema` helper that concatenates array-valued fields:
```ts
function mergeSanitizeSchema(base: any, extension: any): any {
  const result = { ...base }
  for (const key of Object.keys(extension)) {
    if (key === 'attributes' && base.attributes) {
      result.attributes = { ...base.attributes }
      for (const tag of Object.keys(extension.attributes)) {
        result.attributes[tag] = [
          ...(base.attributes[tag] || []),
          ...extension.attributes[tag],
        ]
      }
    } else if (Array.isArray(base[key]) && Array.isArray(extension[key])) {
      result[key] = [...base[key], ...extension[key]]
    } else {
      result[key] = extension[key]
    }
  }
  return result
}
```

Pass plugins through to hastToVue options:
```ts
const vnodeOptions: HastToVueOptions = {
  components,
  urlTransform,
  // ...existing options...
  plugins,
}
```

- [ ] **Step 4: Run test**

Run: `pnpm test -- -t 'plugin pipeline'`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/Markdown.ts src/__tests__/plugin-pipeline.test.ts
git commit -m "feat: add plugin pipeline support to markdown processor"
```

---

### Task 4: Wire plugins through Streamdown → Block → processMarkdown

**Files:**
- Modify: `src/Streamdown.ts:64-67` (plugins prop type)
- Modify: `src/Streamdown.ts:134` (provide)
- Modify: `src/Streamdown.ts:191-208` (Block render)
- Modify: `src/Block.ts:9-51` (props)
- Modify: `src/Block.ts:72-83` (processMarkdown call)
- Modify: `src/composables/usePlugins.ts`

- [ ] **Step 1: Update usePlugins composable**

In `src/composables/usePlugins.ts`, update the type:

```ts
import { inject, provide, type InjectionKey } from 'vue'
import type { StreamdownPlugin } from '../types/plugin'

export const PluginContextKey: InjectionKey<Record<string, StreamdownPlugin>> =
  Symbol('PluginContext')

export function providePlugins(plugins: Record<string, StreamdownPlugin>) {
  provide(PluginContextKey, plugins)
}

export function usePlugins(): Record<string, StreamdownPlugin> {
  return inject(PluginContextKey, {})
}
```

- [ ] **Step 2: Update Streamdown.ts**

Update the import of `PluginConfig` to use `StreamdownPlugin`:
```ts
import type { StreamdownPlugin } from './types/plugin'
```

Update the `plugins` prop type:
```ts
plugins: {
  type: Object as PropType<Record<string, StreamdownPlugin>>,
  default: undefined,
},
```

The `provide(PluginContextKey, props.plugins || {})` on line 134 stays the same — type now matches.

Convert plugins record to array and pass to Block. Add a computed:
```ts
const pluginsList = computed(() =>
  props.plugins ? Object.values(props.plugins) : []
)
```

Pass to Block render:
```ts
return h(Block, {
  // ...existing props...
  plugins: pluginsList.value,
})
```

- [ ] **Step 3: Update Block.ts**

Add `plugins` prop:
```ts
plugins: {
  type: Array as PropType<StreamdownPlugin[]>,
  default: () => [],
},
```

Add import:
```ts
import type { StreamdownPlugin } from './types/plugin'
```

Pass plugins to processMarkdown:
```ts
vnodes.value = processMarkdown(props.content, {
  // ...existing options...
  plugins: props.plugins,
})
```

- [ ] **Step 4: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/Streamdown.ts src/Block.ts src/composables/usePlugins.ts
git commit -m "feat: wire plugins from Streamdown through Block to processMarkdown"
```

---

### Task 5: Extract code block system into plugin (atomic)

This task combines moving files, creating the plugin factory, and updating core exports into a single atomic operation to avoid intermediate broken states.

**Files:**
- Move: `src/code-block/*` → `src/plugins/code/components/`
- Move: `src/icons/index.ts` → `src/plugins/code/icons/`
- Move: `src/code-block/context.ts` → `src/plugins/code/context.ts`
- Create: `src/plugins/code/index.ts`
- Create: `src/plugins/code/CodePluginAdapter.ts`
- Create: `src/plugins/code/utils.ts` (shared HAST text extraction)
- Modify: `src/index.ts`
- Modify: `src/components/index.ts`
- Modify: `src/components/code.ts`

- [ ] **Step 1: Create plugin directory structure**

```bash
mkdir -p src/plugins/code/components src/plugins/code/icons
```

- [ ] **Step 2: Create shared HAST text extraction utility**

```ts
// src/plugins/code/utils.ts

/**
 * Recursively extracts text content from a HAST node tree.
 */
export function extractTextFromHast(node: any): string {
  if (node.type === 'text') return node.value || ''
  if (node.children) {
    return node.children.map(extractTextFromHast).join('')
  }
  return ''
}
```

- [ ] **Step 3: Move code block files and update imports**

Move these files:
- `src/code-block/CodeBlock.ts` → `src/plugins/code/components/CodeBlock.ts`
- `src/code-block/CodeBlockContainer.ts` → `src/plugins/code/components/CodeBlockContainer.ts`
- `src/code-block/CodeBlockHeader.ts` → `src/plugins/code/components/CodeBlockHeader.ts`
- `src/code-block/CodeBlockBody.ts` → `src/plugins/code/components/CodeBlockBody.ts`
- `src/code-block/CodeBlockSkeleton.ts` → `src/plugins/code/components/CodeBlockSkeleton.ts`
- `src/code-block/CodeBlockCopyButton.ts` → `src/plugins/code/components/CodeBlockCopyButton.ts`
- `src/code-block/CodeBlockDownloadButton.ts` → `src/plugins/code/components/CodeBlockDownloadButton.ts`
- `src/code-block/context.ts` → `src/plugins/code/context.ts`
- `src/icons/index.ts` → `src/plugins/code/icons/index.ts`

Update all internal imports within moved files. Key path changes (from `src/plugins/code/components/`):
- `'../composables/useStreamdownContext'` → `'../../../composables/useStreamdownContext'` (3 levels up)
- `'../icons'` → `'../icons/index'`
- `'../lib/utils'` → `'../../../lib/utils'` (3 levels up)
- `'./CodeBlockContainer'` stays the same (sibling within components/)
- Context import: `'./context'` → `'../context'` (context.ts is one level up in `code/`)

Delete `src/code-block/` and `src/icons/` directories after moves.

- [ ] **Step 4: Create the CodePluginAdapter component**

This replaces the old `Pre` component's role — it extracts `language`, `code`, and `meta` from the raw HAST node and passes them to `CodeBlock`.

```ts
// src/plugins/code/CodePluginAdapter.ts
import { defineComponent, h, type PropType } from 'vue'
import type { Element } from 'hast'
import { CodeBlock } from './components/CodeBlock'
import { extractTextFromHast } from './utils'

export const CodePluginAdapter = defineComponent({
  name: 'CodePluginAdapter',
  props: {
    node: {
      type: Object as PropType<Element>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const node = props.node
      const codeChild = node.children?.[0]

      let language = ''
      let code = ''
      let meta = ''

      if (codeChild && codeChild.type === 'element' && codeChild.tagName === 'code') {
        const classes = codeChild.properties?.className
        if (Array.isArray(classes)) {
          for (const cls of classes) {
            const match = typeof cls === 'string' ? cls.match(/^language-(.+)$/) : null
            if (match) {
              language = match[1]
              break
            }
          }
        }
        code = extractTextFromHast(codeChild)
        meta = (codeChild.properties as any)?.meta || ''
      }

      return h(CodeBlock, {
        code,
        language,
        isIncomplete: false,
        meta,
      })
    }
  },
})
```

- [ ] **Step 5: Create the code plugin factory**

```ts
// src/plugins/code/index.ts
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
export { CopyIcon, CheckIcon, DownloadIcon } from './icons'
```

Note: `CodePluginOptions` (lightTheme/darkTheme) is deferred — themes are already configured via `shikiTheme` prop on Streamdown and flow through `useStreamdownContext`. Adding plugin-level theme overrides can be done later without breaking changes.

- [ ] **Step 6: Remove Pre from defaultComponents and update core exports**

In `src/components/code.ts`, remove the `Pre` component entirely (lines 29-80) and the `extractText` function (lines 85-100). Remove the `CodeBlock` import (line 2). Keep only the `Code` (inline code) component.

In `src/components/index.ts`, remove `pre` from the `defaultComponents` object. Keep `code` (inline code).

- [ ] **Step 2: Update src/index.ts**

Remove code block exports from main entry (lines 17-32):
```ts
// REMOVE these:
export { CodeBlock } from './code-block/CodeBlock'
export { CodeBlockContainer } from './code-block/CodeBlockContainer'
// ... etc
export { CopyIcon, CheckIcon, DownloadIcon } from './icons'
```

Remove `Pre` from the components export on line 12:
```ts
// Change from:
export { Code, Pre } from './components/code'
// To:
export { Code } from './components/code'
```

Remove from composables exports (lines 25-29):
```ts
// REMOVE:
export { useCodeBlockContext, provideCodeBlockContext, CodeBlockContextKey } from './code-block/context'
```

Update type exports — remove old types, add new ones:
```ts
// Remove: CustomRendererProps, CustomRenderer, PluginConfig
// Add:
export type { StreamdownPlugin, PluginComponentProps } from './types/plugin'
```

Keep `PluginConfig` export for one version as deprecated alias (already done in Task 1).

- [ ] **Step 7: Run typecheck and tests**

Run: `pnpm typecheck && pnpm test`
Expected: Typecheck PASS. Some tests in code-block.test.ts may fail (they expect code block UI without the plugin) — that's expected and fixed in Task 8.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: extract code block system into code plugin with adapter"
```

---

### Task 6: Create mermaid plugin

**Files:**
- Create: `src/plugins/mermaid/index.ts`
- Create: `src/plugins/mermaid/MermaidBlock.ts`

- [ ] **Step 1: Create MermaidBlock component**

```ts
// src/plugins/mermaid/MermaidBlock.ts
import { defineComponent, h, ref, watch, onMounted, type PropType } from 'vue'
import type { Element } from 'hast'
import { useStreamdownContext } from '../../composables/useStreamdownContext'
import { extractTextFromHast } from '../code/utils'

export const MermaidBlock = defineComponent({
  name: 'MermaidBlock',
  props: {
    node: {
      type: Object as PropType<Element>,
      required: true,
    },
  },
  setup(props) {
    const svgHtml = ref('')
    const error = ref<string | null>(null)
    const isMounted = ref(false)
    const ctx = useStreamdownContext()
    let renderRequestId = 0

    onMounted(() => {
      isMounted.value = true
    })

    watch(
      () => [props.node, isMounted.value, ctx.isAnimating] as const,
      async ([node, mounted, isAnimating]) => {
        const requestId = ++renderRequestId

        if (!mounted) return

        // Extract mermaid source from HAST node
        const codeChild = node.children?.[0]
        const source = codeChild ? extractTextFromHast(codeChild) : ''

        if (!source) {
          svgHtml.value = ''
          return
        }

        // During streaming, show raw source to avoid repeated render calls
        if (isAnimating) {
          svgHtml.value = ''
          error.value = null
          return
        }

        try {
          const mermaidModule = await import('mermaid')
          const mermaid = mermaidModule.default

          // Ensure mermaid is initialized
          mermaid.initialize({ startOnLoad: false })

          const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const { svg } = await mermaid.render(id, source)

          if (requestId === renderRequestId) {
            svgHtml.value = svg
            error.value = null
          }
        } catch (err) {
          if (requestId === renderRequestId) {
            svgHtml.value = ''
            error.value = err instanceof Error ? err.message : 'Mermaid render failed'
          }
        }
      },
      { immediate: true },
    )

    return () => {
      const codeChild = props.node.children?.[0]
      const source = codeChild ? extractTextFromHast(codeChild) : ''

      // Show raw source during streaming
      if (ctx.isAnimating) {
        return h('pre', { 'data-streamdown': 'mermaid-pending' }, [
          h('code', { class: 'language-mermaid' }, source),
        ])
      }

      // Show rendered SVG
      if (svgHtml.value) {
        return h('div', {
          'data-streamdown': 'mermaid',
          innerHTML: svgHtml.value,
        })
      }

      // Show error fallback
      if (error.value) {
        return h('div', { 'data-streamdown': 'mermaid-error' }, [
          h('pre', {}, [h('code', { class: 'language-mermaid' }, source)]),
          h('p', { style: 'color: red; font-size: 0.875rem;' }, error.value),
        ])
      }

      // Loading state
      return h('pre', { 'data-streamdown': 'mermaid-loading' }, [
        h('code', { class: 'language-mermaid' }, source),
      ])
    }
  },
})
```

- [ ] **Step 2: Create the mermaid plugin factory**

```ts
// src/plugins/mermaid/index.ts
import type { StreamdownPlugin } from '../../types/plugin'
import type { Element } from 'hast'
import { MermaidBlock } from './MermaidBlock'

export interface MermaidPluginOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
  config?: Record<string, any>
}

export function mermaid(options?: MermaidPluginOptions): StreamdownPlugin {
  return {
    name: 'mermaid',
    match: (node) => {
      if (node.tagName !== 'pre') return false
      const child = node.children?.[0]
      return (
        child?.type === 'element' &&
        child.tagName === 'code' &&
        Array.isArray(child.properties?.className) &&
        child.properties.className.some(
          (c: string) => typeof c === 'string' && c === 'language-mermaid',
        )
      )
    },
    component: MermaidBlock,
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/plugins/mermaid/
git commit -m "feat: create mermaid plugin with streaming support"
```

---

### Task 7: Update Vite build config for multi-entry

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Update vite.config.ts**

```ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import oxlintPlugin from 'vite-plugin-oxlint'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    oxlintPlugin({
      configFile: '.oxlintrc.json',
      format: 'stylish',
      failOnError: command === 'build',
    }),
    dts({ rollupTypes: false }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        code: resolve(__dirname, 'src/plugins/code/index.ts'),
        mermaid: resolve(__dirname, 'src/plugins/mermaid/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'shiki', 'mermaid'],
    },
  },
}))
```

Key changes:
- Remove `vite-plugin-dts` entirely — rely on `vue-tsc --emitDeclarationOnly` (already in build script) for declarations. This avoids double `.d.ts` emission and is more reliable for multi-entry builds.
- Single entry → object map with 3 entries
- Remove `fileName: 'index'` (Vite auto-names from entry keys)
- Add `'mermaid'` to external

Update `vite.config.ts` to remove the `dts` import and plugin:
```ts
import { defineConfig } from 'vite'
import oxlintPlugin from 'vite-plugin-oxlint'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    oxlintPlugin({
      configFile: '.oxlintrc.json',
      format: 'stylish',
      failOnError: command === 'build',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        code: resolve(__dirname, 'src/plugins/code/index.ts'),
        mermaid: resolve(__dirname, 'src/plugins/mermaid/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'shiki', 'mermaid'],
    },
  },
}))
```

- [ ] **Step 2: Run build to verify output**

Run: `pnpm build`
Expected: Produces `dist/index.js`, `dist/code.js`, `dist/mermaid.js` plus `.d.ts` files

- [ ] **Step 3: Verify dist output structure**

Run: `ls dist/`
Expected: `index.js`, `code.js`, `mermaid.js`, and corresponding `.d.ts` files (possibly nested under `dist/` for types)

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "build: configure multi-entry Vite build for plugin sub-paths"
```

---

### Task 8: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update exports map**

Check the actual `.d.ts` output paths from the build in Task 7. Update exports accordingly. Expected shape:

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./code": {
    "import": "./dist/code.js",
    "types": "./dist/plugins/code/index.d.ts"
  },
  "./mermaid": {
    "import": "./dist/mermaid.js",
    "types": "./dist/plugins/mermaid/index.d.ts"
  },
  "./styles.css": "./styles.css"
}
```

Adjust the `types` paths based on what `vue-tsc --emitDeclarationOnly` actually emits.

- [ ] **Step 2: Update peer dependencies**

Move `shiki` from `optionalDependencies` to `peerDependencies` with optional meta. Add `mermaid`:

```json
"peerDependencies": {
  "vue": "^3.3.0",
  "shiki": "^4.0.0",
  "mermaid": "^11.0.0"
},
"peerDependenciesMeta": {
  "shiki": { "optional": true },
  "mermaid": { "optional": true }
}
```

Remove the `optionalDependencies` block entirely.

- [ ] **Step 3: Bump version**

```json
"version": "0.2.0"
```

- [ ] **Step 4: Run build to verify**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "build: update exports, peer deps, and version for plugin architecture"
```

---

### Task 9: Update existing tests

**Files:**
- Modify: `src/__tests__/code-block.test.ts`
- Modify: `src/__tests__/Streamdown.test.ts`

- [ ] **Step 1: Update code-block.test.ts to use code plugin**

All tests in `code-block.test.ts` mount `Streamdown` and expect code block UI. They now need to pass the `code` plugin:

```ts
import { code } from '../plugins/code'

// In each test, add plugins prop:
const wrapper = mount(Streamdown, {
  props: {
    content: '```javascript\nconst x = 1;\n```',
    mode: 'static',
    plugins: { code: code() },
  },
})
```

Apply this to all tests in the file.

- [ ] **Step 2: Update Streamdown.test.ts code block test**

The test at line 72-81 ("renders code blocks") currently expects `pre` and `code` elements. Without the code plugin, it should still render `<pre><code>` (native HTML from the markdown pipeline). Verify this test still passes as-is since the pipeline produces `<pre><code>` by default.

If it specifically asserts `data-streamdown` attributes from CodeBlock, update it to not expect those.

- [ ] **Step 3: Add test for no-plugin fallback**

```ts
it('renders code fences as plain pre/code without code plugin', () => {
  const wrapper = mount(Streamdown, {
    props: {
      content: '```javascript\nconst x = 1;\n```',
      mode: 'static',
      // No plugins
    },
  })
  expect(wrapper.find('pre').exists()).toBe(true)
  expect(wrapper.find('code').exists()).toBe(true)
  // Should NOT have code block UI
  expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(false)
})
```

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/
git commit -m "test: update tests for plugin architecture"
```

---

### Task 10: Add plugin-specific tests

**Files:**
- Create: `src/__tests__/plugin-matching.test.ts`
- Create: `src/__tests__/mermaid-plugin.test.ts`

- [ ] **Step 1: Write plugin matching integration test**

```ts
// src/__tests__/plugin-matching.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Streamdown } from '../Streamdown'
import { code } from '../plugins/code'
import { mermaid } from '../plugins/mermaid'

describe('plugin matching integration', () => {
  it('code plugin renders CodeBlock for code fences', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```js\nconst x = 1\n```',
        mode: 'static',
        plugins: { code: code() },
      },
    })
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(true)
  })

  it('mermaid plugin claims mermaid fences over code plugin', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```mermaid\ngraph TD\n  A --> B\n```',
        mode: 'static',
        plugins: { code: code(), mermaid: mermaid() },
      },
    })
    // Mermaid should claim this, not code
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(false)
    // Should have mermaid-related rendering (loading state since mermaid is not installed in test env)
    const mermaidEl = wrapper.find('[data-streamdown="mermaid-loading"], [data-streamdown="mermaid-error"]')
    expect(mermaidEl.exists()).toBe(true)
  })

  it('regular code fences still go to code plugin when mermaid is registered', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```javascript\nconst x = 1\n```',
        mode: 'static',
        plugins: { code: code(), mermaid: mermaid() },
      },
    })
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Write mermaid plugin test**

```ts
// src/__tests__/mermaid-plugin.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Streamdown } from '../Streamdown'
import { mermaid } from '../plugins/mermaid'

describe('mermaid plugin', () => {
  it('renders mermaid source in pre while loading', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```mermaid\ngraph TD\n  A --> B\n```',
        mode: 'static',
        plugins: { mermaid: mermaid() },
      },
    })
    expect(wrapper.text()).toContain('graph TD')
  })

  it('does not match non-mermaid code fences', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```javascript\nconst x = 1\n```',
        mode: 'static',
        plugins: { mermaid: mermaid() },
      },
    })
    // Should fall through to plain pre/code
    expect(wrapper.find('pre').exists()).toBe(true)
    // Should NOT have mermaid rendering
    expect(wrapper.find('[data-streamdown="mermaid-loading"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/plugin-matching.test.ts src/__tests__/mermaid-plugin.test.ts
git commit -m "test: add plugin matching and mermaid plugin tests"
```

---

### Task 11: Update playground

**Files:**
- Modify: `playground/src/App.vue`
- Modify: `playground/package.json`
- Modify: `playground/src/content.ts`

- [ ] **Step 1: Update playground/package.json**

Add `mermaid` as a dependency (shiki is already there):
```json
"dependencies": {
  "shiki": "^4.0.2",
  "mermaid": "^11.0.0",
  "vue": "^3.5.30"
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd playground && pnpm install && cd ..`

- [ ] **Step 3: Update playground/src/App.vue**

Add plugin imports and registration:
```ts
import { Streamdown } from 'streamdown-vue'
import { code } from 'streamdown-vue/code'
import { mermaid } from 'streamdown-vue/mermaid'
import 'streamdown-vue/styles.css'

const plugins = { code: code(), mermaid: mermaid() }
```

Update the Streamdown component usage in the template to pass plugins:
```vue
<Streamdown
  :content="content"
  :plugins="plugins"
  <!-- ...existing props... -->
/>
```

- [ ] **Step 4: Add mermaid example to sample content**

In `playground/src/content.ts`, add a mermaid diagram to `SAMPLE_MARKDOWN`:

````ts
// Add after the "Key Takeaways" section:

## Architecture Diagram

Here's how the components connect:

\`\`\`mermaid
graph TD
    A[Client] --> B[Express Server]
    B --> C[User Router]
    B --> D[Post Router]
    C --> E[Database]
    D --> E
    E --> F[PostgreSQL]
\`\`\`
````

- [ ] **Step 5: Test playground locally**

Run: `cd playground && pnpm dev`
Expected: Opens on port 5199, streaming works, code blocks render with syntax highlighting, mermaid diagram renders.

- [ ] **Step 6: Commit**

```bash
git add playground/
git commit -m "feat: update playground with code and mermaid plugins"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: PASS, produces `dist/index.js`, `dist/code.js`, `dist/mermaid.js`

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Run lint and format**

Run: `pnpm lint && pnpm fmt:check`
Expected: PASS (run `pnpm fmt` first if needed)

- [ ] **Step 5: Verify tree-shaking**

Check that `dist/index.js` does NOT contain CodeBlock, CodeBlockHeader, etc.:
```bash
grep -c 'CodeBlock' dist/index.js
```
Expected: 0 (or very few incidental matches)

Check that `dist/code.js` DOES contain them:
```bash
grep -c 'CodeBlock' dist/code.js
```
Expected: Multiple matches

- [ ] **Step 6: Commit any final cleanup**

```bash
git add -A
git commit -m "chore: final cleanup for plugin architecture"
```
