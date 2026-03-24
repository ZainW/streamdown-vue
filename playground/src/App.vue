<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { Streamdown } from 'streamdown-vue'
import 'streamdown-vue/styles.css'
import { streamMarkdown } from './api/stream'
import type { CaretStyle } from 'streamdown-vue'

const content = ref('')
const isAnimating = ref(false)
const animated = ref(true)
const caret = ref<CaretStyle | undefined>('block')
const mode = ref<'streaming' | 'static'>('streaming')

// Settings
const showCaret = ref(true)
const caretStyle = ref<CaretStyle>('block')
const animationEnabled = ref(true)

watch(showCaret, (v) => { caret.value = v ? caretStyle.value : undefined })
watch(caretStyle, (v) => { if (showCaret.value) caret.value = v })
watch(animationEnabled, (v) => { animated.value = v })

const streamingInProgress = ref(false)
const hasStreamed = ref(false)

// Auto-scroll
const outputRef = ref<HTMLElement>()
watch(content, () => {
  if (isAnimating.value && outputRef.value) {
    nextTick(() => {
      outputRef.value?.scrollTo({ top: outputRef.value.scrollHeight, behavior: 'smooth' })
    })
  }
})

async function startStream() {
  content.value = ''
  isAnimating.value = true
  mode.value = 'streaming'
  streamingInProgress.value = true
  hasStreamed.value = false

  await streamMarkdown(
    (accumulated) => {
      content.value = accumulated
    },
    () => {
      isAnimating.value = false
      mode.value = 'static'
      streamingInProgress.value = false
      hasStreamed.value = true
    },
  )
}

function reset() {
  content.value = ''
  isAnimating.value = false
  mode.value = 'streaming'
  streamingInProgress.value = false
  hasStreamed.value = false
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-left">
        <h1 class="logo">streamdown-vue</h1>
        <span class="badge">playground</span>
      </div>
      <a
        href="https://github.com/zain/streamdown-vue"
        target="_blank"
        class="github-link"
      >
        GitHub
      </a>
    </header>

    <div class="layout">
      <!-- Controls sidebar -->
      <aside class="sidebar">
        <div class="control-group">
          <h3 class="control-title">Stream</h3>
          <button
            class="btn btn-primary"
            :disabled="streamingInProgress"
            @click="startStream"
          >
            {{ hasStreamed ? 'Replay' : 'Start Streaming' }}
          </button>
          <button
            v-if="streamingInProgress || hasStreamed"
            class="btn btn-secondary"
            @click="reset"
          >
            Reset
          </button>
        </div>

        <div class="control-group">
          <h3 class="control-title">Animation</h3>
          <label class="toggle">
            <input v-model="animationEnabled" type="checkbox" />
            <span>Word animation</span>
          </label>
        </div>

        <div class="control-group">
          <h3 class="control-title">Caret</h3>
          <label class="toggle">
            <input v-model="showCaret" type="checkbox" />
            <span>Show caret</span>
          </label>
          <div v-if="showCaret" class="radio-group">
            <label class="radio">
              <input v-model="caretStyle" type="radio" value="block" />
              <span>Block <code>▋</code></span>
            </label>
            <label class="radio">
              <input v-model="caretStyle" type="radio" value="circle" />
              <span>Circle <code>●</code></span>
            </label>
          </div>
        </div>

        <div class="control-group">
          <h3 class="control-title">Status</h3>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">Mode</span>
              <span class="status-value">{{ mode }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Animating</span>
              <span :class="['status-dot', isAnimating ? 'active' : '']"></span>
            </div>
            <div class="status-item">
              <span class="status-label">Content</span>
              <span class="status-value">{{ content.length }} chars</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main output area -->
      <main ref="outputRef" class="output">
        <div v-if="!content && !streamingInProgress" class="empty-state">
          <p>Hit <strong>Start Streaming</strong> to see streamdown-vue in action.</p>
          <p class="hint">Streams pre-built markdown token-by-token, just like an LLM would.</p>
        </div>
        <Streamdown
          v-else
          :content="content"
          :mode="mode"
          :is-animating="isAnimating"
          :animated="animated"
          :caret="caret"
          class="prose"
        />
      </main>
    </div>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

:root {
  --bg: #0a0a0b;
  --bg-surface: #141416;
  --bg-elevated: #1c1c1f;
  --border: #2a2a2e;
  --text: #e4e4e7;
  --text-muted: #71717a;
  --accent: #6d5cff;
  --accent-hover: #7d6eff;
  --green: #22c55e;
  --radius: 8px;
  --font-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}

.badge {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--accent);
  background: rgba(109, 92, 255, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid rgba(109, 92, 255, 0.2);
}

.github-link {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.github-link:hover {
  color: var(--text);
}

/* Layout */
.layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 240px;
  padding: 16px;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

/* Buttons */
.btn {
  padding: 8px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  font-family: var(--font-sans);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

/* Toggles and radios */
.toggle,
.radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}

.toggle input,
.radio input {
  accent-color: var(--accent);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  padding-left: 4px;
}

.radio code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

/* Status */
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.status-label {
  color: var(--text-muted);
}

.status-value {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: background 0.2s;
}
.status-dot.active {
  background: var(--green);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

/* Output area */
.output {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background: var(--bg);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
.empty-state strong {
  color: var(--text);
}
.hint {
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.6;
}

/* Prose / markdown styling */
.prose {
  max-width: 720px;
  line-height: 1.7;
  font-size: 15px;
}

.prose [data-streamdown="heading-1"] {
  font-size: 28px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.prose [data-streamdown="heading-2"] {
  font-size: 21px;
  font-weight: 600;
  margin-top: 32px;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.prose [data-streamdown="heading-3"] {
  font-size: 17px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 8px;
}

.prose [data-streamdown="paragraph"] {
  margin-bottom: 16px;
  color: #d1d1d6;
}

.prose [data-streamdown="strong"] {
  font-weight: 600;
  color: var(--text);
}

.prose [data-streamdown="emphasis"] {
  font-style: italic;
  color: #b0b0b8;
}

.prose [data-streamdown="strikethrough"] {
  text-decoration: line-through;
  color: var(--text-muted);
}

.prose [data-streamdown="link"] {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
.prose [data-streamdown="link"]:hover {
  border-bottom-color: var(--accent);
}

.prose [data-streamdown="inline-code"] {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 4px;
  color: #e0b0ff;
}

.prose [data-streamdown="blockquote"] {
  border-left: 3px solid var(--accent);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-muted);
}

.prose [data-streamdown="ordered-list"],
.prose [data-streamdown="unordered-list"] {
  margin-bottom: 16px;
  padding-left: 24px;
}

.prose [data-streamdown="list-item"] {
  margin-bottom: 4px;
  color: #d1d1d6;
}

.prose [data-streamdown="hr"] {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}

/* Code blocks */
.prose [data-streamdown="code-container"] {
  background: #111113;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin: 16px 0;
  overflow: hidden;
}

.prose [data-streamdown="code-header"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.prose [data-streamdown="code-language"] {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: lowercase;
}

.prose [data-streamdown="code-copy-button"],
.prose [data-streamdown="code-download-button"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.prose [data-streamdown="code-copy-button"]:hover,
.prose [data-streamdown="code-download-button"]:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.06);
}

.prose [data-streamdown="code-body"] {
  overflow-x: auto;
}

/* Shiki-highlighted output */
.prose [data-streamdown="code-body"] .shiki {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}

.prose [data-streamdown="code-body"] .shiki code {
  font-family: inherit;
  background: none;
  border: none;
  padding: 0;
}

/* Plain text fallback (no shiki) */
.prose [data-streamdown="code-body"] > pre {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: #c8c8d0;
}

.prose [data-streamdown="code-body"] > pre code {
  font-family: inherit;
}

/* Tables */
.prose [data-streamdown="table-container"] {
  margin: 16px 0;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.prose [data-streamdown="table"] {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.prose [data-streamdown="table-header"] {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.prose [data-streamdown="table-cell"] {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  color: #c8c8d0;
}

.prose [data-streamdown="table-row"]:last-child [data-streamdown="table-cell"] {
  border-bottom: none;
}

.prose [data-streamdown="table-row"]:hover [data-streamdown="table-cell"] {
  background: rgba(255, 255, 255, 0.02);
}

/* Caret styling */
[data-streamdown-caret="block"]::after {
  margin-left: 1px;
  color: var(--accent);
}

[data-streamdown-caret="circle"]::after {
  margin-left: 2px;
  color: var(--accent);
}
</style>
