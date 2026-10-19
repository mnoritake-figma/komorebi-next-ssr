import type { Feed } from '@/types/social'
async function request<T>(path: string, options?: RequestInit): Promise<T> {
 const response = await fetch(`/api${path}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options?.headers } })
 const data = await response.json()
 if (!response.ok) throw new Error(data.error || '通信に失敗しました。')
 return data as T
}
// Serialize first-session creation so simultaneous interactions cannot create different guests.
let sessionRequest: Promise<unknown> | null = null
async function ensureSession() {
 if (!sessionRequest) sessionRequest = request('/session', { method: 'POST' }).finally(() => { sessionRequest = null })
 await sessionRequest
}
export const api = {
 feed: () => request<Feed>('/posts'),
 async publish(author: string, content: string) { await ensureSession(); return request('/posts', { method: 'POST', body: JSON.stringify({ author, content }) }) },
 async like(id: string, liked: boolean) { await ensureSession(); return request(`/posts/${id}/like`, { method: liked ? 'PUT' : 'DELETE' }) },
 remove: (id: string) => request(`/posts/${id}`, { method: 'DELETE' })
}
