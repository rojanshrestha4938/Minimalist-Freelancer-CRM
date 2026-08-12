import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout