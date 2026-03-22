import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { restaurantService } from '../../services/restaurantService'
import { userService } from '../../services'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import StarRating from '../../components/common/StarRating'

// ─── Favourites ───────────────────────────────────────────────────────────────
export function FavouritesPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restaurantService.getFavourites()
      .then(({ data }) => setRestaurants(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Your Favourites</h1>
      <p className="text-sm text-surface-200 mb-6">Restaurants you've saved</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 bg-surface-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-100 rounded w-3/4" />
                <div className="h-3 bg-surface-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">♡</p>
          <p className="font-display text-xl text-surface-800 mb-1">No favourites yet</p>
          <p className="text-sm text-surface-200 mb-4">Start saving restaurants you love</p>
          <Link to="/" className="btn-primary">Explore restaurants</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────
export function HistoryPage() {
  const [history, setHistory] = useState({ reviews: [], restaurants_added: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('reviews')

  useEffect(() => {
    userService.getHistory()
      .then(({ data }) => setHistory(data))
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'reviews', label: 'My reviews', count: history.reviews.length },
    { key: 'added', label: 'Added by me', count: history.restaurants_added.length },
  ]

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-1">Activity History</h1>
      <p className="text-sm text-surface-200 mb-6">Your reviews and restaurant contributions</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${tab === key ? 'bg-white shadow-sm text-surface-900' : 'text-surface-200 hover:text-surface-800'}`}>
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-surface-800'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-2">
              <div className="h-4 bg-surface-100 rounded w-1/2" />
              <div className="h-3 bg-surface-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : tab === 'reviews' ? (
        history.reviews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-surface-800 font-medium">No reviews yet</p>
            <p className="text-sm text-surface-200 mt-1">Go explore and leave your first review!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.reviews.map((rev) => (
              <div key={rev.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/restaurants/${rev.restaurant_id}`}
                      className="font-medium text-surface-900 hover:text-brand-500 transition-colors text-sm">
                      {rev.restaurant_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={rev.rating} size="sm" readonly />
                      <span className="text-xs text-surface-200">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link to={`/restaurants/${rev.restaurant_id}`} className="text-xs text-brand-500 hover:underline shrink-0">
                    View →
                  </Link>
                </div>
                {rev.comment && <p className="text-sm text-surface-800 mt-2 leading-relaxed">{rev.comment}</p>}
              </div>
            ))}
          </div>
        )
      ) : (
        history.restaurants_added.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="text-surface-800 font-medium">No restaurants added yet</p>
            <Link to="/add-restaurant" className="btn-primary mt-4">Add your first one</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.restaurants_added.map((r) => (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <Link to={`/restaurants/${r.id}`}
                    className="font-medium text-surface-900 hover:text-brand-500 transition-colors text-sm">
                    {r.name}
                  </Link>
                  <p className="text-xs text-surface-200 mt-0.5">{r.cuisine_type} · {r.city}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StarRating value={r.avg_rating ?? 0} size="sm" readonly />
                  <Link to={`/restaurants/${r.id}`} className="text-xs text-brand-500 hover:underline">View →</Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
