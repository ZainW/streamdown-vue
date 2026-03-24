import { defineComponent, h } from 'vue'

export const CodeBlockSkeleton = defineComponent({
  name: 'CodeBlockSkeleton',
  setup() {
    return () =>
      h(
        'div',
        {
          'data-streamdown': 'code-skeleton',
          class: 'animate-pulse p-4 space-y-2',
        },
        [
          h('div', { class: 'h-4 bg-muted rounded w-3/4' }),
          h('div', { class: 'h-4 bg-muted rounded w-1/2' }),
          h('div', { class: 'h-4 bg-muted rounded w-5/6' }),
        ],
      )
  },
})
