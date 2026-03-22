import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { restaurantService } from '../services/restaurantService'
import { useAuth } from './AuthContext'

// ─── Favourites ───────────────────────────────────────────────────────────────
const FavouritesContext = createContext(null)

export function FavouritesProvider({ children }) {
  const { user } = useAuth()
  const [favourites, setFavourites] = useState(new Set())

  useEffect(() => {
    if (!user) return
    restaurantService.getFavourites()
      .then(({ data }) => setFavourites(new Set(data.map((r) => r.id))))
      .catch(() => {})
  }, [user])

  const toggle = useCallback(async (id) => {
    await restaurantService.toggleFavourite(id)
    setFavourites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

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
