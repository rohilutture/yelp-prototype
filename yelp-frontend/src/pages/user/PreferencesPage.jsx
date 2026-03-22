import { useState, useEffect } from 'react'
import { userService } from '../../services'

const CUISINES   = ['Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean', 'French', 'Korean']
const PRICES     = [{ label: '$', value: 1 }, { label: '$$', value: 2 }, { label: '$$$', value: 3 }, { label: '$$$$', value: 4 }]
const DIETS      = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Kosher', 'Dairy-free', 'Nut-free']
const AMBIANCES  = ['Casual', 'Fine dining', 'Family-friendly', 'Romantic', 'Outdoor seating', 'Live music', 'Sports bar', 'Trendy']
const SORT_OPTS  = ['Rating', 'Distance', 'Popularity', 'Price (low)', 'Price (high)']

const ToggleChip = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none
      ${active ? 'bg-brand-500 text-white shadow-sm scale-105' : 'bg-surface-100 text-surface-800 hover:bg-surface-200'}`}>
    {label}
  </button>
)

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState({
    cuisines: [], price_range: [], dietary: [],
    ambiance: [], sort_by: 'Rating', location: '', radius: 10,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    userService.getPreferences()
      .then(({ data }) => setPrefs((p) => ({ ...p, ...data })))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (key, val) => setPrefs((p) => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter((v) => v !== val) : [...p[key], val],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await userService.updatePreferences(prefs)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Preferences</h1>
        <p className="text-sm text-surface-200">
          These preferences are used by the <span className="text-brand-500 font-medium">AI Assistant</span> to personalise your restaurant recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cuisine */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Favourite cuisines</h2>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <ToggleChip key={c} label={c} active={prefs.cuisines.includes(c)} onClick={() => toggle('cuisines', c)} />
            ))}
          </div>
        </section>

        {/* Price range */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Price range</h2>
          <div className="flex gap-2">
            {PRICES.map(({ label, value }) => (
              <ToggleChip key={value} label={label} active={prefs.price_range.includes(value)} onClick={() => toggle('price_range', value)} />
            ))}
          </div>
        </section>

        {/* Dietary */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Dietary needs</h2>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((d) => (
              <ToggleChip key={d} label={d} active={prefs.dietary.includes(d)} onClick={() => toggle('dietary', d)} />
            ))}
          </div>
        </section>

        {/* Ambiance */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Ambiance preferences</h2>
          <div className="flex flex-wrap gap-2">
            {AMBIANCES.map((a) => (
              <ToggleChip key={a} label={a} active={prefs.ambiance.includes(a)} onClick={() => toggle('ambiance', a)} />
            ))}
          </div>
        </section>

        {/* Location + radius */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Location & search radius</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred location</label>
              <input type="text" value={prefs.location} onChange={(e) => setPrefs((p) => ({ ...p, location: e.target.value }))}
                className="input" placeholder="City or zip code" />
            </div>
            <div>
              <label className="label">Search radius — {prefs.radius} km</label>
              <input type="range" min={1} max={50} value={prefs.radius}
                onChange={(e) => setPrefs((p) => ({ ...p, radius: Number(e.target.value) }))}
                className="w-full mt-2 accent-brand-500" />
            </div>
          </div>
        </section>

        {/* Sort */}
        <section>
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2 mb-3">Default sort</h2>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTS.map((s) => (
              <ToggleChip key={s} label={s} active={prefs.sort_by === s}
                onClick={() => setPrefs((p) => ({ ...p, sort_by: s }))} />
            ))}
          </div>
        </section>

        {success && (
          <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
            Preferences saved! The AI assistant will use these next time.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </div>
  )
}
