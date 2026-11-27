import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle,
  Send,
  RefreshCw,
  Heart,
  ImagePlus,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../services/supabase'

const LOCAL_KEY = 'vl_community_posts_v2'
const PHOTO_BUCKET = 'community-photos'
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PHOTO_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

export default function Community() {
  const { user, isAdmin } = useAuth()
  const { places } = useApp()
  const photoInputRef = useRef(null)

  const [posts, setPosts] = useState([])
  const [placeId, setPlaceId] = useState('')
  const [message, setMessage] = useState('')
  const [photo, setPhoto] = useState(null)
  const [official, setOfficial] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [replyText, setReplyText] = useState({})
  const [replyBusy, setReplyBusy] = useState(null)

  // Carrega as conversas do Supabase ou, em modo demonstração, do navegador.
  const load = async () => {
    if (!isSupabaseConfigured) {
      try {
        setPosts(JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'))
      } catch {
        setPosts([])
      }
      return
    }

    try {
      const { data, error: loadError } = await supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          place_id,
          author_name,
          message,
          photo_url,
          is_official,
          created_at,
          community_post_likes(user_id),
          community_comments(
            id,
            user_id,
            author_name,
            message,
            created_at,
            community_comment_likes(user_id)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (loadError) throw loadError
      setPosts(data || [])
      setError('')
    } catch (loadError) {
      console.error('Erro ao carregar a comunidade:', loadError)
      setError(`Não foi possível carregar a comunidade: ${loadError.message || 'verifique as tabelas e políticas do Supabase.'}`)
    }
  }

  useEffect(() => {
    load()
    // A consulta inicial deve ocorrer apenas quando a página abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Valida a foto antes de guardar o arquivo no estado do componente.
  const handlePhotoChange = event => {
    const selectedFile = event.target.files?.[0] || null
    setError('')

    if (!selectedFile) {
      setPhoto(null)
      return
    }

    if (!ALLOWED_PHOTO_TYPES.includes(selectedFile.type)) {
      setPhoto(null)
      event.target.value = ''
      setError('Escolha uma imagem JPG, PNG ou WEBP.')
      return
    }

    if (selectedFile.size > MAX_PHOTO_SIZE) {
      setPhoto(null)
      event.target.value = ''
      setError('A foto deve ter no máximo 5 MB.')
      return
    }

    setPhoto(selectedFile)
  }

  // Envia a foto, cria a publicação e atualiza a lista.
  const submit = async event => {
    event.preventDefault()

    if (message.trim().length < 3 || !placeId) {
      setError('Selecione um local e escreva uma mensagem com pelo menos 3 caracteres.')
      return
    }

    if (isSupabaseConfigured && !user?.id) {
      setError('Sua sessão não foi encontrada. Entre novamente para publicar.')
      return
    }

    if (photo && !isSupabaseConfigured) {
      setError('O envio de fotos exige a conexão com o Supabase. Configure o Supabase para publicar imagens.')
      return
    }

    setBusy(true)
    setError('')

    const author_name =
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Pessoa da comunidade'

    let photo_url = null
    let uploadedPhotoPath = null

    try {
      if (isSupabaseConfigured && photo) {
        const extension = PHOTO_EXTENSIONS[photo.type]
        const uniqueName = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
        uploadedPhotoPath = `${user.id}/${uniqueName}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(uploadedPhotoPath, photo, {
            cacheControl: '3600',
            upsert: false,
            contentType: photo.type
          })

        if (uploadError) {
          throw new Error(`Falha no envio da foto: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(uploadedPhotoPath)

        photo_url = publicUrlData?.publicUrl || null
        if (!photo_url) throw new Error('O Supabase não retornou o endereço público da foto.')
      }

      const payload = {
        place_id: placeId,
        author_name,
        message: message.trim(),
        photo_url,
        is_official: Boolean(isAdmin && official)
      }

      if (isSupabaseConfigured) {
        const { error: insertError } = await supabase
          .from('community_posts')
          .insert({ ...payload, user_id: user.id })

        if (insertError) {
          // Remove a imagem caso a publicação não seja salva.
          if (uploadedPhotoPath) {
            await supabase.storage.from(PHOTO_BUCKET).remove([uploadedPhotoPath])
          }
          throw new Error(`Falha ao publicar: ${insertError.message}`)
        }

        setMessage('')
        setPlaceId('')
        setPhoto(null)
        setOfficial(false)
        if (photoInputRef.current) photoInputRef.current.value = ''
        await load()
      } else {
        const next = [
          {
            ...payload,
            id: Date.now(),
            user_id: user?.id || null,
            created_at: new Date().toISOString(),
            community_post_likes: [],
            community_comments: []
          },
          ...posts
        ].slice(0, 100)

        localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
        setPosts(next)
        setMessage('')
        setPlaceId('')
        setPhoto(null)
        if (photoInputRef.current) photoInputRef.current.value = ''
      }
    } catch (submitError) {
      console.error('Erro ao publicar na comunidade:', submitError)
      setError(submitError.message || 'Não foi possível publicar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  // Registra ou remove a curtida de uma publicação.
  const toggleLike = async post => {
    if (!isSupabaseConfigured || !user?.id) {
      setError('Entre na sua conta para curtir publicações.')
      return
    }

    const liked = (post.community_post_likes || []).some(item => item.user_id === user.id)
    const query = supabase.from('community_post_likes')
    const result = liked
      ? await query.delete().eq('post_id', post.id).eq('user_id', user.id)
      : await query.insert({ post_id: post.id, user_id: user.id })

    if (result.error) setError(`Não foi possível registrar a curtida: ${result.error.message}`)
    else await load()
  }

  // Envia uma resposta para uma publicação.
  const addReply = async (postId, event) => {
    event.preventDefault()
    const value = (replyText[postId] || '').trim()

    if (!isSupabaseConfigured || !user?.id) {
      setError('Entre na sua conta para responder às publicações.')
      return
    }

    if (!value) return

    setReplyBusy(postId)
    setError('')

    const author_name =
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Pessoa da comunidade'

    try {
      const { error: replyError } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: user.id, author_name, message: value })

      if (replyError) throw replyError
      setReplyText(current => ({ ...current, [postId]: '' }))
      await load()
    } catch (replyError) {
      setError(`Não foi possível responder: ${replyError.message}`)
    } finally {
      setReplyBusy(null)
    }
  }

  // Registra ou remove a curtida de uma resposta.
  const toggleCommentLike = async comment => {
    if (!isSupabaseConfigured || !user?.id) {
      setError('Entre na sua conta para curtir respostas.')
      return
    }

    const liked = (comment.community_comment_likes || []).some(item => item.user_id === user.id)
    const result = liked
      ? await supabase.from('community_comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id)
      : await supabase.from('community_comment_likes').insert({ comment_id: comment.id, user_id: user.id })

    if (result.error) setError(`Não foi possível curtir a resposta: ${result.error.message}`)
    else await load()
  }

  // Exclui somente uma publicação criada pela própria pessoa.
  const removePost = async post => {
    if (post.user_id !== user?.id) return
    if (!window.confirm('Excluir esta publicação?')) return

    if (!isSupabaseConfigured) {
      const next = posts.filter(item => item.id !== post.id)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
      setPosts(next)
      return
    }

    const { error: deleteError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', post.id)

    if (deleteError) setError(`Não foi possível excluir a publicação: ${deleteError.message}`)
    else await load()
  }

  const nameFor = id => places.find(place => String(place.id) === String(id))?.name || 'Local removido'
  const likes = post => post.community_post_likes?.length || 0

  return (
    <section className="page community-page">
      <div className="barra">
        <h1><MessageCircle size={20} /> Comunidade Via Livre</h1>
        <button className="rd" type="button" onClick={load} aria-label="Atualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      <p className="community-intro">
        Converse sobre acessibilidade, segurança, caminhos e experiências nos locais. Evite publicar dados pessoais.
      </p>

      <form className="community-form" onSubmit={submit}>
        <label>
          Local
          <select value={placeId} onChange={event => setPlaceId(event.target.value)} required>
            <option value="">Selecione um local</option>
            {places.map(place => (
              <option key={place.id} value={place.id}>{place.name}</option>
            ))}
          </select>
        </label>

        <label>
          Sua mensagem
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            maxLength={700}
            rows={3}
            placeholder="Como foi sua experiência neste local?"
            required
          />
        </label>

        <div className="community-photo-field">
          <span className="community-photo-title">
            <ImagePlus size={17} /> Adicionar foto (opcional)
          </span>

          <input
            ref={photoInputRef}
            id="community-photo-input"
            className="community-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
          />

          <label className="community-photo-picker" htmlFor="community-photo-input">
            <span className="community-photo-picker-button">
              <Upload size={16} /> Escolher foto
            </span>
            <span className="community-photo-file-name">
              {photo ? photo.name : 'Nenhum arquivo escolhido'}
            </span>
          </label>

          {photo && (
            <button
              className="community-photo-remove"
              type="button"
              onClick={() => {
                setPhoto(null)
                if (photoInputRef.current) photoInputRef.current.value = ''
              }}
            >
              <X size={14} /> Remover foto
            </button>
          )}
          <small className="community-photo-hint">JPG, PNG ou WEBP · até 5 MB</small>
        </div>

        {isAdmin && (
          <label className="community-official">
            <input type="checkbox" checked={official} onChange={event => setOfficial(event.target.checked)} />
            Publicação oficial da administração
          </label>
        )}

        <button className="btn" type="submit" disabled={busy || !placeId || message.trim().length < 3}>
          <Send size={16} /> {busy ? 'Publicando…' : 'Publicar conversa'}
        </button>

        {error && <p className="err" role="alert">{error}</p>}
      </form>

      <div className="linha">
        <h3>Conversas recentes</h3>
        <span>{posts.length} publicações</span>
      </div>

      {posts.length === 0 ? (
        <p className="aviso">Ainda não há conversas. Seja a primeira pessoa a compartilhar uma dica!</p>
      ) : (
        <div className="community-list">
          {posts.map(post => (
            <article className="community-post" key={post.id}>
              <div className="row">
                <b>{post.author_name}</b>
                <small>{new Date(post.created_at).toLocaleString('pt-BR')}</small>
              </div>

              <strong>{nameFor(post.place_id)}</strong>
              {post.is_official && <span className="community-official-tag">Comunicado oficial</span>}
              <p>{post.message}</p>

              {post.photo_url && (
                <img className="community-post-photo" src={post.photo_url} alt="Foto da publicação" loading="lazy" />
              )}

              <div className="community-actions">
                <button type="button" onClick={() => toggleLike(post)} aria-label="Curtir publicação">
                  <Heart size={16} /> {likes(post)} curtidas
                </button>
                {post.user_id === user?.id && (
                  <button type="button" onClick={() => removePost(post)} aria-label="Excluir publicação">
                    <Trash2 size={15} /> Excluir
                  </button>
                )}
              </div>

              <div className="community-comments">
                {(post.community_comments || []).map(comment => (
                  <div className="community-comment" key={comment.id}>
                    <div>
                      <b>{comment.author_name}</b>
                      <small>{new Date(comment.created_at).toLocaleString('pt-BR')}</small>
                    </div>
                    <p>{comment.message}</p>
                    <button type="button" onClick={() => toggleCommentLike(comment)}>
                      <Heart size={14} /> {comment.community_comment_likes?.length || 0}
                    </button>
                  </div>
                ))}

                {isSupabaseConfigured && (
                  <form className="community-reply" onSubmit={event => addReply(post.id, event)}>
                    <input
                      aria-label="Escreva uma resposta"
                      value={replyText[post.id] || ''}
                      onChange={event => setReplyText(current => ({ ...current, [post.id]: event.target.value }))}
                      placeholder="Escreva uma resposta…"
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      disabled={replyBusy === post.id || !(replyText[post.id] || '').trim()}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!isSupabaseConfigured && (
        <p className="demo">
          Modo demonstração: as publicações ficam salvas somente neste navegador. Configure o Supabase para compartilhar,
          curtir, responder e enviar fotos entre usuários.
        </p>
      )}
    </section>
  )
}
