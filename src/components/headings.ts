import { defineComponent, h, type SetupContext } from 'vue'

function createHeading(level: number) {
  return defineComponent({
    name: `H${level}`,
    inheritAttrs: false,
    setup(_, { attrs, slots }: SetupContext) {
      return () => h(`h${level}`, {
        ...attrs,
        'data-streamdown': `heading-${level}`,
      }, slots.default?.())
    },
  })
}

export const H1 = createHeading(1)
export const H2 = createHeading(2)
export const H3 = createHeading(3)
export const H4 = createHeading(4)
export const H5 = createHeading(5)
export const H6 = createHeading(6)
