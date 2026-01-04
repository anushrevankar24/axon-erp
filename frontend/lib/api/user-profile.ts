"use client"

import { call } from "@/lib/api/client"

// Official Frappe endpoints for User Profile (Desk Page)
const BASE = "frappe.desk.page.user_profile.user_profile"

export async function getEnergyPointsHeatmapData(params: { user: string; date?: string | null }) {
  const res = await call(`${BASE}.get_energy_points_heatmap_data`, {
    user: params.user,
    date: params.date ?? null,
  })
  return res.message || res
}

export async function getEnergyPointsPercentageChartData(params: { user: string; field: string }) {
  const res = await call(`${BASE}.get_energy_points_percentage_chart_data`, params)
  return res.message || res
}

export async function getUserRank(params: { user: string }) {
  const res = await call(`${BASE}.get_user_rank`, params)
  return res.message || res
}

export async function updateProfileInfo(profileInfo: {
  location?: string
  interest?: string
  user_image?: string
  bio?: string
}) {
  const res = await call(`${BASE}.update_profile_info`, {
    profile_info: JSON.stringify(profileInfo),
  })
  return res.message || res
}

export async function getEnergyPointsList(params: { start: number; limit: number; user: string }) {
  const res = await call(`${BASE}.get_energy_points_list`, params)
  return res.message || res
}

export async function getUserProfileBasics(user: string) {
  // Official API: frappe.client.get_value
  // Used as a lightweight "exists + basics" lookup (Desk uses frappe.db.exists + frappe.user_info).
  const res = await call("frappe.client.get_value", {
    doctype: "User",
    filters: { name: user },
    fieldname: ["name", "full_name", "user_image", "location", "interest", "bio"],
  })
  return res.message || res
}

// Desk parity: totals used by User Profile sidebar (Energy Points + Review Points)
export async function getUserEnergyAndReviewPoints(user: string) {
  const res = await call(
    "frappe.social.doctype.energy_point_log.energy_point_log.get_user_energy_and_review_points",
    { user }
  )
  return res.message || res
}

// Desk parity: line chart data uses Dashboard Chart engine
export async function getDashboardChart(params: { chart: any; no_cache?: 1 | 0 }) {
  const res = await call("frappe.desk.doctype.dashboard_chart.dashboard_chart.get", {
    chart: params.chart,
    no_cache: params.no_cache ?? 1,
  })
  return res.message || res
}


