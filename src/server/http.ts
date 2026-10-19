import 'server-only'
import { ApiError } from './validation'
export function json(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } }) }
export async function body(request: Request) {
 if (!request.headers.get('content-type')?.includes('application/json')) throw new ApiError(415, 'JSON形式で送信してください。')
 const text = await request.text()
 if (text.length > 12000) throw new ApiError(413, '送信内容が大きすぎます。')
 try { return JSON.parse(text) as unknown } catch { throw new ApiError(400, 'JSON形式が不正です。') }
}
export function failure(error: unknown) {
 if (error instanceof ApiError) return json({ error: error.message }, error.status)
 console.error('API request failed', error instanceof Error ? error.message : 'Database request failed')
 return json({ error: '処理に失敗しました。時間をおいて再度お試しください。' }, 500)
}
