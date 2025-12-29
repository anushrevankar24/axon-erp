'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FieldRenderer } from './FieldRenderer'
import { evaluateDependsOnValue } from '@/lib/utils/evaluate-depends-on'

interface Section {
  fieldname?: string
  label?: string
  depends_on?: string
  hidden?: number
  collapsible?: boolean
  collapsible_depends_on?: string
  collapsed?: boolean
  columns: Field[][]
}

interface Tab {
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
}

export function FormLayoutRenderer({ fields, form, doc, meta }: FormLayoutRendererProps) {
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
        
        if (section.depends_on) {
          // Use ERPNext's exact evaluation logic
          const guardianHasValue = evaluateDependsOnValue(section.depends_on, doc)
          hidden_due_to_dependency = !guardianHasValue
        }
        
        return {
          ...section,
          hidden_due_to_dependency,
          // Final hidden state: explicit hidden OR depends_on hidden
          isHidden: section.hidden === 1 || hidden_due_to_dependency
        }
      })
    }))
  }, [tabs, doc])  // Re-run when doc changes (React's equivalent to ERPNext's refresh)
  
  // Safety check - ensure we have at least one tab
  if (tabsWithVisibility.length === 0) {
    return <div className="p-4 text-muted-foreground text-sm">No fields to display</div>
  }
  
  // If only one tab (no Tab Breaks), render without tabs UI
  if (tabsWithVisibility.length === 1) {
    return (
      <div className="space-y-3">
        {tabsWithVisibility[0].sections.map((section, sectionIndex) => 
          !section.isHidden && (
            <FormSection
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              form={form}
              doc={doc}
              meta={meta}
            />
          )
        )}
      </div>
    )
  }
  
  // Multiple tabs - render with tabs UI
  return (
    <Tabs defaultValue={tabsWithVisibility[0].fieldname || '0'} className="w-full">
      <TabsList>
        {tabsWithVisibility.map((tab, index) => (
          <TabsTrigger key={tab.fieldname || index} value={tab.fieldname || String(index)}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabsWithVisibility.map((tab, index) => (
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
                />
              )
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}

function parseFieldsIntoTabs(fields: Field[]): Tab[] {
  const tabs: Tab[] = []
  let currentTab: Tab | null = null
  let currentSection: Section = { columns: [[]] }
  let currentColumnIndex = 0
  let hasTabBreaks = fields.some(f => f.fieldtype === 'Tab Break')

  fields.forEach((field) => {
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
        collapsed: !!field.collapsible_depends_on,
        columns: [[]]
      }
      currentColumnIndex = 0
    } else if (field.fieldtype === 'Column Break') {
      // Start new column in current section
      currentColumnIndex++
      if (!currentSection.columns[currentColumnIndex]) {
        currentSection.columns[currentColumnIndex] = []
      }
    } else if (!field.hidden && field.fieldtype !== 'HTML') {
      // Add field to current column (skip hidden and HTML fields)
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
  })

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
  meta
}: { 
  section: Section
  sectionIndex: number
  form: any
  doc?: any
  meta?: any
}) {
  const [isOpen, setIsOpen] = React.useState(!section.collapsed)
  
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
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div 
              className="border-b border-gray-200 px-4 py-2 bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => setIsOpen(!isOpen)}
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

