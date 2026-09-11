import api from "./api"

export async function loginUser(email, password) {
  // const response = await api.post("/auth/login/", {
  //   email,
  //   password,
  // })
  const response = await api.post("/auth/token/", {
    email,
    password,
  })
  return response.data
}

export async function registerUser(userData) {
  const response = await api.post("/auth/register/", userData)

  return response.data
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me/")
  return response.data
}