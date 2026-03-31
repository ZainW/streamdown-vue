import { defineComponent, h, type SetupContext } from 'vue'

/**
 * Code component handles inline code.
 */
export const Code = defineComponent({
  name: 'Code',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => {
      return h(
        'code',
        {
          ...attrs,
          'data-streamdown': 'inline-code',
        },
        slots.default?.(),
      )
    }
  },
})
