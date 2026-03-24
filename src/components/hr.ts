import { defineComponent, h } from 'vue'

export const Hr = defineComponent({
  name: 'Hr',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h('hr', {
        ...attrs,
        'data-streamdown': 'hr',
      })
  },
})
