import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Receipt,
  Briefcase,
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

const HERO_SLIDES = [
  {
    title: "Your entire freelance business in one place.",
    subtitle:
      "Join thousands of professionals managing clients, projects, and invoices with FreelancerFlow.",
    badge: "All-in-One CRM",
    stat: "10k+ Freelancers",
  },
  {
    title: "Automate invoices & get paid 3x faster.",
    subtitle:
      "Create professional estimates, send automated reminders, and accept instant payments online.",
    badge: "Smart Billing",
    stat: "$12M+ Processed",
  },
  {
    title: "Track projects & impress your clients.",
    subtitle:
      "Seamless client portals, time tracking, and milestones to keep every project on schedule.",
    badge: "Client Experience",
    stat: "99.4% Satisfaction",
  },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    setAuthError("")
    setAuthSuccess("")

    if (!email || !password) {
      setAuthError("Please fill in all required fields.")
      return
    }

    setIsLoading(true)

    try {
      // The backend expects "username",
      // but our username is the user's email.
      await login(email, password)

      setAuthSuccess("Welcome back! Redirecting to dashboard...")

      navigate("/dashboard", { replace: true })
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Invalid email or password."

      setAuthError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <div className="w-full flex min-h-screen">

        {/* LEFT COLUMN: Hero & Branding Banner */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 relative bg-indigo-950 flex-col justify-between p-12 xl:p-16 overflow-hidden select-none">

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-900 opacity-90" />

          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Header Branding */}
          <div className="relative z-10 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                <LayoutDashboard className="w-5 h-5" />
              </div>

              <span className="text-white text-2xl font-bold tracking-tight">
                FreelancerFlow
              </span>

            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium">

              <Sparkles className="w-3.5 h-3.5 text-amber-300" />

              <span>
                {HERO_SLIDES[activeSlide].badge}
              </span>

            </div>

          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-auto max-w-xl">

            <div className="transition-all duration-500 ease-in-out">

              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
                {HERO_SLIDES[activeSlide].title}
              </h1>

              <p className="text-lg text-indigo-100/90 font-normal leading-relaxed mb-8">
                {HERO_SLIDES[activeSlide].subtitle}
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">

                <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bank-grade Security</span>
                </div>

                <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                  <Receipt className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>Instant Invoicing</span>
                </div>

                <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                  <Briefcase className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>CRM & Pipeline</span>
                </div>

              </div>

            </div>

          </div>

          {/* Footer + Slider */}
          <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10">

            <div className="flex items-center gap-2">

              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === idx
                      ? "w-12 bg-white"
                      : "w-4 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}

            </div>

            <div className="text-xs text-indigo-200/80 font-medium">
              Trusted by {HERO_SLIDES[activeSlide].stat}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Authentication Form */}
        <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white">

          {/* Mobile Branding */}
          <div className="flex lg:hidden items-center gap-3 mb-8">

            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>

            <span className="text-slate-900 text-xl font-bold tracking-tight">
              FreelancerFlow
            </span>

          </div>

          <div className="my-auto max-w-sm w-full mx-auto">

            {/* Form Header */}
            <div className="mb-8 text-center sm:text-left">

              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Welcome back
              </h2>

              <p className="text-slate-500 text-base">
                Please enter your details to sign in.
              </p>

            </div>

            {/* Error */}
            {authError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">

                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />

                {authError}

              </div>
            )}

            {/* Success */}
            {authSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

                {authSuccess}

              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email
                </label>

                <div className="relative rounded-xl shadow-xs">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>

                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.carter@email.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-150"
                  />

                </div>

              </div>

              {/* Password */}
              <div>

                <div className="flex items-center justify-between mb-1.5">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(
                        "Password reset is not available yet."
                      )
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative rounded-xl shadow-xs">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-150"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}

                  </button>

                </div>

              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between py-1">

                <label className="flex items-center gap-2.5 cursor-pointer group select-none">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition cursor-pointer"
                  />

                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember Me
                  </span>

                </label>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >

                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >

                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />

                    </svg>

                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

            </form>

            {/* Register Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">

              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}

                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create Account
                </Link>

              </p>

            </div>

          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} FreelancerFlow CRM. All rights reserved.
          </div>

        </div>

      </div>
    </div>
  )
}