import { defineComponent, h, type SetupContext } from 'vue'

export const Ol = defineComponent({
  name: 'Ol',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('ol', {
      ...attrs,
      'data-streamdown': 'ordered-list',
    }, slots.default?.())
  },
})

export const Ul = defineComponent({
  name: 'Ul',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('ul', {
      ...attrs,
      'data-streamdown': 'unordered-list',
    }, slots.default?.())
  },
})

export const Li = defineComponent({
  name: 'Li',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('li', {
      ...attrs,
      'data-streamdown': 'list-item',
    }, slots.default?.())
  },
})
