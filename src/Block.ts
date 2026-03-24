import { defineComponent, h, shallowRef, watch, type PropType, type VNode } from 'vue'
import { processMarkdown } from './Markdown'
import type { Component } from 'vue'
import type { Plugin as UnifiedPlugin } from 'unified'
import type { createAnimatePlugin } from './lib/animate'

export const Block = defineComponent({
  name: 'StreamdownBlock',
  props: {
    content: { type: String, required: true },
    isLastBlock: { type: Boolean, default: false },
    isAnimating: { type: Boolean, default: false },
    components: {
      type: Object as PropType<Record<string, Component>>,
      default: () => ({}),
    },
    remarkPlugins: {
      type: Array as PropType<UnifiedPlugin[]>,
      default: () => [],
    },
    rehypePlugins: {
      type: Array as PropType<UnifiedPlugin[]>,
      default: () => [],
    },
    animatePlugin: {
      type: Object as PropType<ReturnType<typeof createAnimatePlugin> | null>,
      default: null,
    },
    urlTransform: {
      type: Function as PropType<(url: string, key: string, node: any) => string | null | undefined>,
      default: undefined,
    },
    allowedElements: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    disallowedElements: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    allowElement: {
      type: Function as PropType<(element: any, index: number, parent: any) => boolean>,
      default: undefined,
    },
    unwrapDisallowed: { type: Boolean, default: false },
    skipHtml: { type: Boolean, default: false },
    dir: { type: String as PropType<'ltr' | 'rtl' | undefined>, default: undefined },
    caret: { type: String as PropType<'block' | 'circle' | undefined>, default: undefined },
  },
  setup(props) {
    // Use shallowRef to avoid deep reactivity on VNode arrays
    const vnodes = shallowRef<(VNode | string)[]>([])

    // Process content on mount and when content changes.
    // Uses a function + manual calls instead of computed to keep
    // side effects (animate plugin state) explicit and controlled.
    function processContent() {
      // Set previous content length for animation tracking
      if (props.animatePlugin && props.isAnimating) {
        const prevCount = props.animatePlugin.getLastRenderCharCount()
        props.animatePlugin.setPrevContentLength(prevCount)
      }

      // Build rehype plugins list, adding animate plugin if present
      const rehypePlugins = [...props.rehypePlugins]
      if (props.animatePlugin && props.isAnimating) {
        rehypePlugins.push(props.animatePlugin.rehypeAnimate as any)
      }

      try {
        vnodes.value = processMarkdown(props.content, {
          remarkPlugins: props.remarkPlugins,
          rehypePlugins,
          components: props.components,
          urlTransform: props.urlTransform,
          allowedElements: props.allowedElements,
          disallowedElements: props.disallowedElements,
          allowElement: props.allowElement,
          unwrapDisallowed: props.unwrapDisallowed,
          skipHtml: props.skipHtml,
        })
      } catch (err) {
        // Graceful fallback: render content as plain text
        console.warn('[streamdown-vue] Markdown processing error:', err)
        vnodes.value = [props.content]
      }
    }

    // Process on initial mount
    processContent()

    // Re-process when content or animation state changes.
    // Using flush: 'sync' to update vnodes before the next render.
    watch(
      () => props.content,
      () => processContent(),
      { flush: 'sync' },
    )

    watch(
      () => props.isAnimating,
      () => processContent(),
      { flush: 'sync' },
    )

    return () => {
      const blockAttrs: Record<string, any> = {
        'data-streamdown': 'block',
      }

      if (props.dir) {
        blockAttrs.dir = props.dir
      }

      // Add caret attribute if this is the last block and we're animating
      if (props.caret && props.isLastBlock && props.isAnimating) {
        blockAttrs['data-streamdown-caret'] = props.caret
      }

      return h('div', blockAttrs, vnodes.value)
    }
  },
})
