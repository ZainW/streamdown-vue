import { defineComponent, h, ref } from 'vue'
import { CopyIcon, CheckIcon } from '../icons/index'
import { useStreamdownContext } from '../../../composables/useStreamdownContext'

export const CodeBlockCopyButton = defineComponent({
  name: 'CodeBlockCopyButton',
  props: {
    code: { type: String, required: true },
  },
  setup(props) {
    const copied = ref(false)
    const ctx = useStreamdownContext()

    async function handleCopy() {
      if (ctx.isAnimating) return

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(props.code)
          copied.value = true
          setTimeout(() => {
            copied.value = false
          }, 2000)
          return
        } catch {
          // Fall through to the DOM-based fallback below.
        }
      }

      if (typeof document === 'undefined') {
        return
      }

      try {
        const textarea = document.createElement('textarea')
        textarea.value = props.code
        document.body.appendChild(textarea)
        textarea.select()
        if (typeof document.execCommand === 'function') {
          document.execCommand('copy')
        }
        document.body.removeChild(textarea)
        copied.value = true
        setTimeout(() => {
          copied.value = false
        }, 2000)
      } catch {
        // Gracefully no-op when neither clipboard API nor DOM fallback works.
      }
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          'data-streamdown': 'code-copy-button',
          title: copied.value ? 'Copied!' : 'Copy code',
          'aria-label': copied.value ? 'Copied!' : 'Copy code',
          disabled: ctx.isAnimating,
          onClick: handleCopy,
          class:
            'inline-flex items-center justify-center rounded p-1 transition-colors disabled:opacity-50',
        },
        [h(copied.value ? CheckIcon : CopyIcon)],
      )
  },
})
