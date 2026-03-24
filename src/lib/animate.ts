import type { Root, Element, Text, Nodes } from 'hast'

export interface AnimatePluginOptions {
  animation?: string
  duration?: number
  easing?: string
  sep?: 'word' | 'char'
}

const defaults: Required<AnimatePluginOptions> = {
  animation: 'fadeIn',
  duration: 150,
  easing: 'ease',
  sep: 'word',
}

/**
 * Create a rehype plugin that wraps text nodes in animated spans.
 * Only new text (after prevContentLength) gets animated.
 */
export function createAnimatePlugin(options: AnimatePluginOptions = {}) {
  const opts = { ...defaults, ...options }
  let prevContentLength = 0
  let lastRenderCharCount = 0

  function setPrevContentLength(len: number) {
    prevContentLength = len
  }

  function getLastRenderCharCount() {
    return lastRenderCharCount
  }

  // Elements whose text content should NOT be animated
  const skipElements = new Set(['code', 'pre', 'svg', 'math', 'annotation'])

  /**
   * Walk HAST tree manually instead of using unist-util-visit.
   * This avoids mutation-during-traversal bugs that occur when
   * splicing children inside a visitor callback.
   */
  function walkAndAnimate(node: Nodes, charOffset: number): number {
    if (node.type === 'text') {
      return charOffset + (node as Text).value.length
    }

    if (node.type !== 'element' && node.type !== 'root') {
      return charOffset
    }

    const element = node as Element | Root
    if ('tagName' in element && skipElements.has(element.tagName)) {
      // Count chars but don't animate
      for (const child of element.children) {
        charOffset = countChars(child, charOffset)
      }
      return charOffset
    }

    // Process children, building a new children array to avoid mutation-during-iteration
    const newChildren: Nodes[] = []

    for (const child of element.children) {
      if (child.type !== 'text') {
        charOffset = walkAndAnimate(child, charOffset)
        newChildren.push(child)
        continue
      }

      const text = (child as Text).value
      const startOffset = charOffset
      charOffset += text.length

      // Already rendered — keep as-is
      if (startOffset + text.length <= prevContentLength) {
        newChildren.push(child)
        continue
      }

      // Determine which part of this text is new
      const newStart = Math.max(0, prevContentLength - startOffset)
      const oldPart = text.slice(0, newStart)
      const newPart = text.slice(newStart)

      if (!newPart) {
        newChildren.push(child)
        continue
      }

      // Keep old part as plain text
      if (oldPart) {
        newChildren.push({ type: 'text', value: oldPart })
      }

      // Split new text into segments (words or chars)
      const segments = opts.sep === 'char'
        ? newPart.split('')
        : newPart.split(/(\s+)/)

      for (const segment of segments) {
        if (!segment) continue

        // Whitespace stays plain
        if (/^\s+$/.test(segment)) {
          newChildren.push({ type: 'text', value: segment })
          continue
        }

        newChildren.push({
          type: 'element',
          tagName: 'span',
          properties: {
            'data-sd-animate': '',
            style: [
              `--sd-animation: sd-${opts.animation}`,
              `--sd-duration: ${opts.duration}ms`,
              `--sd-easing: ${opts.easing}`,
            ].join('; '),
          },
          children: [{ type: 'text', value: segment }],
        })
      }
    }

    element.children = newChildren as any[]
    return charOffset
  }

  /** Count characters in a subtree without modifying it. */
  function countChars(node: Nodes, offset: number): number {
    if (node.type === 'text') return offset + (node as Text).value.length
    if ('children' in node) {
      for (const child of (node as Element).children) {
        offset = countChars(child as Nodes, offset)
      }
    }
    return offset
  }

  function rehypeAnimate() {
    return (tree: Root) => {
      const finalOffset = walkAndAnimate(tree, 0)
      lastRenderCharCount = finalOffset
    }
  }

  return {
    rehypeAnimate,
    setPrevContentLength,
    getLastRenderCharCount,
  }
}
