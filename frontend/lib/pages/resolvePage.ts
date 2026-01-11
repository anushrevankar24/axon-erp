"use client"

import { useQuery } from "@tanstack/react-query"
import { call } from "@/lib/api/client"
import { parseFrappeError, type FrappeError } from "@/lib/utils/errors"

export type PageResolveResult =
  | { ok: true; page: any | null }
  | { ok: false; error: FrappeError }

export async function fetchPageDoc(pageName: string): Promise<PageResolveResult> {
  try {
    // Desk parity: Desk does NOT read DocType "Page" directly (often restricted).
    // It calls the whitelisted method frappe.desk.desk_page.getpage which applies Page.is_permitted().
    const res = await call("frappe.desk.desk_page.getpage", { name: pageName })
    const page =
      res?.docs?.[0] ??
      res?.message?.docs?.[0] ??
      res?.message?.[0] ??
      null
    return { ok: true, page }
  } catch (err: any) {
    const parsed = parseFrappeError(err)
    // Treat missing Page as "not found" rather than a hard error
    if (parsed.type === "not_found") {
      return { ok: true, page: null }
    }
    return { ok: false, error: parsed }
  }
}

/**
 * Resolve a Desk Page by name (e.g. "permission-manager", "user-profile").
 * This is the Next.js equivalent of Desk checking whether a Page exists and whether the user may access it.
 */
export function useResolvedPage(pageName: string, enabled: boolean) {
  return useQuery({
    queryKey: ["page", pageName],
    queryFn: () => fetchPageDoc(pageName),
    enabled: enabled && !!pageName,
    staleTime: 60 * 1000,
    retry: 1,
  })
}


