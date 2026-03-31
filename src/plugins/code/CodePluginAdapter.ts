import { defineComponent, h, type PropType } from 'vue'
import type { Element } from 'hast'
import { CodeBlock } from './components/CodeBlock'
import { extractTextFromHast } from './utils'

export const CodePluginAdapter = defineComponent({
  name: 'CodePluginAdapter',
  props: {
    node: {
      type: Object as PropType<Element>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const node = props.node
      const codeChild = node.children?.[0]

      let language = ''
      let code = ''
      let meta = ''

      if (codeChild && codeChild.type === 'element' && codeChild.tagName === 'code') {
        const classes = codeChild.properties?.className
        if (Array.isArray(classes)) {
          for (const cls of classes) {
            const match = typeof cls === 'string' ? cls.match(/^language-(.+)$/) : null
            if (match) {
              language = match[1]
              break
            }
          }
        }
        code = extractTextFromHast(codeChild)
        meta = (codeChild.properties as any)?.meta || ''
      }

      return h(CodeBlock, {
        code,
        language,
        isIncomplete: false,
        meta,
      })
    }
  },
})
