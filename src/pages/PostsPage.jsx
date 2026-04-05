import { useState, useEffect, useCallback } from 'react'
import { postsApi, usersApi } from '../api'
import { useAuth } from '../context/AuthContext'

function PostModal({ post, currentUser, onClose, onSaved }) {
  const editing = Boolean(post?.id)
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    published: post?.published ?? false,
    author_id: post?.author_id || currentUser?.id || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, author_id: Number(form.author_id) }
      if (editing) {
        await postsApi.update(post.id, { title: form.title, content: form.content, published: form.published })
      } else {
        await postsApi.create(payload)
      }
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Сталася помилка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <h2>{editing ? 'Редагувати пост' : 'Новий пост'}</h2>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Заголовок *</label>
            <input className="form-input" value={form.title} onChange={set('title')} required minLength={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Зміст *</label>
            <textarea className="form-input" value={form.content} onChange={set('content')} required minLength={10} rows={5} />
          </div>
          {!editing && (
            <div className="form-group">
              <label className="form-label">ID Автора *</label>
              <input className="form-input" type="number" value={form.author_id} onChange={set('author_id')} required />
            </div>
          )}
          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" className="toggle-input" checked={form.published}
                onChange={(e) => setForm(f => ({ ...f, published: e.target.checked }))} />
              <span className="toggle-track" />
              Опубліковано
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Скасувати</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PostsPage() {
  const { user } = useAuth()
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        per_page: 6,
        search: search || undefined,
        published: filter === 'all' ? undefined : filter === 'published',
        sort_by: 'created_at',
        order: 'desc',
      }
      const res = await postsApi.list(params)
      setData(res.data)
    } catch {
      setError('Не вдалося завантажити пости')
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { setPage(1) }, [search, filter])

  const handleDelete = async (id) => {
    if (!confirm('Видалити пост?')) return
    try {
      await postsApi.delete(id)
      fetchPosts()
    } catch {
      alert('Помилка при видаленні')
    }
  }

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      <div className="page-header">
        <h1>Пости</h1>
        <p>Всі публікації платформи</p>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍 Пошук за заголовком..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'published', 'draft'].map((f) => (
            <button
              key={f}
              className={`page-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {{ all: 'Всі', published: '✅ Опубліковані', draft: '📝 Чернетки' }[f]}
            </button>
          ))}
        </div>
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Новий пост</button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" /> Завантаження...</div>
      ) : data.items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>Постів не знайдено</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {data.items.map((post) => (
            <div key={post.id} className="card">
              <div className="post-meta">
                <span className={`badge ${post.published ? 'badge-green' : 'badge-gray'}`}>
                  {post.published ? 'Опубліковано' : 'Чернетка'}
                </span>
                <span>👤 ID {post.author_id}</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="post-title">{post.title}</div>
              <div className="post-content">{post.content}</div>
              <div className="card-actions">
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                  onClick={() => setModal(post)}>✏️ Редагувати</button>
                <button className="btn btn-danger" style={{ fontSize: '0.8rem' }}
                  onClick={() => handleDelete(post.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Далі →</button>
          <span className="page-info">Всього: {data.total}</span>
        </div>
      )}

      {modal && (
        <PostModal
          post={modal === 'create' ? null : modal}
          currentUser={user}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchPosts() }}
        />
      )}
    </>
  )
}
