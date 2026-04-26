import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AuthForm({ mode }) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isOwner = location.search.includes('owner')
  const isLogin = mode === 'login'

  const [form, setForm] = useState({ name: '', email: '', password: '', restaurant_location: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const user = await login({ email: form.email, password: form.password }, isOwner)
        navigate(user.role === 'owner' ? '/owner/dashboard' : '/')
      } else {
        await signup(form, isOwner)
        navigate(isOwner ? '/owner/dashboard' : '/')
      }
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface-900 text-white p-12">
        <Link to="/" className="font-display font-bold text-3xl text-brand-400">yelp</Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight mb-4">
            Discover the city's<br />best bites.
          </h2>
          <p className="text-surface-200 text-sm">
            Join thousands of food lovers finding and sharing their favourite restaurants.
          </p>
        </div>
        <p className="text-surface-200 text-xs">© 2025 Yelp Prototype</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="lg:hidden font-display font-bold text-2xl text-brand-500 block mb-6">yelp</Link>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              {isLogin ? 'Welcome back' : isOwner ? 'Register as Owner' : 'Create account'}
            </h1>
            <p className="text-sm text-surface-200 mt-1">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Link to={isLogin ? '/signup' : '/login'} className="text-brand-500 hover:underline">
                {isLogin ? 'Sign up' : 'Log in'}
              </Link>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Full name</label>
                <input type="text" required value={form.name} onChange={set('name')} className="input" placeholder="Jane Doe" />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={6} maxLength={72} value={form.password} onChange={set('password')} className="input" placeholder="Min 6 characters" />
            </div>

            {!isLogin && isOwner && (
              <div>
                <label className="label">Restaurant location</label>
                <input type="text" required value={form.restaurant_location} onChange={set('restaurant_location')} className="input" placeholder="123 Main St, City" />
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Loading…' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-surface-200">
              {isOwner ? (
                <Link to={isLogin ? '/login' : '/signup'} className="text-brand-500 hover:underline">Switch to user account</Link>
              ) : (
                <Link to={`${isLogin ? '/login' : '/signup'}?owner=1`} className="text-brand-500 hover:underline">
                  Register as restaurant owner →
                </Link>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() { return <AuthForm mode="login" /> }
export function SignupPage() { return <AuthForm mode="signup" /> }
