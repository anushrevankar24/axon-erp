/**
 * Logic-only port of Frappe datetime helpers used in expressions.
 * Source of truth:
 * - frappe/public/js/frappe/utils/datetime.js
 *
 * Frappe uses moment-timezone and boot-provided time zones.
 */

import moment from 'moment-timezone'
import { runtimeStore } from './store'

export function getUserTimeZone(): string | undefined {
  const boot = runtimeStore.getBoot()
  return boot?.time_zone?.user || boot?.time_zone?.system || boot?.sysdefaults?.time_zone
}

export function now_date(as_obj: boolean = false): string | Date {
  return _date('YYYY-MM-DD', as_obj, false)
}

export function now_time(as_obj: boolean = false): string | Date {
  return _date('HH:mm:ss', as_obj, false)
}

export function now_datetime(as_obj: boolean = false): string | Date {
  return _date('YYYY-MM-DD HH:mm:ss', as_obj, false)
}

function _date(format: string, as_obj: boolean, system_time: boolean): string | Date {
  const boot = runtimeStore.getBoot()
  let time_zone = boot?.time_zone?.system || boot?.sysdefaults?.time_zone

  // Match upstream: for now_date/datetime, prefer user timezone unless system_time
  if (!system_time) {
    time_zone = boot?.time_zone?.user || time_zone
  }

  const m = time_zone ? moment.tz(time_zone) : moment()
  if (as_obj) return moment_to_date_obj(m)
  return m.format(format)
}

function moment_to_date_obj(m: moment.Moment): Date {
  const date_obj = new Date()
  const arr = m.toArray()
  date_obj.setFullYear(arr[0])
  date_obj.setMonth(arr[1])
  date_obj.setDate(arr[2])
  date_obj.setHours(arr[3])
  date_obj.setMinutes(arr[4])
  date_obj.setSeconds(arr[5])
  date_obj.setMilliseconds(arr[6])
  return date_obj
}


