import { useEffect, useState } from "react"
import { getDashboardData } from "../../services/dashboardService"
import {
  CircleDollarSign,
  FolderKanban,
  FileText,
  CalendarCheck,
  TrendingUp,
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  const num = parseFloat(value) || 0

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("NPR", "NPR")
}

function formatRelativeTime(isoString) {
  if (!isoString) return ""

  const date = new Date(isoString)
  const now = new Date()

  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  }

  if (diffDays === 1) return "Yesterday"

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function getDaysUntil(dueDateStr) {
  if (!dueDateStr) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)

  return Math.round(
    (due - today) / (1000 * 60 * 60 * 24)
  )
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// ─── Activity Icon ───────────────────────────────────────────────────────────

function ActivityIcon({ type }) {
  const base =
    "w-8 h-8 rounded-full flex items-center justify-center shrink-0"

  if (type === "invoice_paid") {
    return (
      <span className={`${base} bg-emerald-100`}>
        <CircleDollarSign className="w-4 h-4 text-emerald-600" />
      </span>
    )
  }

  if (type === "project_updated") {
    return (
      <span className={`${base} bg-blue-100`}>
        <FolderKanban className="w-4 h-4 text-blue-600" />
      </span>
    )
  }

  // task_created
  return (
    <span className={`${base} bg-amber-100`}>
      <CalendarCheck className="w-4 h-4 text-amber-600" />
    </span>
  )
}

// ─── Activity Row ────────────────────────────────────────────────────────────

function ActivityRow({ activity, isLast }) {
  const { type, message, timestamp, amount } = activity

  const renderMessage = () => {
    if (type === "invoice_paid") {
      // Match: "<Name> paid invoice <INV-XXX>"
      const match = message.match(/^(.+?)\s+paid invoice\s+(INV-[\w-]+)/i)

      if (match) {
        return (
          <span className="text-slate-700 text-sm">
            <span className="font-semibold">
              {match[1]}
            </span>{" "}
            paid invoice{" "}
            <span className="text-indigo-600 font-medium">
              {match[2]}
            </span>
          </span>
        )
      }
    }

    if (type === "project_updated") {
      const updatedToIndex = message.indexOf(
        " project updated to "
      )

      if (updatedToIndex !== -1) {
        const projectName = message.slice(
          0,
          updatedToIndex
        )

        const status = message.slice(
          updatedToIndex + " project updated to ".length
        )

        return (
          <span className="text-slate-700 text-sm">
            <span className="font-semibold">
              {projectName}
            </span>{" "}
            project status updated to{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {status}
            </span>
          </span>
        )
      }
    }

    return (
      <span className="text-slate-700 text-sm">
        {message}
      </span>
    )
  }

  return (
    <div
      className={`flex items-start gap-3 py-3.5 ${
        !isLast ? "border-b border-slate-100" : ""
      }`}
    >
      <ActivityIcon type={type} />

      <div className="flex-1 min-w-0">
        <div>{renderMessage()}</div>

        <p className="text-xs text-slate-400 mt-1">
          {formatRelativeTime(timestamp)}

          {amount !== undefined && amount !== null && (
            <span className="text-slate-500 font-medium">
              {" "}
              • {formatCurrency(amount)}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Deadline Row ────────────────────────────────────────────────────────────

function DeadlineRow({ project, isLast }) {
  const { name, due_date, client } = project

  const days = getDaysUntil(due_date)

  const badgeStyle =
    days === null
      ? {
          bg: "bg-slate-100",
          text: "text-slate-600",
        }
      : days <= 2
        ? {
            bg: "bg-red-500",
            text: "text-white",
          }
        : days <= 7
          ? {
              bg: "bg-amber-500",
              text: "text-white",
            }
          : {
              bg: "bg-emerald-100",
              text: "text-emerald-700",
            }

  const badgeLabel =
    days === null
      ? "—"
      : days === 0
        ? "TODAY"
        : days < 0
          ? `${Math.abs(days)}D OVERDUE`
          : `${days} DAYS`

  return (
    <div
      className={`py-3.5 ${
        !isLast ? "border-b border-slate-100" : ""
      }`}
    >
      {/* Project name + deadline badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {name}
        </p>

        <span
          className={`shrink-0 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded ${badgeStyle.bg} ${badgeStyle.text}`}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Client */}
      {client?.name && (
        <p className="text-xs text-slate-400 mt-0.5">
          Client: {client.name}
        </p>
      )}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  isCurrency,
  badge,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <Icon
            className={`w-[18px] h-[18px] ${iconColor}`}
          />
        </div>

        {badge}
      </div>

      <div>
        <p className="text-xs text-slate-500 font-medium mb-0.5">
          {label}
        </p>

        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {isCurrency
            ? formatCurrency(value)
            : (value ?? "—")}
        </p>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-slate-100 mb-3" />

      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />

      <div className="h-7 w-20 bg-slate-100 rounded" />
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError("")

        const data = await getDashboardData()

        setDashboard(data)
      } catch (err) {
        console.error(
          "Failed to load dashboard:",
          err
        )

        setError(
          "Unable to load dashboard data. Please try again."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const stats = dashboard?.stats ?? {}
  const recentActivity =
    dashboard?.recent_activity ?? []
  const upcomingDeadlines =
    dashboard?.upcoming_deadlines ?? []

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* ── Page Header ─────────────────────────────── */}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back. Here&apos;s what&apos;s happening
            today.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 mt-1">
          Today, {getTodayLabel()}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────── */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Stats Cards ─────────────────────────────── */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Total Revenue */}
            <StatCard
              icon={CircleDollarSign}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Total Revenue"
              value={stats.total_revenue}
              isCurrency
            />

            {/* Active Projects */}
            <StatCard
              icon={FolderKanban}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              label="Active Projects"
              value={stats.active_projects}
            />

            {/* Pending Invoices */}
            <StatCard
              icon={FileText}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              label="Pending Invoices"
              value={stats.pending_invoices}
              badge={
                stats.pending_invoices > 0 ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    Requires Action
                  </span>
                ) : null
              }
            />

            {/* Tasks Due Today */}
            <StatCard
              icon={CalendarCheck}
              iconBg="bg-slate-100"
              iconColor="text-slate-500"
              label="Tasks Due Today"
              value={stats.tasks_due_today}
            />
          </>
        )}

      </div>

      {/* ── Main Grid ───────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

        {/* ── Recent Activity ───────────────────────── */}

        <div className="bg-white rounded-xl border border-slate-200 p-5">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Activity
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />

                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />

                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400">
                No recent activity yet.
              </p>
            </div>
          ) : (
            <div>
              {recentActivity.map(
                (activity, index) => (
                  <ActivityRow
                    key={`${activity.type}-${index}`}
                    activity={activity}
                    isLast={
                      index ===
                      recentActivity.length - 1
                    }
                  />
                )
              )}
            </div>
          )}

        </div>

        {/* ── Upcoming Deadlines ────────────────────── */}

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Upcoming Deadlines
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4 flex-1">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                >
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />

                  <div className="h-2.5 bg-slate-100 rounded w-full mb-1.5" />

                  <div className="h-5 bg-slate-100 rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-sm text-slate-400">
                No upcoming deadlines.
              </p>
            </div>
          ) : (
            <div className="flex-1">
              {upcomingDeadlines.map(
                (project, index) => (
                  <DeadlineRow
                    key={project.id}
                    project={project}
                    isLast={
                      index ===
                      upcomingDeadlines.length - 1
                    }
                  />
                )
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  )
}