import { Bell, Search } from "lucide-react"

export default function Header() {
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
        <button
          type="button"
          className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          aria-label="User profile"
        >
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
            alt="User avatar"
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
          />
        </button>
      </div>
    </header>
  )
}