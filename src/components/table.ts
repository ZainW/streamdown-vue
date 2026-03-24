import { defineComponent, h, type SetupContext } from 'vue'

export const Table = defineComponent({
  name: 'Table',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('div', {
      'data-streamdown': 'table-container',
      class: 'overflow-x-auto',
    }, [
      h('table', {
        ...attrs,
        'data-streamdown': 'table',
      }, slots.default?.()),
    ])
  },
})

export const Thead = defineComponent({
  name: 'Thead',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('thead', {
      ...attrs,
      'data-streamdown': 'table-head',
    }, slots.default?.())
  },
})

export const Tbody = defineComponent({
  name: 'Tbody',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('tbody', {
      ...attrs,
      'data-streamdown': 'table-body',
    }, slots.default?.())
  },
})

export const Tr = defineComponent({
  name: 'Tr',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('tr', {
      ...attrs,
      'data-streamdown': 'table-row',
    }, slots.default?.())
  },
})

export const Th = defineComponent({
  name: 'Th',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('th', {
      ...attrs,
      'data-streamdown': 'table-header',
    }, slots.default?.())
  },
})

export const Td = defineComponent({
  name: 'Td',
  inheritAttrs: false,
  setup(_, { attrs, slots }: SetupContext) {
    return () => h('td', {
      ...attrs,
      'data-streamdown': 'table-cell',
    }, slots.default?.())
  },
})
