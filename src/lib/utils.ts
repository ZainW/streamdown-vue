import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine class names with Tailwind merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Create a cn function that prepends a Tailwind prefix to all utility classes.
 */
export function createCn(prefix: string) {
  if (!prefix) return cn
  return (...inputs: ClassValue[]) => {
    const merged = cn(...inputs)
    // Prefix each class with the configured prefix
    return merged
      .split(' ')
      .map((cls) => (cls ? `${prefix}${cls}` : cls))
      .join(' ')
  }
}

/**
 * Default URL transform that sanitizes URLs.
 * Blocks javascript: and vbscript: protocols.
 */
export function defaultUrlTransform(url: string): string {
  const colon = url.indexOf(':')
  if (colon === -1) return url

  const protocol = url.slice(0, colon).toLowerCase()
  if (
    protocol === 'javascript' ||
    protocol === 'vbscript' ||
    protocol === 'data'
  ) {
    return ''
  }

  return url
}

/**
 * Trigger a file download in the browser.
 */
export function save(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
