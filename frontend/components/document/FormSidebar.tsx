"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  UserPlus, 
  Paperclip, 
  Tag, 
  Share2, 
  Heart,
  MessageSquare,
  Clock,
  User
} from "lucide-react"
import { getAssignments, getTags, getAttachments } from "@/lib/api/dashboard"
import { formatDistanceToNow } from "date-fns"

interface FormSidebarProps {
  doctype: string
  docname: string
  doc?: any
}

export function FormSidebar({ doctype, docname, doc }: FormSidebarProps) {
  if (!docname || docname === 'new') return null

  return (
    <div className="w-64 border-l bg-muted/20 p-4 space-y-4 sticky top-[calc(var(--header-height)+52px)] h-fit max-h-[calc(100vh-var(--header-height)-60px)] overflow-y-auto scrollbar-sidebar">
      {/* Assigned To */}
      <SidebarSection
        icon={<UserPlus className="h-4 w-4" />}
        title="Assigned To"
        doctype={doctype}
        docname={docname}
      >
        <AssignedToSection doctype={doctype} docname={docname} />
      </SidebarSection>

      {/* Attachments */}
      <SidebarSection
        icon={<Paperclip className="h-4 w-4" />}
        title="Attachments"
        doctype={doctype}
        docname={docname}
      >
        <AttachmentsSection doctype={doctype} docname={docname} />
      </SidebarSection>

      {/* Tags */}
      <SidebarSection
        icon={<Tag className="h-4 w-4" />}
        title="Tags"
        doctype={doctype}
        docname={docname}
      >
        <TagsSection doctype={doctype} docname={docname} />
      </SidebarSection>

      {/* Share */}
      <SidebarSection
        icon={<Share2 className="h-4 w-4" />}
        title="Share"
        doctype={doctype}
        docname={docname}
      >
        <ShareSection doctype={doctype} docname={docname} />
      </SidebarSection>

      <Separator />

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
          <Heart className="h-4 w-4" />
          <span>0</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
          <MessageSquare className="h-4 w-4" />
          <span>0</span>
        </button>
      </div>

      <Separator />

      {/* Metadata */}
      {doc && (
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <p>Modified {formatDistanceToNow(new Date(doc.modified), { addSuffix: true })}</p>
              <p className="text-foreground">{doc.modified_by}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <p>Created {formatDistanceToNow(new Date(doc.creation), { addSuffix: true })}</p>
              <p className="text-foreground">{doc.owner}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarSection({ 
  icon, 
  title, 
  children, 
  doctype, 
  docname 
}: { 
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  doctype: string
  docname: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <UserPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

function AssignedToSection({ doctype, docname }: { doctype: string, docname: string }) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', doctype, docname],
    queryFn: () => getAssignments(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-6 bg-muted/30 rounded animate-pulse" />
        <div className="h-6 bg-muted/20 rounded animate-pulse w-3/4" />
      </div>
    )
  }

  if (!assignments || assignments.length === 0) {
    return <div className="text-xs text-muted-foreground">No assignments</div>
  }

  return (
    <div className="space-y-1">
      {assignments.map((assignment: any) => (
        <div key={assignment.name} className="flex items-center gap-2 text-sm">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {assignment.owner?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span>{assignment.owner}</span>
        </div>
      ))}
    </div>
  )
}

function AttachmentsSection({ doctype, docname }: { doctype: string, docname: string }) {
  const { data: attachments, isLoading } = useQuery({
    queryKey: ['attachments', doctype, docname],
    queryFn: () => getAttachments(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 bg-muted/20 rounded animate-pulse w-2/3" />
      </div>
    )
  }

  if (!attachments || attachments.length === 0) {
    return <div className="text-xs text-muted-foreground">No attachments</div>
  }

  return (
    <div className="space-y-1">
      {attachments.slice(0, 3).map((file: any) => (
        <a
          key={file.name}
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors truncate"
        >
          <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{file.file_name}</span>
        </a>
      ))}
      {attachments.length > 3 && (
        <div className="text-xs text-muted-foreground">
          +{attachments.length - 3} more
        </div>
      )}
    </div>
  )
}

function TagsSection({ doctype, docname }: { doctype: string, docname: string }) {
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', doctype, docname],
    queryFn: () => getTags(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-muted/30 rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted/20 rounded animate-pulse" />
      </div>
    )
  }

  if (!tags || tags.length === 0) {
    return <div className="text-xs text-muted-foreground">No tags</div>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag: string) => (
        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

function ShareSection({ doctype, docname }: { doctype: string, docname: string }) {
  // TODO: Implement share functionality
  return <div className="text-xs text-muted-foreground">Not shared</div>
}

