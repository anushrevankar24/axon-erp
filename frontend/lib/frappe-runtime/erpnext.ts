/**
 * Minimal logic-only subset of the `erpnext` namespace referenced by DocType metadata.
 * Source of truth:
 * - erpnext/public/js/utils.js
 */

import { cint } from './datatype'
import { get_doc } from './model_store'

export const erpnext = {
  is_perpetual_inventory_enabled(company: string) {
    if (!company) return 0
    // Desk uses locals[":Company"][company]; our runtime caches via get_doc.
    const companyDoc = get_doc(':Company', company) || get_doc('Company', company)
    if (!companyDoc) return 0
    return cint(companyDoc.enable_perpetual_inventory)
  },
}


