import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Add access token to every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // If the request contains FormData (for image uploads),
    // let the browser set Content-Type automatically.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
      delete config.headers["content-type"]
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Refresh access token when it expires
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      sessionStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = sessionStorage.getItem("refreshToken")

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        )

        const newAccessToken = response.data.access

        sessionStorage.setItem("accessToken", newAccessToken)

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        sessionStorage.removeItem("accessToken")
        sessionStorage.removeItem("refreshToken")
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")

        window.location.href = "/login"

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api