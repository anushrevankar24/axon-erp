import { redirect } from 'next/navigation'

export default function Home() {
  // ERPNext pattern: / → /app/home
  redirect('/app/home')
}
