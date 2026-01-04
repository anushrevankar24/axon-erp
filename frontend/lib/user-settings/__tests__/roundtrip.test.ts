/**
 * User Settings Round-Trip Parity Tests
 * 
 * Ensures our parse/serialize matches Desk behavior exactly.
 * Uses real user_settings blobs captured from Desk sessions.
 */

import { parseUserSettings, serializeUserSettings } from '../normalize'
import type { UserSettings } from '../schema'

// ============================================================================
// Golden test data (captured from real Desk sessions)
// ============================================================================

const DESK_ITEM_SETTINGS = `{
  "Form": {
    "collapsed_sections": {
      "section_break_11": true,
      "inventory_section": false
    },
    "active_tab": "inventory_section"
  },
  "GridView": {
    "Item Default": [
      {"fieldname": "company", "columns": 2},
      {"fieldname": "default_warehouse", "columns": 3}
    ]
  }
}`

const DESK_SALES_ORDER_LIST_SETTINGS = `{
  "List": {
    "filters": [
      ["Sales Order", "status", "=", "Draft"],
      ["Sales Order", "customer", "like", "%John%"]
    ],
    "order_by": "modified desc",
    "fields": ["name", "customer", "grand_total", "status"],
    "page_length": 50,
    "last_view": "List"
  }
}`

const DESK_PROJECT_KANBAN_SETTINGS = `{
  "Kanban": {
    "filters": [
      ["Project", "status", "!=", "Completed"]
    ],
    "kanban_column_field": "status",
    "kanban_fields": ["project_name", "expected_end_date"]
  }
}`

// ============================================================================
// Tests
// ============================================================================

/**
 * Test: parse and re-serialize should produce identical structure
 */
export function testRoundTrip() {
  const tests = [
    { name: 'Item Form + Grid', input: DESK_ITEM_SETTINGS },
    { name: 'Sales Order List', input: DESK_SALES_ORDER_LIST_SETTINGS },
    { name: 'Project Kanban', input: DESK_PROJECT_KANBAN_SETTINGS }
  ]
  
  for (const test of tests) {
    console.log(`[RoundTrip Test] ${test.name}`)
    
    // Parse
    const parsed = parseUserSettings(test.input)
    
    // Serialize back
    const serialized = serializeUserSettings(parsed)
    const reparsed = JSON.parse(serialized)
    const original = JSON.parse(test.input)
    
    // Compare (deep equality)
    const matches = JSON.stringify(reparsed) === JSON.stringify(original)
    
    if (matches) {
      console.log(`  ✅ PASS: Round-trip successful`)
    } else {
      console.error(`  ❌ FAIL: Round-trip mismatch`)
      console.error('  Original:', original)
      console.error('  Round-tripped:', reparsed)
    }
  }
}

/**
 * Test: empty/null/corrupt inputs should not crash
 */
export function testEdgeCases() {
  const edgeCases = [
    { name: 'null', input: null, expected: {} },
    { name: 'undefined', input: undefined, expected: {} },
    { name: 'empty string', input: '', expected: {} },
    { name: 'invalid JSON', input: '{invalid', expected: {} },
    { name: 'empty object', input: {}, expected: {} }
  ]
  
  console.log('[Edge Case Tests]')
  
  for (const test of edgeCases) {
    try {
      const result = parseUserSettings(test.input)
      const matches = JSON.stringify(result) === JSON.stringify(test.expected)
      
      if (matches) {
        console.log(`  ✅ ${test.name}: handled correctly`)
      } else {
        console.error(`  ❌ ${test.name}: unexpected result`, result)
      }
    } catch (error) {
      console.error(`  ❌ ${test.name}: threw error`, error)
    }
  }
}

/**
 * Run all parity tests
 * Can be called from browser console or integration test
 */
export function runAllParityTests() {
  console.log('='.repeat(60))
  console.log('User Settings Parity Tests')
  console.log('='.repeat(60))
  
  testRoundTrip()
  console.log('')
  testEdgeCases()
  
  console.log('='.repeat(60))
}

// Auto-run in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose to window for manual testing
  ;(window as any).testUserSettingsParity = runAllParityTests
}


