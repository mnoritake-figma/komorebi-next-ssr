import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ApiError } from './validation'

// Only Route Handlers use this client. Cookie updates (including refresh) stay on the server.
export async function database() {
 const url = process.env.SUPABASE_URL
 const key = process.env.SUPABASE_PUBLISHABLE_KEY
 if (!url || !key) throw new ApiError(503, 'Supabaseの環境変数を設定してください。')
 const jar = await cookies()
 return createServerClient(url, key, {
  cookieOptions: { name: 'komorebi-next-session', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
  cookies: {
   getAll: () => jar.getAll(),
   setAll: items => { items.forEach(({ name, value, options }) => jar.set(name, value, options)) }
  }
 })
}
export type Database = Awaited<ReturnType<typeof database>>
export async function currentUser(db: Database) {
 const { data, error } = await db.auth.getUser()
 if (error) {
  if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403 || error.code === 'refresh_token_not_found') return null
  throw new ApiError(503, 'セッションの確認に失敗しました。もう一度お試しください。')
 }
 return data.user
}
export async function requireUser(db: Database) {
 const user = await currentUser(db)
 if (!user) throw new ApiError(401, 'セッションが切れました。再読み込みしてください。')
 return user
}

// SSR renders public posts without changing session cookies. The API later personalizes the feed.
export function publicDatabase() {
 const url = process.env.SUPABASE_URL
 const key = process.env.SUPABASE_PUBLISHABLE_KEY
 if (!url || !key) throw new ApiError(503, 'Supabaseの環境変数を設定してください。')
 return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } })
}
