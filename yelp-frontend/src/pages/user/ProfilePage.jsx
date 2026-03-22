import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'India',
  'Germany', 'France', 'Japan', 'Brazil', 'Mexico', 'Other'
]
const GENDERS = ['Prefer not to say', 'Male', 'Female', 'Non-binary', 'Other']
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Arabic', 'Portuguese', 'Japanese']

export default function ProfilePage() {
  const { user, login } = useAuth()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', about: '',
    city: '', country: '', gender: '', languages: [],
  })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    userService.getProfile()
      .then(({ data }) => {
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          about: data.about ?? '',
          city: data.city ?? '',
          country: data.country ?? '',
          gender: data.gender ?? '',
          languages: data.languages ?? [],
        })
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleLanguage = (lang) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      if (avatar) {
        const fd = new FormData()
        fd.append('file', avatar)
        await userService.uploadAvatar(fd)
      }
      await userService.updateProfile(form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to save profile')
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
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Your Profile</h1>
      <p className="text-sm text-surface-200 mb-8">Manage your personal details and account info</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-brand-600 text-2xl font-medium">{form.name?.[0]?.toUpperCase() ?? 'U'}</span>
              }
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm">
              ✎
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900">{form.name || 'Your name'}</p>
            <p className="text-xs text-surface-200 mt-0.5">{form.email}</p>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs text-brand-500 hover:underline mt-1">Change photo</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Basic information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" value={form.name} onChange={set('name')} className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className="input" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={set('gender')} className="input">
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">About me</label>
            <textarea value={form.about} onChange={set('about')} rows={3}
              placeholder="Tell others a little about yourself…" className="input resize-none" />
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input type="text" value={form.city} onChange={set('city')} className="input" placeholder="San Francisco" />
            </div>
            <div>
              <label className="label">Country</label>
              <select value={form.country} onChange={set('country')} className="input">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Languages */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-surface-800 border-b border-surface-100 pb-2">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${form.languages.includes(lang)
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-surface-100 text-surface-800 hover:bg-surface-200'}`}>
                {lang}
              </button>
            ))}
          </div>
        </section>

        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        {success && <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">Profile saved successfully!</div>}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
