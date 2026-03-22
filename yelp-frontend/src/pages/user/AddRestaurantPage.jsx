import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { restaurantService } from '../../services/restaurantService'

const CUISINES = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean', 'French', 'Korean', 'Other']
const AMENITIES = ['WiFi', 'Outdoor seating', 'Parking', 'Wheelchair accessible', 'Takeout', 'Delivery', 'Reservations', 'Live music', 'Pet-friendly']

export default function AddRestaurantPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', cuisine_type: '', address: '', city: '',
    phone: '', description: '', hours: '', price_range: 2,
    amenities: [], contact_email: '',
  })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleAmenity = (a) => setForm((f) => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
  }))

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setSaving(true)
  try {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('cuisine_type', form.cuisine_type)
    fd.append('address', form.address)
    fd.append('city', form.city)
    fd.append('price_range', String(form.price_range))
    fd.append('amenities', JSON.stringify(form.amenities))
    if (form.phone)         fd.append('phone', form.phone)
    if (form.contact_email) fd.append('contact_email', form.contact_email)
    if (form.description)   fd.append('description', form.description)
    if (form.hours)         fd.append('hours', form.hours)
    if (photos.length > 0) {
  photos.forEach((p) => fd.append('photos', p))
}
    const { data } = await restaurantService.create(fd)
    navigate(`/restaurants/${data.id}`)
  } catch (err) {
    setError(err.response?.data?.detail ?? 'Failed to create restaurant')
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Add a Restaurant</h1>
      <p className="text-sm text-surface-200 mb-8">Share a great spot with the community</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Basic information</h2>
          <div>
            <label className="label">Restaurant name *</label>
            <input required value={form.name} onChange={set('name')} className="input" placeholder="e.g. Pasta Paradise" />
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
                {[1, 2, 3, 4].map((p) => (
                  <button key={p} type="button"
                    onClick={() => setForm((f) => ({ ...f, price_range: p }))}
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
            <textarea value={form.description} onChange={set('description')} rows={3} className="input resize-none"
              placeholder="Describe the restaurant, its vibe, signature dishes…" />
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Location</h2>
          <div>
            <label className="label">Street address *</label>
            <input required value={form.address} onChange={set('address')} className="input" placeholder="123 Main St" />
          </div>
          <div>
            <label className="label">City *</label>
            <input required value={form.city} onChange={set('city')} className="input" placeholder="San Francisco, CA" />
          </div>
        </section>

        {/* Contact & Hours */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Contact & hours</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className="input" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label">Contact email</label>
              <input type="email" value={form.contact_email} onChange={set('contact_email')} className="input" placeholder="hello@restaurant.com" />
            </div>
          </div>
          <div>
            <label className="label">Hours of operation</label>
            <textarea value={form.hours} onChange={set('hours')} rows={3} className="input resize-none font-mono text-xs"
              placeholder={'Mon–Fri: 11am – 10pm\nSat–Sun: 10am – 11pm'} />
          </div>
        </section>

        {/* Amenities */}
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

        {/* Photos */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Photos</h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all">
            <span className="text-2xl mb-1">📷</span>
            <span className="text-xs text-surface-200">Click to upload photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {previews.map((p, i) => (
                <img key={i} src={p} alt="" className="w-full h-20 object-cover rounded-lg" />
              ))}
            </div>
          )}
        </section>

        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? 'Adding restaurant…' : 'Add restaurant'}
        </button>
      </form>
    </div>
  )
}
