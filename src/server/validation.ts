export class ApiError extends Error {
 constructor(public status: number, message: string) { super(message) }
}
export function postInput(value: unknown) {
 if (!value || typeof value !== 'object') throw new ApiError(400, '投稿内容が不正です。')
 const data = value as Record<string, unknown>
 if (typeof data.content !== 'string') throw new ApiError(400, '本文を入力してください。')
 const content = data.content.trim()
 if (!content || Array.from(content).length > 280) throw new ApiError(400, '本文は1〜280文字で入力してください。')
 if (data.author !== undefined && typeof data.author !== 'string') throw new ApiError(400, '表示名が不正です。')
 const author = (data.author as string | undefined)?.trim() || '名もなき散歩人'
 if (Array.from(author).length > 40) throw new ApiError(400, '表示名は40文字以内にしてください。')
 return { author, content }
}
export function postId(id: string) {
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ApiError(400, '投稿IDが不正です。')
 return id
}
export function checkOrigin(request: Request) {
 const url = new URL(request.url)
 const origin = request.headers.get('origin')
 // Next.js can normalize the internal URL hostname; Host is the browser-facing authority.
 const host = request.headers.get('host') || url.host
 if (!origin || origin !== `${url.protocol}//${host}`) throw new ApiError(403, 'この操作はアプリから実行してください。')
}
