import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/users', icon: '👥', label: 'Користувачі' },
  { to: '/posts', icon: '📝', label: 'Пости' },
  { to: '/profile', icon: '⚙️', label: 'Профіль' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">◈ Lab3 App</div>

        <nav className="nav-links">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', margin: 0 }}>
              {initials}
            </div>
            <div>
              <div className="user-name" style={{ fontSize: '0.85rem' }}>{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            🚪 Вийти
          </button>
        </div>
      </aside>

      <main className="main-content fade-in">
        <Outlet />
      </main>
    </div>
  )
}
