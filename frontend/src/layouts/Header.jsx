import { Bell, Search, User as UserIcon } from "lucide-react"
import { useAuth } from "../hooks/useAuth"

export default function Header() {
  const { user } = useAuth()

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.username || "User"

  const userInitial = (displayName.charAt(0) || "U").toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      {/* Workspace Search Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search across workspace..."
          className="w-full bg-[#F1F5F9]/80 hover:bg-[#F1F5F9] focus:bg-white text-slate-700 placeholder-slate-400 text-sm rounded-full pl-9 pr-4 py-2 border border-transparent focus:border-slate-300 focus:outline-none transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* User profile avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-semibold text-sm shadow-xs border border-blue-200/50 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
            title={displayName}
            aria-label={`User profile for ${displayName}`}
          >
            {userInitial}
          </button>
        </div>
      </div>
    </header>
  )
}