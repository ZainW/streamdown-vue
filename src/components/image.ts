import { defineComponent, h, type SetupContext } from 'vue'

export const Img = defineComponent({
  name: 'Img',
  inheritAttrs: false,
  setup(_, { attrs }: SetupContext) {
    return () => h('img', {
      ...attrs,
      'data-streamdown': 'image',
      loading: 'lazy',
    })
  },
})
