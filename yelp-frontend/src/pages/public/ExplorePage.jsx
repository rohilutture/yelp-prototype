import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import { useChat } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  fetchRestaurants,
  selectRestaurants,
  selectRestaurantsLoading,
} from '../../store/restaurantsSlice'

const CUISINES = ['All', 'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'American', 'Thai', 'Mediterranean']
const PRICES   = [{ label: 'Any', value: '' }, { label: '$', value: '1' }, { label: '$$', value: '2' }, { label: '$$$', value: '3' }, { label: '$$$$', value: '4' }]

export default function ExplorePage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setIsOpen } = useChat()
  const { user } = useAuth()

  const restaurants = useSelector(selectRestaurants)
  const loading = useSelector(selectRestaurantsLoading)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') ?? 'All')
  const [price, setPrice] = useState(searchParams.get('price') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')

  const loadRestaurants = useCallback(async () => {
    const params = {}
    if (query) params.q = query
    if (cuisine && cuisine !== 'All') params.cuisine = cuisine
    if (price) params.price = price
    if (city) params.city = city
    dispatch(fetchRestaurants(params))
  }, [query, cuisine, price, city, dispatch])

  useEffect(() => { loadRestaurants() }, [loadRestaurants])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (query) params.q = query
    if (cuisine !== 'All') params.cuisine = cuisine
    if (price) params.price = price
    if (city) params.city = city
    setSearchParams(params)
  }

  return (
    <div className="page-enter min-h-screen">
      {/* Hero search */}
      <div className="relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-900 to-surface-800 text-white">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 bg-brand-300/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs mb-5">
            <span className="text-brand-300">●</span>
            Curated picks, reviews, and AI recommendations
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-3 leading-tight">
            Find your next<br />
            <span className="text-brand-400">favourite place</span>
          </h1>
          <p className="text-surface-200 text-sm mb-8 max-w-2xl mx-auto">
            Discover restaurants, read reviews, and share your experiences
          </p>

          {/* AI prompt */}
          {user && (
            <button onClick={() => setIsOpen(true)}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              <span className="text-brand-400">✦</span>
              Ask the AI assistant instead
            </button>
          )}

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-card-hover border border-white/30">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Restaurant name or keyword…"
              className="input flex-1 border-0 shadow-none focus:ring-0 text-surface-800"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or zip"
              className="input w-full sm:w-40 border-0 shadow-none focus:ring-0 text-surface-800"
            />
            <button type="submit" className="btn-primary shrink-0">Search</button>
          </form>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-surface-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          {/* Cuisine */}
          <div className="flex items-center gap-1.5 shrink-0">
            {CUISINES.map((c) => (
              <button key={c} onClick={() => setCuisine(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${cuisine === c ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-800 hover:bg-surface-200'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-surface-200 shrink-0" />

          {/* Price */}
          <div className="flex items-center gap-1 shrink-0">
            {PRICES.map(({ label, value }) => (
              <button key={label} onClick={() => setPrice(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all
                  ${price === value ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-800 hover:bg-surface-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!loading && restaurants.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-surface-200">Trending now</span>
            {restaurants.slice(0, 4).map((r) => (
              <span key={r.id} className="badge bg-brand-50 text-brand-600 border border-brand-100">
                {r.name}
              </span>
            ))}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-44 bg-surface-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface-100 rounded w-3/4" />
                  <div className="h-3 bg-surface-100 rounded w-1/2" />
                  <div className="h-3 bg-surface-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-display text-xl text-surface-800 mb-1">No restaurants found</p>
            <p className="text-sm text-surface-200">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-surface-200 mb-4">{restaurants.length} result{restaurants.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
