import api from "./api"

const CLIENTS_URL = "/clients/"

// Build multipart/form-data for client requests
const buildClientFormData = (clientData) => {
  const formData = new FormData()

  formData.append("name", clientData.name || "")
  formData.append("email", clientData.email || "")
  formData.append("company", clientData.company || "")
  formData.append("status", clientData.status || "active")

  // Only append avatar when a new file was selected
  if (clientData.avatar instanceof File) {
    formData.append("avatar", clientData.avatar)
  }

  // Used when the user removes an existing image
  if (clientData.removeAvatar === true) {
    formData.append("avatar", "")
  }

  return formData
}

// GET /api/clients/
export const getClients = async (params = {}) => {
  const response = await api.get(CLIENTS_URL, {
    params,
  })

  return response.data
}

// POST /api/clients/
export const createClient = async (clientData) => {
  const formData = buildClientFormData(clientData)

  const response = await api.post(
    CLIENTS_URL,
    formData
  )

  return response.data
}

// PATCH /api/clients/{id}/
export const updateClient = async (clientId, clientData) => {
  const formData = buildClientFormData(clientData)

  const response = await api.patch(
    `${CLIENTS_URL}${clientId}/`,
    formData
  )

  return response.data
}

// DELETE /api/clients/{id}/
export const deleteClient = async (clientId) => {
  const response = await api.delete(
    `${CLIENTS_URL}${clientId}/`
  )

  return response.data
}