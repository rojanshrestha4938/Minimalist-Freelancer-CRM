import { createContext, useContext, useEffect, useState } from "react"
import { loginUser } from "../services/authService"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    sessionStorage.getItem("accessToken")
  )

  const [refreshToken, setRefreshToken] = useState(
    sessionStorage.getItem("refreshToken")
  )

  const [user, setUser] = useState(null)

  const login = async (email, password) => {
    const data = await loginUser(email, password)

    sessionStorage.setItem("accessToken", data.access)
    sessionStorage.setItem("refreshToken", data.refresh)

    // Clear legacy localStorage if any exists
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")

    setAccessToken(data.access)
    setRefreshToken(data.refresh)

    return data
  }

  const logout = () => {
    sessionStorage.removeItem("accessToken")
    sessionStorage.removeItem("refreshToken")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")

    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken")

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