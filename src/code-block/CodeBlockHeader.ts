import { defineComponent, h } from 'vue'
import { CodeBlockCopyButton } from './CodeBlockCopyButton'
import { CodeBlockDownloadButton } from './CodeBlockDownloadButton'
import { useStreamdownContext } from '../composables/useStreamdownContext'

export const CodeBlockHeader = defineComponent({
  name: 'CodeBlockHeader',
  props: {
    language: { type: String, default: '' },
    code: { type: String, default: '' },
  },
  setup(props) {
    const ctx = useStreamdownContext()

    return () => {
      const controls = ctx.controls?.code ?? { copy: true, download: true }
      const children: any[] = []

      // Language label
      children.push(
        h('span', {
          'data-streamdown': 'code-language',
          class: 'text-xs text-muted-foreground select-none',
        }, props.language || 'text')
      )

      // Control buttons
      const buttons: any[] = []
      if (controls.copy !== false) {
        buttons.push(h(CodeBlockCopyButton, { code: props.code }))
      }
      if (controls.download !== false) {
        buttons.push(h(CodeBlockDownloadButton, { code: props.code, language: props.language }))
      }

      if (buttons.length > 0) {
        children.push(
          h('div', {
            class: 'flex items-center gap-1',
          }, buttons)
        )
      }

      return h('div', {
        'data-streamdown': 'code-header',
        class: 'flex items-center justify-between px-4 py-2 border-b border-border',
      }, children)
    }
  },
})
