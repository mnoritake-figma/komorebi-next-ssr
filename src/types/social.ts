export type Post = { id: string; userId: string; author: string; content: string; createdAt: string; likeCount: number; liked: boolean; mine: boolean }
export type Feed = { posts: Post[]; userId: string | null }
