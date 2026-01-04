"use client"

import * as React from "react"
import { PermissionManagerPage } from "@/components/pages/PermissionManagerPage"
import { UserProfilePage } from "@/components/pages/UserProfilePage"

export type DeskPageComponent = React.ComponentType<{ param?: string }>

export const pageRegistry: Record<string, DeskPageComponent> = {
  "permission-manager": ({ param }) => React.createElement(PermissionManagerPage, { doctype: param }),
  "user-profile": ({ param }) => React.createElement(UserProfilePage, { user: param }),
}

export function isRegisteredPage(name: string): boolean {
  return !!pageRegistry[name]
}

export function getRegisteredPage(name: string): DeskPageComponent | null {
  return pageRegistry[name] || null
}


