import { call } from './client'

// Get dashboard data including connections
export async function getDashboardData(doctype: string, docname: string) {
  try {
    const response = await call('frappe.desk.form.load.get_docinfo', {
      doctype,
      name: docname
    })
    return response?.message || {}
  } catch (error) {
    // Silently fail - dashboard data is optional
    return {}
  }
}

// Get connections configuration from dashboard.py files
export async function getDashboardConfig(doctype: string) {
  try {
    const response = await call('frappe.desk.desktop.get_desktop_page', {
      page: doctype
    })
    return response?.message || {}
  } catch (error) {
    console.error('Error fetching dashboard config:', error)
    return {}
  }
}

// Get document connections/links
export async function getDocumentLinks(doctype: string, docname: string) {
  try {
    const response = await call('frappe.desk.form.load.get_docinfo', {
      doctype,
      name: docname
    })
    return response?.message?.links || {}
  } catch (error) {
    console.error('Error fetching document links:', error)
    return {}
  }
}

// Get comments and activity
export async function getTimeline(doctype: string, docname: string) {
  try {
    const response = await call('frappe.desk.form.load.get_communications', {
      doctype,
      name: docname,
      start: 0,
      limit: 20
    })
    return response?.message || []
  } catch (error) {
    // Silently fail for new documents
    return []
  }
}

// Add comment
export async function addComment(doctype: string, docname: string, comment: string) {
  try {
    const response = await call('frappe.desk.form.utils.add_comment', {
      reference_doctype: doctype,
      reference_name: docname,
      content: comment,
      comment_email: '',
      comment_by: ''
    })
    return response?.message
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

// Get assignments
export async function getAssignments(doctype: string, docname: string) {
  try {
    const response = await call('frappe.desk.form.assign_to.get', {
      dt: doctype,
      dn: docname
    })
    return response?.message || []
  } catch (error) {
    // Silently fail for new documents or unsupported DocTypes
    return []
  }
}

// Add assignment
export async function addAssignment(doctype: string, docname: string, assignTo: string, description?: string) {
  try {
    const response = await call('frappe.desk.form.assign_to.add', {
      assign_to: JSON.stringify([assignTo]),
      doctype,
      name: docname,
      description: description || '',
      priority: 'Medium',
      notify: 1
    })
    return response?.message
  } catch (error) {
    console.error('Error adding assignment:', error)
    throw error
  }
}

// Get tags from docinfo (tags are included in get_docinfo response)
export async function getTags(doctype: string, docname: string) {
  try {
    const docinfo = await getDashboardData(doctype, docname)
    const tagsString = docinfo?.tags || ''
    return tagsString.split(',').filter((t: string) => t.trim()).map((t: string) => t.trim())
  } catch (error) {
    return []
  }
}

// Add tag - use frappe.desk.doctype.tag.tag.add
export async function addTag(doctype: string, docname: string, tag: string) {
  try {
    const response = await call('frappe.desk.doctype.tag.tag.add_tag', {
      dt: doctype,
      dn: docname,
      tag
    })
    return response?.message
  } catch (error) {
    console.error('Error adding tag:', error)
    throw error
  }
}

// Get attachments
export async function getAttachments(doctype: string, docname: string) {
  try {
    const response = await call('frappe.client.get_list', {
      doctype: 'File',
      filters: JSON.stringify({
        attached_to_doctype: doctype,
        attached_to_name: docname
      }),
      fields: JSON.stringify(['name', 'file_name', 'file_url', 'file_size', 'creation']),
      limit_page_length: 10
    })
    return response?.message || []
  } catch (error) {
    // Silently fail for new documents or unsupported DocTypes
    return []
  }
}

