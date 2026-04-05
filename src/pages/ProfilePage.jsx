import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../api'

export default function ProfilePage() {
  const { user, login, token, logout } = useAuth()
  const [posts, setPosts] = useState({ total: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    usersApi.getPosts(user.id, { per_page: 3, sort_by: 'created_at', order: 'desc' })
      .then((res) => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await usersApi.update(user.id, form)
      login(res.data, token) 
      setSuccess('Профіль успішно оновлено!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??'
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <>
      <div className="page-header">
        <h1>Профіль</h1>
        <p>Ваші дані та активність</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
            <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.4rem', margin: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
                {user?.username}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Зареєстрований: {joinDate}
              </div>
              <span className={`badge ${user?.is_active ? 'badge-green' : 'badge-gray'}`} style={{ marginTop: 4 }}>
                {user?.is_active ? 'Активний' : 'Заблокований'}
              </span>
            </div>
          </div>

          {success && <div className="alert alert-success">✅ {success}</div>}
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={set('username')} minLength={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Повне ім'я</label>
              <input className="form-input" value={form.full_name} onChange={set('full_name')} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Збереження...' : '💾 Зберегти зміни'}
              </button>
            </div>
          </form>
        </div>

        {/* Right — stats + recent posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', margin: 0 }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{posts.total}</div>
              <div className="stat-label">Постів</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent2)' }}>#{user?.id}</div>
              <div className="stat-label">ID акаунту</div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>
              Останні пости
            </div>
            {loading ? (
              <div className="loading" style={{ padding: '1rem' }}><span className="spinner" /></div>
            ) : posts.items.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                Постів ще немає
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {posts.items.map((p) => (
                  <div key={p.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className={`badge ${p.published ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                        {p.published ? 'Опубліковано' : 'Чернетка'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token info */}
          <div className="card" style={{ borderColor: 'rgba(108,99,255,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              🔑 Токен авторизації
            </div>
            <div style={{
              background: 'var(--surface2)',
              borderRadius: 6,
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              color: 'var(--muted)',
              wordBreak: 'break-all',
              marginBottom: '0.75rem'
            }}>
              {token ? token.slice(0, 40) + '...' : 'Відсутній'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Токен збережено в localStorage і додається до кожного запиту.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
