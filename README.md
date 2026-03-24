# streamdown-vue3

A Vue 3 component for rendering AI-streamed markdown. Handles incomplete syntax, block-level memoization, per-word animation, Shiki syntax highlighting, and more.

> **Community port of [Streamdown](https://streamdown.ai) by Vercel.** The original is a React component — this brings the same streaming markdown experience to Vue. Full credit to the Streamdown team for the incredible original library and the framework-agnostic tools (`remend`, `remark-gfm`, `rehype-sanitize`, etc.) that made this port possible.

> **Vibe-coded.** This library was built entirely through AI-assisted development (Claude Code). It works, it's tested, but it hasn't been battle-tested in production yet. PRs, bug reports, and real-world usage feedback are very welcome.

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

## Quick Start

```vue
<script setup>
import { ref } from 'vue'
import { Streamdown } from 'streamdown-vue3'
import 'streamdown-vue3/styles.css'

const content = ref('')
const isAnimating = ref(true)

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
    animated
    caret="block"
  />
</template>
```

## Features

### Streaming Markdown

Renders markdown that arrives token-by-token from AI models. Automatically completes incomplete syntax during streaming — unclosed bold, partial code fences, unterminated links — using the [`remend`](https://www.npmjs.com/package/remend) package.

```vue
<Streamdown
  :content="streamingText"
  :is-animating="true"
  mode="streaming"
/>
```

### Block Memoization

Splits markdown into independent blocks. Only re-renders blocks whose content changed — completed blocks stay cached. Built on Vue's reactivity system.

### Animation

Per-word or per-character text animation with three built-in presets. Only new content animates — previously rendered text stays put.

```vue
<!-- Default fade-in -->
<Streamdown :content="text" :animated="true" :is-animating="true" />

<!-- Blur-in effect -->
<Streamdown :content="text" :animated="{ animation: 'blurIn', duration: 200 }" :is-animating="true" />

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

### Code Blocks with Shiki

Syntax highlighting for 200+ languages via [Shiki](https://shiki.style). Grammars lazy-load on demand. Copy and download buttons included.

```vue
<Streamdown
  :content="text"
  :shiki-theme="['github-light', 'github-dark']"
/>
```

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
<Streamdown
  :content="text"
  :components="{ h1: MyCustomHeading, a: MyCustomLink }"
/>
```

### Security

Sanitized by default with `rehype-sanitize`. Dangerous protocols (`javascript:`, `vbscript:`) are stripped from URLs.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Markdown content to render |
| `mode` | `'streaming' \| 'static'` | `'streaming'` | Rendering mode |
| `isAnimating` | `boolean` | `false` | Whether content is currently streaming |
| `animated` | `boolean \| AnimateOptions` | `false` | Enable text animation |
| `caret` | `'block' \| 'circle'` | — | Caret style |
| `dir` | `'auto' \| 'ltr' \| 'rtl'` | `'auto'` | Text direction |
| `shikiTheme` | `[string, string]` | `['github-light', 'github-dark']` | Light/dark Shiki themes |
| `controls` | `ControlsConfig \| boolean` | `true` | Show/hide copy & download buttons |
| `components` | `Record<string, Component>` | — | Custom component overrides |
| `parseIncompleteMarkdown` | `boolean` | `true` | Auto-complete incomplete syntax |
| `remend` | `RemendOptions` | — | Configure which completions to perform |
| `plugins` | `PluginConfig` | — | Plugin configuration |
| `remarkPlugins` | `Plugin[]` | `[]` | Additional remark plugins |
| `rehypePlugins` | `Plugin[]` | `[]` | Additional rehype plugins |
| `urlTransform` | `(url, key, node) => string` | sanitizer | Transform/filter URLs |
| `allowedElements` | `string[]` | — | Only allow these HTML elements |
| `disallowedElements` | `string[]` | — | Remove these HTML elements |
| `skipHtml` | `boolean` | `false` | Ignore raw HTML in markdown |

### Events

| Event | Description |
|-------|-------------|
| `@animation-start` | Fired when `isAnimating` changes to `true` |
| `@animation-end` | Fired when `isAnimating` changes to `false` |

## Styling

Every element has a `data-streamdown` attribute for CSS targeting:

```css
[data-streamdown="heading-1"] { font-size: 2rem; }
[data-streamdown="inline-code"] { background: #f0f0f0; }
[data-streamdown="code-container"] { border-radius: 8px; }
[data-streamdown="table"] { width: 100%; }
[data-streamdown="link"] { color: blue; }
```

Available selectors: `root`, `block`, `heading-1` through `heading-6`, `paragraph`, `strong`, `emphasis`, `strikethrough`, `link`, `inline-code`, `pre`, `code-container`, `code-header`, `code-body`, `code-language`, `code-copy-button`, `code-download-button`, `blockquote`, `ordered-list`, `unordered-list`, `list-item`, `table-container`, `table`, `table-head`, `table-body`, `table-row`, `table-header`, `table-cell`, `image`, `hr`, `subscript`, `superscript`.

## Exports

The package exports all internal components and utilities for advanced usage:

```ts
// Components
import { Streamdown, Block, CodeBlock, CodeBlockHeader } from 'streamdown-vue3'

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

What's next:

- [ ] Interactive tables (copy, download, fullscreen)
- [ ] Link safety modals
- [ ] Mermaid diagram rendering
- [ ] KaTeX math rendering
- [ ] CJK plugin
- [ ] i18n / translations
- [ ] SSR / Nuxt compatibility
- [ ] Tailwind prefix support

## Credits

- **[Streamdown](https://streamdown.ai)** by Vercel — the original React library this is ported from
- **[remend](https://www.npmjs.com/package/remend)** — incomplete markdown completion
- **[Shiki](https://shiki.style)** — syntax highlighting
- **[unified](https://unifiedjs.com)** / **remark** / **rehype** — the markdown processing pipeline

## License

MIT
