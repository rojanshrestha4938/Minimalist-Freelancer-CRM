import api from "./api"

export async function getDashboardData() {
  const response = await api.get("/dashboard/")
  return response.data
}