'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FieldRenderer } from './FieldRenderer'
import { evaluateDependsOnValue } from '@/lib/utils/evaluate-depends-on'
import type { DependencyStateMap } from '@/lib/form/dependency_state'
import { useFrappeRuntimeVersion } from '@/lib/frappe-runtime/react'
import { isNullOrEmpty } from '@/lib/utils/validation'
import { useBoot } from '@/lib/api/hooks'
import { calculatePermissions, getFieldDisplayStatus, applyDependencyOverrides } from '@/lib/utils/field-permissions'
import { getBootUserRoles } from '@/lib/utils/boot'

function isUserSettingsDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  if (typeof window === 'undefined') return false
  return localStorage.getItem('debug_user_settings') === '1'
}

interface Section {
  fieldname?: string
  label?: string
  depends_on?: string
  hidden?: number
  collapsible?: boolean
  collapsible_depends_on?: string
  collapsed?: boolean
  css_class?: string  // Desk parity: for localStorage persistence
  columns: Field[][]
}

interface FormTab {
  label: string
  fieldname?: string
  sections: Section[]
}

interface Field {
  fieldname: string
  fieldtype: string
  label: string
  hidden?: number
  reqd?: number
  description?: string
  collapsible?: number
  collapsible_depends_on?: string
  [key: string]: any
}

interface FormLayoutRendererProps {
  fields: Field[]
  form: any
  doc?: any
  meta?: any
  dependencyState?: DependencyStateMap
  userSettings?: any
  docinfo?: any  // Desk parity: docinfo.permissions for field visibility
}

// In-memory active tab map (Desk parity: not persisted to __UserSettings)
// Key format: `${doctype}::${docname}` to avoid collisions
const activeTabMap = new Map<string, string>()

export function FormLayoutRenderer({ fields, form, doc, meta, dependencyState, userSettings, docinfo }: FormLayoutRendererProps) {
  const runtimeVersion = useFrappeRuntimeVersion()
  const { data: boot } = useBoot()
  
  // Parse fields into tabs (3-level hierarchy: Tab → Section → Column)
  const tabs = React.useMemo(() => parseFieldsIntoTabs(fields), [fields])
  
  // Evaluate section visibility based on depends_on
  // Replicates ERPNext's refresh_dependency() - layout.js lines 693-745
  const tabsWithVisibility = React.useMemo(() => {
    return tabs.map(tab => ({
      ...tab,
      sections: tab.sections.map(section => {
        // Evaluate depends_on for this section
        let hidden_due_to_dependency = false
        let collapsed_due_to_dependency: boolean | undefined = undefined
        
        if (section.depends_on) {
          // Use ERPNext's exact evaluation logic
          const guardianHasValue = evaluateDependsOnValue(section.depends_on, doc)
          hidden_due_to_dependency = !guardianHasValue
        }

        // Collapsible depends_on parity (layout.js):
        // collapse = !evaluate_depends_on_value(df.collapsible_depends_on)
        if (section.collapsible_depends_on) {
          collapsed_due_to_dependency = !evaluateDependsOnValue(section.collapsible_depends_on, doc)
        }
        
        return {
          ...section,
          hidden_due_to_dependency,
          collapsed_due_to_dependency,
          // Final hidden state: explicit hidden OR depends_on hidden
          isHidden: section.hidden === 1 || hidden_due_to_dependency
        }
      })
    }))
  }, [tabs, doc, runtimeVersion])  // Re-run when doc/runtime changes (equivalent to refresh_dependency)
  
  // Desk parity: filter tabs/sections/columns by field permissions
  // This prevents empty tabs from showing (e.g., Roles tab for non-privileged users)
  const tabsWithPermissions = React.useMemo(() => {
    const userRoles = getBootUserRoles(boot)
    if (!meta || userRoles.length === 0) return tabsWithVisibility
    const permissions = calculatePermissions(meta as any, userRoles)
    
    return tabsWithVisibility.map(tab => ({
      ...tab,
      sections: tab.sections.map(section => ({
        ...section,
        columns: section.columns.map(column =>
          column.filter(field => {
            const effectiveField = applyDependencyOverrides(field as any, dependencyState?.[field.fieldname])
            const status = getFieldDisplayStatus(effectiveField as any, doc, permissions, docinfo)
            return status !== 'None'
          })
        ).filter(column => column.length > 0) // Remove empty columns
      })).filter(section => 
        !section.isHidden && section.columns.length > 0 // Remove sections with no visible fields
      )
    })).filter(tab => tab.sections.length > 0) // Remove tabs with no sections
  }, [tabsWithVisibility, meta, boot, doc, dependencyState, docinfo, runtimeVersion])
  
  // Safety check - ensure we have at least one tab
  if (tabsWithPermissions.length === 0) {
    return <div className="p-4 text-muted-foreground text-sm">No fields to display</div>
  }
  
  // Build doc identity key for active tab map (Desk pattern)
  const docIdentity = meta?.name && doc?.name ? `${meta.name}::${doc.name}` : null
  
  // If only one tab (no Tab Breaks), render without tabs UI
  if (tabsWithPermissions.length === 1) {
    return (
      <div className="space-y-3">
        {tabsWithPermissions[0].sections.map((section, sectionIndex) => 
          !section.isHidden && (
            <FormSection
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              form={form}
              doc={doc}
              meta={meta}
              dependencyState={dependencyState}
              userSettings={userSettings}
              docinfo={docinfo}
            />
          )
        )}
      </div>
    )
  }
  
  // Multiple tabs - render with tabs UI
  // Restore active tab from in-memory map (Desk parity)
  const savedActiveTab = docIdentity ? activeTabMap.get(docIdentity) : null
  const defaultTab = savedActiveTab || tabsWithPermissions[0].fieldname || '0'
  
  // Save active tab to in-memory map when it changes (Desk parity)
  const handleTabChange = (value: string) => {
    if (docIdentity) {
      activeTabMap.set(docIdentity, value)
    }
  }
  
  return (
    <Tabs 
      defaultValue={defaultTab} 
      className="w-full"
      onValueChange={handleTabChange}
    >
      <TabsList>
        {tabsWithPermissions.map((tab, index) => (
          <TabsTrigger key={tab.fieldname || index} value={tab.fieldname || String(index)}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabsWithPermissions.map((tab, index) => (
        <TabsContent key={tab.fieldname || index} value={tab.fieldname || String(index)}>
          <div className="space-y-3">
            {tab.sections.map((section, sectionIndex) => 
              !section.isHidden && (
                <FormSection
                  key={sectionIndex}
                  section={section}
                  sectionIndex={sectionIndex}
                  form={form}
                  doc={doc}
                  meta={meta}
                  dependencyState={dependencyState}
                  userSettings={userSettings}
                  docinfo={docinfo}
                />
              )
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

function parseFieldsIntoTabs(fields: Field[]): FormTab[] {
  const tabs: FormTab[] = []
  let currentTab: FormTab | null = null
  let currentSection: Section = { columns: [[]] }
  let currentColumnIndex = 0
  let hasTabBreaks = fields.some(f => f.fieldtype === 'Tab Break')

  for (const field of fields) {
    if (field.fieldtype === 'Tab Break') {
      // Save current section to current tab
      if (currentTab && (currentSection.columns[0].length > 0 || currentSection.label)) {
        currentTab.sections.push(currentSection)
      }
      
      // Save current tab if it has content
      if (currentTab && currentTab.sections.length > 0) {
        tabs.push(currentTab)
      }
      
      // Start new tab
      currentTab = {
        label: field.label || 'Details',
        fieldname: field.fieldname,
        sections: []
      }
      currentSection = { columns: [[]] }
      currentColumnIndex = 0
    } else if (field.fieldtype === 'Section Break') {
      // Save current section if it has content
      if (currentSection.columns[0].length > 0 || currentSection.label) {
        if (!currentTab) {
          // Auto-create first tab if fields before first Tab Break
          currentTab = {
            label: 'Details',
            sections: []
          }
        }
        currentTab.sections.push(currentSection)
      }
      
      // Start new section - PRESERVE ALL METADATA (ERPNext pattern)
      currentSection = {
        fieldname: field.fieldname,
        label: field.label,
        depends_on: field.depends_on,
        hidden: field.hidden,
        collapsible: field.collapsible === 1,
        collapsible_depends_on: field.collapsible_depends_on,
        css_class: field.css_class,  // Desk parity: for localStorage persistence
        // ERPNext Desk parity: collapsible sections default to collapsed (true)
        collapsed: field.collapsible === 1,
        columns: [[]]
      }
      currentColumnIndex = 0
    } else if (field.fieldtype === 'Column Break') {
      // Start new column in current section
      currentColumnIndex++
      if (!currentSection.columns[currentColumnIndex]) {
        currentSection.columns[currentColumnIndex] = []
      }
    } else if (!field.hidden) {
      // Add field to current column (include HTML fields for User doctype custom editors)
      if (!currentTab) {
        // Auto-create first tab if fields before first Tab Break
        currentTab = {
          label: 'Details',
          sections: []
        }
      }
      if (!currentSection.columns[currentColumnIndex]) {
        currentSection.columns[currentColumnIndex] = []
      }
      currentSection.columns[currentColumnIndex].push(field)
    }
  }

  // Add last section to current tab
  if (currentTab && (currentSection.columns[0].length > 0 || currentSection.label)) {
    currentTab.sections.push(currentSection)
  }

  // Add last tab if it has content
  if (currentTab && currentTab.sections.length > 0) {
    tabs.push(currentTab)
  }

  // Filter empty tabs and optimize columns
  const filteredTabs = tabs
    .filter(tab => tab.sections.some(s => s.columns.some(c => c.length > 0)))
    .map(tab => ({
      ...tab,
      sections: tab.sections.map(section => ({
        ...section,
        columns: optimizeColumns(section.columns)
      }))
    }))

  // If no tabs after filtering, create default tab with empty sections
  if (filteredTabs.length === 0) {
    return [{
      label: 'Details',
      sections: []
    }]
  }

  return filteredTabs
}

function optimizeColumns(columns: Field[][]): Field[][] {
  if (columns.length <= 1) return columns
  
  // Filter out empty columns
  const nonEmptyColumns = columns.filter(c => c.length > 0)
  if (nonEmptyColumns.length <= 1) return nonEmptyColumns
  
  const counts = nonEmptyColumns.map(c => c.length)
  const total = counts.reduce((a, b) => a + b, 0)
  const maxInOne = Math.max(...counts)
  
  // If >70% fields in one column, collapse to single column
  if (maxInOne > total * 0.7) {
    return [nonEmptyColumns.flat()]
  }
  
  // Otherwise return non-empty columns
  return nonEmptyColumns
}

function FormSection({ 
  section, 
  sectionIndex, 
  form,
  doc,
  meta,
  dependencyState,
  userSettings,
  docinfo
}: { 
  section: Section
  sectionIndex: number
  form: any
  doc?: any
  meta?: any
  dependencyState?: DependencyStateMap
  userSettings?: any
  docinfo?: any
}) {
  const collapsedByDependency = (section as any).collapsed_due_to_dependency
  
  // Check if section has missing mandatory fields (ERPNext Desk parity)
  // If it does, force the section to be open
  const hasMissingMandatory = React.useMemo(() => {
    if (!section.collapsible || !doc) return false
    
    // Get all fields in this section
    const sectionFields = section.columns.flat()
    
    // Check each field for missing mandatory values
    for (const field of sectionFields) {
      // Skip if not mandatory or hidden
      const isHidden = field.hidden || dependencyState?.[field.fieldname]?.hidden_due_to_dependency
      if (isHidden) continue
      
      // Check if field is mandatory (from field meta or dependency state)
      const isRequired = field.reqd || dependencyState?.[field.fieldname]?.reqd
      if (!isRequired) continue
      
      // Check if value is missing
      const value = doc[field.fieldname]
      if (isNullOrEmpty(value)) {
        return true
      }
    }
    
    return false
  }, [section, doc, dependencyState])
  
  // Compute initial collapsed state (Desk parity):
  // 1. If collapsible_depends_on evaluated, use that
  // 2. Else check localStorage (using df.css_class + "-closed")
  // 3. Else use section.collapsed (defaults to true for collapsible sections)
  // 4. But if has missing mandatory, force open
  const initialCollapsed = React.useMemo(() => {
    if (collapsedByDependency !== undefined) {
      return collapsedByDependency
    }
    
    // Desk parity: check localStorage using css_class
    if (section.css_class && typeof window !== 'undefined') {
      const stored = localStorage.getItem(section.css_class + '-closed')
      // Desk stores '' (open) or '1' (closed). Treat null as \"no preference\".
      if (stored !== null) return stored === '1'
    }
    
    // Default: collapsed for collapsible sections
    return section.collapsed || false
  }, [section.css_class, section.collapsed, collapsedByDependency])
  
  const [isOpen, setIsOpen] = React.useState(!initialCollapsed || hasMissingMandatory)

  // Re-evaluate when dependency or mandatory state changes
  React.useEffect(() => {
    if (collapsedByDependency !== undefined) {
      setIsOpen(!collapsedByDependency || hasMissingMandatory)
    } else if (hasMissingMandatory) {
      setIsOpen(true)
    }
  }, [collapsedByDependency, hasMissingMandatory])
  
  // Handle collapse/expand changes (Desk parity: save to localStorage)
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    
    // Persist to localStorage using css_class (Desk parity)
    if (section.css_class && typeof window !== 'undefined') {
      localStorage.setItem(section.css_class + '-closed', open ? '' : '1')
    }
  }
  
  // Filter empty columns
  const nonEmptyColumns = section.columns.filter(column => column.length > 0)
  
  // Determine grid columns based on number of non-empty columns
  const gridColsClass = nonEmptyColumns.length === 1 
    ? 'grid-cols-1' 
    : nonEmptyColumns.length === 2 
      ? 'md:grid-cols-2' 
      : nonEmptyColumns.length === 3
        ? 'md:grid-cols-3'
        : 'md:grid-cols-4'
  
  const content = (
    <div className={`grid gap-3 ${gridColsClass}`}>
      {nonEmptyColumns.map((column, columnIndex) => (
        <div key={columnIndex} className="space-y-2.5">
          {column.map((field) => (
            <FieldRenderer
              key={field.fieldname}
              field={field}
              form={form}
              doc={doc}
              meta={meta}
              dependencyState={dependencyState}
              userSettings={userSettings}
              docinfo={docinfo}
            />
          ))}
        </div>
      ))}
    </div>
  )

  // If section has a label, wrap in border
  if (section.label) {
    if (section.collapsible) {
      return (
        <div className="border border-gray-200 rounded-md bg-white">
          <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
            <div 
              className="border-b border-gray-200 px-4 py-2 bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => handleOpenChange(!isOpen)}
            >
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {section.label}
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="p-4">
                {content}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )
    }
    
    return (
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">
            {section.label}
          </h3>
        </div>
        <div className="p-4">
          {content}
        </div>
      </div>
    )
  }

  // No label - render with minimal wrapper
  return (
    <div className="border border-gray-200 rounded-md bg-white p-4">
      {content}
    </div>
  )
}

