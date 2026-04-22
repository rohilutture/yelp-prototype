import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { restaurantService } from '../services/restaurantService'

const initialState = {
  list: [],
  byId: {},
  loading: false,
  error: null,
}

export const fetchRestaurants = createAsyncThunk('restaurants/fetchList', async (params, { rejectWithValue }) => {
  try {
    const { data } = await restaurantService.search(params || {})
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch restaurants')
  }
})

export const fetchRestaurantById = createAsyncThunk('restaurants/fetchById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await restaurantService.getById(id)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch restaurant details')
  }
})

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
        action.payload.forEach((restaurant) => {
          state.byId[restaurant.id] = restaurant
        })
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false
        state.byId[action.payload.id] = action.payload
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const selectRestaurants = (state) => state.restaurants.list
export const selectRestaurantsLoading = (state) => state.restaurants.loading
export const selectRestaurantById = (id) => (state) => state.restaurants.byId[id]

export default restaurantsSlice.reducer
