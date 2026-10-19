import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, postInput, postId, checkOrigin } from './validation'
test('normalizes content and ignores a client-supplied owner', () => {
 assert.deepEqual(postInput({ content: ' hello ', author: ' ', user_id: 'forged' }), { author: '名もなき散歩人', content: 'hello' })
})
test('counts emoji as Unicode code points at the database boundary', () => {
 assert.equal(Array.from(postInput({content:'🌱'.repeat(280)}).content).length, 280)
 assert.throws(()=>postInput({content:'🌱'.repeat(281)}), ApiError)
})
test('rejects empty, malformed, or oversized content and names', () => {
 for(const input of [null, {}, {content:' \n '}, {content:42}, {content:'ok',author:42}, {content:'ok',author:'a'.repeat(41)}]) assert.throws(()=>postInput(input), ApiError)
})
test('accepts UUIDs only', () => {
 assert.equal(postId('12345678-1234-1234-1234-123456789abc'),'12345678-1234-1234-1234-123456789abc')
 assert.throws(()=>postId('../posts'), ApiError)
})
test('blocks missing and foreign origins on cookie-authenticated mutations', () => {
 checkOrigin(new Request('http://127.0.0.1:3002/api/posts',{headers:{origin:'http://127.0.0.1:3002'}}))
 for(const origin of ['', 'https://foreign.example']) assert.throws(()=>checkOrigin(new Request('http://127.0.0.1:3002/api/posts',{headers:{origin}})), ApiError)
})

test('uses the original Host when Next normalizes the internal URL', () => {
 checkOrigin(new Request('http://localhost:3002/api/posts', {headers:{host:'127.0.0.1:3002',origin:'http://127.0.0.1:3002'}}))
 assert.throws(()=>checkOrigin(new Request('http://localhost:3002/api/posts', {headers:{host:'127.0.0.1:3002',origin:'https://foreign.example'}})), ApiError)
})
