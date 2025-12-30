export type Boot = any

type Listener = () => void
export type DocFetcher = (doctype: string, name: string) => Promise<any>

/**
 * Minimal shared store for the "Frappe runtime" layer.
 *
 * Purpose:
 * - Keep boot data available (Desk gets it embedded; we fetch it).
 * - Keep a small in-memory doc cache for eval contexts (locals / frappe.get_doc style).
 * - Provide a lightweight invalidation mechanism so dependency state can recompute
 *   when missing docs are fetched lazily.
 */
class RuntimeStore {
  private boot: Boot | null = null
  private listeners = new Set<Listener>()
  private version = 0

  // Keyed cache: `${doctype}::${name}`. Doctype may be normalized (strip leading ':').
  private docs = new Map<string, any>()

  private docFetcher: DocFetcher | null = null
  private inflightDocFetches = new Set<string>()

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.version++
    for (const l of this.listeners) l()
  }

  getVersion() {
    return this.version
  }

  setBoot(boot: Boot) {
    this.boot = boot
    this.notify()
  }

  getBoot(): Boot | null {
    return this.boot
  }

  normalizeDoctype(doctype: string): string {
    // Desk stores some "locals" with leading ':' for singleton/system doctypes
    // like ':Company', ':Currency'. For server APIs, the doctype is without ':'.
    return doctype?.startsWith(':') ? doctype.slice(1) : doctype
  }

  private makeKey(doctype: string, name: string): string {
    return `${this.normalizeDoctype(doctype)}::${name}`
  }

  setDoc(doctype: string, name: string, doc: any) {
    if (!doctype || !name) return
    const normalized = this.normalizeDoctype(doctype)

    // Store under normalized doctype
    this.docs.set(this.makeKey(normalized, name), doc)
    // Also store under legacy ":" doctype for eval parity if expressions reference it
    this.docs.set(this.makeKey(`:${normalized}`, name), doc)

    this.notify()
  }

  getDoc(doctype: string, name: string): any | undefined {
    if (!doctype || !name) return undefined
    const hit = this.docs.get(this.makeKey(doctype, name))
    if (hit) return hit
    // Try normalized lookup as fallback
    const normalized = this.normalizeDoctype(doctype)
    return this.docs.get(this.makeKey(normalized, name))
  }

  setDocFetcher(fetcher: DocFetcher) {
    this.docFetcher = fetcher
  }

  /**
   * Best-effort async cache fill for docs referenced in eval expressions.
   * This intentionally does not throw on failure; it just keeps cache empty.
   */
  async ensureDoc(doctype: string, name: string): Promise<any | undefined> {
    const existing = this.getDoc(doctype, name)
    if (existing) return existing
    if (!this.docFetcher) return undefined

    const normalized = this.normalizeDoctype(doctype)
    const key = this.makeKey(normalized, name)
    if (this.inflightDocFetches.has(key)) return undefined

    this.inflightDocFetches.add(key)
    try {
      const doc = await this.docFetcher(normalized, name)
      if (doc) {
        this.setDoc(normalized, name, doc)
      }
      return doc
    } catch {
      return undefined
    } finally {
      this.inflightDocFetches.delete(key)
    }
  }
}

export const runtimeStore = new RuntimeStore()


