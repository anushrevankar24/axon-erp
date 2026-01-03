/**
 * Image View Component
 * 
 * Matches ERPNext Desk Image view behavior and user_settings persistence.
 * Based on: frappe/public/js/frappe/views/image/image_view.js
 */

"use client"

import * as React from "react"
import { useMeta, useListData } from "@/lib/api/hooks"
import { useUserSettings } from "@/lib/user-settings/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Image as ImageIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ImageViewProps {
  doctype: string
}

export function ImageView({ doctype }: ImageViewProps) {
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: userSettings } = useUserSettings(doctype)
  
  // Get image field from user settings or default
  const imageField = userSettings?.Image?.image_field || 'image'
  const titleField = userSettings?.Image?.title_field || meta?.title_field || 'name'
  
  // Fetch data
  const { data: listData, isLoading: dataLoading } = useListData({
    doctype,
    filters: userSettings?.Image?.filters || {},
    pageSize: 100  // Image view shows more items
  })
  
  if (metaLoading || dataLoading) {
    return <ImageViewSkeleton />
  }
  
  if (!meta) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        DocType "{doctype}" not found
      </div>
    )
  }
  
  return (
    <div className="p-6 h-full">
      {/* Image View Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{doctype} Gallery</h2>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {listData?.map((item: any) => {
          const imageUrl = item[imageField]
          const title = item[titleField] || item.name
          
          return (
            <Card 
              key={item.name}
              className="group cursor-pointer hover:shadow-lg transition-all"
            >
              <CardContent className="p-0">
                {/* Image */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  )}
                </div>
                
                {/* Title Overlay */}
                <div className="p-3 bg-white border-t">
                  <div className="font-medium text-sm truncate" title={title}>
                    {title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Empty State */}
      {listData && listData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>No items with images found</p>
        </div>
      )}
    </div>
  )
}

function ImageViewSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

