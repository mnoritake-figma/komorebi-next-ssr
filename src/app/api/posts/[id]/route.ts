import { database, requireUser } from '@/server/supabase'
import { deletePost } from '@/server/posts'
import { checkOrigin } from '@/server/validation'
import { json, failure } from '@/server/http'
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
 try {
  checkOrigin(request)
  const db = await database()
  const user = await requireUser(db)
  await deletePost(db, user.id, (await context.params).id)
  return json({ ok: true })
 } catch (error) { return failure(error) }
}
