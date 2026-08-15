import { useState, useEffect, useRef } from "react"
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  X,
  Check,
  Building,
  Mail,
  User,
  Upload,
  AlertTriangle,
} from "lucide-react"

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../services/clientService"


// ─────────────────────────────────────────────────────────────
// Demo data
// ─────────────────────────────────────────────────────────────

const INITIAL_DEMO_CLIENTS = [
  {
    id: 1,
    name: "Sarah Williams",
    email: "sarah@novatech.io",
    company: "NovaTech",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    active_projects: 3,
    total_revenue: 12450.0,
    status: "active",
  },
  {
    id: 2,
    name: "John Carter",
    email: "john@acmestudio.co",
    company: "Acme Studio",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    active_projects: 1,
    total_revenue: 4200.0,
    status: "active",
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily@bluepixel.dev",
    company: "BluePixel Agency",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    active_projects: 0,
    total_revenue: 18900.0,
    status: "inactive",
  },
  {
    id: 4,
    name: "Michael Brown",
    email: "michael.b@freelance.com",
    company: "",
    avatar: null,
    active_projects: 2,
    total_revenue: 8750.0,
    status: "active",
  },
]


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}


function getInitials(name) {
  if (!name) return "CL"

  const parts = name.trim().split(" ")

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}


// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function Clients() {
  const [clients, setClients] = useState(INITIAL_DEMO_CLIENTS)
  const [loading, setLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("default")
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const [selectedClient, setSelectedClient] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  // Form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    avatar: null,
    status: "active",
  })

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const filterRef = useRef(null)
  const dropdownRef = useRef(null)
  const fileInputRef = useRef(null)

  // ───────────────────────────────────────────────────────────
  // Close dropdowns when clicking outside
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target)
      ) {
        setShowFilterMenu(false)
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setActiveDropdownId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])


  // ───────────────────────────────────────────────────────────
  // Fetch clients
  // ───────────────────────────────────────────────────────────

  const fetchClients = async () => {
    try {
      setLoading(true)

      const data = await getClients()

      const results = data.results || data

      if (Array.isArray(results)) {
        setClients(results)
      } else {
        setClients([])
      }
    } catch (err) {
      console.warn(
        "Backend API error. Using demo clients.",
        err
      )

      setClients(INITIAL_DEMO_CLIENTS)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchClients()
  }, [])


  // ───────────────────────────────────────────────────────────
  // Filter
  // ───────────────────────────────────────────────────────────

  const filteredClients = clients.filter((client) => {
    const search = searchQuery.toLowerCase()

    const matchesSearch =
      client.name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.company?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === "all"
        ? true
        : client.status === statusFilter

    return matchesSearch && matchesStatus
  })


  // ───────────────────────────────────────────────────────────
  // Sorting
  // ───────────────────────────────────────────────────────────

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    }

    if (sortBy === "revenue-desc") {
      return (
        (b.total_revenue || 0) -
        (a.total_revenue || 0)
      )
    }

    if (sortBy === "revenue-asc") {
      return (
        (a.total_revenue || 0) -
        (b.total_revenue || 0)
      )
    }

    if (sortBy === "projects") {
      return (
        (b.active_projects || 0) -
        (a.active_projects || 0)
      )
    }

    return 0
  })


  // ───────────────────────────────────────────────────────────
  // Pagination
  // ───────────────────────────────────────────────────────────

  const totalPages = Math.max(
    1,
    Math.ceil(sortedClients.length / itemsPerPage)
  )

  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )


  // ───────────────────────────────────────────────────────────
  // Image selection
  // ───────────────────────────────────────────────────────────

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFormErrors({
        ...formErrors,
        avatar: "Please select an image file.",
      })

      return
    }

    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      setFormErrors({
        ...formErrors,
        avatar: "Image must be smaller than 5MB.",
      })

      return
    }

    setFormErrors((prev) => ({
      ...prev,
      avatar: "",
    }))

    setFormData((prev) => ({
      ...prev,
      avatar: file,
    }))

    const previewUrl = URL.createObjectURL(file)

    setAvatarPreview(previewUrl)
  }


  const handleRemoveAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: null,
    }))

    setAvatarPreview(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }


  // ───────────────────────────────────────────────────────────
  // New client
  // ───────────────────────────────────────────────────────────

  const handleOpenNewModal = () => {
    setFormData({
      name: "",
      email: "",
      company: "",
      avatar: null,
      status: "active",
    })

    setAvatarPreview(null)
    setFormErrors({})
    setIsNewModalOpen(true)
  }


  // ───────────────────────────────────────────────────────────
  // Edit client
  // ───────────────────────────────────────────────────────────

  const handleOpenEditModal = (client) => {
    setSelectedClient(client)

    setFormData({
      name: client.name || "",
      email: client.email || "",
      company: client.company || "",
      avatar: null,
      status: client.status || "active",
    })

    setAvatarPreview(client.avatar || null)

    setFormErrors({})
    setIsEditModalOpen(true)
    setActiveDropdownId(null)
  }


  // ───────────────────────────────────────────────────────────
  // View client
  // ───────────────────────────────────────────────────────────

  const handleOpenViewModal = (client) => {
    setSelectedClient(client)
    setIsViewModalOpen(true)
    setActiveDropdownId(null)
  }


  // ───────────────────────────────────────────────────────────
  // Delete client
  // ───────────────────────────────────────────────────────────

  const handleOpenDeleteModal = (client) => {
    setSelectedClient(client)
    setIsDeleteModalOpen(true)
    setActiveDropdownId(null)
  }


  // ───────────────────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────────────────

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = "Client name is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    setFormErrors(errors)

    return Object.keys(errors).length === 0
  }


  // ───────────────────────────────────────────────────────────
  // Create client
  // ───────────────────────────────────────────────────────────

 const handleCreateSubmit = async (e) => {
  e.preventDefault()

  if (!validateForm()) return

  setSubmitting(true)

  try {
    const newClient = await createClient(formData)

    setClients((prev) => [newClient, ...prev])

    setIsNewModalOpen(false)

    // Reset form
    setFormData({
      name: "",
      email: "",
      company: "",
      avatar: "",
      status: "active",
    })

    setFormErrors({})
  } catch (err) {
    console.error("Error creating client:", err)

    const message =
      err.response?.data?.detail ||
      err.response?.data?.avatar?.[0] ||
      err.response?.data?.name?.[0] ||
      err.response?.data?.email?.[0] ||
      "Failed to create client. Please try again."

    setFormErrors({
      submit: message,
    })
  } finally {
    setSubmitting(false)
  }
}


  // ───────────────────────────────────────────────────────────
  // Edit client
  // ───────────────────────────────────────────────────────────

  const handleEditSubmit = async (e) => {
  e.preventDefault()

  if (!validateForm()) return

  setSubmitting(true)

  try {
    const updatedClient = await updateClient(selectedClient.id, formData)

    setClients((prev) =>
      prev.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              ...updatedClient,
            }
          : client
      )
    )

    setIsEditModalOpen(false)
    setSelectedClient(null)
    setFormErrors({})
  } catch (err) {
    console.error("Error updating client:", err)

    if (err.response?.data) {
      console.error("Backend error:", err.response.data)
    }

    setFormErrors({
      submit:
        err.response?.data?.detail ||
        "Failed to update client. Please try again.",
    })
  } finally {
    setSubmitting(false)
  }
}

  // ───────────────────────────────────────────────────────────
  // Delete client
  // ───────────────────────────────────────────────────────────

  const handleDeleteSubmit = async () => {
    setSubmitting(true)

    try {
      await deleteClient(selectedClient.id)

      setClients((prev) =>
        prev.filter(
          (client) =>
            client.id !== selectedClient.id
        )
      )

      setIsDeleteModalOpen(false)
      setSelectedClient(null)
    } catch (err) {
      console.error("Error deleting client:", err)
    } finally {
      setSubmitting(false)
    }
  }


  // ───────────────────────────────────────────────────────────
  // Reusable client avatar
  // ───────────────────────────────────────────────────────────

  const Avatar = ({
    client,
    size = "w-10 h-10",
  }) => {
    if (client?.avatar) {
      return (
        <img
          src={client.avatar}
          alt={client.name}
          className={`${size} rounded-full object-cover shrink-0 border border-slate-100`}
        />
      )
    }

    return (
      <div
        className={`${size} rounded-full bg-[#E0E7FF] text-[#4338CA] font-semibold text-xs flex items-center justify-center shrink-0 border border-indigo-100`}
      >
        {getInitials(client?.name)}
      </div>
    )
  }


  // ───────────────────────────────────────────────────────────
  // Avatar picker
  // ───────────────────────────────────────────────────────────

  const AvatarPicker = () => {
    const displayAvatar =
      avatarPreview ||
      (typeof formData.avatar === "string"
        ? formData.avatar
        : null)

    return (
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Profile Image{" "}
          <span className="text-slate-400 font-normal">
            (optional)
          </span>
        </label>

        <div className="flex items-center gap-4">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Avatar preview"
              className="w-14 h-14 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#E0E7FF] text-[#4338CA] font-semibold text-sm flex items-center justify-center border border-indigo-100">
              {getInitials(formData.name)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="client-avatar-upload"
            />

            <label
              htmlFor="client-avatar-upload"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose Image
            </label>

            {displayAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          JPG, PNG or other image formats. Maximum 5MB.
        </p>

        {formErrors.avatar && (
          <p className="text-xs text-red-500 mt-1">
            {formErrors.avatar}
          </p>
        )}
      </div>
    )
  }


  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-[1240px] mx-auto min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Clients
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage your client relationships and view their status.
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search clients..."
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>


          {/* Filter */}
          <div
            className="relative"
            ref={filterRef}
          >
            <button
              type="button"
              onClick={() =>
                setShowFilterMenu(!showFilterMenu)
              }
              className={`flex items-center gap-2 px-3.5 py-2 bg-white border rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer ${
                statusFilter !== "all" ||
                sortBy !== "default"
                  ? "border-blue-500 text-blue-600 bg-blue-50/50"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Filter className="w-4 h-4 text-slate-500" />

              <span>Filter</span>

              {(statusFilter !== "all" ||
                sortBy !== "default") && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30">

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Status
                </div>

                <div className="space-y-1">
                  {[
                    {
                      id: "all",
                      label: "All Statuses",
                    },
                    {
                      id: "active",
                      label: "Active Only",
                    },
                    {
                      id: "inactive",
                      label: "Inactive Only",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.id)
                        setShowFilterMenu(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        statusFilter === option.id
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>

                      {statusFilter === option.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 my-2.5" />

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Sort By
                </div>

                <div className="space-y-1">
                  {[
                    {
                      id: "default",
                      label: "Default Order",
                    },
                    {
                      id: "name",
                      label: "Client Name",
                    },
                    {
                      id: "revenue-desc",
                      label: "Highest Revenue",
                    },
                    {
                      id: "projects",
                      label: "Active Projects",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSortBy(option.id)
                        setShowFilterMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        sortBy === option.id
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>

                      {sortBy === option.id && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                {(statusFilter !== "all" ||
                  sortBy !== "default") && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all")
                      setSortBy("default")
                      setShowFilterMenu(false)
                    }}
                    className="w-full mt-2.5 pt-2 border-t border-slate-100 text-center text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>


          {/* New Client */}
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium shadow-xs shadow-blue-500/20 transition-all cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />

            <span>New Client</span>
          </button>
        </div>
      </div>


      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead>
              <tr className="border-b border-slate-200">

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CLIENT NAME
                </th>

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  COMPANY
                </th>

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  ACTIVE PROJECTS
                </th>

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TOTAL REVENUE
                </th>

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>

                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  ACTIONS
                </th>

              </tr>
            </thead>


            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    Loading clients...
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    No clients found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const isIndependent =
                    !client.company ||
                    client.company.trim() === ""

                  const isActive =
                    client.status === "active"

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >

                      {/* Client */}
                      <td className="py-4 px-6">

                        <div className="flex items-center gap-3.5">

                          <Avatar client={client} />

                          <div className="min-w-0">

                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {client.name}
                            </p>

                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {client.email}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Company */}
                      <td className="py-4 px-6">

                        {isIndependent ? (
                          <span className="text-sm text-slate-400 italic font-light">
                            Independent
                          </span>
                        ) : (
                          <span className="text-sm text-slate-700 font-medium">
                            {client.company}
                          </span>
                        )}

                      </td>


                      {/* Projects */}
                      <td className="py-4 px-6 text-center">

                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F1F5F9] text-slate-700 text-xs font-semibold">
                          {client.active_projects ?? 0}
                        </span>

                      </td>


                      {/* Revenue */}
                      <td className="py-4 px-6">

                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(client.total_revenue)}
                        </span>

                      </td>


                      {/* Status */}
                      <td className="py-4 px-6">

                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#64748B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                            <span>Inactive</span>
                          </span>
                        )}

                      </td>


                      {/* Actions */}
                      <td className="py-4 px-6 text-center relative">

                        <div className="inline-block relative">

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()

                              setActiveDropdownId(
                                activeDropdownId === client.id
                                  ? null
                                  : client.id
                              )
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>


                          {activeDropdownId === client.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-left"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenViewModal(client)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                View Details
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditModal(client)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                Edit Client
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(client)
                                }
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                Delete Client
                              </button>

                            </div>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                })
              )}

            </tbody>

          </table>

        </div>


        {/* Pagination */}
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white">

          <p className="text-xs text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-700">
              {sortedClients.length === 0
                ? 0
                : (currentPage - 1) * itemsPerPage + 1}
            </span>

            {" "}to{" "}

            <span className="font-semibold text-slate-700">
              {Math.min(
                currentPage * itemsPerPage,
                sortedClients.length
              )}
            </span>

            {" "}of{" "}

            <span className="font-semibold text-slate-700">
              {sortedClients.length}
            </span>

            {" "}entries

          </p>


          <div className="flex items-center gap-1.5">

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((p) =>
                  Math.max(1, p - 1)
                )
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>


            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() =>
                  setCurrentPage(pageNum)
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold"
                    : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}


            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(totalPages, p + 1)
                )
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>

          </div>

        </div>

      </div>


      {/* ═══════════════════════════════════════════════════════ */}
      {/* CREATE CLIENT MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}

      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">

          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">

              <h2 className="text-lg font-bold text-slate-900">
                Add New Client
              </h2>

              <button
                type="button"
                onClick={() =>
                  setIsNewModalOpen(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            <form
              onSubmit={handleCreateSubmit}
              className="space-y-4 mt-4"
            >

              {/* Name */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Client Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Sarah Williams"
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                      formErrors.name
                        ? "border-red-300 focus:ring-red-200"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                  />

                </div>

                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.name}
                  </p>
                )}

              </div>


              {/* Email */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="e.g. sarah@novatech.io"
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                      formErrors.email
                        ? "border-red-300 focus:ring-red-200"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                  />

                </div>

                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.email}
                  </p>
                )}

              </div>


              {/* Company */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company Name{" "}
                  <span className="text-slate-400 font-normal">
                    (optional)
                  </span>
                </label>

                <div className="relative">

                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: e.target.value,
                      })
                    }
                    placeholder="e.g. NovaTech"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                </div>

              </div>


              {/* Avatar */}
              <AvatarPicker />


              {/* Status */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>

                <div className="flex gap-3">

                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">

                    <input
                      type="radio"
                      name="new-status"
                      checked={
                        formData.status === "active"
                      }
                      onChange={() =>
                        setFormData({
                          ...formData,
                          status: "active",
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />

                    Active

                  </label>


                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">

                    <input
                      type="radio"
                      name="new-status"
                      checked={
                        formData.status === "inactive"
                      }
                      onChange={() =>
                        setFormData({
                          ...formData,
                          status: "inactive",
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />

                    Inactive

                  </label>

                </div>

              </div>


              {/* Error message */}
              {formErrors.submit && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.submit}
                </p>
              )}


              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">

                <button
                  type="button"
                  onClick={() =>
                    setIsNewModalOpen(false)
                  }
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Add Client"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ═══════════════════════════════════════════════════════ */}
      {/* EDIT CLIENT MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}

      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">

          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">

              <h2 className="text-lg font-bold text-slate-900">
                Edit Client
              </h2>

              <button
                type="button"
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            <form
              onSubmit={handleEditSubmit}
              className="space-y-4 mt-4"
            >

              {/* Name */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Client Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                </div>

              </div>


              {/* Email */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                </div>

              </div>


              {/* Company */}
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company Name
                </label>

                <div className="relative">

                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company: e.target.value,
                      })
                    }
                    placeholder="Leave empty for Independent"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                </div>

              </div>


              {/* Avatar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Profile Image{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>

                <div className="flex items-center gap-3">
                  {formData.avatar instanceof File ? (
                    <img
                      src={URL.createObjectURL(formData.avatar)}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                    />
                  ) : selectedClient?.avatar ? (
                    <img
                      src={selectedClient.avatar}
                      alt={selectedClient.name}
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                      {getInitials(formData.name)}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]

                      if (!file) return

                      if (file.size > 5 * 1024 * 1024) {
                        setFormErrors({
                          ...formErrors,
                          avatar: "Image size must be less than 5MB.",
                        })
                        return
                      }

                      setFormData({
                        ...formData,
                        avatar: file,
                      })

                      setFormErrors({
                        ...formErrors,
                        avatar: "",
                      })
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Choose Image
                  </button>

                  {(formData.avatar || selectedClient?.avatar) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          avatar: null,
                        })
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {formErrors.avatar && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.avatar}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>

                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      checked={
                        formData.status === "active"
                      }
                      onChange={() =>
                        setFormData({
                          ...formData,
                          status: "active",
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Active
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      checked={
                        formData.status === "inactive"
                      }
                      onChange={() =>
                        setFormData({
                          ...formData,
                          status: "inactive",
                        })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Inactive
                  </label>
                </div>
              </div>

              {/* Error message */}
              {formErrors.submit && (
                <p className="text-xs text-red-500 mt-2">
                  {formErrors.submit}
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setIsEditModalOpen(false)
                  }
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}


      {/* ═══════════════════════════════════════════════════════ */}
      {/* DELETE MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}

      {isDeleteModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">

          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">

            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Delete Client?
            </h3>

            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-slate-800">
                {selectedClient.name}
              </span>
              ? This action cannot be undone.
            </p>


            <div className="flex items-center justify-center gap-3 mt-6">

              <button
                type="button"
                onClick={() =>
                  setIsDeleteModalOpen(false)
                }
                className="w-1/2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteSubmit}
                className="w-1/2 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {submitting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ═══════════════════════════════════════════════════════ */}
      {/* VIEW MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}

      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">

          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">

              <h2 className="text-lg font-bold text-slate-900">
                Client Overview
              </h2>

              <button
                type="button"
                onClick={() =>
                  setIsViewModalOpen(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            <div className="mt-5 flex items-center gap-4">

              <Avatar
                client={selectedClient}
                size="w-16 h-16"
              />

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  {selectedClient.name}
                </h3>

                <p className="text-xs text-slate-500">
                  {selectedClient.email}
                </p>

                <div className="mt-1.5">

                  {selectedClient.status === "active" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active Client
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Inactive Client
                    </span>
                  )}

                </div>

              </div>

            </div>


            <div className="grid grid-cols-2 gap-3 mt-6">

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">

                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Company
                </p>

                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {selectedClient.company ||
                    "Independent"}
                </p>

              </div>


              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">

                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Active Projects
                </p>

                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {selectedClient.active_projects ?? 0}
                </p>

              </div>


              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 col-span-2">

                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                  Total Revenue
                </p>

                <p className="text-base font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    selectedClient.total_revenue
                  )}
                </p>

              </div>

            </div>


            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">

              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false)
                  handleOpenEditModal(
                    selectedClient
                  )
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Edit Details
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsViewModalOpen(false)
                }
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}