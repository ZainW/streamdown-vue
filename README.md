# streamdown-vue3

A Vue 3 component for rendering AI-streamed markdown. Handles incomplete syntax, block-level memoization, per-word animation, Shiki syntax highlighting, and more.

> **Community port of [Streamdown](https://streamdown.ai) by Vercel.** The original is a React component — this brings the same streaming markdown experience to Vue. Full credit to the Streamdown team for the incredible original library and the framework-agnostic tools (`remend`, `remark-gfm`, `rehype-sanitize`, etc.) that made this port possible.

## Install

```bash
pnpm add streamdown-vue3
# or
npm install streamdown-vue3
```

For syntax highlighting, also install Shiki (optional):

```bash
pnpm add shiki
```

Import the stylesheet in your app entry or component:

```ts
import 'streamdown-vue3/styles.css'
```

## Quick Start

```vue
<script setup>
import { ref } from 'vue'
import { Streamdown } from 'streamdown-vue3'
import { code } from 'streamdown-vue3/code'
import 'streamdown-vue3/styles.css'

const content = ref('')
const isAnimating = ref(true)
const plugins = { code: code() }

// Simulate streaming from an AI model
async function stream() {
  const response = await fetch('/api/chat', { method: 'POST' })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    content.value += decoder.decode(value)
  }

  isAnimating.value = false
}
</script>

<template>
  <Streamdown
    :content="content"
    :is-animating="isAnimating"
    :plugins="plugins"
    animated
    caret="block"
  />
</template>
```

### With Vercel AI SDK

Works out of the box with `@ai-sdk/vue`:

```vue
<script setup>
import { useChat } from '@ai-sdk/vue'
import { Streamdown } from 'streamdown-vue3'
import { code } from 'streamdown-vue3/code'
import 'streamdown-vue3/styles.css'

const { messages, input, handleSubmit, isLoading } = useChat()
const plugins = { code: code() }
</script>

<template>
  <div v-for="message in messages" :key="message.id">
    <Streamdown
      :content="message.content"
      :is-animating="isLoading && message.id === messages[messages.length - 1]?.id"
      :mode="isLoading ? 'streaming' : 'static'"
      :plugins="plugins"
      animated
      caret="block"
    />
  </div>

  <form @submit="handleSubmit">
    <input v-model="input" placeholder="Say something..." />
  </form>
</template>
```

## Features

### Streaming Markdown

Renders markdown that arrives token-by-token from AI models. Automatically completes incomplete syntax during streaming — unclosed bold, partial code fences, unterminated links — using the [`remend`](https://www.npmjs.com/package/remend) package.

```vue
<Streamdown :content="streamingText" :is-animating="true" mode="streaming" />
```

### Block Memoization

Splits markdown into independent blocks. Only re-renders blocks whose content changed — completed blocks stay cached. Built on Vue's reactivity system.

### Animation

Per-word or per-character text animation with three built-in presets. Only new content animates — previously rendered text stays put.

```vue
<!-- Default fade-in -->
<Streamdown :content="text" :animated="true" :is-animating="true" />

<!-- Blur-in effect -->
<Streamdown
  :content="text"
  :animated="{ animation: 'blurIn', duration: 200 }"
  :is-animating="true"
/>

<!-- Character-by-character -->
<Streamdown :content="text" :animated="{ sep: 'char' }" :is-animating="true" />
```

Presets: `fadeIn` (default), `blurIn`, `slideUp`

### Caret

Blinking cursor that shows where content is being generated.

```vue
<Streamdown :content="text" :is-animating="true" caret="block" />
<!-- or -->
<Streamdown :content="text" :is-animating="true" caret="circle" />
```

### Plugins

Features like code blocks and mermaid diagrams are tree-shakeable plugins. You only pay for what you use.

```vue
<script setup>
import { Streamdown } from 'streamdown-vue3'
import { code } from 'streamdown-vue3/code'
import { mermaid } from 'streamdown-vue3/mermaid'

const plugins = { code: code(), mermaid: mermaid() }
</script>

<template>
  <Streamdown :content="text" :plugins="plugins" />
</template>
```

Without plugins, code fences render as plain `<pre><code>` (browser default). The `code` plugin adds Shiki highlighting, copy/download buttons, and language labels. The `mermaid` plugin renders mermaid diagrams as SVG.

You can also write custom plugins — see the `StreamdownPlugin` type export:

```ts
import type { StreamdownPlugin } from 'streamdown-vue3'
```

### Code Blocks with Shiki

Requires the `code` plugin. Syntax highlighting for 200+ languages via [Shiki](https://shiki.style). Grammars lazy-load on demand. Copy and download buttons included.

```vue
<Streamdown
  :content="text"
  :plugins="{ code: code() }"
  :shiki-theme="['github-light', 'github-dark']"
/>
```

Without Shiki installed, code blocks fall back to plain `<pre><code>` with language labels and copy/download buttons still working.

### Mermaid Diagrams

Requires the `mermaid` plugin and `mermaid` package:

```bash
pnpm add mermaid
```

```vue
<Streamdown :content="text" :plugins="{ code: code(), mermaid: mermaid() }" />
```

During streaming, mermaid source is shown as raw code. Once streaming completes, the diagram is rendered as SVG. Falls back to source code with an error message if rendering fails.

### GFM Support

Tables, task lists, strikethrough, and autolinks via `remark-gfm`.

### Text Direction

Auto-detects RTL/LTR per block, or set explicitly:

```vue
<Streamdown :content="text" dir="auto" />
```

### Custom Components

Override any markdown element with your own Vue component:

```vue
<Streamdown :content="text" :components="{ h1: MyCustomHeading, a: MyCustomLink }" />
```

### Security

Sanitized by default with `rehype-sanitize`. Dangerous protocols (`javascript:`, `vbscript:`) are stripped from URLs.

### Accessibility

The root element uses `role="log"` with `aria-live="polite"` during streaming, so screen readers announce new content as it arrives. Code block buttons have `aria-label` attributes.

### Error Handling

If markdown processing fails for a block, the component falls back to rendering plain text and emits an `error` event:

```vue
<Streamdown :content="text" @error="(err) => console.error('Parse error:', err)" />
```

## Props

| Prop                      | Type                         | Default                           | Description                            |
| ------------------------- | ---------------------------- | --------------------------------- | -------------------------------------- |
| `content`                 | `string`                     | required                          | Markdown content to render             |
| `mode`                    | `'streaming' \| 'static'`    | `'streaming'`                     | Rendering mode                         |
| `isAnimating`             | `boolean`                    | `false`                           | Whether content is currently streaming |
| `animated`                | `boolean \| AnimateOptions`  | `false`                           | Enable text animation                  |
| `caret`                   | `'block' \| 'circle'`        | —                                 | Caret style                            |
| `dir`                     | `'auto' \| 'ltr' \| 'rtl'`   | `'auto'`                          | Text direction                         |
| `shikiTheme`              | `[string, string]`           | `['github-light', 'github-dark']` | Light/dark Shiki themes                |
| `controls`                | `ControlsConfig \| boolean`  | `true`                            | Show/hide copy & download buttons      |
| `components`              | `Record<string, Component>`  | —                                 | Custom component overrides             |
| `parseIncompleteMarkdown` | `boolean`                    | `true`                            | Auto-complete incomplete syntax        |
| `remend`                  | `RemendOptions`              | —                                 | Configure which completions to perform |
| `plugins`                 | `PluginConfig`               | —                                 | Plugin configuration                   |
| `remarkPlugins`           | `Plugin[]`                   | `[]`                              | Additional remark plugins              |
| `rehypePlugins`           | `Plugin[]`                   | `[]`                              | Additional rehype plugins              |
| `urlTransform`            | `(url, key, node) => string` | sanitizer                         | Transform/filter URLs                  |
| `allowedElements`         | `string[]`                   | —                                 | Only allow these HTML elements         |
| `disallowedElements`      | `string[]`                   | —                                 | Remove these HTML elements             |
| `skipHtml`                | `boolean`                    | `false`                           | Ignore raw HTML in markdown            |

### Events

| Event              | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `@animation-start` | Fired when `isAnimating` changes to `true`                                  |
| `@animation-end`   | Fired when `isAnimating` changes to `false`                                 |
| `@error`           | Fired when markdown processing fails for a block (falls back to plain text) |

## Styling

### Theme Variables

The component uses four CSS custom properties for colors. These have sensible defaults (light/dark via `prefers-color-scheme`), but you can override them to match your design system:

```css
[data-streamdown='root'] {
  --sd-border: #e5e7eb;
  --sd-muted: #f3f4f6;
  --sd-muted-foreground: #6b7280;
  --sd-foreground: #111827;
}
```

These variables control code block borders, backgrounds, button colors, and skeleton placeholders. If you use a component library like Nuxt UI or shadcn-vue, you can map them to your existing tokens.

### Element Selectors

Every element has a `data-streamdown` attribute for CSS targeting:

```css
[data-streamdown='heading-1'] {
  font-size: 2rem;
}
[data-streamdown='inline-code'] {
  background: #f0f0f0;
}
[data-streamdown='code-container'] {
  border-radius: 8px;
}
[data-streamdown='table'] {
  width: 100%;
}
[data-streamdown='link'] {
  color: blue;
}
```

Available selectors: `root`, `block`, `heading-1` through `heading-6`, `paragraph`, `strong`, `emphasis`, `strikethrough`, `link`, `inline-code`, `pre`, `code-container`, `code-header`, `code-body`, `code-language`, `code-copy-button`, `code-download-button`, `code-skeleton`, `blockquote`, `ordered-list`, `unordered-list`, `list-item`, `table-container`, `table`, `table-head`, `table-body`, `table-row`, `table-header`, `table-cell`, `image`, `hr`, `subscript`, `superscript`.

## Exports

```ts
// Main entry
import { Streamdown, Block } from 'streamdown-vue3'
import { code } from 'streamdown-vue3' // also available from 'streamdown-vue3/code'
import type { StreamdownPlugin, PluginComponentProps } from 'streamdown-vue3'

// Code plugin (sub-path export)
import { code, CodeBlock, CodeBlockHeader, CodeBlockBody } from 'streamdown-vue3/code'
import { CopyIcon, CheckIcon, DownloadIcon } from 'streamdown-vue3/code'

// Mermaid plugin (sub-path export)
import { mermaid } from 'streamdown-vue3/mermaid'

// Composables
import { useStreamdownContext, usePlugins } from 'streamdown-vue3'

// Utilities
import { processMarkdown, hastToVue, parseMarkdownIntoBlocks } from 'streamdown-vue3'
import { createAnimatePlugin } from 'streamdown-vue3'
```

## Playground

The repo includes a playground app with simulated streaming:

```bash
cd playground
pnpm install
pnpm run dev
# → http://localhost:5199
```

## Development

This repo uses `pnpm`, `oxfmt`, and `oxlint`. ESLint is not used.

```bash
pnpm fmt
pnpm fmt:check
pnpm lint
pnpm lint:fix
pnpm test
pnpm typecheck
pnpm build
```

The root Vite build runs `vite-plugin-oxlint`, so linting is part of the normal build flow and `pnpm build` fails on lint errors.

## Roadmap

Ported from the React original — not yet at full feature parity. What's here:

- [x] Static & streaming markdown rendering
- [x] Incomplete syntax completion (remend)
- [x] Block-level memoization
- [x] Per-word/char animation (fadeIn, blurIn, slideUp)
- [x] Caret indicators (block, circle)
- [x] Code blocks with Shiki highlighting
- [x] Copy & download buttons
- [x] GFM (tables, task lists, strikethrough, autolinks)
- [x] RTL/LTR auto-detection
- [x] Custom component overrides
- [x] HTML sanitization
- [x] Accessibility (ARIA live regions, button labels)
- [x] CSS custom property theming
- [x] Error event handling
- [x] Plugin architecture with tree-shakeable sub-path exports
- [x] Code block plugin (Shiki highlighting, copy/download)
- [x] Mermaid diagram plugin

What's next:

- [ ] Interactive tables (copy, download, fullscreen)
- [ ] KaTeX math rendering plugin
- [ ] Link safety modals
- [ ] CJK plugin
- [ ] i18n / translations

## Credits

- **[Streamdown](https://streamdown.ai)** by Vercel — the original React library this is ported from
- **[remend](https://www.npmjs.com/package/remend)** — incomplete markdown completion
- **[Shiki](https://shiki.style)** — syntax highlighting
- **[unified](https://unifiedjs.com)** / **remark** / **rehype** — the markdown processing pipeline

## License

MIT
