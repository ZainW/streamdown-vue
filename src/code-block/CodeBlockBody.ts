import { defineComponent, h, ref, watchEffect, type PropType } from 'vue'
import { useStreamdownContext } from '../composables/useStreamdownContext'

export const CodeBlockBody = defineComponent({
  name: 'CodeBlockBody',
  props: {
    code: { type: String, required: true },
    language: { type: String, default: '' },
    startLine: { type: Number, default: undefined },
    showLineNumbers: { type: Boolean, default: false },
  },
  setup(props) {
    const highlightedHtml = ref('')
    const ctx = useStreamdownContext()

    watchEffect(async () => {
      const code = props.code
      const lang = props.language

      if (!lang) {
        highlightedHtml.value = ''
        return
      }

      try {
        const { codeToHtml } = await import('shiki')
        const [lightTheme, darkTheme] = ctx.shikiTheme ?? ['github-light', 'github-dark']

        const html = await codeToHtml(code, {
          lang,
          themes: {
            light: lightTheme,
            dark: darkTheme,
          },
          defaultColor: 'dark',
        })

        highlightedHtml.value = html
      } catch {
        // Language not supported or shiki failed — fall back to plain text
        highlightedHtml.value = ''
      }
    })

    return () => {
      // Highlighted output from Shiki
      if (highlightedHtml.value) {
        return h('div', {
          'data-streamdown': 'code-body',
          innerHTML: highlightedHtml.value,
        })
      }

      // Plain text fallback (no language or shiki not loaded)
      return h('div', {
        'data-streamdown': 'code-body',
      }, [
        h('pre', {}, [
          h('code', {
            class: props.language ? `language-${props.language}` : undefined,
          }, props.code),
        ]),
      ])
    }
  },
})
