import { useEffect, useState } from 'react'
import type { Post, PostInput, PostLang } from '@/lib/types'
import { dashboardApi } from './api'

const emptyForm: PostInput = {
  slug: '',
  lang: 'es',
  title: '',
  excerpt: '',
  body: '',
  published: false,
}

function slugify (value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PostsPanel ({ onStatus }: { onStatus: (message: string, ok?: boolean) => void }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [form, setForm] = useState<PostInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load () {
    setLoading(true)
    try {
      const { posts: next } = await dashboardApi.listPosts()
      setPosts(next)
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'No se pudieron cargar los posts', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function startEdit (post: Post) {
    setEditingId(post.id)
    setForm({
      slug: post.slug,
      lang: post.lang,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      published: post.published,
      published_at: post.published_at,
    })
  }

  function resetForm () {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function onSubmit (event: { preventDefault: () => void }) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload: PostInput = {
        ...form,
        slug: form.slug || slugify(form.title),
      }
      if (editingId) {
        await dashboardApi.updatePost(editingId, payload)
        onStatus('Post actualizado')
      } else {
        await dashboardApi.createPost(payload)
        onStatus('Post creado')
      }
      resetForm()
      await load()
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Error al guardar', false)
    } finally {
      setSaving(false)
    }
  }

  async function onDelete (id: string) {
    if (!confirm('¿Borrar este post?')) return
    try {
      await dashboardApi.deletePost(id)
      onStatus('Post borrado')
      if (editingId === id) resetForm()
      await load()
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Error al borrar', false)
    }
  }

  return (
    <div className='panel-grid'>
      <form className='card form' onSubmit={onSubmit}>
        <h2>{editingId ? 'Editar post' : 'Nuevo post'}</h2>
        <label>
          Título
          <input
            value={form.title}
            onChange={(e) => {
              const title = e.target.value
              setForm((prev) => ({
                ...prev,
                title,
                slug: editingId ? prev.slug : slugify(title),
              }))
            }}
            required
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
            required
          />
        </label>
        <label>
          Idioma
          <select
            value={form.lang}
            onChange={(e) => setForm((prev) => ({ ...prev, lang: e.target.value as PostLang }))}
          >
            <option value='es'>Español</option>
            <option value='en'>English</option>
          </select>
        </label>
        <label>
          Extracto
          <textarea
            rows={2}
            value={form.excerpt ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
          />
        </label>
        <label>
          Cuerpo (Markdown)
          <textarea
            rows={12}
            value={form.body ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            required
          />
        </label>
        <label className='checkbox'>
          <input
            type='checkbox'
            checked={Boolean(form.published)}
            onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
          />
          Publicado
        </label>
        <div className='actions'>
          <button type='submit' disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          {editingId && (
            <button type='button' className='ghost' onClick={resetForm}>Cancelar</button>
          )}
        </div>
      </form>

      <div className='card list'>
        <h2>Posts ({posts.length})</h2>
        {loading
          ? <p className='muted'>Cargando…</p>
          : posts.length === 0
            ? <p className='muted'>Aún no hay posts.</p>
            : (
              <ul>
                {posts.map((post) => (
                  <li key={post.id}>
                    <div>
                      <strong>{post.title}</strong>
                      <span className='muted'>
                        {post.lang} · /{post.slug} · {post.published ? 'publicado' : 'borrador'}
                      </span>
                    </div>
                    <div className='row-actions'>
                      <button type='button' className='ghost' onClick={() => startEdit(post)}>Editar</button>
                      <button type='button' className='danger' onClick={() => void onDelete(post.id)}>Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
              )}
      </div>
    </div>
  )
}
