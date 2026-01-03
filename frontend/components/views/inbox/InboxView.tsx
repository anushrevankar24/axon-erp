/**
 * Inbox View Component
 * 
 * Matches ERPNext Desk Inbox/Communications view behavior and user_settings persistence.
 * Shows emails, comments, and other communications.
 */

"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { call } from "@/lib/api/client"
import { useUserSettings } from "@/lib/user-settings/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Settings, Mail, MessageSquare, FileText, Inbox as InboxIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

interface InboxViewProps {
  doctype: string
}

export function InboxView({ doctype }: InboxViewProps) {
  const { data: userSettings } = useUserSettings(doctype)
  
  // Fetch communications for this doctype
  const { data: communications, isLoading } = useQuery({
    queryKey: ['inbox', doctype],
    queryFn: async () => {
      // Get recent communications
      const result = await call('frappe.desk.form.load.get_communications', {
        doctype,
        limit: 50
      })
      return result.message || []
    }
  })
  
  if (isLoading) {
    return <InboxSkeleton />
  }
  
  const items = communications || []
  
  return (
    <div className="p-6 h-full max-w-7xl mx-auto">
      {/* Inbox Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <InboxIcon className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">{doctype} Inbox</h2>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>
      
      {/* Communications List */}
      <div className="space-y-2">
        {items.map((item: any) => (
          <InboxItem key={item.name} communication={item} />
        ))}
      </div>
      
      {/* Empty State */}
      {items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <InboxIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>No communications found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InboxItem({ communication }: { communication: any }) {
  const getIcon = () => {
    switch (communication.communication_type) {
      case 'Email':
        return <Mail className="h-4 w-4" />
      case 'Comment':
        return <MessageSquare className="h-4 w-4" />
      case 'Attachment':
        return <FileText className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }
  
  const isUnread = communication.seen === 0
  
  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${isUnread ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <div className="h-full w-full bg-primary/10 flex items-center justify-center">
              {getIcon()}
            </div>
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isUnread ? 'font-semibold' : ''}`}>
                  {communication.sender || communication.owner}
                </span>
                {isUnread && (
                  <Badge variant="default" className="text-xs">New</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(communication.creation), { addSuffix: true })}
              </span>
            </div>
            
            {communication.subject && (
              <div className={`text-sm mb-1 ${isUnread ? 'font-semibold' : ''}`}>
                {communication.subject}
              </div>
            )}
            
            {communication.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {communication.content.replace(/<[^>]*>/g, '')} {/* Strip HTML */}
              </div>
            )}
            
            {communication.reference_doctype && communication.reference_name && (
              <div className="text-xs text-muted-foreground mt-2">
                Re: {communication.reference_doctype} - {communication.reference_name}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InboxSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4 animate-pulse">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

