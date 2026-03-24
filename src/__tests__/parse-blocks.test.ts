import { describe, it, expect } from 'vitest'
import { parseMarkdownIntoBlocks } from '../lib/parse-blocks'

describe('parseMarkdownIntoBlocks', () => {
  it('splits headings into separate blocks', () => {
    const blocks = parseMarkdownIntoBlocks('# Heading 1\n\n## Heading 2')
    expect(blocks.length).toBe(2)
  })

  it('splits paragraphs into separate blocks', () => {
    const blocks = parseMarkdownIntoBlocks('Paragraph 1\n\nParagraph 2')
    expect(blocks.length).toBe(2)
  })

  it('keeps a code block as a single block', () => {
    const markdown = '```js\nconst x = 1;\nconst y = 2;\n```'
    const blocks = parseMarkdownIntoBlocks(markdown)
    expect(blocks.length).toBe(1)
  })

  it('keeps a list as a single block', () => {
    const markdown = '- Item 1\n- Item 2\n- Item 3'
    const blocks = parseMarkdownIntoBlocks(markdown)
    expect(blocks.length).toBe(1)
  })

  it('handles empty input', () => {
    const blocks = parseMarkdownIntoBlocks('')
    expect(blocks.length).toBe(0)
  })

  it('handles a table as a single block', () => {
    const markdown = '| A | B |\n| --- | --- |\n| 1 | 2 |'
    const blocks = parseMarkdownIntoBlocks(markdown)
    expect(blocks.length).toBe(1)
  })

  it('handles mixed content', () => {
    const markdown = '# Title\n\nSome text\n\n```js\ncode\n```\n\n- list item'
    const blocks = parseMarkdownIntoBlocks(markdown)
    expect(blocks.length).toBe(4)
  })
})
