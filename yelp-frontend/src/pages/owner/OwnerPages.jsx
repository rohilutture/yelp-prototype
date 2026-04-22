import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { restaurantService } from '../../services/restaurantService'
import StarRating from '../../components/common/StarRating'

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export function OwnerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/owner/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  const stats = [
    { label: 'Total views', value: data?.total_views ?? 0, icon: '👁️' },
    { label: 'Avg rating', value: data?.avg_rating?.toFixed(1) ?? '—', icon: '⭐' },
    { label: 'Total reviews', value: data?.total_reviews ?? 0, icon: '💬' },
    { label: 'Favourites', value: data?.favourites_count ?? 0, icon: '♥' },
  ]

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">Owner Dashboard</h1>
          <p className="text-sm text-surface-200 mt-0.5">
            Managing {data?.restaurants?.length ?? 0} restaurant{data?.restaurants?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/add-restaurant" className="btn-secondary text-sm">+ Add Restaurant</Link>
          <Link to="/owner/restaurants" className="btn-primary text-sm">Manage restaurants</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="font-display text-2xl font-bold text-surface-900">{value}</p>
            <p className="text-xs text-surface-200 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-restaurant breakdown */}
      {data?.restaurants?.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold mb-4">Your restaurants</h2>
          <div className="space-y-3">
            {data.restaurants.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100">
                <div>
                  <Link to={`/restaurants/${r.id}`} className="font-medium text-surface-900 hover:text-brand-500 text-sm">
                    {r.name}
                  </Link>
                  <p className="text-xs text-surface-200">{r.cuisine_type} · {r.city}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-surface-200">
                  <span>👁️ {r.view_count}</span>
                  <span>💬 {r.review_count}</span>
                  <span>⭐ {r.avg_rating?.toFixed(1) ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {data?.rating_distribution && (
        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold mb-4">Rating breakdown (all restaurants)</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.rating_distribution[star] ?? 0
              const pct = data.total_reviews > 0 ? (count / data.total_reviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs w-4 text-right font-mono text-surface-800">{star}</span>
                  <span className="text-amber-400 text-xs">★</span>
                  <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-surface-200 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      <div className="card p-5">
        <h2 className="font-display font-semibold mb-4">Recent reviews</h2>
        {!data?.recent_reviews?.length ? (
          <p className="text-sm text-surface-200 py-4 text-center">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {data.recent_reviews.map((rev) => (
              <div key={rev.id} className="border-b border-surface-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-medium">
                      {rev.user_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-surface-900">{rev.user_name}</span>
                      {rev.restaurant_name && (
                        <span className="text-xs text-surface-200 ml-2">on {rev.restaurant_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={rev.rating} size="sm" readonly />
                    <span className="text-xs text-surface-200">{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {rev.comment && <p className="text-sm text-surface-800 leading-relaxed mt-1 pl-8">{rev.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Manage Restaurants (multiple) ────────────────────────────────────────────
const CUISINES  = ['Italian','Chinese','Mexican','Indian','Japanese','American','Thai','Mediterranean','French','Korean','Other']
const AMENITIES = ['WiFi','Outdoor seating','Parking','Wheelchair accessible','Takeout','Delivery','Reservations','Live music','Pet-friendly']

export function ManageRestaurantsPage() {
  const [myRestaurants, setMyRestaurants] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [claiming, setClaiming] = useState(null)
  const [releasing, setReleasing] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [form, setForm] = useState({
    name: '', cuisine_type: '', address: '', city: '',
    phone: '', description: '', hours: '', price_range: 2,
    amenities: [], contact_email: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('owned')

  const fetchMyRestaurants = () => {
    api.get('/owner/restaurants')
      .then(({ data }) => setMyRestaurants(data))
      .catch(() => {})
  }

  useEffect(() => { fetchMyRestaurants() }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(`/owner/search-unclaimed?q=${searchQuery}`)
      setSearchResults(data)
    } finally {
      setSearching(false)
    }
  }

  const handleClaim = async (id) => {
    setClaiming(id)
    try {
      await api.post(`/owner/claim/${id}`)
      fetchMyRestaurants()
      setSearchResults((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Could not claim restaurant')
    } finally {
      setClaiming(null)
    }
  }

  const handleRelease = async (id) => {
    if (!confirm('Release this restaurant? You will lose ownership.')) return
    setReleasing(id)
    try {
      await api.post(`/owner/release/${id}`)
      fetchMyRestaurants()
      if (selectedRestaurant?.id === id) { setSelectedRestaurant(null); setTab('owned') }
    } finally {
      setReleasing(null)
    }
  }

  const selectForEdit = (r) => {
    setSelectedRestaurant(r)
    setForm({
      name: r.name ?? '', cuisine_type: r.cuisine_type ?? '',
      address: r.address ?? '', city: r.city ?? '',
      phone: r.phone ?? '', contact_email: r.contact_email ?? '',
      description: r.description ?? '', hours: r.hours ?? '',
      price_range: r.price_range ?? 2, amenities: r.amenities ?? [],
    })
    setTab('edit')
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleAmenity = (a) => setForm((f) => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
  }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    try {
      await restaurantService.update(selectedRestaurant.id, form)
      setSuccess(true)
      fetchMyRestaurants()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-surface-900">Manage Restaurants</h1>
        <div className="flex items-center gap-2">
          <Link to="/add-restaurant" className="btn-primary text-sm">+ Add new restaurant</Link>
          <Link to="/owner/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: 'owned', label: `My Restaurants (${myRestaurants.length})` },
          { key: 'claim', label: 'Claim a Restaurant' },
          ...(selectedRestaurant ? [{ key: 'edit', label: `Edit: ${selectedRestaurant.name}` }] : []),
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${tab === key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-200 hover:text-surface-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Owned restaurants */}
      {tab === 'owned' && (
        <div className="space-y-3">
          {myRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🍽️</p>
              <p className="text-surface-800 font-medium">No restaurants yet</p>
              <p className="text-sm text-surface-200 mt-1">Claim an existing listing or add a new one</p>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => setTab('claim')} className="btn-secondary">Claim existing</button>
                <Link to="/add-restaurant" className="btn-primary">Add new restaurant</Link>
              </div>
            </div>
          ) : (
            myRestaurants.map((r) => (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <Link to={`/restaurants/${r.id}`}
                    className="font-medium text-surface-900 hover:text-brand-500 text-sm">
                    {r.name}
                  </Link>
                  <p className="text-xs text-surface-200 mt-0.5">{r.cuisine_type} · {r.city}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-surface-200">
                    <span>👁️ {r.view_count ?? 0} views</span>
                    <span>💬 {r.review_count ?? 0} reviews</span>
                    <span>⭐ {r.avg_rating?.toFixed(1) ?? '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => selectForEdit(r)} className="btn-secondary text-xs px-3 py-1.5">
                    Edit
                  </button>
                  <button onClick={() => handleRelease(r.id)} disabled={releasing === r.id}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors">
                    {releasing === r.id ? 'Releasing…' : 'Release'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Claim tab */}
      {tab === 'claim' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-200">Search for restaurants that haven't been claimed yet</p>
          <div className="flex gap-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by restaurant name…" className="input flex-1" />
            <button onClick={handleSearch} disabled={searching} className="btn-primary shrink-0">
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-sm text-surface-200 text-center py-8">No unclaimed restaurants found for "{searchQuery}"</p>
          )}

          <div className="space-y-3">
            {searchResults.map((r) => (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-surface-900 text-sm">{r.name}</p>
                  <p className="text-xs text-surface-200 mt-0.5">{r.cuisine_type} · {r.city}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarRating value={r.avg_rating ?? 0} size="sm" readonly />
                    <span className="text-xs text-surface-200">({r.review_count ?? 0} reviews)</span>
                  </div>
                </div>
                <button onClick={() => handleClaim(r.id)} disabled={claiming === r.id}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0">
                  {claiming === r.id ? 'Claiming…' : 'Claim'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit tab */}
      {tab === 'edit' && selectedRestaurant && (
        <form onSubmit={handleSave} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Restaurant details</h2>
            <div>
              <label className="label">Restaurant name *</label>
              <input required value={form.name} onChange={set('name')} className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cuisine type *</label>
                <select required value={form.cuisine_type} onChange={set('cuisine_type')} className="input">
                  <option value="">Select cuisine</option>
                  {CUISINES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price range</label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4].map((p) => (
                    <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, price_range: p }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium border transition-all
                        ${form.price_range === p ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-surface-800 hover:border-brand-300'}`}>
                      {'$'.repeat(p)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="input resize-none" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Location & contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Address *</label>
                <input required value={form.address} onChange={set('address')} className="input" />
              </div>
              <div>
                <label className="label">City *</label>
                <input required value={form.city} onChange={set('city')} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="input" />
              </div>
              <div>
                <label className="label">Contact email</label>
                <input type="email" value={form.contact_email} onChange={set('contact_email')} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Hours of operation</label>
              <textarea value={form.hours} onChange={set('hours')} rows={3} className="input resize-none font-mono text-xs"
                placeholder={'Mon–Fri: 11am – 10pm\nSat–Sun: 10am – 11pm'} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${form.amenities.includes(a) ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-800 hover:bg-surface-200'}`}>
                  {a}
                </button>
              ))}
            </div>
          </section>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
          {success && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">Saved successfully!</div>}

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  )
}