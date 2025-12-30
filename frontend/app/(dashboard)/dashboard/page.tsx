import { redirect } from 'next/navigation'

export default function LegacyDashboardPage() {
  // Redirect to ERPNext-style home
  redirect('/app/home')
}

/*
// Legacy dashboard content - now at /app/home
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocList } from '@/lib/api/hooks'
import { TrendingUp, Users, ShoppingCart, Package } from 'lucide-react'

export default function DashboardPage() {
  const { data: salesInvoices } = useDocList('Sales Invoice', { docstatus: 1 })
  const { data: customers } = useDocList('Customer')
  const { data: items } = useDocList('Item')
  const { data: salesOrders } = useDocList('Sales Order')
  
  const stats = [
    {
      title: 'Total Customers',
      value: customers?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Sales Orders',
      value: salesOrders?.length || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Sales Invoices',
      value: salesInvoices?.length || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Items',
      value: items?.length || 0,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Axon ERP</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {salesInvoices && salesInvoices.length > 0 ? (
              <div className="space-y-2">
                {salesInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.name} className="flex justify-between items-center p-2 hover:bg-accent rounded">
                    <span className="font-medium">{invoice.name}</span>
                    <span className="text-sm text-muted-foreground">{invoice.customer}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No invoices yet</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {salesOrders && salesOrders.length > 0 ? (
              <div className="space-y-2">
                {salesOrders.slice(0, 5).map((order: any) => (
                  <div key={order.name} className="flex justify-between items-center p-2 hover:bg-accent rounded">
                    <span className="font-medium">{order.name}</span>
                    <span className="text-sm text-muted-foreground">{order.customer}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

*/
