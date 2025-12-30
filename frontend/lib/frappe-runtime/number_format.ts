/**
 * Logic-only subset of Frappe number helpers used by metadata expressions.
 * Source of truth:
 * - frappe/public/js/frappe/utils/number_format.js
 *
 * NOTE: We implement the parts that matter for eval/depends_on:
 * - flt (robust numeric coercion)
 * - in_list
 */

import { cint, cstr } from './datatype'
import { runtimeStore } from './store'

type NumberFormatInfo = { decimal_str: string; group_sep: string }

const number_format_info: Record<string, NumberFormatInfo> = {
  '#,###.##': { decimal_str: '.', group_sep: ',' },
  '#.###,##': { decimal_str: ',', group_sep: '.' },
  '# ###.##': { decimal_str: '.', group_sep: ' ' },
  '# ###,##': { decimal_str: ',', group_sep: ' ' },
}

function get_number_format(): string {
  const boot = runtimeStore.getBoot()
  return boot?.sysdefaults?.number_format || '#,###.##'
}

function get_number_format_info(format: string): NumberFormatInfo {
  return number_format_info[format] || number_format_info['#,###.##']
}

function strip_number_groups(v: string, number_format?: string): string {
  const fmt = number_format || get_number_format()
  const info = get_number_format_info(fmt)

  // strip group separators
  const groupRegex = new RegExp(info.group_sep === '.' ? '\\.' : info.group_sep, 'g')
  v = v.replace(groupRegex, '')

  // replace decimal separator with '.'
  if (info.decimal_str !== '.' && info.decimal_str !== '') {
    const decRegex = new RegExp(info.decimal_str, 'g')
    v = v.replace(decRegex, '.')
  }

  return v
}

export function flt(v: any, decimals?: number, number_format?: string): number {
  if (v == null || v === '') return 0

  let out: number
  if (typeof v === 'number') {
    out = v
  } else {
    let s = cstr(v)

    // strip currency symbol if exists (best-effort, matches upstream shape)
    if (s.indexOf(' ') !== -1) {
      const parts = s.split(' ')
      const first = parts[0]
      const last = parts[parts.length - 1]
      const asFirst = parseFloat(first)
      s = Number.isNaN(asFirst) ? last : s
    }

    s = strip_number_groups(s, number_format)
    out = parseFloat(s)
    if (Number.isNaN(out)) out = 0
  }

  if (decimals != null) {
    const precision = cint(decimals)
    const m = Math.pow(10, precision)
    return Math.round(out * m) / m
  }

  return out
}

export function in_list(list: any, item: any): boolean {
  return Array.isArray(list) && list.includes(item)
}


