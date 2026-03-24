import { defineComponent, h, ref } from 'vue'
import { CopyIcon, CheckIcon } from '../icons'
import { useStreamdownContext } from '../composables/useStreamdownContext'

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
      try {
        await navigator.clipboard.writeText(props.code)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = props.code
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2000)
      }
    }

    return () => h('button', {
      type: 'button',
      'data-streamdown': 'code-copy-button',
      title: copied.value ? 'Copied!' : 'Copy code',
      disabled: ctx.isAnimating,
      onClick: handleCopy,
      class: 'inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50',
    }, [
      h(copied.value ? CheckIcon : CopyIcon),
    ])
  },
})
