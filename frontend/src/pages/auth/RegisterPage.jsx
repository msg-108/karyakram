import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function RegisterPage() {
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // TODO (Aman): build out the full registration form here.
  // Fields required by the backend RegisterSerializer:
  //   first_name, last_name, username, email,
  //   password, password_confirm, phone_number, date_of_birth, role
  //
  // For role='organizer' also include:
  //   organization_name, citizenship, citizenship_number,
  //   pan_number, bank_name, bank_account_number
  //
  // On success: navigate('/login') — do NOT auto-login after register
  // because is_organizer_approved starts as False for organizers.

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Create account</h1>
        <p className="text-sm text-[var(--color-muted)]">Registration form — assigned to Aman</p>
      </div>
    </div>
  )
}