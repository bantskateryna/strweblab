import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../api'

export default function LoginPage() {
  const { login } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim()) return setError('Введіть username')

    setLoading(true)
    try {
      const res = await usersApi.list({ search: form.username, per_page: 10 })
      const found = res.data.items.find(
        (u) => u.username.toLowerCase() === form.username.toLowerCase()
      )
      if (!found) {
        setError('Користувача не знайдено. Спробуйте зареєструватися.')
        return
      }
      const token = btoa(`${found.id}:${found.username}:${Date.now()}`)
      login(found, token)
    } catch (err) {
      setError('Помилка підключення до сервера. Перевірте, чи запущений API.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.email.trim()) {
      return setError("Заповніть обов'язкові поля")
    }

    setLoading(true)
    try {
      const res = await usersApi.create({
        username: form.username,
        email: form.email,
        full_name: form.full_name || undefined,
      })
      const user = res.data
      const token = btoa(`${user.id}:${user.username}:${Date.now()}`)
      login(user, token)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-title">
          {mode === 'login' ? 'Вхід' : 'Реєстрація'}
        </div>
        <div className="auth-subtitle">
          {mode === 'login'
            ? 'Введіть свій username для входу'
            : 'Створіть новий акаунт'}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              className="form-input"
              placeholder="john_doe"
              value={form.username}
              onChange={set('username')}
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Повне ім'я</label>
                <input
                  className="form-input"
                  placeholder="Іван Петренко"
                  value={form.full_name}
                  onChange={set('full_name')}
                />
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Зачекайте...</>
            ) : mode === 'login' ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          {mode === 'login' ? 'Немає акаунту?' : 'Вже є акаунт?'}
          {' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
          >
            {mode === 'login' ? 'Зареєструватися' : 'Увійти'}
          </button>
        </div>
      </div>
    </div>
  )
}
