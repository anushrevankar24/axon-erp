/**
 * Clipboard Utilities (Desk-style)
 *
 * Uses the modern Clipboard API when available and falls back to the
 * textarea + execCommand('copy') approach when not.
 *
 * This matches the production pattern used by many web apps and is safe
 * for both secure and constrained environments.
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Modern API (preferred). If it throws (permissions/policy), fall back.
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // Fall through to legacy fallback
  }

  // Fallback (works broadly)
  if (typeof document === 'undefined') {
    throw new Error('Clipboard not available')
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!ok) {
    throw new Error('Copy failed')
  }
}


