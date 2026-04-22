import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import restaurantsReducer from './restaurantsSlice'
import reviewsReducer from './reviewsSlice'
import favouritesReducer from './favouritesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurants: restaurantsReducer,
    reviews: reviewsReducer,
    favourites: favouritesReducer,
  },
  devTools: true,
})
