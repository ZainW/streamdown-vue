import { defineComponent, h, type SetupContext, type VNode } from 'vue'
import { CodeBlock } from '../code-block/CodeBlock'

/**
 * Code component handles inline code.
 */
export const Code = defineComponent({
  name: 'Code',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => {
      return h('code', {
        ...attrs,
        'data-streamdown': 'inline-code',
      }, slots.default?.())
    }
  },
})

/**
 * Pre component — detects code blocks and dispatches to CodeBlock.
 * When the child is a <code> element with a language class, it renders
 * a full CodeBlock with header, copy/download buttons, etc.
 */
export const Pre = defineComponent({
  name: 'Pre',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => {
      const children = slots.default?.()

      // Check if this is a code fence (pre > code)
      // The unified pipeline produces: <pre><code class="language-X">...</code></pre>
      if (children && children.length === 1) {
        const child = children[0] as VNode

        // Match only actual <code> elements — either native 'code' tag
        // or our Code component (which has name 'Code')
        const isCodeElement =
          child?.type === 'code' ||
          (child?.type && typeof child.type === 'object' && 'name' in child.type && child.type.name === 'Code')

        if (isCodeElement && child?.props) {
          // Extract language from class like "language-javascript"
          const classStr = child.props.class
          const langMatch = typeof classStr === 'string'
            ? classStr.match(/language-(\S+)/)
            : null
          const language = langMatch ? langMatch[1] : ''

          // Extract code text from VNode children
          const code = extractText(child.children)
          const meta = (child.props as Record<string, any>).meta || ''

          return h(CodeBlock, {
            code,
            language,
            isIncomplete: false,
            meta,
          })
        }
      }

      // Fallback: plain pre
      return h('pre', {
        ...attrs,
        'data-streamdown': 'pre',
      }, children)
    }
  },
})

/**
 * Recursively extract text content from VNode children.
 */
function extractText(children: unknown): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) {
    return children.map(extractText).join('')
  }
  if (children && typeof children === 'object' && children !== null) {
    const obj = children as Record<string, unknown>
    if (obj.children) return extractText(obj.children)
    if (typeof obj.props === 'object' && obj.props !== null) {
      const props = obj.props as Record<string, unknown>
      if (props.children) return extractText(props.children)
    }
  }
  return ''
}
