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
          <p className="text-sm text-surface-200 mt-0.5">Analytics for {data?.restaurant_name ?? 'your restaurant'}</p>
        </div>
        <Link to="/owner/restaurant" className="btn-primary text-sm">Manage listing</Link>
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

      {/* Rating distribution */}
      {data?.rating_distribution && (
        <div className="card p-5 mb-6">
          <h2 className="font-display font-semibold mb-4">Rating breakdown</h2>
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
                    <span className="text-sm font-medium text-surface-900">{rev.user_name}</span>
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

// ─── Manage Restaurant ────────────────────────────────────────────────────────
const CUISINES  = ['Italian','Chinese','Mexican','Indian','Japanese','American','Thai','Mediterranean','French','Korean','Other']
const AMENITIES = ['WiFi','Outdoor seating','Parking','Wheelchair accessible','Takeout','Delivery','Reservations','Live music','Pet-friendly']

export function ManageRestaurantPage() {
  const [form, setForm] = useState({
    name: '', cuisine_type: '', address: '', city: '',
    phone: '', description: '', hours: '', price_range: 2,
    amenities: [], contact_email: '',
  })
  const [restaurantId, setRestaurantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [claimId, setClaimId] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    api.get('/owner/restaurant')
      .then(({ data }) => {
        setRestaurantId(data.id)
        setForm({
          name: data.name ?? '',
          cuisine_type: data.cuisine_type ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          phone: data.phone ?? '',
          description: data.description ?? '',
          hours: data.hours ?? '',
          price_range: data.price_range ?? 2,
          amenities: data.amenities ?? [],
          contact_email: data.contact_email ?? '',
        })
      })
      .catch(() => {}) // no restaurant yet
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleAmenity = (a) => setForm((f) => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (restaurantId) {
        await restaurantService.update(restaurantId, form)
      } else {
        const { data } = await restaurantService.create(form)
        setRestaurantId(data.id)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleClaim = async () => {
    if (!claimId) return
    setClaiming(true)
    try {
      await restaurantService.claim(claimId)
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Could not claim restaurant')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">
        {restaurantId ? 'Manage Restaurant' : 'Create Restaurant Listing'}
      </h1>
      <p className="text-sm text-surface-200 mb-8">
        {restaurantId ? 'Update your restaurant profile' : 'Post your restaurant to get discovered'}
      </p>

      {/* Claim existing */}
      {!restaurantId && (
        <div className="card p-5 mb-8 border-dashed border-2 border-surface-200">
          <h2 className="text-sm font-medium text-surface-800 mb-3">Claim an existing listing</h2>
          <div className="flex gap-2">
            <input value={claimId} onChange={(e) => setClaimId(e.target.value)}
              placeholder="Restaurant ID" className="input flex-1 text-sm" />
            <button onClick={handleClaim} disabled={claiming || !claimId} className="btn-secondary text-sm shrink-0">
              {claiming ? 'Claiming…' : 'Claim'}
            </button>
          </div>
          <p className="text-xs text-surface-200 mt-2">Find the restaurant ID in the URL of the restaurant's page</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
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
          {saving ? 'Saving…' : restaurantId ? 'Update restaurant' : 'Create listing'}
        </button>
      </form>
    </div>
  )
}
