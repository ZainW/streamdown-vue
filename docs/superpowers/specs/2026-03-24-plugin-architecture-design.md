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
}
```

- **`name`** — identifier used as key in the plugins object
- **`match`** — claims a HAST element node during rendering; first plugin to match wins
- **`component`** — Vue component that renders matched nodes; receives HAST node data as props
- **`remarkPlugins`** — optional remark extensions merged after remark-gfm
- **`rehypePlugins`** — optional rehype extensions merged after rehype-raw, before rehype-sanitize

Each plugin sub-path exports a factory function so consumers can pass options:

```ts
export function code(options?: CodePluginOptions): StreamdownPlugin
export function mermaid(options?: MermaidPluginOptions): StreamdownPlugin
```

## Core Integration

### HAST-to-Vue rendering (hast-to-vue.ts)

Plugin matching runs before the component map lookup:

```ts
for (const plugin of plugins) {
  if (plugin.match(element)) {
    return h(plugin.component, { node: element, ...attrs }, children)
  }
}
const component = options.components?.[element.tagName] ?? element.tagName
```

### Markdown pipeline (Markdown.ts)

Pipeline extensions collected from plugins and merged at fixed positions:

```ts
const extraRemarkPlugins = plugins.flatMap(p => p.remarkPlugins ?? [])
const extraRehypePlugins = plugins.flatMap(p => p.rehypePlugins ?? [])

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(...extraRemarkPlugins)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(...extraRehypePlugins)
  .use(rehypeSanitize, schema)
```

### Plugin data flow

Plugins are provided from `Streamdown.ts` via Vue's provide/inject. The existing `usePlugins` composable is updated to work with `Record<string, StreamdownPlugin>`. Both the HAST renderer and markdown processor read from this context.

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
    plugin.ts               # StreamdownPlugin interface
```

## Code Plugin

Moves existing code block system into `src/plugins/code/`. Shiki remains a dynamic import and optional peer dependency.

```ts
export interface CodePluginOptions {
  lightTheme?: string
  darkTheme?: string
}

export function code(options?: CodePluginOptions): StreamdownPlugin {
  return {
    name: 'code',
    match: (node) => node.tagName === 'pre' && hasCodeChild(node),
    component: CodeBlock, // wired with options via provide or props
  }
}
```

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
      return node.tagName === 'pre'
        && node.children?.[0]?.properties?.className?.includes('language-mermaid')
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

### Package.json exports

```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./code": {
    "import": "./dist/code.js",
    "types": "./dist/code.d.ts"
  },
  "./mermaid": {
    "import": "./dist/mermaid.js",
    "types": "./dist/mermaid.d.ts"
  },
  "./styles.css": "./styles.css"
}
```

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
4. `PluginConfig` type replaced by `Record<string, StreamdownPlugin>`

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
- New tests for mermaid plugin (mock mermaid library)
- Integration test: Streamdown with no plugins renders code fences as plain `<pre><code>`
- Integration test: Streamdown with code plugin renders full CodeBlock UI
