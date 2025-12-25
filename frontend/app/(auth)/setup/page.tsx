'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSetupStages, useProcessSetup } from '@/lib/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const setupSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_abbr: z.string().min(2, 'Company abbreviation is required').max(5, 'Max 5 characters'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  fy_start_date: z.string().min(1, 'Fiscal year start date is required'),
  fy_end_date: z.string().min(1, 'Fiscal year end date is required'),
  domain: z.string().optional(),
  chart_of_accounts: z.string().optional(),
})

type SetupFormData = z.infer<typeof setupSchema>

const countries = [
  'United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE'
]

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
]

export default function SetupWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const { data: stages } = useSetupStages()
  const processSetup = useProcessSetup()
  
  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      company_name: '',
      company_abbr: '',
      country: 'United States',
      currency: 'USD',
      fy_start_date: new Date().getFullYear() + '-01-01',
      fy_end_date: new Date().getFullYear() + '-12-31',
      domain: 'Manufacturing',
      chart_of_accounts: 'Standard',
    }
  })
  
  const onSubmit = async (data: SetupFormData) => {
    try {
      toast.info('Setting up your company...')
      
      await processSetup.mutateAsync({
        stages: stages || [],
        user_input: data
      })
      
      toast.success('Setup completed successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Setup failed:', error)
      toast.error(error.message || 'Setup failed. Please try again.')
    }
  }
  
  const steps = [
    { title: 'Organization', description: 'Basic company information' },
    { title: 'Company Details', description: 'Fiscal year and currency' },
  ]
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Setup Your Company</CardTitle>
          <CardDescription>
            Complete the setup to start using Axon ERP
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  idx <= step ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
                }`}>
                  {idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    idx < step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Organization Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company_abbr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Abbreviation</FormLabel>
                        <FormControl>
                          <Input placeholder="ACME" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setStep(1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Company Details</h3>
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fy_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year Start</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fy_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year End</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={processSetup.isPending}>
                      {processSetup.isPending ? 'Setting up...' : 'Complete Setup'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

