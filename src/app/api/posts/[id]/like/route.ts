import { database, requireUser } from '@/server/supabase'
import { setLike } from '@/server/posts'
import { checkOrigin } from '@/server/validation'
import { json, failure } from '@/server/http'
type Context = { params: Promise<{ id: string }> }
async function handle(request: Request, context: Context, liked: boolean) {
 try {
  checkOrigin(request)
  const db = await database()
  const user = await requireUser(db)
  await setLike(db, user.id, (await context.params).id, liked)
  return json({ ok: true })
 } catch (error) { return failure(error) }
}
export async function PUT(request: Request, context: Context) { return handle(request, context, true) }
export async function DELETE(request: Request, context: Context) { return handle(request, context, false) }
