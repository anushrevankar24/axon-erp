import {
  Home, Building2, DollarSign, ShoppingCart, Package,
  Factory, ClipboardCheck, FolderKanban, Headphones,
  Users, Globe, Settings, Boxes, Link2, Calendar,
  FileText, BarChart3, Calculator, CreditCard, Wallet,
  TrendingUp, PieChart, Briefcase, Mail, Phone,
  Wrench, BookOpen, Award, Shield, type LucideIcon
} from 'lucide-react'

// Maps ERPNext icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  // Primary modules
  'home': Home,
  'accounting': Calculator,
  'accounts': Calculator,
  'stock': Package,
  'buying': ShoppingCart,
  'selling': TrendingUp,
  'manufacturing': Factory,
  'quality': ClipboardCheck,
  'projects': FolderKanban,
  'support': Headphones,
  'users': Users,
  'website': Globe,
  'tools': Wrench,
  'crm': Briefcase,
  'assets': Boxes,
  'integrations': Link2,
  
  // Common entities
  'company': Building2,
  'building': Building2,
  'calendar': Calendar,
  'reports': BarChart3,
  'chart': PieChart,
  'money': DollarSign,
  'invoice': FileText,
  'payment': CreditCard,
  'wallet': Wallet,
  'email': Mail,
  'phone': Phone,
  'education': BookOpen,
  'quality-management': Award,
  'security': Shield,
  
  // Fallback
  'default': FileText,
}

export function getWorkspaceIcon(iconName: string): LucideIcon {
  const normalizedName = iconName?.toLowerCase().trim() || ''
  return iconMap[normalizedName] || iconMap['default']
}

