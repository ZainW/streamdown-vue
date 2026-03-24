import { defineComponent, h, computed, type PropType } from 'vue'
import { CodeBlockContainer } from './CodeBlockContainer'
import { CodeBlockHeader } from './CodeBlockHeader'
import { CodeBlockBody } from './CodeBlockBody'
import { CodeBlockSkeleton } from './CodeBlockSkeleton'
import { useStreamdownContext } from '../composables/useStreamdownContext'

export const CodeBlock = defineComponent({
  name: 'CodeBlock',
  props: {
    code: { type: String, required: true },
    language: { type: String, default: '' },
    isIncomplete: { type: Boolean, default: false },
    meta: { type: String, default: '' },
  },
  setup(props) {
    const ctx = useStreamdownContext()

    const startLine = computed(() => {
      if (!props.meta) return undefined
      const match = props.meta.match(/startLine=(\d+)/)
      return match ? parseInt(match[1], 10) : undefined
    })

    const showLineNumbers = computed(() => {
      if (!props.meta) return false
      if (props.meta.includes('noLineNumbers')) return false
      return startLine.value !== undefined
    })

    return () => {
      // Show skeleton while incomplete during streaming
      if (props.isIncomplete && ctx.isAnimating) {
        return h(CodeBlockContainer, {}, () => [
          h(CodeBlockHeader, {
            language: props.language,
            code: props.code,
          }),
          h(CodeBlockSkeleton),
        ])
      }

      return h(CodeBlockContainer, {}, () => [
        h(CodeBlockHeader, {
          language: props.language,
          code: props.code,
        }),
        h(CodeBlockBody, {
          code: props.code,
          language: props.language,
          startLine: startLine.value,
          showLineNumbers: showLineNumbers.value,
        }),
      ])
    }
  },
})
