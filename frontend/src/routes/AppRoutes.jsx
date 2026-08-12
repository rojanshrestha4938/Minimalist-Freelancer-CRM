import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import ProtectedRoute from "./ProtectedRoute"
import DashboardLayout from "../layouts/DashboardLayout"

// Auth pages
import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register"

// App pages
import Dashboard from "../pages/dashboard/Dashboard"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<div className="p-6"><h1 className="text-2xl font-semibold">Clients</h1></div>} />
            <Route path="/projects" element={<div className="p-6"><h1 className="text-2xl font-semibold">Projects</h1></div>} />
            <Route path="/tasks" element={<div className="p-6"><h1 className="text-2xl font-semibold">Tasks</h1></div>} />
            <Route path="/invoices" element={<div className="p-6"><h1 className="text-2xl font-semibold">Invoices</h1></div>} />
          </Route>
        </Route>

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes