import { describe, it, expect } from 'vitest'
import { createAnimatePlugin } from '../lib/animate'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { Root } from 'hast'

describe('createAnimatePlugin', () => {
  it('creates a plugin with expected API', () => {
    const plugin = createAnimatePlugin()
    expect(plugin.rehypeAnimate).toBeTypeOf('function')
    expect(plugin.setPrevContentLength).toBeTypeOf('function')
    expect(plugin.getLastRenderCharCount).toBeTypeOf('function')
  })

  it('tracks character count after processing', () => {
    const plugin = createAnimatePlugin()
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin.rehypeAnimate)

    const mdast = processor.parse('Hello world')
    processor.runSync(mdast) as Root

    expect(plugin.getLastRenderCharCount()).toBeGreaterThan(0)
  })

  it('wraps new text in animated spans', () => {
    const plugin = createAnimatePlugin()
    plugin.setPrevContentLength(0) // Everything is "new"

    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin.rehypeAnimate)

    const mdast = processor.parse('Hello world')
    const hast = processor.runSync(mdast) as Root

    // Check that spans with data-sd-animate were created
    const hasAnimatedSpans = JSON.stringify(hast).includes('data-sd-animate')
    expect(hasAnimatedSpans).toBe(true)
  })

  it('does not animate already-rendered text', () => {
    const plugin = createAnimatePlugin()

    // First render
    plugin.setPrevContentLength(0)
    const processor1 = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin.rehypeAnimate)
    processor1.runSync(processor1.parse('Hello'))

    // Second render — set prev to first render's count
    plugin.setPrevContentLength(plugin.getLastRenderCharCount())
    const processor2 = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin.rehypeAnimate)
    const hast2 = processor2.runSync(processor2.parse('Hello')) as Root

    // "Hello" should NOT be wrapped in animated spans since it was already rendered
    const hastStr = JSON.stringify(hast2)
    expect(hastStr).not.toContain('data-sd-animate')
  })

  it('respects custom animation options', () => {
    const plugin = createAnimatePlugin({
      animation: 'blurIn',
      duration: 300,
      easing: 'ease-out',
    })
    plugin.setPrevContentLength(0)

    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(plugin.rehypeAnimate)

    const hast = processor.runSync(processor.parse('Test')) as Root
    const hastStr = JSON.stringify(hast)
    expect(hastStr).toContain('sd-blurIn')
    expect(hastStr).toContain('300ms')
    expect(hastStr).toContain('ease-out')
  })
})
