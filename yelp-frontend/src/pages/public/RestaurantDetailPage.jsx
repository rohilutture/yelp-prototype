import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../context/AuthContext'
import { useFavourites } from '../../context/AppContext'
import StarRating from '../../components/common/StarRating'
import { fetchRestaurantById, selectRestaurantById, selectRestaurantsLoading } from '../../store/restaurantsSlice'
import {
  createReviewAsync,
  deleteReviewAsync,
  fetchReviewsForRestaurant,
  selectReviewLoading,
  selectReviewsForRestaurant,
  updateReviewAsync,
} from '../../store/reviewsSlice'

const PRICE = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' }

export default function RestaurantDetailPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const { user } = useAuth()
  const favCtx = useFavourites()
  const isFav = favCtx?.isFavourite(Number(id))

  const restaurant = useSelector(selectRestaurantById(Number(id)))
  const reviews = useSelector(selectReviewsForRestaurant(Number(id)))
  const loading = useSelector(selectRestaurantsLoading) || useSelector(selectReviewLoading)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    await Promise.all([
      dispatch(fetchRestaurantById(id)),
      dispatch(fetchReviewsForRestaurant(id)),
    ])
    setInitialFetchDone(true)
  }

  useEffect(() => { fetchData() }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.rating) return
    setSubmitting(true)
    try {
      if (editingReview) {
        await dispatch(updateReviewAsync({ reviewId: editingReview.id, payload: reviewForm }))
      } else {
        await dispatch(createReviewAsync({ restaurantId: id, payload: reviewForm }))
      }
      setReviewForm({ rating: 0, comment: '' })
      setShowReviewForm(false)
      setEditingReview(null)
      setTimeout(fetchData, 400)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return
    await dispatch(deleteReviewAsync(reviewId))
    setTimeout(fetchData, 400)
  }

  const startEdit = (review) => {
    setEditingReview(review)
    setReviewForm({ rating: review.rating, comment: review.comment })
    setShowReviewForm(true)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  if (loading || !initialFetchDone) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  if (!restaurant) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">🤔</p>
      <p className="font-display text-xl">Restaurant not found</p>
      <Link to="/" className="btn-primary mt-4">Back to Explore</Link>
    </div>
  )

  const userReview = reviews.find((r) => r.user_id === user?.id)

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h1 className="font-display text-3xl font-bold text-surface-900">{restaurant.name}</h1>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => favCtx?.toggle(restaurant.id)}
                className={`btn-secondary text-sm ${isFav ? 'text-brand-500 border-brand-200' : ''}`}>
                {isFav ? '♥ Saved' : '♡ Save'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-surface-200">
          <span className="badge bg-surface-100 text-surface-800">{restaurant.cuisine_type}</span>
          {restaurant.price_range && <span className="font-mono">{PRICE[restaurant.price_range]}</span>}
          <div className="flex items-center gap-1.5">
            <StarRating value={restaurant.avg_rating ?? 0} size="sm" readonly />
            <span className="font-medium text-surface-800">{restaurant.avg_rating?.toFixed(1) ?? '—'}</span>
            <span>({reviews.length} reviews)</span>
          </div>
        </div>
      </div>

      {/* Photos */}
      {restaurant.photos?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-6 rounded-2xl overflow-hidden h-60">
          {restaurant.photos.slice(0, 3).map((p, i) => (
            <img key={i} src={`http://localhost:8000${p}`} alt="" className={`w-full h-full object-cover ${i === 0 ? 'col-span-2' : ''}`} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-5">
          {restaurant.description && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-2">About</h2>
              <p className="text-sm text-surface-800 leading-relaxed">{restaurant.description}</p>
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-lg">Reviews</h2>
              {user && !userReview && (
                <button onClick={() => { setEditingReview(null); setReviewForm({ rating: 0, comment: '' }); setShowReviewForm(true) }}
                  className="btn-primary text-sm">Write a review</button>
              )}
            </div>

            {reviews.length === 0 && (
              <p className="text-sm text-surface-200 py-4">No reviews yet. Be the first!</p>
            )}

            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-medium">
                        {rev.user_name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span className="text-sm font-medium text-surface-900">{rev.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={rev.rating} size="sm" readonly />
                      {rev.user_id === user?.id && (
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(rev)} className="text-xs text-surface-200 hover:text-brand-500">Edit</button>
                          <button onClick={() => deleteReview(rev.id)} className="text-xs text-surface-200 hover:text-red-500">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-surface-800 leading-relaxed mt-2">{rev.comment}</p>
                  <p className="text-xs text-surface-200 mt-1">{new Date(rev.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            {/* Review form */}
            {showReviewForm && user && (
              <form onSubmit={submitReview} className="mt-4 p-4 bg-surface-50 rounded-xl border border-surface-100 space-y-3">
                <h3 className="text-sm font-medium">{editingReview ? 'Edit review' : 'Write a review'}</h3>
                <div>
                  <label className="label">Your rating</label>
                  <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} size="lg" />
                </div>
                <div>
                  <label className="label">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    rows={3} placeholder="Share your experience…" className="input resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={!reviewForm.rating || submitting} className="btn-primary text-sm">
                    {submitting ? 'Submitting…' : editingReview ? 'Update' : 'Submit'}
                  </button>
                  <button type="button" onClick={() => { setShowReviewForm(false); setEditingReview(null) }} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3 text-sm">
            {restaurant.address && (
              <div>
                <p className="label">Address</p>
                <p className="text-surface-800">{restaurant.address}</p>
                <p className="text-surface-200">{restaurant.city}</p>
              </div>
            )}
            {restaurant.phone && (
              <div>
                <p className="label">Phone</p>
                <a href={`tel:${restaurant.phone}`} className="text-brand-500 hover:underline">{restaurant.phone}</a>
              </div>
            )}
            {restaurant.hours && (
              <div>
                <p className="label">Hours</p>
                <p className="text-surface-800 whitespace-pre-line text-xs">{restaurant.hours}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
