import { describe, it, expect, vi } from 'vitest'
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

  it('falls back to document.execCommand when clipboard API is unavailable', async () => {
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const execCommand = vi.fn(() => true)
    const originalExecCommand = document.execCommand?.bind(document)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    document.execCommand = execCommand

    try {
      const wrapper = mount(Streamdown, {
        props: {
          content: '```js\nconsole.log("hi")\n```',
          mode: 'static',
        },
      })

      await wrapper.find('[data-streamdown="code-copy-button"]').trigger('click')
      expect(execCommand).toHaveBeenCalledWith('copy')
    } finally {
      if (clipboardDescriptor) {
        Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
      } else {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: undefined,
        })
      }
      document.execCommand = originalExecCommand ?? (() => false)
    }
  })

  it('downloads code without throwing when browser download APIs are available', async () => {
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const removeChild = vi.spyOn(document.body, 'removeChild')

    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    try {
      const wrapper = mount(Streamdown, {
        props: {
          content: '```ts\nconst value = 1\n```',
          mode: 'static',
        },
      })

      await expect(
        wrapper.find('[data-streamdown="code-download-button"]').trigger('click'),
      ).resolves.toBeUndefined()

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
      expect(appendChild).toHaveBeenCalled()
      expect(removeChild).toHaveBeenCalled()
    } finally {
      appendChild.mockRestore()
      removeChild.mockRestore()
    }
  })
})
