import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { restaurantService } from '../services/restaurantService'

const initialState = {
  ids: [],
  loading: false,
}

export const fetchFavourites = createAsyncThunk('favourites/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await restaurantService.getFavourites()
    return data.map((restaurant) => restaurant.id)
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to fetch favourites')
  }
})

export const toggleFavouriteAsync = createAsyncThunk('favourites/toggle', async (id, { rejectWithValue }) => {
  try {
    const { data } = await restaurantService.toggleFavourite(id)
    return { id, favourited: data.favourited }
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Failed to update favourite')
  }
})

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavourites.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.loading = false
        state.ids = action.payload
      })
      .addCase(fetchFavourites.rejected, (state) => {
        state.loading = false
        state.ids = []
      })
      .addCase(toggleFavouriteAsync.fulfilled, (state, action) => {
        const { id, favourited } = action.payload
        if (favourited && !state.ids.includes(id)) {
          state.ids.push(id)
        }
        if (!favourited) {
          state.ids = state.ids.filter((item) => item !== id)
        }
      })
  },
})

export const selectFavouriteIds = (state) => state.favourites.ids
export const selectIsFavourite = (id) => (state) => state.favourites.ids.includes(Number(id))

export default favouritesSlice.reducer
