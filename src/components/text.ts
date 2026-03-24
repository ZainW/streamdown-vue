import { defineComponent, h, type SetupContext } from 'vue'

export const P = defineComponent({
  name: 'P',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'p',
        {
          ...attrs,
          'data-streamdown': 'paragraph',
        },
        slots.default?.(),
      )
  },
})

export const Strong = defineComponent({
  name: 'Strong',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'strong',
        {
          ...attrs,
          'data-streamdown': 'strong',
        },
        slots.default?.(),
      )
  },
})

export const Em = defineComponent({
  name: 'Em',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'em',
        {
          ...attrs,
          'data-streamdown': 'emphasis',
        },
        slots.default?.(),
      )
  },
})

export const Del = defineComponent({
  name: 'Del',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'del',
        {
          ...attrs,
          'data-streamdown': 'strikethrough',
        },
        slots.default?.(),
      )
  },
})

export const Sub = defineComponent({
  name: 'Sub',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'sub',
        {
          ...attrs,
          'data-streamdown': 'subscript',
        },
        slots.default?.(),
      )
  },
})

export const Sup = defineComponent({
  name: 'Sup',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () =>
      h(
        'sup',
        {
          ...attrs,
          'data-streamdown': 'superscript',
        },
        slots.default?.(),
      )
  },
})
