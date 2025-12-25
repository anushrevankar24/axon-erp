import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard (now exists at /dashboard)
  redirect('/dashboard')
}
