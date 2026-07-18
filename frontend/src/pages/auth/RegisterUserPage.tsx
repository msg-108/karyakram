/**
 * RegisterUserPage.tsx — Registration form for role=USER.
 *
 * Real endpoint: POST /api/auth/register/user/
 * Real fields (from UserRegisterSerializer): username, email, first_name, last_name,
 *   password, password_confirm.
 *
 * Fields removed from the old stub: phone_number, date_of_birth, citizenship.
 * Those fields do not exist on the real User model.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../../api/users'
import type { UserRegisterPayload } from '../../types/auth'

type FormState = UserRegisterPayload & { agreed: boolean }

const INITIAL: FormState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
  agreed: false,
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-[var(--color-border)] bg-white rounded-lg
                  px-4 py-2.5 text-sm text-[var(--color-text)]
                  placeholder:text-[var(--color-muted)] outline-none
                  focus:ring-2 focus:ring-[var(--color-primary-500)]
                  focus:border-transparent transition ${className}`}
    />
  )
}

type FieldErrors = Partial<Record<keyof FormState | 'non_field_errors', string[]>>

export default function RegisterUserPage() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const { username, email, first_name, last_name, password, password_confirm } = form
      await registerUser({ username, email, first_name, last_name, password, password_confirm })
      localStorage.setItem('last_registered_email', form.email)
      navigate('/verify', { state: { email: form.email, role: 'USER' } })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: FieldErrors } }
      const data = axiosErr.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ non_field_errors: ['Something went wrong. Please try again.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  const EyeOff = () => (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  const EyeOn = () => (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <div className="w-full max-w-md">
      {errors.non_field_errors && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
          {errors.non_field_errors[0]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.first_name?.[0]}>
            <Input id="reg-user-first" value={form.first_name} onChange={set('first_name')} placeholder="John" required />
          </Field>
          <Field label="Last Name" error={errors.last_name?.[0]}>
            <Input id="reg-user-last" value={form.last_name} onChange={set('last_name')} placeholder="Doe" required />
          </Field>
        </div>

        {/* Username */}
        <Field label="Username" error={errors.username?.[0]}>
          <Input id="reg-user-username" value={form.username} onChange={set('username')} placeholder="john_doe" required autoComplete="username" />
        </Field>

        {/* Email */}
        <Field label="Email" error={errors.email?.[0]}>
          <Input id="reg-user-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
        </Field>

        {/* Password + Confirm */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={errors.password?.[0]}>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••" required autoComplete="new-password" className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {showPass ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password" error={errors.password_confirm?.[0]}>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} value={form.password_confirm} onChange={set('password_confirm')} placeholder="••••••••" required className="pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                {showConfirm ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </Field>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="reg-user-agreed"
            type="checkbox"
            checked={form.agreed}
            onChange={set('agreed')}
            required
            className="size-4 mt-0.5 rounded border-[var(--color-border)] accent-[var(--color-primary-500)] cursor-pointer"
          />
          <label htmlFor="reg-user-agreed" className="text-sm text-[var(--color-muted)] cursor-pointer select-none">
            I agree to the{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">Privacy Policy</a>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                     disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                     rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
              Registering…
            </span>
          ) : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
