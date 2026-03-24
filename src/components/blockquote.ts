import { defineComponent, h, type SetupContext } from 'vue'

export const Blockquote = defineComponent({
  name: 'Blockquote',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('blockquote', {
      ...attrs,
      'data-streamdown': 'blockquote',
    }, slots.default?.())
  },
})
