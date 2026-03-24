import { defineComponent, h, type SetupContext } from 'vue'

export const A = defineComponent({
  name: 'A',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('a', {
      ...attrs,
      'data-streamdown': 'link',
      target: '_blank',
      rel: 'noopener noreferrer',
    }, slots.default?.())
  },
})
