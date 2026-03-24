import { Lexer, type Token } from 'marked'

/**
 * Parse markdown content into independent blocks.
 *
 * Uses the marked Lexer to tokenize markdown, then groups tokens
 * into blocks that can be rendered independently. This enables
 * block-level memoization during streaming.
 */
export function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = new Lexer().lex(markdown)
  const blocks: string[] = []

  for (const token of tokens) {
    const raw = token.raw
    if (raw.trim() !== '') {
      blocks.push(raw)
    }
  }

  // Merge HTML blocks with unclosed tags
  return mergeIncompleteHtmlBlocks(blocks)
}

/**
 * Merge blocks that contain unclosed HTML tags.
 * When streaming, an HTML tag might be split across blocks.
 */
function mergeIncompleteHtmlBlocks(blocks: string[]): string[] {
  const result: string[] = []
  let pending = ''

  for (const block of blocks) {
    const combined = pending + block
    if (hasUnclosedHtmlTag(combined)) {
      pending = combined
    } else {
      if (pending) {
        result.push(combined)
        pending = ''
      } else {
        result.push(block)
      }
    }
  }

  if (pending) {
    result.push(pending)
  }

  return result
}

/**
 * Check if a string has an unclosed HTML tag at the end.
 * This detects tags like `<div` or `<span class="foo"` without closing `>`.
 */
function hasUnclosedHtmlTag(text: string): boolean {
  // Look for < that isn't closed by >
  const lastOpen = text.lastIndexOf('<')
  if (lastOpen === -1) return false
  const afterOpen = text.slice(lastOpen)
  // If there's no > after the last <, the tag is unclosed
  return !afterOpen.includes('>')
}
