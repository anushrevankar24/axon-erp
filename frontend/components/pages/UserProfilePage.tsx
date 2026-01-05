"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useBoot } from "@/lib/api/hooks"
import { parseFrappeError } from "@/lib/utils/errors"
import { LinkField } from "@/components/forms/LinkField"
import { getBootUserId } from "@/lib/utils/boot"
import {
  getUserProfileBasics,
  getUserRank,
  updateProfileInfo,
  getUserEnergyAndReviewPoints,
} from "@/lib/api/user-profile"
import styles from "@/components/user-profile/user-profile.module.css"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { UserProfileSidebar } from "@/components/user-profile/UserProfileSidebar"
import { OverviewHeatmapCard, TypeDistributionCard, EnergyPointsLineCard } from "@/components/user-profile/UserProfileCharts"
import { RecentActivityTimeline } from "@/components/user-profile/RecentActivityTimeline"

export function UserProfilePage({ user }: { user?: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: boot } = useBoot()

  const currentUser = getBootUserId(boot)
  const viewedUser = user || currentUser || ""
  const isSelf = !!viewedUser && !!currentUser && viewedUser === currentUser

  const basicsQuery = useQuery({
    queryKey: ["user-profile", "basics", viewedUser],
    queryFn: () => getUserProfileBasics(viewedUser),
    enabled: !!viewedUser,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const rankQuery = useQuery({
    queryKey: ["user-profile", "rank", viewedUser],
    queryFn: () => getUserRank({ user: viewedUser }),
    enabled: !!viewedUser,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const totalsQuery = useQuery({
    queryKey: ["user-profile", "totals", viewedUser],
    queryFn: async () => {
      const r = await getUserEnergyAndReviewPoints(viewedUser)
      // API returns dict keyed by user id: { [user]: { energy_points, review_points } }
      return (r && (r as any)[viewedUser]) || { energy_points: 0, review_points: 0 }
    },
    enabled: !!viewedUser,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const [changeUserOpen, setChangeUserOpen] = React.useState(false)
  const [changeUserValue, setChangeUserValue] = React.useState(viewedUser)
  React.useEffect(() => setChangeUserValue(viewedUser), [viewedUser])

  const updateMutation = useMutation({
    mutationFn: updateProfileInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", "basics", viewedUser] })
    },
  })

  const topError = basicsQuery.error || rankQuery.error || totalsQuery.error || updateMutation.error
  const parsedError = topError ? parseFrappeError(topError) : null

  if (!viewedUser) return null

  const basics = basicsQuery.data
  const fullName = React.useMemo(() => {
    const v: any = basics
    if (!v) return viewedUser
    if (typeof v === "string") return v
    if (typeof v === "object") {
      // Common shapes:
      // - frappe.client.get_value(User): { name, full_name, first_name, last_name, ... }
      // - frappe.user_info(User): { name, email, first_name, last_name, ... }
      if (typeof v.full_name === "string" && v.full_name.trim()) return v.full_name
      const first = typeof v.first_name === "string" ? v.first_name.trim() : ""
      const last = typeof v.last_name === "string" ? v.last_name.trim() : ""
      const combined = `${first} ${last}`.trim()
      if (combined) return combined
      if (typeof v.email === "string" && v.email.trim()) return v.email
      if (typeof v.name === "string" && v.name.trim()) return v.name
    }
    return viewedUser
  }, [basics, viewedUser])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.title}>{fullName}</div>
          <Button type="button" variant="outline" size="sm" onClick={() => setChangeUserOpen(true)}>
            Change User
          </Button>
        </div>

        {parsedError ? (
          <div className="mb-4 flex items-start gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <div className="font-medium">{parsedError.title}</div>
              <div className="text-sm text-muted-foreground">{parsedError.message}</div>
            </div>
          </div>
        ) : null}

        <div className={styles.layout}>
          <UserProfileSidebar
            userId={viewedUser}
            basics={basics as any}
            totals={totalsQuery.data as any}
            rank={rankQuery.data as any}
            isSelf={isSelf}
            saving={updateMutation.isPending}
            onSaveProfile={
              isSelf
                ? (values) => {
                    updateMutation.mutate(values)
                  }
                : undefined
            }
          />

          <section className={styles.main}>
            <div className={styles.performanceGraphs}>
              <OverviewHeatmapCard user={viewedUser} boot={boot} />
              <TypeDistributionCard user={viewedUser} />
              <EnergyPointsLineCard user={viewedUser} />
            </div>

            <div className={styles.recentActivity}>
              <div className={styles.recentActivityTitle}>Recent Activity</div>
              <RecentActivityTimeline user={viewedUser} />
            </div>
          </section>
        </div>
      </div>

      <Dialog open={changeUserOpen} onOpenChange={setChangeUserOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change User</DialogTitle>
            <DialogDescription className="sr-only">
              Select a user to view their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">User</div>
            <LinkField
              doctype="User"
              value={changeUserValue}
              onChange={(v) => setChangeUserValue(v)}
              disabled={false}
              placeholder="Select User"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setChangeUserOpen(false)
                if (changeUserValue) {
                  router.push(`/app/user-profile/${encodeURIComponent(changeUserValue)}`)
                }
              }}
            >
              Go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


