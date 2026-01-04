"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import styles from "./user-profile.module.css"
import { useQuery } from "@tanstack/react-query"
import { getEnergyPointsList } from "@/lib/api/user-profile"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, Undo2, Sparkles } from "lucide-react"

function getActivityIcon(type: string | null | undefined) {
  switch (type) {
    case "Appreciation":
      return <ThumbsUp className="h-4 w-4" />
    case "Criticism":
      return <ThumbsDown className="h-4 w-4" />
    case "Revert":
      return <Undo2 className="h-4 w-4" />
    default:
      return <Sparkles className="h-4 w-4" />
  }
}

function getReferenceHref(reference_doctype?: string, reference_name?: string) {
  if (!reference_doctype || !reference_name) return null
  // This matches the Next.js routing convention already used for user profile route slugs.
  // If your document route differs, we can map it here centrally.
  return `/app/${encodeURIComponent(reference_doctype)}/${encodeURIComponent(reference_name)}`
}

export function RecentActivityTimeline(props: { user: string }) {
  const pageSize = 20
  const [start, setStart] = React.useState(0)

  const query = useQuery({
    queryKey: ["user-profile", "recent-activity", props.user, start, pageSize],
    queryFn: () => getEnergyPointsList({ user: props.user, start, limit: pageSize }),
    enabled: !!props.user,
    staleTime: 30 * 1000,
    retry: 1,
  })

  const [items, setItems] = React.useState<any[]>([])

  React.useEffect(() => {
    // Reset when user changes
    setStart(0)
    setItems([])
  }, [props.user])

  React.useEffect(() => {
    if (!query.data) return
    const next = Array.isArray(query.data) ? query.data : []
    setItems((prev) => (start === 0 ? next : [...prev, ...next]))
  }, [query.data, start])

  const canShowMore = (query.data || []).length === pageSize

  if (query.isLoading && items.length === 0) {
    return <div className={styles.nullState}>Loading…</div>
  }

  if (!query.isLoading && items.length === 0) {
    return <div className="text-sm text-muted-foreground">No activities to show</div>
  }

  return (
    <div>
      <div className="space-y-3">
        {items.map((a) => {
          const href = getReferenceHref(a.reference_doctype, a.reference_name)
          const when = a.creation ? formatDistanceToNow(new Date(a.creation), { addSuffix: true }) : ""
          const points = Number(a.points || 0)
          const pointsColor = points >= 0 ? "text-emerald-600" : "text-red-600"
          const type = a.type || "Auto"
          return (
            <div key={a.name} className="flex items-start gap-3">
              <div className="mt-1 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                {getActivityIcon(type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={["text-sm font-semibold", pointsColor].join(" ")}>
                    {points > 0 ? `+${points}` : `${points}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {type}
                    {a.owner ? ` · ${a.owner}` : ""}
                    {when ? ` · ${when}` : ""}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  {href ? (
                    <Link href={href} className="text-primary hover:underline">
                      {a.reference_doctype}: {a.reference_name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {a.reason ? <span className="text-muted-foreground"> {" — "} {a.reason}</span> : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {canShowMore ? (
        <Button
          type="button"
          variant="link"
          className={styles.showMoreBtn}
          onClick={() => setStart((s) => s + pageSize)}
          disabled={query.isFetching}
        >
          Show More Activity
        </Button>
      ) : null}
    </div>
  )
}


