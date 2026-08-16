import { useState, useEffect, useRef, useMemo } from "react"
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
} from "lucide-react"

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../services/taskService"
import { getProjects } from "../../services/projectService"

// ─────────────────────────────────────────────────────────────
// Status Definitions matching Backend values
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo: {
    id: "todo",
    label: "To Do",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-slate-200/60",
    dotColor: "bg-slate-400",
  },
  in_progress: {
    id: "in_progress",
    label: "In Progress",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-600",
    badgeBorder: "border-blue-100",
    dotColor: "bg-blue-600",
  },
  completed: {
    id: "completed",
    label: "Completed",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-200/60",
    isCheck: true,
  },
}

const PROJECT_COLORS = [
  "bg-blue-600",
  "bg-amber-600",
  "bg-slate-400",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-rose-500",
  "bg-purple-600",
  "bg-emerald-600",
]

function getProjectColor(projectId = 0, projectName = "") {
  if (projectId) {
    return PROJECT_COLORS[projectId % PROJECT_COLORS.length]
  }
  let hash = 0
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

function formatDueDate(dateString) {
  if (!dateString) return "No due date"
  try {
    const parts = dateString.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const date = new Date(year, month, day)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    }
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

// ─────────────────────────────────────────────────────────────
// Tasks Component
// ─────────────────────────────────────────────────────────────

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Pagination (5 tasks per page as configured in backend)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 5

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project: "",
    status: "todo",
    due_date: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const filterRef = useRef(null)
  const dropdownRef = useRef(null)

  // Show Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // ───────────────────────────────────────────────────────────
  // Close dropdowns on outside click
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterMenu(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdownId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ───────────────────────────────────────────────────────────
  // Fetch Tasks with Pagination, Search & Filter
  // ───────────────────────────────────────────────────────────
  const fetchTasks = async (
    page = currentPage,
    search = searchQuery,
    status = statusFilter
  ) => {
    try {
      setLoading(true)
      const params = {
        page,
        page_size: pageSize,
      }
      if (search && search.trim()) {
        params.search = search.trim()
      }
      if (status && status !== "all") {
        params.status = status
      }

      const data = await getTasks(params)
      const taskList = data.results || data || []

      setTasks(Array.isArray(taskList) ? taskList : [])
      setTotalCount(
        data.count !== undefined
          ? data.count
          : Array.isArray(taskList)
          ? taskList.length
          : 0
      )
    } catch (err) {
      console.error("Failed to load tasks:", err)
      showToast("Failed to load tasks from server", "error")
      setTasks([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Projects list for lookup map and modal selection
  const fetchProjectsList = async () => {
    try {
      const data = await getProjects({ page_size: 50 })
      const projectList = data.results || data || []
      setProjects(Array.isArray(projectList) ? projectList : [])
    } catch (err) {
      console.error("Failed to load projects:", err)
    }
  }

  useEffect(() => {
    fetchProjectsList()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(currentPage, searchQuery, statusFilter)
    }, 250)
    return () => clearTimeout(timer)
  }, [currentPage, searchQuery, statusFilter])

  // Lookup map: project ID -> project object
  const projectMap = useMemo(() => {
    const map = {}
    projects.forEach((p) => {
      if (p && p.id !== undefined) {
        map[p.id] = p
      }
    })
    return map
  }, [projects])

  // Computed Pagination Numbers
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endEntry = Math.min(currentPage * pageSize, totalCount)

  // ───────────────────────────────────────────────────────────
  // Form Handling
  // ───────────────────────────────────────────────────────────
  const openNewModal = () => {
    setFormData({
      name: "",
      description: "",
      project: projects.length > 0 ? projects[0].id : "",
      status: "todo",
      due_date: new Date().toISOString().split("T")[0],
    })
    setFormErrors({})
    setIsNewModalOpen(true)
  }

  const openEditModal = (task) => {
    setSelectedTask(task)
    setFormData({
      name: task.name || "",
      description: task.description || "",
      project: task.project || "",
      status: task.status || "todo",
      due_date: task.due_date || "",
    })
    setFormErrors({})
    setIsEditModalOpen(true)
    setActiveDropdownId(null)
  }

  const openDeleteModal = (task) => {
    setSelectedTask(task)
    setIsDeleteModalOpen(true)
    setActiveDropdownId(null)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = "Task name is required"
    }
    if (!formData.project) {
      errors.project = "Please select a project"
    }
    if (!formData.due_date) {
      errors.due_date = "Due date is required"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      await createTask({
        name: formData.name.trim(),
        description: formData.description.trim(),
        project: Number(formData.project),
        status: formData.status,
        due_date: formData.due_date,
      })
      setIsNewModalOpen(false)
      showToast("Task created successfully")
      if (currentPage === 1) {
        fetchTasks(1, searchQuery, statusFilter)
      } else {
        setCurrentPage(1)
      }
    } catch (err) {
      console.error("Error creating task:", err)
      const apiErrors = err.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        setFormErrors(apiErrors)
      } else {
        showToast("Failed to create task", "error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm() || !selectedTask) return

    try {
      setSubmitting(true)
      const updated = await updateTask(selectedTask.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        project: Number(formData.project),
        status: formData.status,
        due_date: formData.due_date,
      })
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? updated : t))
      )
      setIsEditModalOpen(false)
      setSelectedTask(null)
      showToast("Task updated successfully")
    } catch (err) {
      console.error("Error updating task:", err)
      const apiErrors = err.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        setFormErrors(apiErrors)
      } else {
        showToast("Failed to update task", "error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle completion with checkbox
  const handleToggleCompletion = async (task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed"
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      )
      await updateTask(task.id, { status: nextStatus })
      if (statusFilter !== "all") {
        fetchTasks(currentPage, searchQuery, statusFilter)
      }
      showToast(
        nextStatus === "completed"
          ? "Task marked as completed"
          : "Task moved to To Do"
      )
    } catch (err) {
      console.error("Error toggling task status:", err)
      showToast("Failed to update status", "error")
      // Revert on error
      fetchTasks(currentPage, searchQuery, statusFilter)
    }
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      setActiveDropdownId(null)
      await updateTask(task.id, { status: newStatus })
      if (statusFilter !== "all") {
        fetchTasks(currentPage, searchQuery, statusFilter)
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        )
      }
      showToast(
        `Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`
      )
    } catch (err) {
      console.error("Error changing task status:", err)
      showToast("Failed to update status", "error")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return
    try {
      setSubmitting(true)
      await deleteTask(selectedTask.id)
      setIsDeleteModalOpen(false)
      setSelectedTask(null)
      showToast("Task deleted successfully")
      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1)
      } else {
        fetchTasks(currentPage, searchQuery, statusFilter)
      }
    } catch (err) {
      console.error("Error deleting task:", err)
      showToast("Failed to delete task", "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Header Area
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your daily work and stay on top of project deadlines.
          </p>
        </div>

        {/* Toolbar: Search, Status Filter, Add Task */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search tasks, projects..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl pl-9.5 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-3.5 py-2 bg-white border rounded-xl text-sm font-medium transition-all shadow-2xs cursor-pointer ${
                statusFilter !== "all"
                  ? "border-blue-300 text-blue-600 bg-blue-50/50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Status</span>
              {statusFilter !== "all" && (
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </div>
                {[
                  { id: "all", label: "All Statuses" },
                  { id: "todo", label: "To Do" },
                  { id: "in_progress", label: "In Progress" },
                  { id: "completed", label: "Completed" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.id)
                      setShowFilterMenu(false)
                      setCurrentPage(1)
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg text-left transition-colors cursor-pointer ${
                      statusFilter === item.id
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    {statusFilter === item.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Task Button */}
          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Loading & Empty States
         ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {searchQuery || statusFilter !== "all"
              ? "No matching tasks found"
              : "No tasks yet"}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search query or filters to find what you're looking for."
              : "Get started by creating your first task to track work and meet your deadlines."}
          </p>
          {searchQuery || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setCurrentPage(1)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────
            Task Table View (Pixel-perfect match to screenshot)
           ───────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">TASK NAME</th>
                  <th className="py-3.5 px-6">PROJECT</th>
                  <th className="py-3.5 px-6">DUE DATE</th>
                  <th className="py-3.5 px-6">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks.map((task) => {
                  const project = projectMap[task.project]
                  const projectName = project?.name || "No Project"
                  const isCompleted = task.status === "completed"
                  const statusConfig =
                    STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
                  const dotColor = getProjectColor(task.project, projectName)

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Task Name with Checkbox */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCompletion(task)}
                            className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                            aria-label={
                              isCompleted
                                ? "Mark as incomplete"
                                : "Mark as completed"
                            }
                          >
                            {isCompleted ? (
                              <div className="w-4.5 h-4.5 rounded bg-blue-600 flex items-center justify-center text-white">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4.5 h-4.5 rounded border-2 border-slate-300 hover:border-blue-500 bg-white transition-colors" />
                            )}
                          </button>

                          <div>
                            <div
                              className={`text-sm font-semibold tracking-tight transition-colors ${
                                isCompleted
                                  ? "line-through text-slate-400 font-medium"
                                  : "text-slate-900"
                              }`}
                            >
                              {task.name}
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {projectName}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            isCompleted ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          <Calendar
                            className={`w-3.5 h-3.5 ${
                              isCompleted ? "text-slate-300" : "text-slate-400"
                            }`}
                          />
                          <span>{formatDueDate(task.due_date)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                        >
                          {statusConfig.isCheck ? (
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
                            />
                          )}
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDropdownId(
                                activeDropdownId === task.id ? null : task.id
                              )
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeDropdownId === task.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in"
                            >
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Task</span>
                              </button>

                              <div className="border-t border-slate-100 my-1"></div>
                              <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Set Status
                              </div>
                              {["todo", "in_progress", "completed"].map(
                                (st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(task, st)
                                    }
                                    className={`flex items-center justify-between w-full px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                                      task.status === st
                                        ? "text-blue-600 font-semibold bg-blue-50/60"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span>{STATUS_CONFIG[st]?.label}</span>
                                    {task.status === st && (
                                      <Check className="w-3 h-3 text-blue-600" />
                                    )}
                                  </button>
                                )
                              )}

                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(task)}
                                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Task</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Pagination Controls (Inside Card Footer)
             ───────────────────────────────────────────────────────── */}
          {totalCount > 0 && (
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500 font-medium">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startEntry}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {endEntry}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {totalCount}
                </span>{" "}
                tasks
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-[#2563EB] text-white font-semibold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Create Task Modal
         ───────────────────────────────────────────────────────── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Task</h2>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Homepage UI Revision"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.name
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g. Requires final client approval"
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Project Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.project}
                  onChange={(e) =>
                    setFormData({ ...formData, project: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.project
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.project && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.project}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "todo", label: "To Do" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "completed", label: "Completed" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.id })}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                        formData.status === st.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.due_date
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.due_date && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.due_date}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Edit Task Modal
         ───────────────────────────────────────────────────────── */}
      {isEditModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Task</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedTask(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.name
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Project Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.project}
                  onChange={(e) =>
                    setFormData({ ...formData, project: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.project
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.project && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.project}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "todo", label: "To Do" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "completed", label: "Completed" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.id })}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                        formData.status === st.id
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.due_date
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.due_date && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.due_date}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setSelectedTask(null)
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Delete Confirmation Modal
         ───────────────────────────────────────────────────────── */}
      {isDeleteModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Task
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                "{selectedTask.name}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedTask(null)
                }}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
