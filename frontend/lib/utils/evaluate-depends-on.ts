/**
 * Compatibility wrapper.
 *
 * The earlier implementation diverged from Desk because it lacked the Desk runtime
 * globals (cint/in_list/frappe/erpnext/etc). We now delegate to the shared engine
 * modeled after frappe/form/layout.js.
 */

import { evaluateDependsOnValue as evaluateDependsOnValueImpl } from '@/lib/form/depends_on'

export function evaluateDependsOnValue(
  expression: string | boolean | undefined | null,
  doc: any,
  parent?: any
): boolean {
  // Keep prior public API: treat missing expression as "show".
  if (expression === undefined || expression === null) return true
  // If doc is missing, we return true for backward compatibility; DynamicForm now blocks
  // rendering until doc exists, so this should not affect normal flows.
  if (!doc) return true

  return !!evaluateDependsOnValueImpl(expression as any, { doc, parent })
}

