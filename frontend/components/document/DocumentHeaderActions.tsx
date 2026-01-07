/**
 * Document Header Actions Component
 * 
 * Renders the document action toolbar based on ActionManifest.
 * Handles grouping, permissions, and action execution.
 */

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import * as LucideIcons from "lucide-react"
import type { Action, ActionContext, ActionGroup } from "@/lib/actions/types"
import { checkActionRequirements } from "@/lib/actions/types"

interface DocumentHeaderActionsProps {
  /** Actions to render */
  actions: Action[]
  /** Action context for execution */
  context: ActionContext
  /** Whether document is dirty/unsaved */
  isDirty?: boolean
}

/**
 * Get Lucide icon component by name
 */
function getIcon(iconName?: string): React.ComponentType<any> | null {
  if (!iconName) return null
  const Icon = (LucideIcons as any)[iconName]
  return Icon || null
}

/**
 * Group actions by their group property
 */
function groupActions(actions: Action[]): Map<ActionGroup, Action[]> {
  const grouped = new Map<ActionGroup, Action[]>()
  
  for (const action of actions) {
    const group = action.group || 'more'
    if (!grouped.has(group)) {
      grouped.set(group, [])
    }
    grouped.get(group)!.push(action)
  }
  
  return grouped
}

export function DocumentHeaderActions({
  actions,
  context,
  isDirty = false
}: DocumentHeaderActionsProps) {
  const [executingAction, setExecutingAction] = React.useState<string | null>(null)
  const [confirmAction, setConfirmAction] = React.useState<Action | null>(null)
  
  // Group actions
  const groupedActions = React.useMemo(() => groupActions(actions), [actions])
  
  // Get primary actions (Save, Submit, etc.)
  const primaryActions = groupedActions.get('primary') || []
  
  // Get workflow actions
  const workflowActions = groupedActions.get('workflow') || []
  
  // Get view actions
  const viewActions = groupedActions.get('view') || []
  
  // Get document actions (Rename, Duplicate, Delete)
  const documentActions = groupedActions.get('document') || []
  
  // Get print actions
  const printActions = groupedActions.get('print') || []
  
  // Get email actions
  const emailActions = groupedActions.get('email') || []
  
  // Get overflow actions
  const moreActions = groupedActions.get('more') || []
  
  // Combine actions that should show as menu items
  const menuActions = [
    ...viewActions.filter(a => a.showAsMenuItem),
    ...documentActions,
    ...printActions.filter(a => a.showAsMenuItem),
    ...emailActions.filter(a => a.showAsMenuItem),
    ...moreActions
  ]
  
  /**
   * Execute an action
   */
  const executeAction = async (action: Action) => {
    // Check if action requires confirmation
    if (action.confirm && !confirmAction) {
      setConfirmAction(action)
      return
    }
    
    // Check requirements (UX only, server is still authoritative)
    const requirementsMet = checkActionRequirements(action.requires, context)
    if (!requirementsMet) {
      toast.error('Action Unavailable', {
        description: 'You do not have permission to perform this action.',
      })
      return
    }
    
    try {
      setExecutingAction(action.id)
      await action.execute(context)
    } catch (error: any) {
      console.error(`[Action] Error executing ${action.id}:`, error)
      toast.error('Error', {
        description: error.message || `Failed to ${action.label.toLowerCase()}`,
      })
    } finally {
      setExecutingAction(null)
      setConfirmAction(null)
    }
  }
  
  /**
   * Render an action button
   */
  const renderActionButton = (action: Action) => {
    const Icon = getIcon(action.icon)
    const isExecuting = executingAction === action.id
    const requirementsMet = checkActionRequirements(action.requires, context)
    
    return (
      <Button
        key={action.id}
        onClick={() => executeAction(action)}
        disabled={isExecuting || !requirementsMet}
        variant={action.primary ? 'default' : 'ghost'}
        size="sm"
        className={action.primary ? 'h-9 text-sm px-4' : 'h-8 w-8 p-0'}
        title={action.label}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {action.primary && <span className="ml-2">{action.label}</span>}
      </Button>
    )
  }
  
  /**
   * Render an action menu item
   */
  const renderMenuItem = (action: Action) => {
    const Icon = getIcon(action.icon)
    const isExecuting = executingAction === action.id
    const requirementsMet = checkActionRequirements(action.requires, context)
    
    return (
      <DropdownMenuItem
        key={action.id}
        onClick={() => executeAction(action)}
        disabled={isExecuting || !requirementsMet}
        className="text-sm"
      >
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {action.label}
      </DropdownMenuItem>
    )
  }
  
  return (
    <>
      <div className="flex items-center gap-1">
        {/* Primary buttons (inline) */}
        {primaryActions
          .filter(a => !a.showAsMenuItem)
          .map(action => renderActionButton(action))}
        
        {/* Workflow actions dropdown */}
        {workflowActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm px-4">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Workflow</DropdownMenuLabel>
              {workflowActions.map(action => renderMenuItem(action))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* View actions (inline buttons) */}
        {viewActions
          .filter(a => !a.showAsMenuItem)
          .map(action => renderActionButton(action))}
        
        {/* Print button */}
        {printActions.length > 0 && (
          renderActionButton(printActions[0])
        )}
        
        {/* Email button */}
        {emailActions.length > 0 && (
          renderActionButton(emailActions[0])
        )}
        
        {/* More actions dropdown */}
        {menuActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <LucideIcons.MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {viewActions.filter(a => a.showAsMenuItem).length > 0 && (
                <>
                  <DropdownMenuLabel>View</DropdownMenuLabel>
                  {viewActions.filter(a => a.showAsMenuItem).map(action => renderMenuItem(action))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {documentActions.length > 0 && (
                <>
                  <DropdownMenuLabel>Document</DropdownMenuLabel>
                  {documentActions.map(action => renderMenuItem(action))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {printActions.filter(a => a.showAsMenuItem).length > 0 && (
                <>
                  {printActions.filter(a => a.showAsMenuItem).map(action => renderMenuItem(action))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {emailActions.filter(a => a.showAsMenuItem).length > 0 && (
                <>
                  {emailActions.filter(a => a.showAsMenuItem).map(action => renderMenuItem(action))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {moreActions.map(action => renderMenuItem(action))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.confirm?.title || confirmAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirm?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && executeAction(confirmAction)}
              className={confirmAction?.confirm?.type === 'danger' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

