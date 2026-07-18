/**
 * RegisterOrganizerPage.tsx — Registration form for role=ORGANIZER.
 *
 * Real endpoint: POST /api/auth/register/organizer/
 * Sent as multipart/FormData because citizenship_document and pan_document are FileFields.
 *
 * Real fields (from OrganizerRegisterSerializer):
 *   User fields:    username, email, first_name, last_name, password, password_confirm
 *   Profile fields: organization_name, organization_description (optional),
 *                   website_url (optional), citizenship_number, pan_number,
 *                   bank_name, bank_account_number,
 *                   citizenship_document (file), pan_document (file)
 *
 * Fields removed from the old stub: phone_number, date_of_birth, citizenship (country).
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerOrganizer } from '../../api/users'
import type { OrganizerRegisterPayload } from '../../types/auth'

type OrgForm = Omit<OrganizerRegisterPayload, 'citizenship_document' | 'pan_document'> & {
  agreed: boolean
  citizenship_document: File | null
  pan_document: File | null
}

const INITIAL: OrgForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
  organization_name: '',
  organization_description: '',
  website_url: '',
  citizenship_number: '',
  pan_number: '',
  bank_name: '',
  bank_account_number: '',
  citizenship_document: null,
  pan_document: null,
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
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{label}</label>
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

type FieldErrors = Partial<Record<keyof OrgForm | 'non_field_errors', string[]>>

export default function RegisterOrganizerPage() {
  const [form, setForm] = useState<OrgForm>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const citizenRef = useRef<HTMLInputElement>(null)
  const panRef = useRef<HTMLInputElement>(null)

  const set =
    (field: keyof OrgForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }

  const setFile =
    (field: 'citizenship_document' | 'pan_document') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      setForm((f) => ({ ...f, [field]: file }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.citizenship_document || !form.pan_document) {
      setErrors({
        citizenship_document: form.citizenship_document ? undefined : ['Required'],
        pan_document: form.pan_document ? undefined : ['Required'],
      })
      return
    }
    setLoading(true)
    setErrors({})
    try {
      await registerOrganizer({
        ...form,
        citizenship_document: form.citizenship_document,
        pan_document: form.pan_document,
      })
      localStorage.setItem('last_registered_email', form.email)
      navigate('/verify', { state: { email: form.email, role: 'ORGANIZER' } })
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

  return (
    <div className="w-full max-w-md">
      {errors.non_field_errors && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
          {errors.non_field_errors[0]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.first_name?.[0]}>
            <Input id="reg-org-first" value={form.first_name} onChange={set('first_name')} placeholder="John" required />
          </Field>
          <Field label="Last Name" error={errors.last_name?.[0]}>
            <Input id="reg-org-last" value={form.last_name} onChange={set('last_name')} placeholder="Doe" required />
          </Field>
        </div>

        <Field label="Username" error={errors.username?.[0]}>
          <Input id="reg-org-username" value={form.username} onChange={set('username')} placeholder="acme_events" required autoComplete="username" />
        </Field>

        <Field label="Email" error={errors.email?.[0]}>
          <Input id="reg-org-email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required autoComplete="email" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={errors.password?.[0]}>
            <Input id="reg-org-password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password" error={errors.password_confirm?.[0]}>
            <Input id="reg-org-confirm" type="password" value={form.password_confirm} onChange={set('password_confirm')} placeholder="••••••••" required />
          </Field>
        </div>

        {/* Organization section */}
        <div className="pt-3 border-t border-[var(--color-border)] space-y-4">
          <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
            Organization Details
          </p>

          <Field label="Organization Name" error={errors.organization_name?.[0]}>
            <Input id="reg-org-name" value={form.organization_name} onChange={set('organization_name')} placeholder="Acme Events Pvt. Ltd." required />
          </Field>

          <Field label="Organization Description (optional)" error={errors.organization_description?.[0]}>
            <textarea
              id="reg-org-desc"
              value={form.organization_description}
              onChange={set('organization_description')}
              placeholder="Brief description of your organization…"
              rows={2}
              className="w-full border border-[var(--color-border)] bg-white rounded-lg
                         px-4 py-2.5 text-sm text-[var(--color-text)]
                         placeholder:text-[var(--color-muted)] outline-none
                         focus:ring-2 focus:ring-[var(--color-primary-500)]
                         focus:border-transparent transition resize-none"
            />
          </Field>

          <Field label="Website URL (optional)" error={errors.website_url?.[0]}>
            <Input id="reg-org-website" type="url" value={form.website_url} onChange={set('website_url')} placeholder="https://yourorganization.com" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Citizenship Number" error={errors.citizenship_number?.[0]}>
              <Input id="reg-org-citizen" value={form.citizenship_number} onChange={set('citizenship_number')} placeholder="XX-XX-XXXXXXX" required />
            </Field>
            <Field label="PAN Number" error={errors.pan_number?.[0]}>
              <Input id="reg-org-pan" value={form.pan_number} onChange={set('pan_number')} placeholder="9 digits" maxLength={9} required />
            </Field>
          </div>

          <Field label="Bank Name" error={errors.bank_name?.[0]}>
            <Input id="reg-org-bank" value={form.bank_name} onChange={set('bank_name')} placeholder="Nepal Investment Bank" required />
          </Field>

          <Field label="Bank Account Number" error={errors.bank_account_number?.[0]}>
            <Input id="reg-org-account" value={form.bank_account_number} onChange={set('bank_account_number')} placeholder="XXXXXXXXXXXXXXXXXX" required />
          </Field>

          {/* Document uploads */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Citizenship Document" error={errors.citizenship_document?.[0]}>
              <div
                onClick={() => citizenRef.current?.click()}
                className="border border-dashed border-[var(--color-border)] rounded-lg p-3
                           text-center cursor-pointer hover:border-[var(--color-primary-500)]
                           hover:bg-[var(--color-primary-50)] transition"
              >
                <p className="text-xs text-[var(--color-muted)]">
                  {form.citizenship_document ? form.citizenship_document.name : 'Click to upload'}
                </p>
              </div>
              <input
                id="reg-org-citizen-doc"
                ref={citizenRef}
                type="file"
                accept="image/*,.pdf"
                onChange={setFile('citizenship_document')}
                className="hidden"
                required
              />
            </Field>

            <Field label="PAN Document" error={errors.pan_document?.[0]}>
              <div
                onClick={() => panRef.current?.click()}
                className="border border-dashed border-[var(--color-border)] rounded-lg p-3
                           text-center cursor-pointer hover:border-[var(--color-primary-500)]
                           hover:bg-[var(--color-primary-50)] transition"
              >
                <p className="text-xs text-[var(--color-muted)]">
                  {form.pan_document ? form.pan_document.name : 'Click to upload'}
                </p>
              </div>
              <input
                id="reg-org-pan-doc"
                ref={panRef}
                type="file"
                accept="image/*,.pdf"
                onChange={setFile('pan_document')}
                className="hidden"
                required
              />
            </Field>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="reg-org-agreed"
            type="checkbox"
            checked={form.agreed}
            onChange={set('agreed')}
            required
            className="size-4 mt-0.5 rounded border-[var(--color-border)] accent-[var(--color-primary-500)] cursor-pointer"
          />
          <label htmlFor="reg-org-agreed" className="text-sm text-[var(--color-muted)] cursor-pointer select-none">
            I agree to the{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[var(--color-primary-500)] hover:underline">Privacy Policy</a>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm(INITIAL)}
            className="flex-1 border border-[var(--color-border)] text-[var(--color-text)]
                       font-medium rounded-lg py-2.5 text-sm hover:bg-[var(--color-bg)]
                       transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
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
            ) : 'Register as Organizer'}
          </button>
        </div>
      </form>
    </div>
  )
}
