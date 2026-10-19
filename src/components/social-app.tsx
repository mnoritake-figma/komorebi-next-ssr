'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Leaf, House, Search, Heart, UserRound, Plus, ArrowUpRight, RefreshCw, Trash2, Globe, Radio, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import type { Post } from '@/types/social'
type Tab = 'home' | 'search' | 'likes' | 'profile'
const navigation = [{ id: 'home' as Tab, label: 'ホーム', icon: House }, { id: 'search' as Tab, label: '見つける', icon: Search }, { id: 'likes' as Tab, label: 'いいね', icon: Heart }, { id: 'profile' as Tab, label: 'プロフィール', icon: UserRound }]
const titles = { home: 'ホーム', search: '見つける', likes: 'いいね', profile: 'マイプロフィール' }
export default function SocialApp({ initialPosts, initialError }: { initialPosts: Post[]; initialError: string }) {
 const [posts, setPosts] = useState<Post[]>(initialPosts)
 const [tab, setTab] = useState<Tab>('home')
 const [name, setName] = useState('')
 const [text, setText] = useState('')
 const [query, setQuery] = useState('')
 const [busy, setBusy] = useState(false)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState(initialError)
 const [notice, setNotice] = useState('')
 const [pending, setPending] = useState<Set<string>>(new Set())
 const pendingRef = useRef(new Set<string>())
 const publishing = useRef(false)
 const composer = useRef<HTMLTextAreaElement>(null)
 const requestNumber = useRef(0)
 const count = Array.from(text).length
 const filtered = posts.filter(p => (tab !== 'likes' || p.liked) && (tab !== 'profile' || p.mine) && `${p.author} ${p.content}`.toLowerCase().includes(query.toLowerCase()))
 const tags = [...new Set(posts.flatMap(p => p.content.match(/#[^\s#。、！]+/gu) || []))].slice(0, 5)
 const load = useCallback(async () => {
  const number = ++requestNumber.current
  setLoading(true)
  try { const feed = await api.feed(); if (number === requestNumber.current) { setPosts(feed.posts); setError('') } }
  catch (e) { if (number === requestNumber.current) setError(e instanceof Error ? e.message : '読み込みに失敗しました。') }
  finally { if (number === requestNumber.current) setLoading(false) }
 }, [])
 useEffect(() => { void load() }, [load])
 async function publish(event: React.FormEvent) {
  event.preventDefault()
  if (publishing.current || !text.trim() || count > 280) return
  publishing.current = true; setBusy(true); setError('')
  try { await api.publish(name, text); setText(''); setTab('home'); setQuery(''); setNotice('投稿しました。'); await load() }
  catch (e) { setError(e instanceof Error ? e.message : '投稿できませんでした。') }
  finally { publishing.current = false; setBusy(false) }
 }
 async function act(post: Post, action: 'like' | 'remove') {
  if (pendingRef.current.has(post.id)) return
  if (action === 'remove' && !window.confirm('この投稿を削除しますか？')) return
  pendingRef.current.add(post.id); setPending(new Set(pendingRef.current)); setError('')
  try { if (action === 'like') await api.like(post.id, !post.liked); else await api.remove(post.id); await load() }
  catch (e) { setError(e instanceof Error ? e.message : '更新できませんでした。') }
  finally { pendingRef.current.delete(post.id); setPending(new Set(pendingRef.current)) }
 }
 function navigate(next: Tab) { setTab(next); setQuery('') }
 return <div className="layout">
  <aside className="sidebar">
   <a className="brand" href="/" aria-label="komorebi ホーム"><span className="brand-icon"><Radio size={23}/></span>komorebi<span className="brand-dot">/</span></a>
   <p className="tagline">NEXT EDITION — CONNECT YOUR WORLD</p>
   <nav aria-label="メインナビゲーション">{navigation.map(({id,label,icon:Icon}) => <button key={id} aria-label={label} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={21}/><span>{label}</span>{tab===id && <i/>}</button>)}</nav>
   <button className="primary new-post" onClick={()=>{navigate('home'); requestAnimationFrame(()=>composer.current?.focus())}}><Plus size={19}/><span>投稿する</span></button>
   <div className="sidebar-bottom"><div className="connection"><span/>ログイン不要で参加できます</div><button className="account" onClick={()=>navigate('profile')}><span className="avatar mint">{(name || '私').slice(0,1)}</span><span><strong>{name || '散歩人'}</strong><small>今日も、自分のペースで。</small></span></button><div className="stack-badge">NEXT.JS EDITION</div></div>
  </aside>
  <main>
   <header className="page-header"><div><span className="eyebrow">YOUR WORLD, IN REAL TIME</span><h1>{titles[tab]}</h1></div><button className="icon-button" aria-label="タイムラインを更新" disabled={loading} onClick={()=>{setError(''); void load()}}><RefreshCw size={18} className={loading?'spin':''}/></button></header>
   <section className="welcome"><div><span className="eyebrow">A NEW SIGNAL. A NEW CONNECTION.</span><h2>そのひとことが、<br/>世界とつながる。</h2><p>いま感じたことを、自由にシェア。<br/>新しい会話は、あなたから。</p></div><div className="botanical" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="signal-core"><Zap size={34}/></span><span className="botanical-caption">STAY CONNECTED</span></div></section>
   {error && <div className="message error" role="alert">{error}<button onClick={()=>setError('')} aria-label="エラーを閉じる">×</button></div>}
   {notice && <div className="message" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="通知を閉じる">×</button></div>}
   {tab==='home' && <section className="composer"><span className="avatar mint">{(name || '私').slice(0,1)}</span><form onSubmit={publish}><input className="name-input" value={name} onChange={e=>setName(e.target.value)} maxLength={40} aria-label="投稿の表示名" placeholder="あなたの表示名（任意）"/><textarea ref={composer} value={text} onChange={e=>setText(e.target.value)} aria-label="投稿内容" placeholder="いま、どんなことを考えてる？"/><div className="composer-footer"><span><Globe size={13}/>みんなに公開</span><div><small className={count>280?'over':''}>{count} / 280</small><button className="primary" disabled={busy || !text.trim() || count>280} type="submit">{busy?'投稿中…':'投稿する'}<ArrowUpRight size={16}/></button></div></div></form></section>}
   <div className="feed-heading"><h3>{tab==='home'?'タイムライン':titles[tab]}</h3><span>{filtered.length} posts</span></div>
   {tab==='search' && <label className="search-box inline-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="キーワードや #タグで検索" aria-label="投稿を検索"/></label>}
   {loading && <div className="loading-note" role="status">読み込み中…</div>}
   {!loading && !filtered.length && <div className="empty"><Leaf size={30}/><h3>{query?'投稿が見つかりませんでした':'まだ投稿がありません'}</h3><p>{tab==='likes'?'気になった投稿に、ハートを送ってみよう。':'最初のひとことから、はじめてみよう。'}</p></div>}
   {filtered.map((post,index)=><article key={post.id} className="post"><span className={`avatar ${['peach','lavender','mint'][index%3]}`}>{post.author.slice(0,1)}</span><div className="post-body"><div className="post-meta"><strong>{post.author}</strong><span>@{post.userId.slice(0,8)}</span><time dateTime={post.createdAt}>{new Intl.DateTimeFormat('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(post.createdAt))}</time></div><p>{post.content}</p><div className="post-actions"><button className={post.liked?'liked':''} disabled={pending.has(post.id)} aria-pressed={post.liked} aria-label="いいね" onClick={()=>void act(post,'like')}><Heart size={17}/><span>{post.likeCount || 'いいね'}</span></button>{post.mine && <button aria-label="投稿を削除" disabled={pending.has(post.id)} onClick={()=>void act(post,'remove')}><Trash2 size={16}/></button>}</div></div></article>)}
   <footer className="feed-end">ひと息ついて、また会いましょう。<Leaf size={13}/></footer>
  </main>
  <aside className="rightbar"><label className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="気になることを検索" aria-label="タイムラインを検索"/></label><section className="about-card"><span className="tiny-leaf"><Radio size={22}/></span><h3>あなたの「いま」を届けよう。</h3><p>アイデアも、日常の発見も。<br/>気軽に投稿して、<br/>新しい視点と出会おう。</p><span className="small-label">LESS SCROLL. MORE CONNECTION.</span></section><section className="topics"><h3>話題を見つける <span>↗</span></h3>{tags.map(tag=><button key={tag} onClick={()=>{setTab('search');setQuery(tag)}}><span>{tag}</span><small>会話をのぞいてみる</small></button>)}{!tags.length && <p>投稿に #タグ を添えて、<br/>好きなことを共有しよう。</p>}</section><div className="right-footer">やさしい言葉で、心地よい場所に。<br/>© 2026 komorebi</div></aside>
 </div>
}
