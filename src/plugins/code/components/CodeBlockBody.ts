import { defineComponent, h, onMounted, ref, watch } from 'vue'
import { useStreamdownContext } from '../../../composables/useStreamdownContext'

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
    const isMounted = ref(false)
    let highlightRequestId = 0
    const ctx = useStreamdownContext()

    onMounted(() => {
      isMounted.value = true
    })

    watch(
      () => [props.code, props.language, isMounted.value, ctx.shikiTheme] as const,
      async ([code, lang, mounted]) => {
        const requestId = ++highlightRequestId

        if (!mounted || !lang) {
          highlightedHtml.value = ''
          return
        }

        if (typeof window === 'undefined') {
          highlightedHtml.value = ''
          return
        }

        const [lightTheme, darkTheme] = ctx.shikiTheme ?? ['github-light', 'github-dark']

        try {
          const { codeToHtml } = await import('shiki')
          const html = await codeToHtml(code, {
            lang,
            themes: {
              light: lightTheme,
              dark: darkTheme,
            },
            defaultColor: 'dark',
          })

          if (requestId === highlightRequestId) {
            highlightedHtml.value = html
          }
        } catch {
          // Language not supported or shiki failed — fall back to plain text
          if (requestId === highlightRequestId) {
            highlightedHtml.value = ''
          }
        }
      },
      { immediate: true },
    )

    return () => {
      // Keep SSR and initial hydration deterministic by rendering plain code first.
      if (!isMounted.value || !highlightedHtml.value) {
        return h(
          'div',
          {
            'data-streamdown': 'code-body',
          },
          [
            h('pre', {}, [
              h(
                'code',
                {
                  class: props.language ? `language-${props.language}` : undefined,
                },
                props.code,
              ),
            ]),
          ],
        )
      }

      // Highlighted output from Shiki after client mount.
      return h('div', {
        'data-streamdown': 'code-body',
        innerHTML: highlightedHtml.value,
      })
    }
  },
})
