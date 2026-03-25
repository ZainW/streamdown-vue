# Plugin Architecture Design

**Date:** 2026-03-24
**Status:** Approved
**Scope:** Tree-shakeable plugin system for streamdown-vue3 with `code` and `mermaid` plugins at launch

## Problem

The library bundles code block components (7 files + icons) into core regardless of whether consumers use code fences. Mermaid support is planned but would add even more weight. Consumers should only pay for features they use.

## Decision

Single package with sub-path exports. Each plugin is a separate Vite entry point exposed via `package.json` `"exports"` map. Mirrors the original React Streamdown v2 plugin API but avoids monorepo overhead.

## Consumer API

```ts
import { Streamdown } from 'streamdown-vue3'
import { code } from 'streamdown-vue3/code'
import { mermaid } from 'streamdown-vue3/mermaid'

<Streamdown
  :content="md"
  :plugins="{ code: code(), mermaid: mermaid() }"
/>
```

Without plugins, code fences render as plain `<pre><code>` (browser default).

## Plugin Interface

```ts
interface StreamdownPlugin {
  name: string
  match: (node: HastElement) => boolean
  component: Component
  remarkPlugins?: unified.Plugin[]
  rehypePlugins?: unified.Plugin[]
  sanitizeSchema?: Partial<SanitizeSchema>
}
```

- **`name`** — identifier used as key in the plugins object
- **`match`** — claims a HAST element node during rendering; most-specific match wins (see Plugin Matching Order)
- **`component`** — Vue component that renders matched nodes; receives `PluginComponentProps` (see below)
- **`remarkPlugins`** — optional remark extensions merged after remark-gfm
- **`rehypePlugins`** — optional rehype extensions merged after rehype-raw, before rehype-sanitize
- **`sanitizeSchema`** — optional schema extensions merged into rehype-sanitize (e.g., to allow SVG elements)

**`StreamdownPlugin` is exported from the main entry point** (`streamdown-vue3`) so third-party plugin authors can type against it.

### Plugin Component Props

All plugin components receive a standard prop interface:

```ts
interface PluginComponentProps {
  node: HastElement        // the raw HAST element node
  children: VNode[]        // pre-rendered child VNodes
}
```

Plugin components are responsible for extracting what they need from the HAST node. For example, the code plugin's component extracts `language`, `code`, and `meta` from the `<pre>` node's `<code>` child rather than expecting them as separate props.

Each plugin sub-path exports a factory function so consumers can pass options:

```ts
export function code(options?: CodePluginOptions): StreamdownPlugin
export function mermaid(options?: MermaidPluginOptions): StreamdownPlugin
```

## Core Integration

### HAST-to-Vue rendering (hast-to-vue.ts)

Plugins are passed to `hastToVue` via the `HastToVueOptions` object (not via provide/inject, since `hastToVue` is a pure function). Plugin matching runs before the component map lookup:

```ts
// Options now includes: plugins?: StreamdownPlugin[]
for (const plugin of sortedPlugins) {
  if (plugin.match(element)) {
    return h(plugin.component, { node: element }, children)
  }
}
const component = options.components?.[element.tagName] ?? element.tagName
```

### Plugin Matching Order

Plugins are sorted by specificity before matching: plugins whose `match` checks more conditions (e.g., mermaid checks tag name + language class) run before plugins with broader matches (e.g., code checks tag name + any code child). This prevents the code plugin from swallowing mermaid fences.

Implementation: the plugins array is iterated in **reverse insertion order** for matching — later entries match first. Consumers who want mermaid to take precedence over code just list code before mermaid (which is the natural order):

```ts
:plugins="{ code: code(), mermaid: mermaid() }"
// Matching order: mermaid first (more specific), then code
```

This is simple, explicit, and matches the common intuition that "later overrides earlier."

### Markdown pipeline (Markdown.ts)

Two separate insertion points for rehype plugins to preserve backward compatibility:

```ts
const pluginRemarkPlugins = plugins.flatMap(p => p.remarkPlugins ?? [])
const pluginRehypePlugins = plugins.flatMap(p => p.rehypePlugins ?? [])
const pluginSanitizeExtensions = plugins.map(p => p.sanitizeSchema).filter(Boolean)

// Merge sanitize schema
// Array-valued fields (e.g., attributes lists) are concatenated, not replaced.
// Use deepmerge with arrayMerge: concatMerge, or manually spread attribute arrays.
const mergedSchema = deepMerge(defaultSchema, ...pluginSanitizeExtensions)

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(...pluginRemarkPlugins)              // plugin remark extensions
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(...pluginRehypePlugins)              // plugin rehype extensions (before sanitize)
  .use(rehypeSanitize, mergedSchema)        // sanitize with extended schema
  .use(...consumerRehypePlugins)            // consumer-provided rehype plugins (after sanitize, backward compat)
```

Plugin-provided rehype plugins run **before** sanitization (so the sanitizer validates their output). Consumer-provided rehype plugins via the Streamdown `rehypePlugins` prop continue to run **after** sanitization, preserving existing behavior.

### Processor cache key

The processor cache key (`getCachedProcessor` in Markdown.ts) must account for active plugins. The cache key includes plugin names and a hash of plugin options so that switching plugins between renders produces a new processor.

### Plugin data flow

Plugins are provided from `Streamdown.ts` via Vue's provide/inject for components that need them. The existing `usePlugins` composable is updated: its return type changes from `PluginConfig` to `Record<string, StreamdownPlugin>`, and the injection key is updated accordingly. The composable remains exported from the main entry point.

For the HAST renderer and markdown processor (which are pure functions), plugins are passed explicitly via function arguments.

## What Moves Out of Core

| Files | Destination | Reason |
|-------|-------------|--------|
| `src/code-block/*` (7 files) | `src/plugins/code/components/` | Only needed with code plugin |
| `src/icons/*` | `src/plugins/code/icons/` | Only used by code block UI |
| `useCodeBlockContext` composable | `src/plugins/code/` | Only used by code block internals |
| `Pre` component override in `defaultComponents` | Removed | No special code fence handling without plugin |

**Stays in core:** Streamdown, Block, Markdown pipeline, hast-to-vue, defaultComponents (without `pre` override), all other composables, all utilities, styles.css.

## New File Structure

```
src/
  plugins/
    code/
      index.ts              # exports code() factory
      components/            # CodeBlock, CodeBlockContainer, CodeBlockHeader,
                             # CodeBlockBody, CodeBlockSkeleton,
                             # CodeBlockCopyButton, CodeBlockDownloadButton
      icons/                 # CopyIcon, CheckIcon, DownloadIcon
      context.ts             # useCodeBlockContext
    mermaid/
      index.ts              # exports mermaid() factory
      MermaidBlock.ts        # Mermaid renderer component
  types/
    plugin.ts               # StreamdownPlugin, PluginComponentProps interfaces
```

## Code Plugin

Moves existing code block system into `src/plugins/code/`. Shiki remains a dynamic import and optional peer dependency.

The code plugin's component wraps `CodeBlock` with an adapter that extracts `language`, `code`, and `meta` from the raw HAST node, since `CodeBlock` expects these as structured props rather than a raw HAST node.

```ts
export interface CodePluginOptions {
  lightTheme?: string
  darkTheme?: string
}

export function code(options?: CodePluginOptions): StreamdownPlugin {
  return {
    name: 'code',
    match: (node) => node.tagName === 'pre' && hasCodeChild(node),
    component: CodePluginAdapter, // extracts props from HAST, renders CodeBlock
  }
}
```

`CodePluginAdapter` replaces the current `Pre` component's role: it extracts `language`, `code`, and `meta` from the HAST `<pre><code>` structure and passes them to `CodeBlock`.

## Mermaid Plugin

New plugin. Dynamically imports `mermaid` library. Falls back to raw `<pre>` if mermaid not installed or render fails.

```ts
export interface MermaidPluginOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral'
  config?: Record<string, any>
}

export function mermaid(options?: MermaidPluginOptions): StreamdownPlugin {
  return {
    name: 'mermaid',
    match: (node) => {
      const child = node.children?.[0]
      return node.tagName === 'pre'
        && child?.type === 'element'   // type-guard: ensure child is an Element, not a text node
        && child.properties?.className?.includes('language-mermaid')
    },
    component: MermaidBlock,
  }
}
```

**MermaidBlock behavior:**
- Extracts raw mermaid source from HAST node text content
- Dynamically imports mermaid (`await import('mermaid')`)
- Calls `mermaid.render()`, displays SVG via `v-html`
- During streaming (block incomplete): shows raw source in plain `<pre>` to avoid repeated render calls on partial input
- On error: falls back to raw source with error indicator
- Mermaid styles are scoped to the plugin component (no additions to core `styles.css`)

## Build Configuration

### Vite (vite.config.ts)

```ts
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
}
```

### Type declarations

The current build uses `vite-plugin-dts` with `rollupTypes: true`, which produces a single bundled `.d.ts` file. This is incompatible with multiple entry points.

**Solution:** Disable `rollupTypes` and use `vue-tsc --emitDeclarationOnly` to emit per-file `.d.ts` output. The exports map paths are adjusted to match the actual emit structure:

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

Alternative: investigate whether `vite-plugin-dts` v4 handles multi-entry `rollupTypes`. If so, the flat `./dist/code.d.ts` paths can be used. Spike this during implementation.

### Peer dependencies

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

## Breaking Changes

1. Code fences render as plain `<pre><code>` without the `code` plugin
2. `useCodeBlockContext` moves from `streamdown-vue3` to `streamdown-vue3/code`
3. Code block sub-components move from `streamdown-vue3` to `streamdown-vue3/code`
4. `PluginConfig` type replaced by `Record<string, StreamdownPlugin>`; `usePlugins` composable return type changes accordingly
5. `shiki` moves from `optionalDependencies` to `peerDependencies` with `optional: true` (different install behavior: pnpm/npm will warn if missing rather than silently skipping)
6. Consumer-provided `rehypePlugins` continue to run after sanitization (no change), but plugin-system-provided rehype plugins run before sanitization (new behavior)

### Migration

```diff
  import { Streamdown } from 'streamdown-vue3'
+ import { code } from 'streamdown-vue3/code'

- <Streamdown :content="md" />
+ <Streamdown :content="md" :plugins="{ code: code() }" />
```

Version bump: 0.1.x → 0.2.0 (or 1.0.0).

## Testing

- Existing code block tests move to test the code plugin in isolation
- New tests for plugin registration, matching, and fallback behavior
- New tests for plugin matching order (mermaid takes precedence over code for mermaid fences)
- New tests for mermaid plugin (mock mermaid library)
- Integration test: Streamdown with no plugins renders code fences as plain `<pre><code>`
- Integration test: Streamdown with code plugin renders full CodeBlock UI
- Integration test: Streamdown with both plugins renders mermaid fences as MermaidBlock and regular fences as CodeBlock
- Test processor cache invalidation when plugins change
