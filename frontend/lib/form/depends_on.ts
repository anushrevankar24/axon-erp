import { erpnext, frappe, globals } from '@/lib/frappe-runtime'

type DependsOnExpression =
  | string
  | boolean
  | ((doc: any) => any)
  | undefined
  | null

export interface DependsOnContext {
  doc: any
  /**
   * Top-level parent document.
   * For child table rows, this should be the parent doc.
   */
  parent?: any
  /**
   * Optional getter to fetch current form values (Desk uses this.get_values(true))
   * when doc isn't attached to the layout object.
   */
  get_values?: (for_validate?: boolean) => any
}

export class DependsOnNotSupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DependsOnNotSupportedError'
  }
}

/**
 * Minimal `locals` proxy for metadata expressions.
 * Desk keeps `locals` as a nested object keyed by doctype -> name -> doc.
 * Our runtime cache can answer the same shape for read-only usage.
 */
function createLocalsProxy() {
  return new Proxy(
    {},
    {
      get(_target, doctypeKey: string) {
        if (typeof doctypeKey !== 'string') return undefined
        return new Proxy(
          {},
          {
            get(__t, nameKey: string) {
              if (typeof nameKey !== 'string') return undefined
              return frappe.get_doc(doctypeKey, nameKey)
            },
          }
        )
      },
    }
  )
}

const locals = createLocalsProxy()

/**
 * Evaluate a Frappe/ERPNext `depends_on` expression.
 *
 * Modeled after: frappe/public/js/frappe/form/layout.js:evaluate_depends_on_value()
 *
 * Notes for separate frontend:
 * - Desk eval runs with many globals available (cint, flt, in_list, frappe, erpnext, locals, etc.).
 * - Our eval is explicitly scoped, so we provide those as variables in the eval context.
 */
export function evaluateDependsOnValue(
  expression: DependsOnExpression,
  ctx: DependsOnContext
): any {
  let out: any = null
  let doc = ctx.doc

  if (!doc && ctx.get_values) {
    doc = ctx.get_values(true)
  }

  if (!doc) {
    return
  }

  // In Desk: parent = this.frm ? this.frm.doc : this.doc || null
  // For our usage we require callers to pass parent for child rows; fallback to doc.
  const parent = ctx.parent ?? doc ?? null

  if (typeof expression === 'boolean') {
    out = expression
  } else if (typeof expression === 'function') {
    out = expression(doc)
  } else if (typeof expression === 'string' && expression.substr(0, 5) === 'eval:') {
    const code = expression.substr(5)
    try {
      // Provide Desk-like globals explicitly.
      // Also include `frappe` and `erpnext` namespaces since ERPNext meta uses them.
      out = frappe.utils.eval(code, {
        doc,
        parent,
        frappe,
        erpnext,
        locals,
        ...globals,
      })

      // Desk compatibility:
      // if (parent && parent.istable && expression.includes("is_submittable")) out = true;
      if (parent && (parent as any).istable && expression.includes('is_submittable')) {
        out = true
      }
    } catch (e) {
      // Desk does: frappe.throw(__('Invalid "depends_on" expression'));
      // We throw here so our error boundary can surface it.
      throw new Error('Invalid "depends_on" expression')
    }
  } else if (typeof expression === 'string' && expression.substr(0, 3) === 'fn:') {
    // In Desk, this triggers script_manager. We defer fn: to Phase 2.
    throw new DependsOnNotSupportedError(`fn: depends_on not supported yet: ${expression}`)
  } else if (typeof expression === 'string') {
    const value = doc[expression]
    if (Array.isArray(value)) {
      out = !!value.length
    } else {
      out = !!value
    }
  }

  return out
}

export interface DependencyFlags {
  hidden_due_to_dependency?: boolean
  reqd_due_to_dependency?: boolean
  read_only_due_to_dependency?: boolean
}

/**
 * Compute dependency flags for a list of DocFields (Desk refresh_dependency equivalent),
 * but as a pure function (no UI refresh side-effects).
 */
export function computeDependencyFlagsForFields(fields: any[], ctx: DependsOnContext) {
  const out: Record<string, DependencyFlags> = {}

  // Desk iterates from end -> start; dependency expressions themselves don't depend on order,
  // so we can iterate forward for a pure mapping.
  for (const f of fields || []) {
    const fieldname = f?.fieldname
    if (!fieldname) continue

    const flags: DependencyFlags = {}

    if (f.depends_on) {
      const guardianHasValue = !!evaluateDependsOnValue(f.depends_on, ctx)
      flags.hidden_due_to_dependency = !guardianHasValue
    }

    if (f.mandatory_depends_on) {
      const setReqd = !!evaluateDependsOnValue(f.mandatory_depends_on, ctx)
      flags.reqd_due_to_dependency = setReqd
    }

    if (f.read_only_depends_on) {
      const setReadOnly = !!evaluateDependsOnValue(f.read_only_depends_on, ctx)
      flags.read_only_due_to_dependency = setReadOnly
    }

    if (Object.keys(flags).length) {
      out[fieldname] = flags
    }
  }

  return out
}


