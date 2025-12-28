/**
 * Design System Constants
 * Single source of truth for spacing, typography, and styling
 * Applied consistently across all views (workspace, list, form)
 */

export const SPACING = {
  // Container padding
  containerPadding: 'p-3',      // Was: p-4, p-6 (inconsistent)
  containerPaddingX: 'px-4',
  containerPaddingY: 'py-3',
  
  // Gaps between elements
  sectionGap: 'gap-3',          // Was: gap-4, gap-6
  fieldGap: 'gap-2',            // Was: gap-3, gap-4
  elementGap: 'gap-1.5',        // Was: gap-2
  
  // Vertical spacing
  sectionSpacing: 'space-y-3',  // Was: space-y-6
  fieldSpacing: 'space-y-2',    // Was: space-y-4
  elementSpacing: 'space-y-1.5', // Was: space-y-2
} as const

export const TYPOGRAPHY = {
  // Headers
  pageTitle: 'text-2xl font-bold text-gray-900',
  sectionHeader: 'text-sm font-semibold text-gray-700',
  cardTitle: 'text-sm font-medium text-gray-700',
  
  // Labels
  fieldLabel: 'text-xs font-medium text-gray-600',
  filterLabel: 'text-xs font-medium text-gray-600',
  
  // Body text
  body: 'text-sm text-gray-900',
  bodyMuted: 'text-sm text-gray-600',
  
  // Small text
  caption: 'text-xs text-gray-500',
  helper: 'text-[11px] text-gray-500',
} as const

export const COMPONENTS = {
  // Input heights
  inputHeight: 'h-8',           // Was: h-9, h-10 (inconsistent)
  buttonHeight: 'h-8',
  selectHeight: 'h-8',
  
  // Borders
  border: 'border border-gray-200',
  borderRadius: 'rounded-md',   // Was: rounded-lg, rounded-xl
  
  // Backgrounds
  cardBg: 'bg-white',
  pageBg: 'bg-gray-50',
  sidebarBg: 'bg-white',
  
  // Shadows (minimal)
  cardShadow: '',               // Removed shadow-sm
  hoverShadow: 'hover:shadow-sm',
} as const

export const SIDEBAR = {
  workspace: {
    width: 'w-64',              // 256px
    bg: 'bg-white',
  },
  filter: {
    width: 'w-56',              // 224px
    bg: 'bg-white',
  }
} as const

