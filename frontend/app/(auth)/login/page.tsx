'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { auth } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('[Login] Attempting login...')
      await auth.loginWithUsernamePassword({
        username,
        password
      })
      
      console.log('[Login] Login successful, fetching CSRF token and boot info...')
      
      // Fetch CSRF token after login
      try {
        const response = await fetch('/api/method/axon_erp.api.get_csrf_token', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const csrfToken = data.message?.csrf_token
          
          if (csrfToken) {
            // Store CSRF token in cookie for later use
            document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Lax`
            console.log('[Login] CSRF token fetched and stored')
          }
        }
      } catch (csrfError) {
        console.warn('[Login] Could not fetch CSRF token:', csrfError)
        // Continue anyway - CSRF might be disabled
      }
      
      toast.success('Login successful!')
      
      // Invalidate boot query to trigger fetch now that user is logged in
      queryClient.invalidateQueries({ queryKey: ['boot'] })
      
      // Small delay to ensure CSRF token is set before navigation
      setTimeout(() => {
        router.push('/')
      }, 100)
    } catch (error: any) {
      console.error('[Login] Login failed:', error)
      toast.error(error.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to Axon ERP</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

