import 'server-only'
import type { Database } from './supabase'
import { ApiError, postId, postInput } from './validation'
import type { Post } from '@/types/social'
export async function listPosts(db: Database, userId: string | null): Promise<Post[]> {
 const { data, error } = await db.from('posts').select('id, user_id, author, content, created_at, likes(user_id)').order('created_at', { ascending: false }).limit(100)
 if (error) throw error
 return (data || []).map(p => ({ id: p.id, userId: p.user_id, author: p.author, content: p.content, createdAt: p.created_at, likeCount: p.likes.length, liked: p.likes.some(l => l.user_id === userId), mine: p.user_id === userId }))
}
export async function createPost(db: Database, userId: string, input: unknown) {
 const values = postInput(input)
 const { data, error } = await db.from('posts').insert({ ...values, user_id: userId }).select('id').single()
 if (error) throw error
 return data
}
export async function deletePost(db: Database, userId: string, id: string) {
 const { data, error } = await db.from('posts').delete().eq('id', postId(id)).eq('user_id', userId).select('id')
 if (error) throw error
 if (!data?.length) throw new ApiError(404, '削除できる投稿が見つかりません。')
}
export async function setLike(db: Database, userId: string, id: string, liked: boolean) {
 postId(id)
 const { data: post, error: lookupError } = await db.from('posts').select('id').eq('id', id).maybeSingle()
 if (lookupError) throw lookupError
 if (!post) throw new ApiError(404, '投稿が見つかりません。')
 const { error } = liked
  ? await db.from('likes').insert({ post_id: id, user_id: userId })
  : await db.from('likes').delete().eq('post_id', id).eq('user_id', userId)
 if (error && !(liked && error.code === '23505')) throw error
}
