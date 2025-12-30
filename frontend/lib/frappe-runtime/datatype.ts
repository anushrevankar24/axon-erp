/**
 * Logic-only ports of core globals from Frappe.
 * Source of truth:
 * - frappe/public/js/frappe/utils/datatype.js
 */

export function cstr(s: any): string {
  if (s == null) return ''
  return String(s)
}

function lstrip(value: string, chars: string[]): string {
  if (!value) return value
  let out = value
  while (out.length && chars.includes(out[0])) {
    out = out.slice(1)
  }
  return out
}

export function cint(v: any, def?: number): number {
  if (v === true) return 1
  if (v === false) return 0
  v = cstr(v)
  if (v !== '0') v = lstrip(v, ['0'])
  // eslint-disable-next-line radix
  let out = parseInt(v)
  if (Number.isNaN(out)) out = def === undefined ? 0 : def
  return out
}

export function is_null(v: any): boolean {
  return v === null || v === undefined || cstr(v).trim() === ''
}

export function has_words(list: string[] | null | undefined, item: string | null | undefined): boolean {
  if (!item) return true
  if (!list) return false
  for (let i = 0, j = list.length; i < j; i++) {
    if (item.indexOf(list[i]) !== -1) return true
  }
  return false
}

export function has_common(list1: any[] | null | undefined, list2: any[] | null | undefined): boolean {
  if (!list1 || !list2) return false
  for (let i = 0, j = list1.length; i < j; i++) {
    if ((list2 as any[]).includes(list1[i])) return true
  }
  return false
}


