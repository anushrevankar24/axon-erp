/**
 * Desk Alert (frappe.show_alert parity)
 *
 * Desk uses small transient alerts for successful mutations (Saved, Renamed, etc.)
 * and uses msgprint for blocking/validation errors.
 *
 * This helper standardizes those alerts on top of Sonner.
 */
import { toast } from "sonner"

export type DeskAlertIndicator = "green" | "red" | "orange" | "blue"

export function showDeskAlert(message: string, opts?: { indicator?: DeskAlertIndicator; duration?: number }) {
  const indicator = opts?.indicator || "green"
  const duration = opts?.duration ?? 2500

  if (indicator === "red") {
    toast.error(message, { duration })
    return
  }
  if (indicator === "orange") {
    toast.warning(message, { duration })
    return
  }
  if (indicator === "blue") {
    toast.info(message, { duration })
    return
  }
  toast.success(message, { duration })
}



