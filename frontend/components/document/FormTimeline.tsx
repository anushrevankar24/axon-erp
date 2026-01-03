"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Activity, 
  Send, 
  FileText, 
  Mail,
  Edit,
  Trash2,
  Clock,
  MoreHorizontal
} from "lucide-react"
import { getTimeline, addComment } from "@/lib/api/dashboard"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface FormTimelineProps {
  doctype: string
  docname: string
}

export function FormTimeline({ doctype, docname }: FormTimelineProps) {
  if (!docname || docname === 'new') return null
  const [activeTab, setActiveTab] = React.useState("comments")

  return (
    <div className="px-6 py-6 border-t">
      {/* Header with title that changes based on active tab */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {activeTab === "comments" ? "Comments" : "Activity"}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "comments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("comments")}
            className="h-8"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </Button>
          <Button
            variant={activeTab === "activity" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("activity")}
            className="h-8"
          >
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </Button>
          {activeTab === "activity" && (
            <Button variant="outline" size="sm" className="h-8">
              + New Email
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "comments" ? (
        <div className="space-y-4">
          <CommentBox doctype={doctype} docname={docname} />
          <CommentsList doctype={doctype} docname={docname} />
        </div>
      ) : (
        <div className="space-y-3">
          <ActivityList doctype={doctype} docname={docname} />
        </div>
      )}
    </div>
  )
}

function CommentBox({ doctype, docname }: { doctype: string, docname: string }) {
  const [comment, setComment] = React.useState("")
  const [showButton, setShowButton] = React.useState(false)
  const queryClient = useQueryClient()

  const addCommentMutation = useMutation({
    mutationFn: () => addComment(doctype, docname, comment),
    onSuccess: () => {
      toast.success("Comment added")
      setComment("")
      setShowButton(false)
      queryClient.invalidateQueries({ queryKey: ['timeline', doctype, docname] })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment")
    }
  })

  // Show button only when user starts typing
  React.useEffect(() => {
    const hasContent = comment.trim().length > 0
    setShowButton(hasContent)
  }, [comment])

  return (
    <div className="space-y-2">
      <div className="flex gap-3 items-start bg-muted/30 p-3 rounded-lg">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <div className="h-full w-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {/* You can get user initial from session */}
              U
            </span>
          </div>
        </Avatar>
        <Textarea
          placeholder="Type a reply / comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 min-h-[80px] text-sm resize-none"
        />
      </div>
      {showButton && (
        <div className="flex justify-end">
          <Button 
            size="sm"
            onClick={() => addCommentMutation.mutate()}
            disabled={!comment.trim() || addCommentMutation.isPending}
            className="h-9 px-4 text-sm"
          >
            {addCommentMutation.isPending ? "Sending..." : "Comment"}
          </Button>
        </div>
      )}
    </div>
  )
}

function CommentsList({ doctype, docname }: { doctype: string, docname: string }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', doctype, docname],
    queryFn: () => getTimeline(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const comments = timeline?.filter((item: any) => item.comment_type === 'Comment') || []

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No comments yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((item: any) => (
        <CommentItem key={item.name} comment={item} />
      ))}
    </div>
  )
}

function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="flex gap-3 py-4">
      <Avatar className="h-10 w-10">
        <div className="h-full w-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium">
            {comment.owner?.charAt(0).toUpperCase()}
          </span>
        </div>
      </Avatar>
      <div className="flex-1 min-w-0 border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">You commented</span>
            <span className="text-sm text-muted-foreground">
              · {formatDistanceToNow(new Date(comment.creation), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-foreground bg-muted/30 rounded p-3">
          {comment.content}
        </div>
      </div>
    </div>
  )
}

function ActivityList({ doctype, docname }: { doctype: string, docname: string }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', doctype, docname],
    queryFn: () => getTimeline(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 py-3 border-b animate-pulse">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const activities = timeline || []

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((item: any, idx: number) => (
        <ActivityItem key={item.name || idx} activity={item} />
      ))}
    </div>
  )
}

function ActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.communication_type) {
      case 'Email':
        return <Mail className="h-4 w-4" />
      case 'Comment':
        return <MessageSquare className="h-4 w-4" />
      case 'Attachment':
        return <FileText className="h-4 w-4" />
      default:
        return <Edit className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (activity.communication_type) {
      case 'Email':
        return 'Email'
      case 'Comment':
        return 'Comment'
      case 'Attachment':
        return 'Attachment'
      default:
        return 'Activity'
    }
  }

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {activity.owner || activity.sender || 'System'}
          </span>
          <span className="text-sm text-muted-foreground">
            · {formatDistanceToNow(new Date(activity.creation), { addSuffix: true })}
          </span>
        </div>
        {activity.subject && (
          <p className="text-sm text-muted-foreground">{activity.subject}</p>
        )}
        {activity.content && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.content}</p>
        )}
      </div>
    </div>
  )
}

