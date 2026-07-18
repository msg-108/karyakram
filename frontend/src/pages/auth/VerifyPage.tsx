import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp, resendOtp } from '../../api/users'
import PublicNavbar from '../../components/PublicNavbar'

// ── Success state ──
function SuccessView({ role, onDone }: { role: string; onDone: (action: string) => void }) {
  const isOrganizer = role === 'ORGANIZER'
  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Checkmark */}
      <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="size-10 text-green-500" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2">
          <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          Thank you for Registering!
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-2 max-w-xs leading-relaxed">
          {isOrganizer
            ? 'As an Organizer, you will receive an email once your account is approved by the Karyakram team.'
            : 'A confirmation has been sent to your registered email address.'}
        </p>
      </div>

      <div className={`flex gap-3 w-full ${isOrganizer ? '' : 'flex-col'}`}>
        {isOrganizer && (
          <button
            onClick={() => onDone('back')}
            className="flex-1 border border-[var(--color-border)] text-[var(--color-text)]
                       font-medium rounded-lg py-2.5 text-sm hover:bg-[var(--color-bg)]
                       transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={() => onDone('done')}
          className="flex-1 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                     text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ── Main verify page ──
export default function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve initial values from query parameters, location state, or localStorage
  const searchParams = new URLSearchParams(location.search)
  const initialEmail = location.state?.email || searchParams.get('email') || localStorage.getItem('last_registered_email') || ''
  const initialRole = location.state?.role || searchParams.get('role') || 'USER'

  const [email, setEmail] = useState(initialEmail)
  const role = initialRole
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Resend cooldown timer decrement
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResendMessage(null)
    try {
      await verifyOtp({ email, code })
      setVerified(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail ?? 'Invalid or expired code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError(null)
    setResendMessage(null)
    try {
      await resendOtp({ email })
      setResendMessage('A new verification code has been sent.')
      setCooldown(60) // Default fallback cooldown
    } catch (err: any) {
      const detail = err.response?.data?.detail || ''
      const match = detail.match(/(\d+)\s+seconds/)
      if (match) {
        const secs = parseInt(match[1], 10)
        setCooldown(secs)
      } else {
        setError(detail || 'Failed to resend OTP. Please try again.')
      }
    }
  }

  const handleDone = (action: string) => {
    if (action === 'back') navigate('/register')
    else navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <PublicNavbar />

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="hidden lg:flex w-[42%] flex-col justify-between
                        bg-[var(--color-primary-500)] p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                            bg-[var(--color-primary-700)] opacity-40 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                            bg-[var(--color-accent-500)] opacity-20 blur-2xl" />
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots-verify" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots-verify)" />
            </svg>
          </div>
          <div className="relative">
            <span className="text-white font-bold text-2xl tracking-tight">Karyakram</span>
          </div>
          <div className="relative flex flex-col items-center text-center gap-6">
            <div className="size-32 rounded-full bg-white/10 border border-white/20
                            flex items-center justify-center">
              <svg className="size-16 text-white/70" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0
                         0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25
                         2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07
                         1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25
                         0 0 1-1.07-1.916V6.75"
                   strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl">Check your email</h2>
              <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                We sent a verification code to your registered email address.
              </p>
            </div>
          </div>
          <div className="relative" />
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {verified ? (
              <SuccessView role={role} onDone={handleDone} />
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Verify your account
                  </h1>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    Enter your email and the 6-digit code sent to you.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                                  rounded-lg px-4 py-3 mb-5">
                    {error}
                  </div>
                )}

                {resendMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm
                                  rounded-lg px-4 py-3 mb-5">
                    {resendMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="verify-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-[var(--color-border)] bg-white rounded-lg
                                 px-4 py-2.5 text-sm text-[var(--color-text)]
                                 placeholder:text-[var(--color-muted)] outline-none
                                 focus:ring-2 focus:ring-[var(--color-primary-500)]
                                 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                      Verification Code
                    </label>
                    <input
                      id="verify-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      maxLength={6}
                      className="w-full border border-[var(--color-border)] bg-white rounded-lg
                                 px-4 py-3 text-2xl text-center tracking-[0.5em] font-mono
                                 text-[var(--color-text)] outline-none
                                 focus:ring-2 focus:ring-[var(--color-primary-500)]
                                 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 6 || !email}
                    className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                               disabled:opacity-60 disabled:cursor-not-allowed text-white
                               font-medium rounded-lg py-2.5 text-sm transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10"
                                  stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                        </svg>
                        Verifying…
                      </span>
                    ) : 'Continue'}
                  </button>
                </form>

                <p className="text-center text-sm text-[var(--color-muted)] mt-5">
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || !email}
                    className="text-[var(--color-primary-500)] font-medium hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
