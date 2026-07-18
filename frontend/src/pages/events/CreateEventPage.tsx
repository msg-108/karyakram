import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent, updateEvent, listCategories } from '../../api/events'
import PublicNavbar from '../../components/PublicNavbar'
import type { EventCategory, TicketTierCreateInput } from '../../types/events'

interface FormState {
  title: string
  short_description: string
  description: string
  terms_and_conditions: string
  category: string
  venue: string
  address: string
  city: string
  district: string
  province: string
  latitude: string
  longitude: string
  start_datetime: string
  end_datetime: string
  registration_deadline: string
  capacity: string
  visibility: 'PUBLIC' | 'PRIVATE'
}

const INITIAL_FORM: FormState = {
  title: '',
  short_description: '',
  description: '',
  terms_and_conditions: '',
  category: '',
  venue: '',
  address: '',
  city: '',
  district: '',
  province: '',
  latitude: '',
  longitude: '',
  start_datetime: '',
  end_datetime: '',
  registration_deadline: '',
  capacity: '',
  visibility: 'PUBLIC',
}

interface TierInput extends TicketTierCreateInput {
  _id: string // local tracking
}

export default function CreateEventPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [banner, setBanner] = useState<File | null>(null)
  const [ticketTiers, setTicketTiers] = useState<TierInput[]>([
    { _id: '1', name: 'General Admission', description: '', price: '', quantity: 100, display_order: 1, is_active: true },
  ])

  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const navigate = useNavigate()

  useEffect(() => {
    listCategories()
      .then((r) => {
        setCategories(r.data)
        if (r.data.length > 0) {
          setForm((f) => ({ ...f, category: String(r.data[0].id) }))
        }
      })
      .catch((err) => console.error('Failed to load categories', err))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: [] }))
  }

  const handleTierChange = (id: string, field: keyof TierInput, value: any) => {
    setTicketTiers((prev) =>
      prev.map((tier) => (tier._id === id ? { ...tier, [field]: value } : tier))
    )
  }

  const addTier = () => {
    const nextId = String(ticketTiers.length + 1)
    setTicketTiers((prev) => [
      ...prev,
      { _id: nextId, name: '', description: '', price: '', quantity: 50, display_order: prev.length + 1, is_active: true },
    ])
  }

  const removeTier = (id: string) => {
    if (ticketTiers.length <= 1) return
    setTicketTiers((prev) => prev.filter((t) => t._id !== id))
  }

  const validateForm = () => {
    setValidationError(null)

    if (!form.start_datetime || !form.end_datetime) {
      setValidationError('Start date and end date are required.')
      return false
    }

    const start = new Date(form.start_datetime)
    const end = new Date(form.end_datetime)

    if (end <= start) {
      setValidationError('End date/time must be after the start date/time.')
      return false
    }

    if (form.registration_deadline) {
      const deadline = new Date(form.registration_deadline)
      if (deadline > start) {
        setValidationError('Registration deadline must be on or before the event start date/time.')
        return false
      }
    }

    if (ticketTiers.length === 0) {
      setValidationError('At least one ticket tier is required.')
      return false
    }

    for (const tier of ticketTiers) {
      if (!tier.name.trim()) {
        setValidationError('All ticket tiers must have a name.')
        return false
      }
      if (!tier.price || parseFloat(tier.price) < 0) {
        setValidationError(`Price for tier "${tier.name}" must be 0 or positive.`)
        return false
      }
      if (tier.quantity <= 0) {
        setValidationError(`Quantity for tier "${tier.name}" must be greater than 0.`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      // 1. Create event with JSON payload to handle nested ticket_tiers
      const eventPayload = {
        title: form.title,
        short_description: form.short_description,
        description: form.description,
        terms_and_conditions: form.terms_and_conditions || undefined,
        category: parseInt(form.category, 10),
        venue: form.venue,
        address: form.address,
        city: form.city,
        district: form.district || undefined,
        province: form.province || undefined,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: new Date(form.end_datetime).toISOString(),
        registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        visibility: form.visibility,
        ticket_tiers: ticketTiers.map((t) => ({
          name: t.name,
          description: t.description || undefined,
          price: t.price,
          quantity: t.quantity,
          display_order: t.display_order || 1,
          is_active: t.is_active ?? true,
        })),
      }

      const response = await createEvent(eventPayload)
      const createdEvent = response.data

      // 2. Upload banner image if present
      if (banner) {
        const formData = new FormData()
        formData.append('banner', banner)
        await updateEvent(createdEvent.id, formData)
      }

      alert('Draft event created successfully!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, string[]> } }
      if (axiosErr.response?.data) {
        setErrors(axiosErr.response.data)
      } else {
        setValidationError('Something went wrong. Please check your form and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      <PublicNavbar />

      <main className="max-w-3xl w-full mx-auto px-6 py-10 flex-1">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Create Event</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">Submit your event details. Tiers are created inline.</p>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {validationError}
            </div>
          )}

          {errors.non_field_errors && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {errors.non_field_errors[0]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-1">
                General Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Nepal Music Festival 2026"
                  className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-[var(--color-border)] bg-white rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBanner(e.target.files?.[0] || null)}
                    className="w-full text-sm text-[var(--color-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary-50)] file:text-[var(--color-primary-700)] hover:file:bg-[var(--color-primary-100)]"
                  />
                  {errors.banner && <p className="text-xs text-red-500 mt-1">{errors.banner[0]}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Short Description</label>
                <input
                  type="text"
                  name="short_description"
                  value={form.short_description}
                  onChange={handleInputChange}
                  required
                  placeholder="One-sentence hook..."
                  className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.short_description && <p className="text-xs text-red-500 mt-1">{errors.short_description[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Full Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Tell us more about the event layout, features, line up..."
                  className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Terms and Conditions (optional)</label>
                <textarea
                  name="terms_and_conditions"
                  value={form.terms_and_conditions}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Rules, refund policies, dress code..."
                  className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
            </div>

            {/* Venue & Location */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-1">
                Venue &amp; Location
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Venue Name</label>
                  <input
                    type="text"
                    name="venue"
                    value={form.venue}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Dasarath Rangasala Stadium"
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.venue && <p className="text-xs text-red-500 mt-1">{errors.venue[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Tripureshowr"
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Kathmandu"
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">District (optional)</label>
                  <input
                    type="text"
                    name="district"
                    value={form.district}
                    onChange={handleInputChange}
                    placeholder="Kathmandu"
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Province (optional)</label>
                  <input
                    type="text"
                    name="province"
                    value={form.province}
                    onChange={handleInputChange}
                    placeholder="Bagmati"
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>
            </div>

            {/* Date & Schedule */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-1">
                Date &amp; Schedule
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={form.start_datetime}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.start_datetime && <p className="text-xs text-red-500 mt-1">{errors.start_datetime[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={form.end_datetime}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.end_datetime && <p className="text-xs text-red-500 mt-1">{errors.end_datetime[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Registration Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={form.registration_deadline}
                    onChange={handleInputChange}
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.registration_deadline && <p className="text-xs text-red-500 mt-1">{errors.registration_deadline[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Overall Event Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000"
                    min={1}
                    className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  />
                  {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity[0]}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Visibility</label>
                <select
                  name="visibility"
                  value={form.visibility}
                  onChange={handleInputChange}
                  className="w-full border border-[var(--color-border)] bg-white rounded-lg px-4 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="PUBLIC">Public (visible to everyone)</option>
                  <option value="UNLISTED">Unlisted (only via link)</option>
                </select>
              </div>
            </div>

            {/* Ticket Tiers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-1">
                <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Ticket Tiers
                </h2>
                <button
                  type="button"
                  onClick={addTier}
                  className="text-xs text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] font-bold cursor-pointer"
                >
                  + Add Tier
                </button>
              </div>

              {errors.ticket_tiers && (
                <p className="text-xs text-red-500 font-semibold">{errors.ticket_tiers[0]}</p>
              )}

              <div className="space-y-4">
                {ticketTiers.map((tier, idx) => (
                  <div key={tier._id} className="border border-[var(--color-border)] rounded-xl p-4 bg-slate-50 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--color-muted)]">Tier #{idx + 1}</span>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(tier._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Tier Name</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => handleTierChange(tier._id, 'name', e.target.value)}
                          placeholder="e.g. General Admission, VIP"
                          required
                          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] outline-none bg-white focus:ring-1 focus:ring-[var(--color-primary-500)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Price (Rs.)</label>
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => handleTierChange(tier._id, 'price', e.target.value)}
                          placeholder="0 for Free"
                          min={0}
                          required
                          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] outline-none bg-white focus:ring-1 focus:ring-[var(--color-primary-500)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Quantity</label>
                        <input
                          type="number"
                          value={tier.quantity}
                          onChange={(e) => handleTierChange(tier._id, 'quantity', parseInt(e.target.value, 10) || 0)}
                          min={1}
                          required
                          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] outline-none bg-white focus:ring-1 focus:ring-[var(--color-primary-500)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text)] mb-1">Display Order</label>
                        <input
                          type="number"
                          value={tier.display_order}
                          onChange={(e) => handleTierChange(tier._id, 'display_order', parseInt(e.target.value, 10) || 1)}
                          min={1}
                          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] outline-none bg-white focus:ring-1 focus:ring-[var(--color-primary-500)]"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          checked={tier.is_active}
                          onChange={(e) => handleTierChange(tier._id, 'is_active', e.target.checked)}
                          id={`tier-active-${tier._id}`}
                          className="size-4 rounded border-[var(--color-border)] accent-[var(--color-primary-500)]"
                        />
                        <label htmlFor={`tier-active-${tier._id}`} className="text-xs text-[var(--color-muted)] select-none">
                          Is Active (Visible)
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-4 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="flex-1 border border-[var(--color-border)] text-[var(--color-text)] font-semibold py-2.5 rounded-xl text-center hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-center shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Draft Event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
