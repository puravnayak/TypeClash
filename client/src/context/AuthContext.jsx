import { createContext, useContext, useEffect, useState } from 'react'
import { auth, googleProvider } from '../lib/firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { io } from 'socket.io-client'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

let socket = null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbUser, setDbUser] = useState(null)

  const login = () => signInWithPopup(auth, googleProvider)

  const logout = () => {
    signOut(auth)
    setDbUser(null)
    socket?.disconnect()
    socket = null
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        try {
          const token = await user.getIdToken()
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              userData: {
                name: user.displayName,
                email: user.email,
                avatar: user.photoURL,
              },
            }),
          })

          const data = await res.json()
          setDbUser(data)

          if (!socket) {
            socket = io(import.meta.env.VITE_BACKEND_URL)
            socket.emit("auth", { googleId: data.googleId })
          }
        } catch (err) {
          console.error("❌ Sync error:", err)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, dbUser, socket }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
