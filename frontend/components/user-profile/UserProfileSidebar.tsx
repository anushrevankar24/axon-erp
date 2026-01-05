"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Bolt, Star, Trophy, Calendar } from "lucide-react"

type UserBasics = {
  full_name?: string
  name?: string
  user_image?: string
  location?: string
  interest?: string
  bio?: string
}

export type UserTotals = {
  energy_points: number
  review_points: number
}

export type UserProfileSidebarProps = {
  userId: string
  basics: UserBasics | null | undefined
  isSelf: boolean
  totals: UserTotals | null | undefined
  rank: { monthly_rank?: number[]; all_time_rank?: number[] } | null | undefined
  onSaveProfile?: (values: { user_image?: string; location?: string; interest?: string; bio?: string }) => void
  saving?: boolean
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-start gap-3 mt-4">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <div className="text-base font-medium leading-5">{value}</div>
        <div className="text-sm text-muted-foreground leading-5">{label}</div>
      </div>
    </div>
  )
}

export function UserProfileSidebar(props: UserProfileSidebarProps) {
  const { userId, basics, isSelf, totals, rank, onSaveProfile, saving } = props
  const [editOpen, setEditOpen] = React.useState(false)
  const [edit, setEdit] = React.useState({
    user_image: "",
    location: "",
    interest: "",
    bio: "",
  })

  React.useEffect(() => {
    setEdit({
      user_image: basics?.user_image || "",
      location: basics?.location || "",
      interest: basics?.interest || "",
      bio: basics?.bio || "",
    })
  }, [basics?.user_image, basics?.location, basics?.interest, basics?.bio])

  const monthlyRank = rank?.monthly_rank?.[0] ?? 0
  const allTimeRank = rank?.all_time_rank?.[0] ?? 0

  return (
    <aside className="min-w-0">
      <div className="hidden lg:block">
        <div className="rounded-lg overflow-hidden bg-muted/20">
          {basics?.user_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={basics.user_image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="aspect-square w-full flex items-center justify-center bg-muted/30 text-muted-foreground">
              <span className="text-2xl font-semibold">{(basics?.full_name || basics?.name || "U").slice(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-8">
        {basics?.bio ? <p className="text-sm text-muted-foreground">{basics.bio}</p> : null}

        {basics?.location ? (
          <div>
            <h5 className="text-sm font-semibold">Intro</h5>
            <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <span>{basics.location}</span>
            </p>
          </div>
        ) : null}

        {basics?.interest ? (
          <div>
            <h5 className="text-sm font-semibold">Interests</h5>
            <p className="text-sm text-muted-foreground mt-3">{basics.interest}</p>
          </div>
        ) : null}

        <div>
          <h5 className="text-sm font-semibold">Details</h5>
          <div className="mt-3">
            <StatItem icon={<Bolt className="h-5 w-5 text-amber-500" />} value={totals?.energy_points ?? 0} label="Energy Points" />
            <StatItem icon={<Star className="h-5 w-5 text-emerald-500" />} value={totals?.review_points ?? 0} label="Review Points" />
            <StatItem icon={<Trophy className="h-5 w-5 text-violet-500" />} value={allTimeRank} label="Rank" />
            <StatItem icon={<Calendar className="h-5 w-5 text-blue-500" />} value={monthlyRank} label="Monthly Rank" />
          </div>
        </div>

        <div className="space-y-2">
          {isSelf ? (
            <>
              <button className="text-sm text-primary hover:underline" onClick={() => setEditOpen(true)}>
                Edit Profile
              </button>
              <a className="block text-sm text-primary hover:underline" href={`/app/user/${encodeURIComponent(userId)}`}>
                User Settings
              </a>
            </>
          ) : null}
          <a className="block text-sm text-primary hover:underline" href="/app/leaderboard/User">
            Leaderboard
          </a>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription className="sr-only">
              Edit your profile details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Profile Image</div>
              <Input value={edit.user_image} onChange={(e) => setEdit((s) => ({ ...s, user_image: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Interests</div>
              <Input value={edit.interest} onChange={(e) => setEdit((s) => ({ ...s, interest: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Location</div>
              <Input value={edit.location} onChange={(e) => setEdit((s) => ({ ...s, location: e.target.value }))} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="text-xs text-muted-foreground">Bio</div>
              <Textarea rows={4} value={edit.bio} onChange={(e) => setEdit((s) => ({ ...s, bio: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                onSaveProfile?.(edit)
              }}
              disabled={!onSaveProfile || saving}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}


