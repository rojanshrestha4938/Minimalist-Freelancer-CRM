import { createContext, useContext, useEffect, useState } from "react"
import { loginUser } from "../services/authService"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  )

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  )

  const [user, setUser] = useState(null)

  const login = async (username, password) => {
    const data = await loginUser(username, password)

    localStorage.setItem("accessToken", data.access)
    localStorage.setItem("refreshToken", data.refresh)

    setAccessToken(data.access)
    setRefreshToken(data.refresh)

    return data
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")

    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken")

    if (token) {
      setAccessToken(token)
    }
  }, [])

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}