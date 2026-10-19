import { database, currentUser } from '@/server/supabase'
import { checkOrigin, ApiError } from '@/server/validation'
import { json, failure } from '@/server/http'
export async function POST(request: Request) {
 try {
  checkOrigin(request)
  const db = await database()
  const existing = await currentUser(db)
  if (existing) return json({ userId: existing.id })
  const { data, error } = await db.auth.signInAnonymously()
  if (error) throw new ApiError(error.status === 429 ? 429 : 503, error.code === 'anonymous_provider_disabled' ? 'Supabaseで匿名サインインを有効にしてください。' : '匿名セッションを開始できませんでした。少し待って再度お試しください。')
  return json({ userId: data.user!.id })
 } catch (error) { return failure(error) }
}
