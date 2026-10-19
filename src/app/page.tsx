import SocialApp from '@/components/social-app'
import { publicDatabase } from '@/server/supabase'
import { listPosts } from '@/server/posts'
import type { Post } from '@/types/social'

// Fetch the public feed for every request, not during static generation.
export const dynamic = 'force-dynamic'
export default async function Page() {
 let posts: Post[] = []
 let error = ''
 try { posts = await listPosts(publicDatabase(), null) }
 catch { error = '投稿を読み込めませんでした。更新ボタンで再試行してください。' }
 return <SocialApp initialPosts={posts} initialError={error}/>
}
