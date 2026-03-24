import { defineComponent, h } from 'vue'

export const CopyIcon = defineComponent({
  name: 'CopyIcon',
  setup() {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('rect', { x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 }),
      h('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }),
    ])
  },
})

export const CheckIcon = defineComponent({
  name: 'CheckIcon',
  setup() {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('polyline', { points: '20 6 9 17 4 12' }),
    ])
  },
})

export const DownloadIcon = defineComponent({
  name: 'DownloadIcon',
  setup() {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }, [
      h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
      h('polyline', { points: '7 10 12 15 17 10' }),
      h('line', { x1: 12, y1: 15, x2: 12, y2: 3 }),
    ])
  },
})
