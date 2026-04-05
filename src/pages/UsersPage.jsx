import { useState, useEffect, useCallback } from 'react'
import { usersApi } from '../api'

function UserModal({ user, onClose, onSaved }) {
  const editing = Boolean(user?.id)
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await usersApi.update(user.id, form)
      } else {
        await usersApi.create(form)
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
      <div className="modal">
        <h2>{editing ? 'Редагувати' : 'Новий'} користувач</h2>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-input" value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Повне ім'я</label>
            <input className="form-input" value={form.full_name} onChange={set('full_name')} />
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

export default function UsersPage() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) 
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await usersApi.list({ page, per_page: 9, search: search || undefined })
      setData(res.data)
    } catch {
      setError('Не вдалося завантажити користувачів')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => { setPage(1) }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Видалити користувача?')) return
    try {
      await usersApi.delete(id)
      fetchUsers()
    } catch {
      alert('Помилка при видаленні')
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Користувачі</h1>
        <p>Управління акаунтами</p>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="🔍 Пошук за username або email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-spacer" />
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          + Додати
        </button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading"><span className="spinner" /> Завантаження...</div>
      ) : data.items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <p>Користувачів не знайдено</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {data.items.map((u) => (
            <div key={u.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                <div className="user-avatar">
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="user-name">{u.username}</div>
                  <div className="user-email">{u.email}</div>
                </div>
              </div>
              {u.full_name && <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{u.full_name}</div>}
              <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                {u.is_active ? 'Активний' : 'Неактивний'}
              </span>
              <div className="card-actions">
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                  onClick={() => setModal(u)}>✏️ Редагувати</button>
                <button className="btn btn-danger" style={{ fontSize: '0.8rem' }}
                  onClick={() => handleDelete(u.id)}>🗑️</button>
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
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchUsers() }}
        />
      )}
    </>
  )
}
