import { defineComponent, h, computed, provide, watch, type PropType } from 'vue'
import remend from 'remend'
import type { RemendOptions } from 'remend'
import { Block } from './Block'
import { defaultComponents } from './components'
import { parseMarkdownIntoBlocks } from './lib/parse-blocks'
import { detectTextDirection } from './lib/detect-direction'
import { defaultUrlTransform } from './lib/utils'
import { StreamdownContextKey } from './composables/useStreamdownContext'
import { PluginContextKey } from './composables/usePlugins'
import { PrefixKey } from './composables/usePrefixCn'
import { createAnimatePlugin, type AnimatePluginOptions } from './lib/animate'
import type {
  StreamdownMode,
  CaretStyle,
  TextDirection,
  AnimateOptions,
  ControlsConfig,
  PluginConfig,
  StreamdownContext,
} from './types'
import type { Component } from 'vue'
import type { Plugin as UnifiedPlugin } from 'unified'

export const Streamdown = defineComponent({
  name: 'Streamdown',
  props: {
    content: { type: String, required: true },
    mode: {
      type: String as PropType<StreamdownMode>,
      default: 'streaming',
    },
    isAnimating: { type: Boolean, default: false },
    animated: {
      type: [Boolean, Object] as PropType<boolean | AnimateOptions>,
      default: false,
    },
    caret: {
      type: String as PropType<CaretStyle>,
      default: undefined,
    },
    dir: {
      type: String as PropType<TextDirection>,
      default: 'auto',
    },
    parseIncompleteMarkdown: { type: Boolean, default: true },
    remend: {
      type: Object as PropType<RemendOptions>,
      default: undefined,
    },
    normalizeHtmlIndentation: { type: Boolean, default: false },
    components: {
      type: Object as PropType<Record<string, Component>>,
      default: undefined,
    },
    shikiTheme: {
      type: Array as unknown as PropType<[any, any]>,
      default: () => ['github-light', 'github-dark'],
    },
    controls: {
      type: [Object, Boolean] as PropType<ControlsConfig | boolean>,
      default: true,
    },
    plugins: {
      type: Object as PropType<PluginConfig>,
      default: undefined,
    },
    icons: {
      type: Object as PropType<Record<string, Component>>,
      default: undefined,
    },
    translations: {
      type: Object as PropType<Record<string, string>>,
      default: undefined,
    },
    prefix: { type: String, default: '' },
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
    urlTransform: {
      type: Function as PropType<
        (url: string, key: string, node: any) => string | null | undefined
      >,
      default: defaultUrlTransform,
    },
    allowedTags: {
      type: Object as PropType<Record<string, string[]>>,
      default: undefined,
    },
    literalTagContent: {
      type: Array as PropType<string[]>,
      default: undefined,
    },
    rehypePlugins: {
      type: Array as PropType<UnifiedPlugin[]>,
      default: () => [],
    },
    remarkPlugins: {
      type: Array as PropType<UnifiedPlugin[]>,
      default: () => [],
    },
  },
  emits: ['animation-start', 'animation-end'],
  inheritAttrs: false,
  setup(props, { emit, attrs }) {
    // Provide reactive context to child components.
    // Children call useStreamdownContext() which unwraps this computed ref,
    // so they always see the latest values when props change.
    const streamdownContext = computed<StreamdownContext>(() => ({
      controls:
        typeof props.controls === 'boolean'
          ? props.controls
            ? { code: { copy: true, download: true }, table: { copy: true, download: true } }
            : { code: { copy: false, download: false }, table: { copy: false, download: false } }
          : props.controls,
      isAnimating: props.isAnimating,
      mode: props.mode,
      shikiTheme: props.shikiTheme,
      prefix: props.prefix,
    }))

    provide(StreamdownContextKey, streamdownContext)
    provide(PluginContextKey, props.plugins || {})
    provide(PrefixKey, props.prefix)

    // Watch for animation state changes
    watch(
      () => props.isAnimating,
      (newVal, oldVal) => {
        if (newVal && !oldVal) emit('animation-start')
        if (!newVal && oldVal) emit('animation-end')
      },
    )

    // Create animate plugin if animation is enabled
    const animatePlugin = computed(() => {
      if (!props.animated) return null
      const animOpts: AnimatePluginOptions =
        typeof props.animated === 'object' ? props.animated : {}
      return createAnimatePlugin(animOpts)
    })

    // Merge user components with defaults
    const mergedComponents = computed(() => ({
      ...defaultComponents,
      ...(props.components || {}),
    }))

    // Process markdown: preprocess with remend → split into blocks
    const processedBlocks = computed(() => {
      let markdown = props.content || ''

      // Complete incomplete markdown during streaming using the remend package
      if (props.parseIncompleteMarkdown && props.mode === 'streaming') {
        markdown = remend(markdown, props.remend)
      }

      // Parse into blocks
      return parseMarkdownIntoBlocks(markdown)
    })

    return () => {
      const blocks = processedBlocks.value

      return h(
        'div',
        {
          ...attrs,
          'data-streamdown': 'root',
        },
        blocks.map((blockContent, index) => {
          // Determine text direction per block
          let blockDir: 'ltr' | 'rtl' | undefined
          if (props.dir === 'auto') {
            blockDir = detectTextDirection(blockContent)
          } else if (props.dir !== undefined) {
            blockDir = props.dir
          }

          return h(Block, {
            key: `block-${index}-${blockContent.slice(0, 32)}`,
            content: blockContent,
            isLastBlock: index === blocks.length - 1,
            isAnimating: props.isAnimating,
            components: mergedComponents.value,
            remarkPlugins: props.remarkPlugins,
            rehypePlugins: props.rehypePlugins,
            urlTransform: props.urlTransform,
            allowedElements: props.allowedElements,
            disallowedElements: props.disallowedElements,
            allowElement: props.allowElement,
            unwrapDisallowed: props.unwrapDisallowed,
            skipHtml: props.skipHtml,
            dir: blockDir,
            caret: props.caret,
            animatePlugin: animatePlugin.value,
          })
        }),
      )
    }
  },
})
