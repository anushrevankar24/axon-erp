import { runtimeStore, type Boot, type DocFetcher } from './store'
import { frappeEval } from './utils'
import * as datetime from './datetime'
import * as datatype from './datatype'
import * as number_format from './number_format'
import * as model from './model_store'
import { erpnext } from './erpnext'

export function setBoot(boot: Boot) {
  runtimeStore.setBoot(boot)

  // Seed the runtime doc cache if boot includes docs (Desk has locals populated).
  const docs = boot?.docs
  if (Array.isArray(docs)) {
    for (const d of docs) {
      if (d?.doctype && d?.name) {
        runtimeStore.setDoc(d.doctype, d.name, d)
      }
    }
  }
}

export function getBoot(): Boot | null {
  return runtimeStore.getBoot()
}

export function onRuntimeChange(listener: () => void) {
  return runtimeStore.subscribe(listener)
}

export function setDocInRuntimeCache(doctype: string, name: string, doc: any) {
  runtimeStore.setDoc(doctype, name, doc)
}

export function setDocFetcher(fetcher: DocFetcher) {
  runtimeStore.setDocFetcher(fetcher)
}

export async function ensureDoc(doctype: string, name: string): Promise<any | undefined> {
  return runtimeStore.ensureDoc(doctype, name)
}

/**
 * Expose a `frappe`-shaped object used in eval expressions.
 * This is not the frappe-js-sdk `frappe` instance; it's the logic runtime.
 */
export const frappe = {
  get boot() {
    return runtimeStore.getBoot()
  },
  get sys_defaults() {
    return runtimeStore.getBoot()?.sysdefaults || runtimeStore.getBoot()?.sys_defaults
  },
  utils: {
    eval: frappeEval,
  },
  datetime,
  get_doc: model.get_doc,
  model: {
    get_value: model.get_value,
  },
}

/**
 * Globals that exist on `window` in Desk and are commonly referenced by metadata.
 */
export const globals = {
  ...datatype,
  ...number_format,
}

export { erpnext }


