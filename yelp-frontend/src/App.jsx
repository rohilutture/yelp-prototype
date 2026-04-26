import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FavouritesProvider, ChatProvider } from './context/AppContext'
import { PrivateRoute, OwnerRoute } from './components/common/RouteGuards'
import ErrorBoundary from './components/common/ErrorBoundary'
import Navbar from './components/common/Navbar'
import ChatBot from './components/chat/ChatBot'

// Pages
import ExplorePage from './pages/public/ExplorePage'
import RestaurantDetailPage from './pages/public/RestaurantDetailPage'
import { LoginPage, SignupPage } from './pages/auth/AuthPages'
import ProfilePage from './pages/user/ProfilePage'
import PreferencesPage from './pages/user/PreferencesPage'
import AddRestaurantPage from './pages/user/AddRestaurantPage'
import { FavouritesPage, HistoryPage } from './pages/user/UserListPages'
import { OwnerDashboard, ManageRestaurantsPage } from './pages/owner/OwnerPages'

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <ChatBot />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <FavouritesProvider>
            <ErrorBoundary>
              <Routes>
                <Route element={<Layout />}>
                  {/* Public routes */}
                  <Route path="/" element={<ExplorePage />} />
                  <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Protected user routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/preferences" element={<PreferencesPage />} />
                    <Route path="/add-restaurant" element={<AddRestaurantPage />} />
                    <Route path="/favourites" element={<FavouritesPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                  </Route>

                  {/* Protected owner routes */}
                  <Route element={<OwnerRoute />}>
                    <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                    <Route path="/owner/restaurants" element={<ManageRestaurantsPage />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={
                    <div className="text-center py-24 page-enter">
                      <p className="text-5xl mb-4">🤷</p>
                      <p className="font-display text-2xl font-bold text-surface-900 mb-2">Page not found</p>
                      <a href="/" className="btn-primary mt-4 inline-flex">Go home</a>
                    </div>
                  } />
                </Route>
              </Routes>
            </ErrorBoundary>
          </FavouritesProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
