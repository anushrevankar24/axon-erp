"use client"

import { useQuery } from "@tanstack/react-query"
import { call } from "@/lib/api/client"
import { parseFrappeError, type FrappeError } from "@/lib/utils/errors"

export type PageResolveResult =
  | { ok: true; page: any | null }
  | { ok: false; error: FrappeError }

export async function fetchPageDoc(pageName: string): Promise<PageResolveResult> {
  try {
    const res = await call("frappe.client.get", { doctype: "Page", name: pageName })
    return { ok: true, page: res?.message || res }
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


