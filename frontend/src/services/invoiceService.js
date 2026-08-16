import api from "./api"

const INVOICES_URL = "/invoices/"

// GET /api/invoices/
export const getInvoices = async (params = {}) => {
  const response = await api.get(INVOICES_URL, {
    params,
  })
  return response.data
}

// GET /api/invoices/{id}/
export const getInvoice = async (invoiceId) => {
  const response = await api.get(`${INVOICES_URL}${invoiceId}/`)
  return response.data
}

// GET /api/invoices/summary/
export const getInvoiceSummary = async () => {
  const response = await api.get(`${INVOICES_URL}summary/`)
  return response.data
}

// POST /api/invoices/
export const createInvoice = async (invoiceData) => {
  const payload = {
    client: Number(invoiceData.client),
    invoice_date: invoiceData.invoice_date,
    due_date: invoiceData.due_date,
    tax_rate: Number(invoiceData.tax_rate) || 0,
    notes: invoiceData.notes || "",
    status: invoiceData.status || "sent",
    items: invoiceData.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
    })),
  }

  const response = await api.post(INVOICES_URL, payload)
  return response.data
}

// PATCH /api/invoices/{id}/
export const updateInvoice = async (invoiceId, invoiceData) => {
  const payload = {}
  if (invoiceData.client !== undefined) payload.client = Number(invoiceData.client)
  if (invoiceData.invoice_date !== undefined) payload.invoice_date = invoiceData.invoice_date
  if (invoiceData.due_date !== undefined) payload.due_date = invoiceData.due_date
  if (invoiceData.tax_rate !== undefined) payload.tax_rate = Number(invoiceData.tax_rate) || 0
  if (invoiceData.notes !== undefined) payload.notes = invoiceData.notes
  if (invoiceData.status !== undefined) payload.status = invoiceData.status
  if (invoiceData.items !== undefined) {
    payload.items = invoiceData.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
    }))
  }

  const response = await api.patch(`${INVOICES_URL}${invoiceId}/`, payload)
  return response.data
}

// DELETE /api/invoices/{id}/
export const deleteInvoice = async (invoiceId) => {
  const response = await api.delete(`${INVOICES_URL}${invoiceId}/`)
  return response.data
}

// POST /api/invoices/{id}/mark-paid/
export const markInvoicePaid = async (invoiceId) => {
  const response = await api.post(`${INVOICES_URL}${invoiceId}/mark-paid/`)
  return response.data
}

// GET /api/invoices/{id}/pdf/ (download as file)
export const downloadInvoicePdf = async (invoiceId, invoiceNumber) => {
  const response = await api.get(`${INVOICES_URL}${invoiceId}/pdf/`, {
    responseType: "blob",
  })
  const blob = new Blob([response.data], { type: "application/pdf" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `invoice_${invoiceNumber || invoiceId}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
