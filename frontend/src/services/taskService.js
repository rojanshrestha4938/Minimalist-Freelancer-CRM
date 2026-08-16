import api from "./api"

const TASKS_URL = "/tasks/"

// GET /api/tasks/
export const getTasks = async (params = {}) => {
  const response = await api.get(TASKS_URL, {
    params,
  })
  return response.data
}

// POST /api/tasks/
export const createTask = async (taskData) => {
  const payload = {
    name: taskData.name,
    project: taskData.project,
    description: taskData.description || "",
    status: taskData.status || "todo",
    due_date: taskData.due_date,
  }

  const response = await api.post(TASKS_URL, payload)
  return response.data
}

// PATCH /api/tasks/{id}/
export const updateTask = async (taskId, taskData) => {
  const payload = {}
  if (taskData.name !== undefined) payload.name = taskData.name
  if (taskData.project !== undefined) payload.project = taskData.project
  if (taskData.description !== undefined) payload.description = taskData.description
  if (taskData.status !== undefined) payload.status = taskData.status
  if (taskData.due_date !== undefined) payload.due_date = taskData.due_date

  const response = await api.patch(`${TASKS_URL}${taskId}/`, payload)
  return response.data
}

// DELETE /api/tasks/{id}/
export const deleteTask = async (taskId) => {
  const response = await api.delete(`${TASKS_URL}${taskId}/`)
  return response.data
}
