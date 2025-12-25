import { z } from 'zod'

export function generateZodSchema(meta: any) {
  if (!meta || !meta.fields) {
    return z.object({})
  }
  
  const schemaFields: Record<string, any> = {}
  
  meta.fields.forEach((field: any) => {
    let fieldSchema: any
    
    switch (field.fieldtype) {
      case 'Data':
      case 'Small Text':
      case 'Text':
      case 'Long Text':
      case 'Text Editor':
      case 'Code':
      case 'HTML':
        fieldSchema = z.string()
        break
      
      case 'Int':
        fieldSchema = z.number().int()
        break
      
      case 'Float':
      case 'Currency':
      case 'Percent':
        fieldSchema = z.number()
        break
      
      case 'Check':
        fieldSchema = z.union([z.number(), z.boolean()])
        break
      
      case 'Date':
      case 'Datetime':
      case 'Time':
        fieldSchema = z.string()
        break
      
      case 'Link':
      case 'Dynamic Link':
        fieldSchema = z.string()
        break
      
      case 'Select':
        if (field.options) {
          const options = field.options.split('\n').filter(Boolean)
          fieldSchema = z.enum(options as [string, ...string[]])
        } else {
          fieldSchema = z.string()
        }
        break
      
      case 'Table':
        fieldSchema = z.array(z.any())
        break
      
      case 'Attach':
      case 'Attach Image':
        fieldSchema = z.string()
        break
      
      default:
        fieldSchema = z.any()
    }
    
    // Make field optional if not required
    if (!field.reqd) {
      fieldSchema = fieldSchema.optional().nullable()
    }
    
    schemaFields[field.fieldname] = fieldSchema
  })
  
  return z.object(schemaFields)
}

