import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/AppContext'

export default function Navbar() {
  const { user, logout, isOwner } = useAuth()
  const { setIsOpen } = useChat()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${isActive ? 'text-brand-500' : 'text-surface-800 hover:text-brand-500'}`

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display font-bold text-2xl text-brand-500 leading-none">yelp</span>
          <span className="text-xs font-mono text-surface-200 hidden sm:block">prototype</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={navLink}>Explore</NavLink>
          {user && !isOwner && (
            <>
              <NavLink to="/favourites" className={navLink}>Favourites</NavLink>
              <NavLink to="/history" className={navLink}>History</NavLink>
              <NavLink to="/add-restaurant" className={navLink}>Add Restaurant</NavLink>
            </>
          )}
          {isOwner && (
            <>
              <NavLink to="/owner/dashboard" className={navLink}>Dashboard</NavLink>
              <NavLink to="/owner/restaurant" className={navLink}>My Restaurant</NavLink>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setIsOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium hover:bg-brand-100 transition-colors"
            >
              <span>✦</span> AI Assistant
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-medium text-xs">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-medium text-surface-800 hidden sm:block max-w-24 truncate">
                  {user.name}
                </span>
                <svg className="w-4 h-4 text-surface-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-card-hover border border-surface-100 py-1 z-50"
                  onBlur={() => setMenuOpen(false)}>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-surface-800 hover:bg-surface-50"
                    onClick={() => setMenuOpen(false)}>Profile</Link>
                  <Link to="/preferences" className="block px-4 py-2 text-sm text-surface-800 hover:bg-surface-50"
                    onClick={() => setMenuOpen(false)}>Preferences</Link>
                  <hr className="my-1 border-surface-100" />
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">Log in</Link>
              <Link to="/signup" className="btn-primary text-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
