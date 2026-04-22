import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { reviewService } from '../services'

const initialState = {
  byRestaurant: {},
  pendingEvents: [],
  loading: false,
  error: null,
}

export const fetchReviewsForRestaurant = createAsyncThunk('reviews/fetchByRestaurant', async (restaurantId, { rejectWithValue }) => {
  try {
    const { data } = await reviewService.getForRestaurant(restaurantId)
    return { restaurantId: Number(restaurantId), reviews: data }
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch reviews')
  }
})

export const createReviewAsync = createAsyncThunk('reviews/create', async ({ restaurantId, payload }, { rejectWithValue }) => {
  try {
    const { data } = await reviewService.create(restaurantId, payload)
    return { restaurantId: Number(restaurantId), queueStatus: data }
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to submit review')
  }
})

export const updateReviewAsync = createAsyncThunk('reviews/update', async ({ reviewId, payload }, { rejectWithValue }) => {
  try {
    const { data } = await reviewService.update(reviewId, payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to update review')
  }
})

export const deleteReviewAsync = createAsyncThunk('reviews/delete', async (reviewId, { rejectWithValue }) => {
  try {
    const { data } = await reviewService.delete(reviewId)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to delete review')
  }
})

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsForRestaurant.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviewsForRestaurant.fulfilled, (state, action) => {
        state.loading = false
        state.byRestaurant[action.payload.restaurantId] = action.payload.reviews
      })
      .addCase(fetchReviewsForRestaurant.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createReviewAsync.fulfilled, (state, action) => {
        state.pendingEvents.push(action.payload.queueStatus)
      })
      .addCase(updateReviewAsync.fulfilled, (state, action) => {
        state.pendingEvents.push(action.payload)
      })
      .addCase(deleteReviewAsync.fulfilled, (state, action) => {
        state.pendingEvents.push(action.payload)
      })
  },
})

export const selectReviewsForRestaurant = (restaurantId) => (state) =>
  state.reviews.byRestaurant[Number(restaurantId)] || []
export const selectReviewLoading = (state) => state.reviews.loading
export const selectReviewPendingEvents = (state) => state.reviews.pendingEvents

export default reviewsSlice.reducer
