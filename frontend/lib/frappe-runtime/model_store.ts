import { runtimeStore } from './store'

export function get_doc(doctype: string, name: string): any | undefined {
  const existing = runtimeStore.getDoc(doctype, name)
  if (existing) return existing

  // Trigger a background fetch so expressions like locals[":Company"][company] can resolve
  // after the first render (similar to Desk having locals pre-populated).
  void runtimeStore.ensureDoc(doctype, name)
  return undefined
}

export function get_value(doctype: string, name: string, fieldname: string): any {
  const doc = get_doc(doctype, name)
  return doc ? doc[fieldname] : undefined
}


