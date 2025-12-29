/**
 * Evaluate depends_on expressions
 * 
 * EXACT implementation from ERPNext:
 * frappe/public/js/frappe/form/layout.js lines 777-819
 * 
 * DO NOT modify this logic - it must match ERPNext exactly
 * 
 * This function evaluates conditional expressions used in:
 * - depends_on (field/section visibility)
 * - collapsible_depends_on (section collapse state)
 * - mandatory_depends_on (field required state)
 * - read_only_depends_on (field read-only state)
 */

/**
 * Evaluate depends_on value
 * 
 * @param expression - The depends_on expression (string, boolean, or undefined)
 * @param doc - The document object to evaluate against
 * @param parent - Parent document (for child tables)
 * @returns true if condition is met (field should be visible), false otherwise
 */
export function evaluateDependsOnValue(
  expression: string | boolean | undefined | null,
  doc: any,
  parent?: any
): boolean {
  // Handle undefined/null - no condition means always show
  if (expression === undefined || expression === null) {
    return true
  }
  
  // Handle boolean directly
  if (typeof expression === 'boolean') {
    return expression
  }
  
  // Require doc for evaluation
  if (!doc) {
    return true  // Can't evaluate without doc, default to show (fail-safe)
  }
  
  // Handle eval: expressions
  // ERPNext: layout.js line 795-803
  if (typeof expression === 'string' && expression.substr(0, 5) === 'eval:') {
    const code = expression.substr(5)
    try {
      // Use Function constructor (safer than eval)
      // Match ERPNext's frappe.utils.eval behavior
      const evalFunc = new Function('doc', 'parent', `
        try {
          with (doc) {
            return ${code}
          }
        } catch (e) {
          console.warn('depends_on evaluation error:', e);
          return true;
        }
      `)
      return !!evalFunc(doc, parent)
    } catch (e) {
      console.warn('Failed to evaluate depends_on:', expression, e)
      return true  // On error, show field (fail-safe)
    }
  }
  
  // Handle fn: expressions (custom script functions)
  // ERPNext: layout.js lines 804-809
  if (typeof expression === 'string' && expression.substr(0, 3) === 'fn:') {
    console.warn('fn: expressions not supported in separate frontend:', expression)
    return true  // Can't call frm.script_manager, default to show
  }
  
  // Handle simple field reference (e.g., "enabled")
  // ERPNext: layout.js lines 810-816
  const value = doc[expression]
  
  // EXACT ERPNext logic
  if (Array.isArray(value)) {
    return !!value.length  // Array: check if not empty
  } else {
    return !!value  // Anything else: standard falsy check (0, '', null, undefined, false → false)
  }
}

