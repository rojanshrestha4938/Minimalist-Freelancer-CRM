import api from "./api"

export async function loginUser(username, password) {
  const response = await api.post("/auth/token/", {
    username,
    password,
  })

  return response.data
}

export async function registerUser(userData) {
  const response = await api.post("/auth/register/", userData)

  return response.data
}