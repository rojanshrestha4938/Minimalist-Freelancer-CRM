import React, { useState } from "react"
import {
  User,
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
import { useNavigate } from "react-router-dom"
import { registerUser } from "../../services/authService"

const HERO_SLIDES = [
  {
    title: "Streamline Your Freelance Business.",
    subtitle:
      "Join thousands of independent professionals managing projects, clients, and invoices with unparalleled clarity and speed.",
    badge: "All-in-One CRM",
    stat: "10k+ Freelancers",
  },
  {
    title: "Stay organized & boost client trust.",
    subtitle:
      "Centralize communications, project timelines, and deliverable handoffs in one branded client portal.",
    badge: "Client Experience",
    stat: "99.4% Satisfaction",
  },
  {
    title: "Automate billing & scale your revenue.",
    subtitle:
      "Create professional contracts, send recurring invoices, and track your cashflow automatically.",
    badge: "Smart Billing",
    stat: "$12M+ Processed",
  },
]

export default function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    setAuthError("")
    setAuthSuccess("")

    // Frontend validation
    if (!fullName || !email || !password || !confirmPassword) {
      setAuthError("Please fill in all required fields.")
      return
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.")
      return
    }

    // Django RegisterSerializer requires minimum 8 characters
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters long.")
      return
    }

    if (!agreedToTerms) {
      setAuthError("You must agree to the Terms & Conditions.")
      return
    }

    setIsLoading(true)

    try {
      // Connect to Django registration API
      //
      // IMPORTANT:
      // Your Django RegisterSerializer expects:
      // username, email, password, password2
      //
      // It does NOT currently accept full_name.
      await registerUser({
        username: email,
        email: email,
        password: password,
        password2: confirmPassword,
      })

      setAuthSuccess(
        "Account created successfully! Redirecting to login..."
      )

      // Give the user a moment to see the success message
      setTimeout(() => {
        navigate("/login")
      }, 1200)
    } catch (error) {
      console.error("Registration error:", error)

      const responseData = error.response?.data

      if (responseData) {
        if (responseData.username) {
          setAuthError(
            Array.isArray(responseData.username)
              ? responseData.username[0]
              : responseData.username
          )
        } else if (responseData.email) {
          setAuthError(
            Array.isArray(responseData.email)
              ? responseData.email[0]
              : responseData.email
          )
        } else if (responseData.password) {
          setAuthError(
            Array.isArray(responseData.password)
              ? responseData.password[0]
              : responseData.password
          )
        } else if (responseData.password2) {
          setAuthError(
            Array.isArray(responseData.password2)
              ? responseData.password2[0]
              : responseData.password2
          )
        } else if (responseData.non_field_errors) {
          setAuthError(
            Array.isArray(responseData.non_field_errors)
              ? responseData.non_field_errors[0]
              : responseData.non_field_errors
          )
        } else if (responseData.detail) {
          setAuthError(responseData.detail)
        } else {
          setAuthError(
            "Registration failed. Please check your information."
          )
        }
      } else {
        setAuthError(
          "Unable to connect to the server. Please try again."
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <div className="w-full flex min-h-screen">

        {/* LEFT COLUMN */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 relative bg-indigo-950 flex-col justify-between p-12 xl:p-16 overflow-hidden select-none">

          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-900 opacity-90" />

          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Branding */}
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

          {/* Hero */}
          <div className="relative z-10 my-auto max-w-xl">
            <div className="transition-all duration-500 ease-in-out">

              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
                {HERO_SLIDES[activeSlide].title}
              </h1>

              <p className="text-lg text-indigo-100/90 font-normal leading-relaxed mb-8">
                {HERO_SLIDES[activeSlide].subtitle}
              </p>

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

          {/* Slider footer */}
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

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto">

          {/* Mobile branding */}
          <div className="flex lg:hidden items-center gap-3 mb-8">

            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>

            <span className="text-slate-900 text-xl font-bold tracking-tight">
              FreelancerFlow
            </span>

          </div>

          <div className="my-auto max-w-sm w-full mx-auto">

            {/* Header */}
            <div className="mb-6 text-center sm:text-left">

              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Create Account
              </h2>

              <p className="text-slate-500 text-base">
                Start your journey to better workflow.
              </p>

            </div>

            {/* Error */}
            {authError && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                {authError}
              </div>
            )}

            {/* Success */}
            {authSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {authSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Full Name
                </label>

                <div className="relative rounded-xl shadow-xs">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>

                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Carter"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-150"
                  />

                </div>
              </div>

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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-150"
                  />

                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>

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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>

                <div className="relative rounded-xl shadow-xs">

                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-150"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>

                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center justify-between py-1">

                <label className="flex items-center gap-2.5 cursor-pointer group select-none">

                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) =>
                      setAgreedToTerms(e.target.checked)
                    }
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition cursor-pointer"
                  />

                  <span className="text-sm font-normal text-slate-600 group-hover:text-slate-900 transition-colors">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() =>
                        alert("Terms & Conditions modal")
                      }
                      className="font-medium text-indigo-600 hover:text-indigo-700 bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Terms & Conditions
                    </button>
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

                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">

              <p className="text-sm text-slate-600">
                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  Sign In
                </button>
              </p>

            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} FreelancerFlow CRM. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  )
}