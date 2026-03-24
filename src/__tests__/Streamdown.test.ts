import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Streamdown } from '../Streamdown'

describe('Streamdown', () => {
  describe('static rendering', () => {
    it('renders a heading', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '# Hello World', mode: 'static' },
      })
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toBe('Hello World')
      expect(h1.attributes('data-streamdown')).toBe('heading-1')
    })

    it('renders multiple heading levels', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '# H1\n## H2\n### H3', mode: 'static' },
      })
      expect(wrapper.find('h1').exists()).toBe(true)
      expect(wrapper.find('h2').exists()).toBe(true)
      expect(wrapper.find('h3').exists()).toBe(true)
    })

    it('renders bold and italic text', () => {
      const wrapper = mount(Streamdown, {
        props: { content: 'This is **bold** and *italic*', mode: 'static' },
      })
      expect(wrapper.find('strong').text()).toBe('bold')
      expect(wrapper.find('em').text()).toBe('italic')
    })

    it('renders links', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '[Click here](https://example.com)', mode: 'static' },
      })
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('Click here')
      expect(link.attributes('href')).toBe('https://example.com')
      expect(link.attributes('target')).toBe('_blank')
    })

    it('renders unordered lists', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '- Item 1\n- Item 2\n- Item 3', mode: 'static' },
      })
      const items = wrapper.findAll('li')
      expect(items.length).toBe(3)
      expect(items[0].text()).toBe('Item 1')
    })

    it('renders ordered lists', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '1. First\n2. Second\n3. Third', mode: 'static' },
      })
      expect(wrapper.find('ol').exists()).toBe(true)
      const items = wrapper.findAll('li')
      expect(items.length).toBe(3)
    })

    it('renders inline code', () => {
      const wrapper = mount(Streamdown, {
        props: { content: 'Use the `console.log` function', mode: 'static' },
      })
      const code = wrapper.find('code')
      expect(code.exists()).toBe(true)
      expect(code.text()).toBe('console.log')
    })

    it('renders code blocks', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: '```javascript\nconst x = 1;\n```',
          mode: 'static',
        },
      })
      expect(wrapper.find('pre').exists()).toBe(true)
      expect(wrapper.find('code').exists()).toBe(true)
    })

    it('renders blockquotes', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '> This is a quote', mode: 'static' },
      })
      const blockquote = wrapper.find('blockquote')
      expect(blockquote.exists()).toBe(true)
      expect(blockquote.text()).toBe('This is a quote')
    })

    it('renders images', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '![Alt text](https://example.com/img.png)', mode: 'static' },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('alt')).toBe('Alt text')
      expect(img.attributes('src')).toBe('https://example.com/img.png')
    })

    it('renders horizontal rules', () => {
      const wrapper = mount(Streamdown, {
        props: { content: 'Above\n\n---\n\nBelow', mode: 'static' },
      })
      expect(wrapper.find('hr').exists()).toBe(true)
    })

    it('renders strikethrough', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '~~deleted~~', mode: 'static' },
      })
      expect(wrapper.find('del').exists()).toBe(true)
      expect(wrapper.find('del').text()).toBe('deleted')
    })
  })

  describe('GFM tables', () => {
    it('renders a table', () => {
      const markdown = `| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |`
      const wrapper = mount(Streamdown, {
        props: { content: markdown, mode: 'static' },
      })
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.findAll('th').length).toBe(2)
      expect(wrapper.findAll('td').length).toBe(4)
    })
  })

  describe('data-streamdown attributes', () => {
    it('sets root data attribute', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '# Test', mode: 'static' },
      })
      expect(wrapper.attributes('data-streamdown')).toBe('root')
    })

    it('sets block data attribute', () => {
      const wrapper = mount(Streamdown, {
        props: { content: '# Test', mode: 'static' },
      })
      expect(wrapper.find('[data-streamdown="block"]').exists()).toBe(true)
    })
  })

  describe('streaming mode', () => {
    it('completes incomplete bold during streaming', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: 'This is **bol',
          mode: 'streaming',
          isAnimating: true,
        },
      })
      // Should still render without errors
      expect(wrapper.find('[data-streamdown="root"]').exists()).toBe(true)
      // The bold should be completed
      expect(wrapper.find('strong').exists()).toBe(true)
    })

    it('completes incomplete code fence during streaming', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: '```javascript\nconst x = 1;',
          mode: 'streaming',
          isAnimating: true,
        },
      })
      expect(wrapper.find('pre').exists()).toBe(true)
    })

    it('shows caret on last block when animating', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: 'Hello world',
          mode: 'streaming',
          isAnimating: true,
          caret: 'block',
        },
      })
      expect(wrapper.find('[data-streamdown-caret="block"]').exists()).toBe(true)
    })

    it('does not show caret when not animating', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: 'Hello world',
          mode: 'streaming',
          isAnimating: false,
          caret: 'block',
        },
      })
      expect(wrapper.find('[data-streamdown-caret]').exists()).toBe(false)
    })
  })

  describe('custom components', () => {
    it('uses custom components when provided', () => {
      const CustomH1 = {
        inheritAttrs: false,
        setup(_: any, { attrs, slots }: any) {
          const { h: createElement } = require('vue')
          return () => createElement('h1', { ...attrs, class: 'custom-heading' }, slots.default?.())
        },
      }
      const wrapper = mount(Streamdown, {
        props: {
          content: '# Custom',
          mode: 'static',
          components: { h1: CustomH1 as any },
        },
      })
      expect(wrapper.find('h1.custom-heading').exists()).toBe(true)
    })
  })

  describe('text direction', () => {
    it('detects RTL text', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: 'مرحبا بالعالم',
          mode: 'static',
          dir: 'auto',
        },
      })
      const block = wrapper.find('[data-streamdown="block"]')
      expect(block.attributes('dir')).toBe('rtl')
    })

    it('detects LTR text', () => {
      const wrapper = mount(Streamdown, {
        props: {
          content: 'Hello world',
          mode: 'static',
          dir: 'auto',
        },
      })
      const block = wrapper.find('[data-streamdown="block"]')
      expect(block.attributes('dir')).toBe('ltr')
    })
  })

  describe('props', () => {
    it('accepts class via attrs', () => {
      const wrapper = mount(Streamdown, {
        props: { content: 'Test', mode: 'static' },
        attrs: { class: 'my-class' },
      })
      expect(wrapper.classes()).toContain('my-class')
    })
  })
})
