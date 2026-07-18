/**
 * RegisterPage.tsx — landing page that lets the user pick a registration type,
 * then renders either RegisterUserPage or RegisterOrganizerPage.
 *
 * The old RegisterPage.jsx was a single form with a role toggle that:
 *  1. Posted to a non-existent /auth/register/ endpoint
 *  2. Had fields (phone_number, date_of_birth, citizenship) that don't exist
 *
 * This page keeps the same split-panel layout and role-toggle UX, but renders
 * two separate real forms instead of one broken form.
 */
import { useState } from 'react'
import PublicNavbar from '../../components/PublicNavbar'
import RegisterUserPage from './RegisterUserPage'
import RegisterOrganizerPage from './RegisterOrganizerPage'

type Role = 'user' | 'organizer'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('user')

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <PublicNavbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex w-[42%] flex-col justify-between
                        bg-[var(--color-primary-500)] p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                            bg-[var(--color-primary-700)] opacity-40 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                            bg-[var(--color-accent-500)] opacity-20 blur-2xl" />
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots-register" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots-register)" />
            </svg>
          </div>

          <div className="relative">
            <span className="text-white font-bold text-2xl tracking-tight">Karyakram</span>
          </div>

          <div className="relative flex flex-col items-center text-center gap-8">
            <div className="w-56 h-56 rounded-3xl bg-white/10 border border-white/20
                            flex items-center justify-center backdrop-blur-sm">
              <svg className="size-24 text-white/60" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1">
                <path d="M16.5 6v.75a3.75 3.75 0 0 1 0 7.5V15m0-9H7.5m9 0h1.125c.621
                         0 1.125.504 1.125 1.125v2.25c0 .207-.168.375-.375.375a2.25 2.25
                         0 0 0 0 4.5c.207 0 .375.168.375.375v2.25c0 .621-.504 1.125-1.125
                         1.125H7.5M7.5 15H6.375A1.125 1.125 0 0 1 5.25 13.875v-2.25A.375.375
                         0 0 1 5.625 11.25a2.25 2.25 0 0 0 0-4.5.375.375 0 0
                         1-.375-.375v-2.25C5.25 3.504 5.754 3 6.375 3H7.5m0 12v.75M7.5 6V5.25"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl leading-snug">
                {role === 'user' ? 'Join Karyakram' : 'Host Events'}<br />
                {role === 'user' ? 'Today' : 'on Karyakram'}
              </h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                {role === 'user'
                  ? 'Create your account and start discovering events across Nepal.'
                  : 'Register as an organizer to create and manage events.'}
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-6">
            {[
              { value: '500+', label: 'Events' },
              { value: '12K+', label: 'Attendees' },
              { value: '200+', label: 'Organizers' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — forms ── */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Create your account
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                You are a few steps away from joining Karyakram
              </p>
            </div>

            {/* Role toggle */}
            <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)]
                            rounded-lg p-1 mb-6">
              {(['user', 'organizer'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  id={`register-role-${r}`}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    role === r
                      ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {r === 'user' ? 'Attendee' : 'Organizer'}
                </button>
              ))}
            </div>

            {/* Render the correct sub-form */}
            {role === 'user' ? <RegisterUserPage /> : <RegisterOrganizerPage />}

            <p className="text-center text-sm text-[var(--color-muted)] mt-5">
              Already have an account?{' '}
              <a href="/login" className="text-[var(--color-primary-500)] font-medium hover:underline">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
