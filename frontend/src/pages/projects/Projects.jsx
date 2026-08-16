import { useState, useEffect, useRef, useMemo } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  Calendar,
  LayoutGrid,
  List,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react"

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectService"
import { getClients } from "../../services/clientService"

// ─────────────────────────────────────────────────────────────
// Status Definitions matching Backend values
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  in_progress: {
    label: "In Progress",
    accentColor: "bg-blue-600",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    progressColor: "bg-blue-600",
    progressTextColor: "text-blue-600",
  },
  completed: {
    label: "Completed",
    accentColor: "bg-indigo-600",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    progressColor: "bg-indigo-600",
    progressTextColor: "text-indigo-600",
  },
  on_hold: {
    label: "On Hold",
    accentColor: "bg-rose-600",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    progressColor: "bg-rose-500",
    progressTextColor: "text-rose-600",
  },
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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

function getInitials(name) {
  if (!name) return "CL"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_BG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
]

function getAvatarColor(name = "") {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length
  return AVATAR_BG_COLORS[index]
}

// ─────────────────────────────────────────────────────────────
// Projects Component
// ─────────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & View mode
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid") // "grid" | "list"
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  // Toast / notification
  const [toast, setToast] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    status: "in_progress",
    progress: 0,
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
  // Fetch Data from APIs
  // ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsData, clientsData] = await Promise.all([
        getProjects(),
        getClients(),
      ])

      const projectList = projectsData.results || projectsData || []
      const clientList = clientsData.results || clientsData || []

      setProjects(Array.isArray(projectList) ? projectList : [])
      setClients(Array.isArray(clientList) ? clientList : [])
    } catch (err) {
      console.error("Failed to load projects or clients:", err)
      showToast("Failed to load projects from server", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Lookup map: client ID -> client object
  const clientMap = useMemo(() => {
    const map = {}
    clients.forEach((c) => {
      if (c && c.id !== undefined) {
        map[c.id] = c
      }
    })
    return map
  }, [clients])

  // ───────────────────────────────────────────────────────────
  // Filtering
  // ───────────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const search = searchQuery.toLowerCase().trim()
      const client = clientMap[project.client]

      const nameMatch = project.name?.toLowerCase().includes(search)
      const clientNameMatch = client?.name?.toLowerCase().includes(search)
      const clientCompanyMatch = client?.company?.toLowerCase().includes(search)

      const matchesSearch = !search || nameMatch || clientNameMatch || clientCompanyMatch
      const matchesStatus = statusFilter === "all" || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, searchQuery, statusFilter, clientMap])

  // ───────────────────────────────────────────────────────────
  // Form Handling
  // ───────────────────────────────────────────────────────────
  const openNewModal = () => {
    setFormData({
      name: "",
      client: clients.length > 0 ? clients[0].id : "",
      status: "in_progress",
      progress: 0,
      due_date: new Date().toISOString().split("T")[0],
    })
    setFormErrors({})
    setIsNewModalOpen(true)
  }

  const openEditModal = (project) => {
    setSelectedProject(project)
    setFormData({
      name: project.name || "",
      client: project.client || "",
      status: project.status || "in_progress",
      progress: project.progress || 0,
      due_date: project.due_date || "",
    })
    setFormErrors({})
    setIsEditModalOpen(true)
    setActiveDropdownId(null)
  }

  const openDeleteModal = (project) => {
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
    setActiveDropdownId(null)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = "Project name is required"
    }
    if (!formData.client) {
      errors.client = "Please select a client"
    }
    if (!formData.due_date) {
      errors.due_date = "Due date is required"
    }
    if (formData.progress < 0 || formData.progress > 100) {
      errors.progress = "Progress must be between 0 and 100"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const created = await createProject({
        name: formData.name.trim(),
        client: Number(formData.client),
        status: formData.status,
        progress: Number(formData.progress),
        due_date: formData.due_date,
      })
      setProjects((prev) => [created, ...prev])
      setIsNewModalOpen(false)
      showToast("Project created successfully")
    } catch (err) {
      console.error("Error creating project:", err)
      const apiErrors = err.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        setFormErrors(apiErrors)
      } else {
        showToast("Failed to create project", "error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm() || !selectedProject) return

    try {
      setSubmitting(true)
      const updated = await updateProject(selectedProject.id, {
        name: formData.name.trim(),
        client: Number(formData.client),
        status: formData.status,
        progress: Number(formData.progress),
        due_date: formData.due_date,
      })
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? updated : p))
      )
      setIsEditModalOpen(false)
      setSelectedProject(null)
      showToast("Project updated successfully")
    } catch (err) {
      console.error("Error updating project:", err)
      const apiErrors = err.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        setFormErrors(apiErrors)
      } else {
        showToast("Failed to update project", "error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (project, newStatus) => {
    try {
      setActiveDropdownId(null)
      await updateProject(project.id, { status: newStatus })
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      )
      showToast(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
    } catch (err) {
      console.error("Error changing project status:", err)
      showToast("Failed to update status", "error")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return
    try {
      setSubmitting(true)
      await deleteProject(selectedProject.id)
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id))
      setIsDeleteModalOpen(false)
      setSelectedProject(null)
      showToast("Project deleted successfully")
    } catch (err) {
      console.error("Error deleting project:", err)
      showToast("Failed to delete project", "error")
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
          Header Area (matching screenshot)
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track your active engagements.
          </p>
        </div>

        {/* Toolbar: Search, Grid/List toggle, Filter, Add Project */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl pl-9.5 pr-4 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grid / List View Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Dropdown */}
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
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter</span>
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
                  { id: "all", label: "All Projects" },
                  { id: "in_progress", label: "In Progress" },
                  { id: "completed", label: "Completed" },
                  { id: "on_hold", label: "On Hold" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setStatusFilter(item.id)
                      setShowFilterMenu(false)
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

          {/* Add Project Button */}
          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Loading & Empty States
         ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {searchQuery || statusFilter !== "all"
              ? "No matching projects found"
              : "No projects yet"}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search query or filters to find what you're looking for."
              : "Get started by creating your first client project to track progress and deadlines."}
          </p>
          {searchQuery || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
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
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─────────────────────────────────────────────────────────
            Grid View (Pixel-perfect match to screenshot)
           ───────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const client = clientMap[project.client]
            const clientName = client?.name || "Client"
            const clientCompany = client?.company || clientName
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress
            const isCompleted = project.status === "completed"

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all relative flex flex-col justify-between overflow-hidden group"
              >
                {/* Top colored accent line */}
                <div className={`h-1 w-full ${statusConfig.accentColor}`} />

                <div className="p-6">
                  {/* Card Header: Status Badge & 3-Dot Menu */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
                    >
                      {project.status === "on_hold" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-rose-300/40"></span>
                      )}
                      {statusConfig.label}
                    </span>

                    {/* Three-dot menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdownId(
                            activeDropdownId === project.id ? null : project.id
                          )
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdownId === project.id && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in"
                        >
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Project</span>
                          </button>

                          <div className="border-t border-slate-100 my-1"></div>
                          <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Set Status
                          </div>
                          {["in_progress", "completed", "on_hold"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(project, st)}
                              className={`flex items-center justify-between w-full px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                                project.status === st
                                  ? "text-blue-600 font-semibold bg-blue-50/60"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span>{STATUS_CONFIG[st]?.label}</span>
                              {project.status === st && (
                                <Check className="w-3 h-3 text-blue-600" />
                              )}
                            </button>
                          ))}

                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(project)}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Name */}
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-1">
                    {project.name}
                  </h3>

                  {/* Client Info */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mb-6">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{clientCompany}</span>
                  </div>

                  {/* Progress Bar Section */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">Progress</span>
                      <span className={`font-bold ${statusConfig.progressTextColor}`}>
                        {project.progress ?? 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${statusConfig.progressColor}`}
                        style={{
                          width: `${Math.min(Math.max(project.progress ?? 0, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Due Date & Client Avatar/Initials */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Calendar className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {isCompleted ? "" : "Due "}
                      {formatDueDate(project.due_date)}
                    </span>
                  </div>

                  {/* Client avatar or initials */}
                  <div className="shrink-0" title={clientName}>
                    {client?.avatar ? (
                      <img
                        src={client.avatar}
                        alt={clientName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold tracking-tight shadow-2xs ${getAvatarColor(
                          clientName
                        )}`}
                      >
                        {getInitials(clientName)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────
            List View
           ───────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Project Name</th>
                  <th className="py-3.5 px-6">Client</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Progress</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProjects.map((project) => {
                  const client = clientMap[project.client]
                  const clientName = client?.name || "Client"
                  const clientCompany = client?.company || clientName
                  const statusConfig =
                    STATUS_CONFIG[project.status] || STATUS_CONFIG.in_progress

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Project Name */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {project.name}
                      </td>

                      {/* Client */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          {client?.avatar ? (
                            <img
                              src={client.avatar}
                              alt={clientName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                                clientName
                              )}`}
                            >
                              {getInitials(clientName)}
                            </div>
                          )}
                          <div>
                            <div className="text-slate-800 font-medium">
                              {clientCompany}
                            </div>
                            {client?.company && (
                              <div className="text-xs text-slate-400">
                                {clientName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
                        >
                          {project.status === "on_hold" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          )}
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-6">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              {project.progress ?? 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${statusConfig.progressColor}`}
                              style={{
                                width: `${Math.min(
                                  Math.max(project.progress ?? 0, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due {formatDueDate(project.due_date)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(project)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(project)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Create Project Modal
         ───────────────────────────────────────────────────────── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Project</h2>
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
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Website Redesign"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.name ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Client Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Client <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.client}
                  onChange={(e) =>
                    setFormData({ ...formData, client: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.client ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.client && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.client}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "in_progress", label: "In Progress" },
                    { id: "completed", label: "Completed" },
                    { id: "on_hold", label: "On Hold" },
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

              {/* Progress */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Progress ({formData.progress}%)
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: Number(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
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
                    formErrors.due_date ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
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
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Edit Project Modal
         ───────────────────────────────────────────────────────── */}
      {isEditModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Project</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedProject(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.name ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Client Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Client <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.client}
                  onChange={(e) =>
                    setFormData({ ...formData, client: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                    formErrors.client ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
                {formErrors.client && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.client}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "in_progress", label: "In Progress" },
                    { id: "completed", label: "Completed" },
                    { id: "on_hold", label: "On Hold" },
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

              {/* Progress */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Progress ({formData.progress}%)
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: Number(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
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
                    formErrors.due_date ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
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
                    setSelectedProject(null)
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
      {isDeleteModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Project
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                "{selectedProject.name}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedProject(null)
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
