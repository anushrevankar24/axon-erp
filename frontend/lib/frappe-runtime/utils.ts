/**
 * Upstream semantics: frappe.utils.eval (see frappe/public/js/frappe/utils/utils.js)
 *
 * Frappe wraps the expression as:
 *   `let out = ${code}; return out`
 * and evaluates it using `new Function(...variable_names, code)`.
 */
export function frappeEval(code: string, context: Record<string, any> = {}) {
  const variableNames = Object.keys(context)
  const variables = Object.values(context)
  const wrapped = `let out = ${code}; return out`

  try {
    // eslint-disable-next-line no-new-func
    const expressionFunction = new Function(...variableNames, wrapped)
    return expressionFunction(...variables)
  } catch (error) {
    // Match upstream: log the expression then rethrow so caller can handle
    // (Desk throws an "Invalid depends_on expression" error on failure)
    // eslint-disable-next-line no-console
    console.log('Error evaluating the following expression:')
    // eslint-disable-next-line no-console
    console.error(wrapped)
    throw error
  }
}


