"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, Printer, Mail, Copy, Trash2, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FormDashboard } from "./FormDashboard"
import { FormSidebar } from "./FormSidebar"
import { FormTimeline } from "./FormTimeline"
import { DynamicForm } from "../forms/DynamicForm"
import { useDoc } from "@/lib/api/hooks"

interface DocumentLayoutProps {
  doctype: string
  id?: string
}

export function DocumentLayout({ doctype, id }: DocumentLayoutProps) {
  const router = useRouter()
  const isNew = !id || id === 'new'
  const [isDirty, setIsDirty] = React.useState(false)
  const [formRef, setFormRef] = React.useState<any>(null)

  // Fetch document data
  const { data: doc, refetch } = useDoc(doctype, id)

  const handleSave = () => {
    // Trigger form submission from DynamicForm
    if (formRef && formRef.handleSubmit) {
      formRef.handleSubmit()
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log('Print document')
  }

  const handleEmail = () => {
    // TODO: Implement email functionality
    console.log('Email document')
  }

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate document')
  }

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete document')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Document Title Bar - Like ERPNext */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        {/* Left: Hamburger + Document Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          
          <h1 className="text-lg font-semibold">
            {isNew ? `New ${doctype}` : (id || doctype)}
          </h1>
          
          {isDirty && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              Not Saved
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Navigation arrows */}
          {!isNew && (
            <>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Refresh */}
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {/* Print */}
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="h-8 w-8 p-0"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}

          {/* More Actions */}
          {!isNew && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEmail} className="text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} className="text-sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh} className="text-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} className="h-9 text-sm px-4 ml-2">
            Save
          </Button>
        </div>
      </div>

      {/* Dashboard (Connections) - Only show after save */}
      {!isNew && id && (
        <FormDashboard doctype={doctype} docname={id} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <DynamicForm 
              doctype={doctype} 
              id={id}
              onFormReady={setFormRef}
              onDirtyChange={setIsDirty}
            />
          </div>

          {/* Timeline (Activity & Comments) - Only show after save */}
          {!isNew && id && (
            <FormTimeline doctype={doctype} docname={id} />
          )}
        </div>

        {/* Sidebar - Only show after save */}
        {!isNew && id && (
          <FormSidebar doctype={doctype} docname={id} doc={doc} />
        )}
      </div>
    </div>
  )
}

