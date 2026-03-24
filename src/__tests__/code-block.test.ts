import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Streamdown } from '../Streamdown'

describe('Code Blocks', () => {
  it('renders a code block with language header', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```javascript\nconst x = 1;\n```',
        mode: 'static',
      },
    })
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-streamdown="code-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-streamdown="code-language"]').text()).toBe('javascript')
  })

  it('renders code content correctly', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```python\nprint("hello")\n```',
        mode: 'static',
      },
    })
    expect(wrapper.find('[data-streamdown="code-body"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('print("hello")')
  })

  it('renders inline code differently from code blocks', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: 'Use `inline` code',
        mode: 'static',
      },
    })
    // Inline code should NOT have a code block container
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(false)
    expect(wrapper.find('[data-streamdown="inline-code"]').exists()).toBe(true)
  })

  it('renders code block without language', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```\nplain text\n```',
        mode: 'static',
      },
    })
    expect(wrapper.find('[data-streamdown="code-container"]').exists()).toBe(true)
  })

  it('shows copy button by default', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```js\ncode\n```',
        mode: 'static',
      },
    })
    expect(wrapper.find('[data-streamdown="code-copy-button"]').exists()).toBe(true)
  })

  it('shows download button by default', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```js\ncode\n```',
        mode: 'static',
      },
    })
    expect(wrapper.find('[data-streamdown="code-download-button"]').exists()).toBe(true)
  })

  it('hides controls when controls=false', () => {
    const wrapper = mount(Streamdown, {
      props: {
        content: '```js\ncode\n```',
        mode: 'static',
        controls: false,
      },
    })
    expect(wrapper.find('[data-streamdown="code-copy-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-streamdown="code-download-button"]').exists()).toBe(false)
  })
})
