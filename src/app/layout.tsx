import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'komorebi — Next.js', description: '日々を、ひとこと。ログイン不要の小さなSNS。' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html> }
