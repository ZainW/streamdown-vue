import { SAMPLE_MARKDOWN, tokenize } from '../content'

const tokens = tokenize(SAMPLE_MARKDOWN)

/**
 * Create a ReadableStream that yields markdown tokens with realistic delays.
 * Mimics how an LLM streams tokens — fast bursts with occasional pauses.
 */
export function createMarkdownStream(): ReadableStream<string> {
  let index = 0

  return new ReadableStream<string>({
    async pull(controller) {
      if (index >= tokens.length) {
        controller.close()
        return
      }

      const token = tokens[index++]

      // Simulate variable latency:
      // - Newlines: longer pause (thinking between paragraphs)
      // - Code fence markers: brief pause
      // - Normal tokens: fast
      let delay: number
      if (token === '\n') {
        delay = 15 + Math.random() * 30
      } else if (token.startsWith('```')) {
        delay = 40 + Math.random() * 60
      } else {
        delay = 8 + Math.random() * 18
      }

      await new Promise((r) => setTimeout(r, delay))
      controller.enqueue(token)
    },
  })
}

/**
 * Stream markdown and call onToken for each chunk.
 * Returns a promise that resolves when streaming is complete.
 */
export async function streamMarkdown(
  onToken: (accumulated: string) => void,
  onDone: () => void,
): Promise<void> {
  const stream = createMarkdownStream()
  const reader = stream.getReader()
  let accumulated = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    accumulated += value
    onToken(accumulated)
  }

  onDone()
}
