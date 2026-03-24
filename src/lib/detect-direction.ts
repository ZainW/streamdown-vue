/**
 * Detect text direction using the "first strong character" algorithm.
 * Returns 'rtl' if the first strong directional character is RTL,
 * 'ltr' otherwise.
 */
export function detectTextDirection(text: string): 'ltr' | 'rtl' {
  // Strip markdown syntax to get to actual text
  const stripped = text
    .replace(/[#*_~`\[\]()!>+\-|\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // RTL Unicode ranges
  const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

  for (const char of stripped) {
    // Check RTL first
    if (rtlPattern.test(char)) return 'rtl'
    // Check if it's a Latin/LTR character (basic ASCII letters)
    if (/[a-zA-Z]/.test(char)) return 'ltr'
  }

  return 'ltr'
}
