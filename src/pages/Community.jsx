import { useEffect, useState } from 'react'
import { MessageCircle, Send, RefreshCw, Heart, ImagePlus, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../services/supabase'

const LOCAL_KEY = 'vl_community_posts_v2'
const PHOTO_BUCKET = 'community-photos'

export default function Community() {
  const { user, isAdmin } = useAuth()
  const { places } = useApp()
  const [posts, setPosts] = useState([])
  const [placeId, setPlaceId] = useState('')
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState(null)
  const [official, setOfficial] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [replies, setReplies] = useState({})
  const [replyText, setReplyText] = useState({})
  const [replyBusy, setReplyBusy] = useState(null)

  const load = async () => {
    setError('')
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('community_posts')
        .select('id, user_id, place_id, author_name, message, photo_url, created_at, community_post_likes(user_id), community_comments(id,user_id,author_name,message,created_at,community_comment_likes(user_id))')
        .order('created_at', { ascending: false }).limit(100)
      if (error) { setError('Não foi possível carregar a comunidade. Execute o novo SQL no Supabase e confira as políticas de acesso.'); return }
      setPosts(data || [])
    } else {
      try { setPosts(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')) } catch { setPosts([]) }
    }
  }

  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    if (message.trim().length < 3 || !placeId) return
    setBusy(true); setError('')
    const author_name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pessoa da comunidade'
    let photo_url = null
    if (isSupabaseConfigured && photo) {
      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo, { upsert: false, contentType: photo.type })
      if (uploadError) { setError('Não foi possível enviar a foto. Confira o bucket community-photos.'); setBusy(false); return }
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
      photo_url = data.publicUrl
    }
    const payload = { place_id: placeId, author_name, message: message.trim(), photo_url, is_official: Boolean(isAdmin && official) }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('community_posts').insert({ ...payload, user_id: user.id })
      if (error) setError('Não foi possível publicar. Verifique as permissões/RLS.')
      else { setMessage(''); setPhoto(null); e.target.reset() }
    } else {
      const next = [{ ...payload, id: Date.now(), user_id: user?.id, created_at: new Date().toISOString(), community_post_likes: [], community_comments: [] }, ...posts].slice(0, 100)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); setPosts(next); setMessage(''); setPhoto(null); e.target.reset()
    }
    setBusy(false); if (isSupabaseConfigured) load()
  }

  const toggleLike = async post => {
    if (!isSupabaseConfigured) return setError('Curtidas compartilhadas precisam do Supabase configurado.')
    const liked = (post.community_post_likes || []).some(x => x.user_id === user.id)
    const query = supabase.from('community_post_likes')
    const result = liked
      ? await query.delete().eq('post_id', post.id).eq('user_id', user.id)
      : await query.insert({ post_id: post.id, user_id: user.id })
    if (result.error) setError('Não foi possível registrar a curtida.')
    else load()
  }

  const addReply = async (postId, e) => {
    e.preventDefault()
    const value = (replyText[postId] || '').trim()
    if (value.length < 1) return
    setReplyBusy(postId); setError('')
    const author_name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pessoa da comunidade'
    const { error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: user.id, author_name, message: value })
    if (error) setError('Não foi possível responder. Confira a configuração SQL.')
    else { setReplyText(v => ({ ...v, [postId]: '' })); await load() }
    setReplyBusy(null)
  }

  const toggleCommentLike = async comment => {
    const liked = (comment.community_comment_likes || []).some(x => x.user_id === user.id)
    const result = liked
      ? await supabase.from('community_comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id)
      : await supabase.from('community_comment_likes').insert({ comment_id: comment.id, user_id: user.id })
    if (result.error) setError('Não foi possível curtir a resposta.')
    else load()
  }

  const removePost = async post => {
    if (post.user_id !== user?.id || !window.confirm('Excluir esta publicação?')) return
    const { error } = await supabase.from('community_posts').delete().eq('id', post.id)
    if (error) setError('Não foi possível excluir a publicação.')
    else load()
  }

  const nameFor = id => places.find(p => p.id === id)?.name || 'Local removido'
  const likes = post => post.community_post_likes?.length || 0

  return <section className="page community-page">
    <div className="barra"><h1><MessageCircle size={20}/> Comunidade Via Livre</h1><button className="rd" onClick={load} aria-label="Atualizar"><RefreshCw size={16}/></button></div>
    <p className="community-intro">Converse sobre acessibilidade, segurança, caminhos e experiências nos locais. Evite publicar dados pessoais.</p>
    <form className="community-form" onSubmit={submit}>
      <label>Local<select value={placeId} onChange={e=>setPlaceId(e.target.value)} required><option value="">Selecione um local</option>{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Sua mensagem<textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={700} rows={3} placeholder="Como foi sua experiência neste local?" required/></label>
      <label className="community-photo"><ImagePlus size={17}/> Adicionar foto (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0] || null)}/>{photo && <small>{photo.name}</small>}</label>
      {isAdmin && <label className="community-official"><input type="checkbox" checked={official} onChange={e=>setOfficial(e.target.checked)}/> Publicação oficial da administração</label>}
      <button className="btn" disabled={busy || !placeId || message.trim().length<3}><Send size={16}/> {busy?'Publicando…':'Publicar conversa'}</button>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
    <div className="linha"><h3>Conversas recentes</h3><span>{posts.length} publicações</span></div>
    {posts.length===0 ? <p className="aviso">Ainda não há conversas. Seja a primeira pessoa a compartilhar uma dica!</p> : <div className="community-list">{posts.map(post=><article className="community-post" key={post.id}>
      <div className="row"><b>{post.author_name}</b><small>{new Date(post.created_at).toLocaleString('pt-BR')}</small></div>
      <strong>{nameFor(post.place_id)}</strong>{post.is_official && <span className="community-official-tag">Comunicado oficial</span>}<p>{post.message}</p>
      {post.photo_url && <img className="community-post-photo" src={post.photo_url} alt="Foto da publicação" loading="lazy"/>}
      <div className="community-actions">
        <button type="button" onClick={()=>toggleLike(post)} aria-label="Curtir publicação"><Heart size={16}/> {likes(post)} curtidas</button>
        {post.user_id === user?.id && <button type="button" onClick={()=>removePost(post)} aria-label="Excluir publicação"><Trash2 size={15}/> Excluir</button>}
      </div>
      <div className="community-comments">
        {(post.community_comments || []).map(comment=><div className="community-comment" key={comment.id}>
          <div><b>{comment.author_name}</b><small>{new Date(comment.created_at).toLocaleString('pt-BR')}</small></div>
          <p>{comment.message}</p>
          <button type="button" onClick={()=>toggleCommentLike(comment)}><Heart size={14}/> {comment.community_comment_likes?.length || 0}</button>
        </div>)}
        {isSupabaseConfigured && <form className="community-reply" onSubmit={e=>addReply(post.id,e)}>
          <input aria-label="Escreva uma resposta" value={replyText[post.id] || ''} onChange={e=>setReplyText(v=>({...v,[post.id]:e.target.value}))} placeholder="Escreva uma resposta…" maxLength={500}/>
          <button type="submit" disabled={replyBusy===post.id || !(replyText[post.id] || '').trim()}><Send size={15}/></button>
        </form>}
      </div>
    </article>)}</div>}
    {!isSupabaseConfigured && <p className="demo">Modo demonstração: as publicações ficam salvas somente neste navegador. Configure o Supabase para compartilhar, curtir, responder e enviar fotos entre usuários.</p>}
  </section>
}
