import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useFavourites } from '../../context/AppContext'
import StarRating from "../common/StarRating";

const PRICE_LABELS = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' }
const toPhotoUrl = (photo) =>
  photo?.startsWith('http://') || photo?.startsWith('https://')
    ? photo
    : `http://localhost:8000${photo}`

export default function RestaurantCard({ restaurant }) {
  const { user } = useAuth()
  const favCtx = useFavourites()
  const isFav = favCtx?.isFavourite(restaurant.id)

  return (
    <div className="card group cursor-pointer hover:-translate-y-1">
      <Link to={`/restaurants/${restaurant.id}`} className="block">
        {/* Image */}
        <div className="relative h-44 bg-surface-100 overflow-hidden">
          {restaurant.photos?.[0] ? (
            <img src={toPhotoUrl(restaurant.photos[0])} alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-200 text-4xl">🍽️</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3">
            <span className="badge bg-white/90 backdrop-blur text-surface-800 shadow-sm">
              {restaurant.cuisine_type}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="badge bg-white/90 backdrop-blur text-surface-800 shadow-sm font-mono">
              {PRICE_LABELS[restaurant.price_range] ?? '?'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-semibold text-surface-900 text-base leading-snug line-clamp-1">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-surface-200 mb-2 line-clamp-1">{restaurant.city}</p>

          <div className="flex items-center gap-2">
            <StarRating value={restaurant.avg_rating ?? 0} size="sm" readonly />
            <span className="text-xs text-surface-800 font-medium">{restaurant.avg_rating?.toFixed(1) ?? '—'}</span>
            <span className="text-xs text-surface-200">({restaurant.review_count ?? 0})</span>
          </div>

          {restaurant.description && (
            <p className="text-xs text-surface-200 mt-2 line-clamp-2 leading-relaxed">
              {restaurant.description}
            </p>
          )}
        </div>
      </Link>

      {/* Favourite button */}
      {user && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => { e.preventDefault(); favCtx?.toggle(restaurant.id) }}
            className={`text-xs font-medium transition-colors duration-150 flex items-center gap-1
              ${isFav ? 'text-brand-500' : 'text-surface-200 hover:text-brand-400'}`}
          >
            <span>{isFav ? '♥' : '♡'}</span>
            {isFav ? 'Saved' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
