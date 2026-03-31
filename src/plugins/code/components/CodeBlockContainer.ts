import { defineComponent, h, type SetupContext } from 'vue'

export const CodeBlockContainer = defineComponent({
  name: 'CodeBlockContainer',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-streamdown': 'code-container',
          class: 'rounded-lg border overflow-hidden my-4',
        },
        slots.default?.(),
      )
  },
})
