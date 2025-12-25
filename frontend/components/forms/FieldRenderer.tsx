import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LinkField } from './LinkField'
import { ChildTable } from './ChildTable'

export function FieldRenderer({ field, form }: any) {
  const fieldName = field.fieldname
  
  // Skip hidden fields and breaks
  if (field.hidden || ['Section Break', 'Column Break', 'HTML'].includes(field.fieldtype)) {
    return null
  }
  
  const isFullWidth = ['Text', 'Small Text', 'Long Text', 'Text Editor', 'Table'].includes(field.fieldtype)
  
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem className={isFullWidth ? 'md:col-span-2' : ''}>
          <FormLabel className="text-sm font-medium">
            {field.label}
            {field.reqd === 1 && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {renderFieldInput(field, formField, form)}
          </FormControl>
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}

function renderFieldInput(field: any, formField: any, form?: any) {
  switch (field.fieldtype) {
    case 'Data':
    case 'Barcode':
    case 'Phone':
    case 'Password':
      return <Input type={field.fieldtype === 'Password' ? 'password' : 'text'} className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Int':
      return <Input type="number" step="1" className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Float':
    case 'Percent':
      return <Input type="number" step="0.01" className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input type="number" step="0.01" className="pl-8 h-9 text-sm" {...formField} value={formField.value || ''} />
        </div>
      )
    
    case 'Text':
    case 'Small Text':
    case 'Long Text':
      return <Textarea rows={field.fieldtype === 'Long Text' ? 6 : 3} className="text-sm resize-none" {...formField} value={formField.value || ''} />
    
    case 'Date':
      return <Input type="date" className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Datetime':
      return <Input type="datetime-local" className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Time':
      return <Input type="time" className="h-9 text-sm" {...formField} value={formField.value || ''} />
    
    case 'Check':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formField.value === 1 || formField.value === true}
            onCheckedChange={(checked) => formField.onChange(checked ? 1 : 0)}
            className="h-4 w-4"
          />
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {field.label}
          </label>
        </div>
      )
    
    case 'Select':
      // Filter out empty options to avoid Select.Item error
      const options = field.options?.split('\n').filter((opt: string) => opt.trim() !== '') || []
      
      return (
        <Select value={formField.value || ''} onValueChange={formField.onChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt} className="text-sm">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'Link':
      return (
        <LinkField
          value={formField.value || ''}
          onChange={formField.onChange}
          doctype={field.options}
          placeholder={`Select ${field.options}`}
          disabled={field.read_only === 1}
        />
      )
    
    case 'Table':
      return (
        <ChildTable
          value={formField.value || []}
          onChange={formField.onChange}
          doctype={field.options}
          disabled={field.read_only === 1}
          parentForm={form}
        />
      )
    
    case 'Attach':
    case 'Attach Image':
      return (
        <div className="border-2 border-dashed rounded p-4 text-center">
          <Input type="file" className="hidden" id={field.fieldname} />
          <label htmlFor={field.fieldname} className="cursor-pointer">
            <p className="text-sm text-muted-foreground">Click to upload file</p>
          </label>
        </div>
      )
    
    case 'Text Editor':
    case 'Code':
    case 'HTML':
      return <Textarea rows={8} {...formField} value={formField.value || ''} className="font-mono text-sm resize-none" />
    
    case 'Read Only':
      return (
        <Input {...formField} value={formField.value || ''} disabled className="bg-gray-50 h-9 text-sm" />
      )
    
    default:
      return <Input {...formField} value={formField.value || ''} placeholder={field.fieldtype} className="h-9 text-sm" />
  }
}

