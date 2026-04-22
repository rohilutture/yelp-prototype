import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFavourites, selectFavouriteIds, toggleFavouriteAsync } from '../store/favouritesSlice'
import { useAuth } from './AuthContext'

// ─── Favourites ───────────────────────────────────────────────────────────────
const FavouritesContext = createContext(null)

export function FavouritesProvider({ children }) {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const favouriteIds = useSelector(selectFavouriteIds)
  const favourites = new Set(favouriteIds)

  useEffect(() => {
    if (!user) return
    dispatch(fetchFavourites())
  }, [dispatch, user])

  const toggle = useCallback(async (id) => {
    await dispatch(toggleFavouriteAsync(id))
  }, [dispatch])

  const isFavourite = useCallback((id) => favourites.has(id), [favourites])

  return (
    <FavouritesContext.Provider value={{ favourites, toggle, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  )
}

export const useFavourites = () => useContext(FavouritesContext)

// ─── Chat ─────────────────────────────────────────────────────────────────────
const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }])
  }, [])

  const clearChat = useCallback(() => setMessages([]), [])

  return (
    <ChatContext.Provider value={{ messages, isOpen, setIsOpen, isThinking, setIsThinking, addMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)
