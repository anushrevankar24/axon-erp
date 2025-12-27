'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FieldRenderer } from './FieldRenderer'

interface Section {
  label?: string
  collapsible?: boolean
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
}

export function FormLayoutRenderer({ fields, form }: FormLayoutRendererProps) {
  // Parse fields into tabs (3-level hierarchy: Tab → Section → Column)
  const tabs = parseFieldsIntoTabs(fields)
  
  // Safety check - ensure we have at least one tab
  if (tabs.length === 0) {
    return <div className="p-4 text-muted-foreground text-sm">No fields to display</div>
  }
  
  // If only one tab (no Tab Breaks), render without tabs UI
  if (tabs.length === 1) {
    return (
      <div className="space-y-3">
        {tabs[0].sections.map((section, sectionIndex) => (
          <FormSection
            key={sectionIndex}
            section={section}
            sectionIndex={sectionIndex}
            form={form}
          />
        ))}
      </div>
    )
  }
  
  // Multiple tabs - render with tabs UI
  return (
    <Tabs defaultValue={tabs[0].fieldname || '0'} className="w-full">
      <TabsList>
        {tabs.map((tab, index) => (
          <TabsTrigger key={tab.fieldname || index} value={tab.fieldname || String(index)}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab, index) => (
        <TabsContent key={tab.fieldname || index} value={tab.fieldname || String(index)}>
          <div className="space-y-3">
            {tab.sections.map((section, sectionIndex) => (
              <FormSection
                key={sectionIndex}
                section={section}
                sectionIndex={sectionIndex}
                form={form}
              />
            ))}
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
      
      // Start new section
      currentSection = {
        label: field.label,
        collapsible: field.collapsible === 1,
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
  form 
}: { 
  section: Section
  sectionIndex: number
  form: any 
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

