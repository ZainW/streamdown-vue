/**
 * Recursively extracts text content from a HAST node tree.
 */
export function extractTextFromHast(node: any): string {
  if (node.type === 'text') return node.value || ''
  if (node.children) {
    return node.children.map(extractTextFromHast).join('')
  }
  return ''
}
