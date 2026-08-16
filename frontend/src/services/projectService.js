import api from "./api"

const PROJECTS_URL = "/projects/"

// GET /api/projects/
export const getProjects = async (params = {}) => {
  const response = await api.get(PROJECTS_URL, {
    params,
  })
  return response.data
}

// POST /api/projects/
export const createProject = async (projectData) => {
  const payload = {
    name: projectData.name,
    client: projectData.client,
    status: projectData.status || "in_progress",
    progress: Number(projectData.progress) || 0,
    due_date: projectData.due_date,
  }

  const response = await api.post(PROJECTS_URL, payload)
  return response.data
}

// PATCH /api/projects/{id}/
export const updateProject = async (projectId, projectData) => {
  const payload = {}
  if (projectData.name !== undefined) payload.name = projectData.name
  if (projectData.client !== undefined) payload.client = projectData.client
  if (projectData.status !== undefined) payload.status = projectData.status
  if (projectData.progress !== undefined) payload.progress = Number(projectData.progress)
  if (projectData.due_date !== undefined) payload.due_date = projectData.due_date

  const response = await api.patch(`${PROJECTS_URL}${projectId}/`, payload)
  return response.data
}

// DELETE /api/projects/{id}/
export const deleteProject = async (projectId) => {
  const response = await api.delete(`${PROJECTS_URL}${projectId}/`)
  return response.data
}
