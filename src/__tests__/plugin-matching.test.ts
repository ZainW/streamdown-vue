import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { Streamdown } from '../Streamdown'
import { hastToVue } from '../hast-to-vue'
import { code } from '../plugins/code'
import { mermaid } from '../plugins/mermaid'
import type { StreamdownPlugin } from '../types/plugin'
import type { Element } from 'hast'

describe('plugin matching', () => {
  it('uses plugin component when match returns true', () => {
    const CustomCodeBlock = defineComponent({
      props: { node: { type: Object, required: true } },
      setup() {
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
    // Should have mermaid-related rendering (loading/error state since mermaid lib not installed in test)
    const mermaidEl = wrapper.find(
      '[data-streamdown="mermaid-loading"], [data-streamdown="mermaid-error"]',
    )
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
