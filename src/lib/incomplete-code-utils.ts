/**
 * Check if a block of text has an incomplete (unclosed) code fence.
 * A code fence is incomplete if it has an opening ``` without a matching closing ```.
 */
export function hasIncompleteCodeFence(text: string): boolean {
  const lines = text.split('\n')
  let inCodeFence = false
  let fenceChar = ''
  let fenceCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (!inCodeFence) {
      const match = trimmed.match(/^(`{3,}|~{3,})/)
      if (match) {
        inCodeFence = true
        fenceChar = match[1][0]
        fenceCount = match[1].length
      }
    } else {
      // Check for closing fence (must be same char and at least same count)
      const closeMatch = trimmed.match(/^(`{3,}|~{3,})\s*$/)
      if (
        closeMatch &&
        closeMatch[1][0] === fenceChar &&
        closeMatch[1].length >= fenceCount
      ) {
        inCodeFence = false
      }
    }
  }

  return inCodeFence
}

/**
 * Check if a block of text contains a table (GFM).
 */
export function hasTable(text: string): boolean {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return false

  // A GFM table needs a header row and a separator row with |---|
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]
    const nextLine = lines[i + 1]
    if (
      line.includes('|') &&
      nextLine.includes('|') &&
      /\|[\s:]*-{3,}[\s:]*\|/.test(nextLine)
    ) {
      return true
    }
  }

  return false
}
