import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListChecks,
  Receipt,
  LogOut,
  Plus,
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients",   label: "Clients",   icon: Users },
  { to: "/projects",  label: "Projects",  icon: FolderKanban },
  { to: "/tasks",     label: "Tasks",     icon: ListChecks },
  { to: "/invoices",  label: "Invoices",  icon: Receipt },
]

export default function Sidebar({ onQuickAdd }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="w-[230px] min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex flex-col">
          <span className="text-[#2563EB] font-bold text-xl tracking-tight leading-tight">
            FreelancerFlow
          </span>
          <span className="text-slate-500 text-xs font-normal mt-0.5">
            CRM for Freelancers
          </span>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={() => {
            if (onQuickAdd) {
              onQuickAdd()
            } else {
              navigate("/clients?action=new")
            }
          }}
          className="mt-5 w-full bg-[#2563EB] hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Quick Add</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#2563EB]" : "text-slate-500"
                  }`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 pt-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}