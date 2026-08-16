import { useState, useEffect, useRef, useMemo } from "react"
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
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Download,
  Clock,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
} from "lucide-react"

import {
  getInvoices,
  getInvoice,
  getInvoiceSummary,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
  downloadInvoicePdf,
} from "../../services/invoiceService"
import { getClients } from "../../services/clientService"

// ─────────────────────────────────────────────────────────────
// Status Definitions matching Backend values
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    id: "draft",
    label: "Draft",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    badgeBorder: "border-slate-200",
  },
  sent: {
    id: "sent",
    label: "Sent",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200/60",
  },
  paid: {
    id: "paid",
    label: "Paid",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200/60",
  },
  overdue: {
    id: "overdue",
    label: "Overdue",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200/60",
  },
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function formatDate(dateString) {
  if (!dateString) return "—"
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
// Invoices Component
// ─────────────────────────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    overdue: 0,
    outstanding: 0,
    paid_this_month: 0,
  })

  // View mode: "list" | "detail"
  const [activeView, setActiveView] = useState("list")
  const [viewingInvoice, setViewingInvoice] = useState(null)

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState("all") // "all" | "paid" | "overdue" | "draft"
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination (client-side slicing over fetched items or API response)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    client: "",
    invoice_date: "",
    due_date: "",
    tax_rate: 0,
    notes: "",
    items: [{ description: "", quantity: 1, rate: 0 }],
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const filterRef = useRef(null)
  const dropdownRef = useRef(null)

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
  // Data Fetching
  // ───────────────────────────────────────────────────────────
  const fetchInvoicesData = async () => {
    try {
      setLoading(true)
      const [invoicesData, clientsData, summaryData] = await Promise.all([
        getInvoices({ page_size: 50 }),
        getClients({ page_size: 50 }),
        getInvoiceSummary().catch(() => null),
      ])

      const invoiceList = invoicesData.results || invoicesData || []
      const clientList = clientsData.results || clientsData || []

      setInvoices(Array.isArray(invoiceList) ? invoiceList : [])
      setClients(Array.isArray(clientList) ? clientList : [])

      if (summaryData) {
        setSummary(summaryData)
      }
    } catch (err) {
      console.error("Failed to load invoices data:", err)
      showToast("Failed to load invoices from server", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoicesData()
  }, [])

  // Client lookup map
  const clientMap = useMemo(() => {
    const map = {}
    clients.forEach((c) => {
      if (c && c.id !== undefined) {
        map[c.id] = c
      }
    })
    return map
  }, [clients])

  // Count calculations for summary cards
  const summaryCounts = useMemo(() => {
    let overdueCount = 0
    let outstandingCount = 0

    invoices.forEach((inv) => {
      const effectiveStatus = inv.effective_status || inv.status
      // effective_status === "overdue" means stored status="sent" + due_date in the past
      if (effectiveStatus === "overdue") {
        overdueCount++
      }
      // Outstanding = all sent invoices (stored status="sent"), which covers
      // both on-time (effective_status="sent") and overdue (effective_status="overdue")
      const storedStatus = inv.status
      if (storedStatus === "sent") {
        outstandingCount++
      }
    })

    return { overdueCount, outstandingCount }
  }, [invoices])

  // ───────────────────────────────────────────────────────────
  // Filtering & Sorting
  // ───────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const status = inv.effective_status || inv.status
      const client = clientMap[inv.client]
      const clientName = client?.name || ""
      const clientCompany = client?.company || ""
      const search = searchQuery.toLowerCase().trim()

      const matchesSearch =
        !search ||
        inv.invoice_number?.toLowerCase().includes(search) ||
        clientName.toLowerCase().includes(search) ||
        clientCompany.toLowerCase().includes(search)

      // Tab filter
      let matchesTab = true
      if (activeTab === "paid") {
        matchesTab = status === "paid"
      } else if (activeTab === "overdue") {
        matchesTab = status === "overdue"
      } else if (activeTab === "draft") {
        matchesTab = status === "draft"
      }

      // Dropdown status filter
      let matchesStatus = true
      if (statusFilter !== "all") {
        matchesStatus = status === statusFilter
      }

      return matchesSearch && matchesTab && matchesStatus
    })
  }, [invoices, searchQuery, activeTab, statusFilter, clientMap])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage))
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredInvoices.slice(start, start + itemsPerPage)
  }, [filteredInvoices, currentPage, itemsPerPage])

  const startEntry =
    filteredInvoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endEntry = Math.min(currentPage * itemsPerPage, filteredInvoices.length)

  // ───────────────────────────────────────────────────────────
  // Form Actions: Add / Edit / Items calculation
  // ───────────────────────────────────────────────────────────
  const openNewModal = () => {
    const today = new Date().toISOString().split("T")[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    setFormData({
      client: clients.length > 0 ? clients[0].id : "",
      invoice_date: today,
      due_date: dueDate,
      status: "sent",
      tax_rate: 0,
      notes: "Please process payment within 30 days of receiving this invoice. Thank you for your business!",
      items: [{ description: "", quantity: 1, rate: 0 }],
    })
    setIsEditMode(false)
    setSelectedInvoice(null)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (inv) => {
    setSelectedInvoice(inv)
    setFormData({
      client: inv.client || "",
      invoice_date: inv.invoice_date || "",
      due_date: inv.due_date || "",
      status: inv.status || "sent",
      tax_rate: inv.tax_rate ?? 0,
      notes: inv.notes || "",
      items:
        inv.items && inv.items.length > 0
          ? inv.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              rate: it.rate,
            }))
          : [{ description: "", quantity: 1, rate: 0 }],
    })
    setIsEditMode(true)
    setFormErrors({})
    setIsModalOpen(true)
    setActiveDropdownId(null)
  }

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      setActiveDropdownId(null)
      if (newStatus === "paid") {
        await handleMarkAsPaid(invoice.id)
      } else {
        const updated = await updateInvoice(invoice.id, { status: newStatus })
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoice.id ? updated : inv))
        )
        if (viewingInvoice?.id === invoice.id) {
          setViewingInvoice(updated)
        }
        showToast(
          `Invoice status updated to ${
            STATUS_CONFIG[newStatus]?.label || newStatus
          }`
        )
        getInvoiceSummary().then((s) => s && setSummary(s))
      }
    } catch (err) {
      console.error("Error changing invoice status:", err)
      showToast("Failed to update status", "error")
    }
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0 }],
    }))
  }

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      showToast("Invoice must have at least one item", "error")
      return
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  // Live modal totals calculation
  const calculatedSubtotal = useMemo(() => {
    return formData.items.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0
      const rate = parseFloat(item.rate) || 0
      return acc + qty * rate
    }, 0)
  }, [formData.items])

  const calculatedTaxAmount = useMemo(() => {
    const taxRate = parseFloat(formData.tax_rate) || 0
    return (calculatedSubtotal * taxRate) / 100
  }, [calculatedSubtotal, formData.tax_rate])

  const calculatedGrandTotal = calculatedSubtotal + calculatedTaxAmount

  const validateForm = () => {
    const errors = {}
    if (!formData.client) {
      errors.client = "Please select a client"
    }
    if (!formData.invoice_date) {
      errors.invoice_date = "Invoice date is required"
    }
    if (!formData.due_date) {
      errors.due_date = "Due date is required"
    }
    if (
      formData.invoice_date &&
      formData.due_date &&
      formData.due_date < formData.invoice_date
    ) {
      errors.due_date = "Due date cannot be earlier than invoice date"
    }
    if (!formData.items || formData.items.length === 0) {
      errors.items = "At least one item is required"
    } else {
      const hasEmptyDesc = formData.items.some((it) => !it.description.trim())
      if (hasEmptyDesc) {
        errors.items = "All items must have a description"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      if (isEditMode && selectedInvoice) {
        const updated = await updateInvoice(selectedInvoice.id, formData)
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === selectedInvoice.id ? updated : inv))
        )
        if (viewingInvoice?.id === selectedInvoice.id) {
          setViewingInvoice(updated)
        }
        showToast("Invoice updated successfully")
      } else {
        await createInvoice(formData)
        await fetchInvoicesData()
        showToast("Invoice created successfully")
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving invoice:", err)
      const apiErrors = err.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        setFormErrors(apiErrors)
      } else {
        showToast("Failed to save invoice", "error")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Mark as Paid
  // ───────────────────────────────────────────────────────────
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setActiveDropdownId(null)
      const updated = await markInvoicePaid(invoiceId)
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? updated : inv))
      )
      if (viewingInvoice?.id === invoiceId) {
        setViewingInvoice(updated)
      }
      showToast("Invoice marked as paid")
      getInvoiceSummary().then((s) => s && setSummary(s))
    } catch (err) {
      console.error("Failed to mark invoice as paid:", err)
      showToast("Failed to mark invoice as paid", "error")
    }
  }

  // ───────────────────────────────────────────────────────────
  // Download PDF
  // ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async (invoice) => {
    try {
      setDownloadingId(invoice.id)
      setActiveDropdownId(null)
      await downloadInvoicePdf(invoice.id, invoice.invoice_number)
      showToast("Invoice PDF downloaded")
    } catch (err) {
      console.error("Error downloading PDF:", err)
      showToast("Failed to download PDF", "error")
    } finally {
      setDownloadingId(null)
    }
  }

  // ───────────────────────────────────────────────────────────
  // Delete Invoice
  // ───────────────────────────────────────────────────────────
  const openDeleteModal = (inv) => {
    setSelectedInvoice(inv)
    setIsDeleteModalOpen(true)
    setActiveDropdownId(null)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return
    try {
      setSubmitting(true)
      await deleteInvoice(selectedInvoice.id)
      setInvoices((prev) => prev.filter((i) => i.id !== selectedInvoice.id))
      if (viewingInvoice?.id === selectedInvoice.id) {
        setActiveView("list")
        setViewingInvoice(null)
      }
      setIsDeleteModalOpen(false)
      setSelectedInvoice(null)
      showToast("Invoice deleted successfully")
      getInvoiceSummary().then((s) => s && setSummary(s))
    } catch (err) {
      console.error("Error deleting invoice:", err)
      showToast("Failed to delete invoice", "error")
    } finally {
      setSubmitting(false)
    }
  }

  // ───────────────────────────────────────────────────────────
  // View Details
  // ───────────────────────────────────────────────────────────
  const handleViewDetails = async (invoice) => {
    try {
      setActiveDropdownId(null)
      // fetch latest details if items aren't populated
      if (!invoice.items) {
        const fullInvoice = await getInvoice(invoice.id)
        setViewingInvoice(fullInvoice)
      } else {
        setViewingInvoice(invoice)
      }
      setActiveView("detail")
    } catch (err) {
      setViewingInvoice(invoice)
      setActiveView("detail")
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* INVOICE DETAIL VIEW                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeView === "detail" && viewingInvoice ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Breadcrumb & Action Toolbar */}
          {(() => {
            const detailEffectiveStatus =
              viewingInvoice.effective_status || viewingInvoice.status

            return (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("list")
                      setViewingInvoice(null)
                    }}
                    className="font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Invoices
                  </button>
                  <span className="text-slate-400">›</span>
                  <span className="font-semibold text-slate-900">
                    {viewingInvoice.invoice_number}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {detailEffectiveStatus !== "paid" && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(viewingInvoice.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Mark as Paid</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(viewingInvoice)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingId === viewingInvoice.id}
                    onClick={() => handleDownloadPdf(viewingInvoice)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {downloadingId === viewingInvoice.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Invoice Document Paper Card */}
          {(() => {
            const client = clientMap[viewingInvoice.client]
            const clientName = client?.name || "Client"
            const clientCompany = client?.company || ""
            const clientEmail = client?.email || ""
            const effectiveStatus =
              viewingInvoice.effective_status || viewingInvoice.status
            const statusConfig =
              STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.draft

            const items = viewingInvoice.items || []
            const subtotal =
              viewingInvoice.subtotal ??
              items.reduce(
                (acc, it) => acc + (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0),
                0
              )
            const taxRate = parseFloat(viewingInvoice.tax_rate) || 0
            const taxAmount =
              viewingInvoice.tax_amount ?? (subtotal * taxRate) / 100
            const total = viewingInvoice.total ?? subtotal + taxAmount

            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Invoice #{viewingInvoice.invoice_number}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-8 text-xs">
                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Issue Date
                      </div>
                      <div className="font-medium text-slate-700">
                        {formatDate(viewingInvoice.invoice_date)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Due Date
                      </div>
                      <div className="font-medium text-slate-700">
                        {formatDate(viewingInvoice.due_date)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* From / Bill To Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      From
                    </div>
                    <div className="font-bold text-slate-900">
                      FreelancerFlow
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Bill To
                    </div>
                    <div className="font-bold text-slate-900">
                      {clientName}
                    </div>
                    {clientCompany && (
                      <div className="text-slate-600 font-medium">
                        {clientCompany}
                      </div>
                    )}
                    {clientEmail && (
                      <div className="text-slate-500 text-xs mt-0.5">
                        {clientEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-5">Description</th>
                        <th className="py-3 px-5 text-center w-24">Qty</th>
                        <th className="py-3 px-5 text-right w-32">Rate</th>
                        <th className="py-3 px-5 text-right w-36">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {items.map((item, idx) => {
                        const qty = parseFloat(item.quantity) || 1
                        const rate = parseFloat(item.rate) || 0
                        const amount = item.amount ?? qty * rate

                        return (
                          <tr key={item.id || idx}>
                            <td className="py-3.5 px-5 font-semibold text-slate-800">
                              {item.description}
                            </td>
                            <td className="py-3.5 px-5 text-center text-slate-600">
                              {qty}
                            </td>
                            <td className="py-3.5 px-5 text-right text-slate-600">
                              {formatCurrency(rate)}
                            </td>
                            <td className="py-3.5 px-5 text-right font-semibold text-slate-900">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Section: Notes & Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-2">
                  <div>
                    {viewingInvoice.notes && (
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Notes & Terms
                        </div>
                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
                          {viewingInvoice.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 max-w-xs ml-auto w-full">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Tax ({taxRate}%)</span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 my-2"></div>

                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold text-[#2563EB] tracking-tight">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════ */
        /* INVOICES LIST VIEW                                      */
        /* ═══════════════════════════════════════════════════════ */
        <>
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Invoices
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage and track your billing.
              </p>
            </div>

            {/* Create Invoice Button */}
            <button
              type="button"
              onClick={openNewModal}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Invoice</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Summary Cards
             ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OVERDUE Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 relative overflow-hidden border-t-4 border-t-rose-500 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Overdue
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(summary.overdue)}
                </div>
                <div className="flex items-center gap-1 text-xs text-rose-600 font-medium mt-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{summaryCounts.overdueCount} invoices</span>
                </div>
              </div>
            </div>

            {/* OUTSTANDING Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 relative overflow-hidden border-t-4 border-t-indigo-500 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Outstanding
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(summary.outstanding)}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{summaryCounts.outstandingCount} invoices</span>
                </div>
              </div>
            </div>

            {/* PAID THIS MONTH Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 relative overflow-hidden border-t-4 border-t-blue-500 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Paid This Month
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(summary.paid_this_month)}
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Toolbar: Segmented Tabs, Search & Filter
             ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              {[
                { id: "all", label: "All Invoices" },
                { id: "paid", label: "Paid" },
                { id: "overdue", label: "Overdue" },
                { id: "draft", label: "Drafts" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-[#2563EB] font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Status Filter */}
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search invoices..."
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

              {/* Status Filter */}
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
                      { id: "all", label: "All Statuses" },
                      { id: "draft", label: "Draft" },
                      { id: "sent", label: "Sent" },
                      { id: "paid", label: "Paid" },
                      { id: "overdue", label: "Overdue" },
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
                        {statusFilter === item.id && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Invoices Table
             ───────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {searchQuery || activeTab !== "all" || statusFilter !== "all"
                  ? "No matching invoices found"
                  : "No invoices yet"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {searchQuery || activeTab !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search query or filters to find what you're looking for."
                  : "Get started by creating your first client invoice."}
              </p>
              {searchQuery || activeTab !== "all" || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setActiveTab("all")
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
                  <span>Create Invoice</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">INVOICE ID</th>
                      <th className="py-3.5 px-6">CLIENT</th>
                      <th className="py-3.5 px-6">AMOUNT</th>
                      <th className="py-3.5 px-6">DUE DATE</th>
                      <th className="py-3.5 px-6">STATUS</th>
                      <th className="py-3.5 px-6 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedInvoices.map((inv) => {
                      const client = clientMap[inv.client]
                      const clientName = client?.name || "Client"
                      const effectiveStatus =
                        inv.effective_status || inv.status
                      const statusConfig =
                        STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.draft
                      const overdue = effectiveStatus === "overdue"

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleViewDetails(inv)}
                        >
                          {/* Invoice ID */}
                          <td className="py-4 px-6 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {inv.invoice_number}
                          </td>

                          {/* Client */}
                          <td className="py-4 px-6 text-slate-700 font-medium">
                            {clientName}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {formatCurrency(inv.total)}
                          </td>

                          {/* Due Date */}
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-medium ${
                                overdue ? "text-rose-600 font-semibold" : "text-slate-600"
                              }`}
                            >
                              {formatDate(inv.due_date)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.badgeBorder}`}
                            >
                              <span>{statusConfig.label}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-4 px-6 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDropdownId(
                                    activeDropdownId === inv.id ? null : inv.id
                                  )
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeDropdownId === inv.id && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in text-left"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleViewDetails(inv)}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditModal(inv)}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Invoice</span>
                                  </button>

                                  {effectiveStatus === "draft" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(inv, "sent")
                                      }
                                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Mark as Sent</span>
                                    </button>
                                  )}

                                  {effectiveStatus !== "paid" && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsPaid(inv.id)}
                                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Mark as Paid</span>
                                    </button>
                                  )}

                                  {effectiveStatus !== "draft" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStatusChange(inv, "draft")
                                      }
                                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Set to Draft</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(inv)}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Download PDF</span>
                                  </button>

                                  <div className="border-t border-slate-100 my-1"></div>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(inv)}
                                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Invoice</span>
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
                  Pagination Footer
                 ───────────────────────────────────────────────────────── */}
              {filteredInvoices.length > 0 && (
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
                      {filteredInvoices.length}
                    </span>{" "}
                    invoices
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="w-7 h-7 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT INVOICE MODAL                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Invoice" : "Create Invoice"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Top Row: Client, Invoice Date, Due Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Client Select */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Client <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.client}
                    onChange={(e) =>
                      setFormData({ ...formData, client: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                      formErrors.client
                        ? "border-rose-400 ring-1 ring-rose-400"
                        : "border-slate-200"
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
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.client}
                    </p>
                  )}
                </div>

                {/* Invoice Date */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Invoice Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border ${
                      formErrors.invoice_date
                        ? "border-rose-400 ring-1 ring-rose-400"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  />
                  {formErrors.invoice_date && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.invoice_date}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="sm:col-span-3">
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

                {/* Status Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status || "sent"}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Invoice Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Invoice Items <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items Header */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>

                  {/* Item Rows */}
                  {formData.items.map((item, index) => {
                    const itemAmount =
                      (parseFloat(item.quantity) || 0) *
                      (parseFloat(item.rate) || 0)

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center"
                      >
                        {/* Description */}
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Website Development"
                            className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        {/* Qty */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm bg-white text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>

                        {/* Rate */}
                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(index, "rate", e.target.value)
                              }
                              className="w-full pl-6 pr-2.5 py-2 text-sm bg-white text-right rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Amount & Delete */}
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(itemAmount)}
                          </span>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {formErrors.items && (
                  <p className="text-xs text-rose-500">{formErrors.items}</p>
                )}
              </div>

              {/* Bottom Section: Notes & Summary Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Add payment terms, banking info or notes..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Live Calculations */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(calculatedSubtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>Tax Rate:</span>
                      <div className="relative w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.tax_rate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tax_rate: e.target.value,
                            })
                          }
                          className="w-full pr-5 pl-2 py-1 text-xs bg-white text-right rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(calculatedTaxAmount)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 my-2"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">
                      Grand Total
                    </span>
                    <span className="text-xl font-bold text-[#2563EB]">
                      {formatCurrency(calculatedGrandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{isEditMode ? "Save Changes" : "Create Invoice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION MODAL                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {isDeleteModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Invoice
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete invoice{" "}
              <span className="font-semibold text-slate-800">
                "{selectedInvoice.invoice_number}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setSelectedInvoice(null)
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
