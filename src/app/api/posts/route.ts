import { database, currentUser, requireUser } from '@/server/supabase'
import { listPosts, createPost } from '@/server/posts'
import { checkOrigin, postInput } from '@/server/validation'
import { json, body, failure } from '@/server/http'
export async function GET() {
 try {
  const db = await database()
  const user = await currentUser(db)
  return json({ posts: await listPosts(db, user?.id || null), userId: user?.id || null })
 } catch (error) { return failure(error) }
}
export async function POST(request: Request) {
 try {
  checkOrigin(request)
  const input = postInput(await body(request))
  const db = await database()
  const user = await requireUser(db)
  return json(await createPost(db, user.id, input), 201)
 } catch (error) { return failure(error) }
}
