import { describe, it, expect } from 'vitest'
import { hastToVue } from '../hast-to-vue'
import { h, defineComponent, createApp } from 'vue'
import type { Element, Root, Text } from 'hast'

describe('hastToVue', () => {
  it('converts a text node', () => {
    const text: Text = { type: 'text', value: 'Hello' }
    const result = hastToVue(text)
    expect(result).toEqual(['Hello'])
  })

  it('converts an element node', () => {
    const element: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Hello' }],
    }
    const result = hastToVue(element)
    expect(result.length).toBe(1)
  })

  it('converts className to class', () => {
    const element: Element = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['foo', 'bar'] },
      children: [],
    }
    const result = hastToVue(element)
    expect(result.length).toBe(1)
    // The VNode should have class "foo bar"
    const vnode = result[0]
    expect(typeof vnode).not.toBe('string')
    if (typeof vnode !== 'string') {
      expect(vnode.props?.class).toBe('foo bar')
    }
  })

  it('converts a root node', () => {
    const root: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'Hello' }],
        },
      ],
    }
    const result = hastToVue(root)
    expect(result.length).toBe(1)
  })

  it('filters elements with allowedElements', () => {
    const root: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'Keep' }],
        },
        {
          type: 'element',
          tagName: 'div',
          properties: {},
          children: [{ type: 'text', value: 'Remove' }],
        },
      ],
    }
    const result = hastToVue(root, { allowedElements: ['p'] })
    expect(result.length).toBe(1)
  })

  it('filters elements with disallowedElements', () => {
    const root: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'Keep' }],
        },
        {
          type: 'element',
          tagName: 'script',
          properties: {},
          children: [{ type: 'text', value: 'Remove' }],
        },
      ],
    }
    const result = hastToVue(root, { disallowedElements: ['script'] })
    expect(result.length).toBe(1)
  })

  it('unwraps disallowed elements when unwrapDisallowed is true', () => {
    const root: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: {},
          children: [{ type: 'text', value: 'Unwrapped' }],
        },
      ],
    }
    const result = hastToVue(root, {
      disallowedElements: ['div'],
      unwrapDisallowed: true,
    })
    expect(result.length).toBe(1)
    expect(result[0]).toBe('Unwrapped')
  })

  it('uses custom components', () => {
    const CustomP = defineComponent({
      setup(_, { slots }) {
        return () => h('p', { class: 'custom' }, slots.default?.())
      },
    })

    const element: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [{ type: 'text', value: 'Hello' }],
    }

    const result = hastToVue(element, { components: { p: CustomP } })
    expect(result.length).toBe(1)
    const vnode = result[0]
    expect(typeof vnode).not.toBe('string')
    if (typeof vnode !== 'string') {
      expect(vnode.type).toBe(CustomP)
    }
  })

  it('handles void elements', () => {
    const element: Element = {
      type: 'element',
      tagName: 'br',
      properties: {},
      children: [],
    }
    const result = hastToVue(element)
    expect(result.length).toBe(1)
  })

  it('transforms URLs with urlTransform', () => {
    const element: Element = {
      type: 'element',
      tagName: 'a',
      properties: { href: 'javascript:alert(1)' },
      children: [{ type: 'text', value: 'Click' }],
    }
    const result = hastToVue(element, {
      urlTransform: (url) => {
        if (url.startsWith('javascript:')) return ''
        return url
      },
    })
    expect(result.length).toBe(1)
    const vnode = result[0]
    if (typeof vnode !== 'string') {
      expect(vnode.props?.href).toBe('')
    }
  })

  it('skips comment nodes', () => {
    const root: Root = {
      type: 'root',
      children: [
        { type: 'comment', value: 'this is a comment' } as any,
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'Hello' }],
        },
      ],
    }
    const result = hastToVue(root)
    expect(result.length).toBe(1)
  })
})
