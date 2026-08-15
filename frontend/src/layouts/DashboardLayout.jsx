import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

    </div>
  )
}