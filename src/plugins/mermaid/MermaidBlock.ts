import { defineComponent, h, ref, watch, onMounted, type PropType } from 'vue'
import type { Element } from 'hast'
import { useStreamdownContext } from '../../composables/useStreamdownContext'
import { extractTextFromHast } from '../code/utils'

export const MermaidBlock = defineComponent({
  name: 'MermaidBlock',
  props: {
    node: {
      type: Object as PropType<Element>,
      required: true,
    },
  },
  setup(props) {
    const svgHtml = ref('')
    const error = ref<string | null>(null)
    const isMounted = ref(false)
    const ctx = useStreamdownContext()
    let renderRequestId = 0

    onMounted(() => {
      isMounted.value = true
    })

    watch(
      () => [props.node, isMounted.value, ctx.isAnimating] as const,
      async ([node, mounted, isAnimating]) => {
        const requestId = ++renderRequestId

        if (!mounted) return

        // Extract mermaid source from HAST node
        const codeChild = node.children?.[0]
        const source = codeChild ? extractTextFromHast(codeChild) : ''

        if (!source) {
          svgHtml.value = ''
          return
        }

        // During streaming, show raw source to avoid repeated render calls
        if (isAnimating) {
          svgHtml.value = ''
          error.value = null
          return
        }

        try {
          // @ts-ignore mermaid is an optional peer dependency
          const mermaidModule = await import('mermaid')
          const mermaid = mermaidModule.default

          // Ensure mermaid is initialized
          mermaid.initialize({ startOnLoad: false })

          const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const { svg } = await mermaid.render(id, source)

          if (requestId === renderRequestId) {
            svgHtml.value = svg
            error.value = null
          }
        } catch (err) {
          if (requestId === renderRequestId) {
            svgHtml.value = ''
            error.value = err instanceof Error ? err.message : 'Mermaid render failed'
          }
        }
      },
      { immediate: true },
    )

    return () => {
      const codeChild = props.node.children?.[0]
      const source = codeChild ? extractTextFromHast(codeChild) : ''

      // Show raw source during streaming
      if (ctx.isAnimating) {
        return h('pre', { 'data-streamdown': 'mermaid-pending' }, [
          h('code', { class: 'language-mermaid' }, source),
        ])
      }

      // Show rendered SVG
      if (svgHtml.value) {
        return h('div', {
          'data-streamdown': 'mermaid',
          innerHTML: svgHtml.value,
        })
      }

      // Show error fallback
      if (error.value) {
        return h('div', { 'data-streamdown': 'mermaid-error' }, [
          h('pre', {}, [h('code', { class: 'language-mermaid' }, source)]),
          h('p', { style: 'color: red; font-size: 0.875rem;' }, error.value),
        ])
      }

      // Loading state
      return h('pre', { 'data-streamdown': 'mermaid-loading' }, [
        h('code', { class: 'language-mermaid' }, source),
      ])
    }
  },
})
