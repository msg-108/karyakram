import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createBooking } from '../../api/bookings'
import PublicNavbar from '../../components/PublicNavbar'
import type { BookingDetail } from '../../types/bookings'

interface SelectedItem {
  ticket_tier_id: number
  name: string
  price: number
  quantity: number
}

interface LocationState {
  event?: {
    id: number
    title: string
    venue: string
    city: string
  }
  selectedItems?: SelectedItem[]
}

export default function BookTicketsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!state || !state.event || !state.selectedItems || state.selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 text-center max-w-sm shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text)]">No items selected</h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">Please go back to the event detail page and select tickets first.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-[var(--color-primary-500)] text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-[var(--color-primary-600)] transition"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { event, selectedItems } = state
  const totalCost = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const handleConfirmBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload = {
        event: event.id,
        items: selectedItems.map((item) => ({
          ticket_tier: item.ticket_tier_id,
          quantity: item.quantity,
        })),
      }

      const response = await createBooking(payload)
      const bookingData: BookingDetail = response.data

      // Redirect to confirmation page with created booking details
      navigate(`/bookings/${bookingData.id}/confirmation`, {
        state: { booking: bookingData },
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; items?: string[] | Record<string, string[]> } } }
      const resData = axiosErr.response?.data
      if (resData?.detail) {
        setError(resData.detail)
      } else if (resData?.items) {
        setError(
          typeof resData.items === 'string'
            ? resData.items
            : Array.isArray(resData.items)
            ? resData.items[0]
            : Object.values(resData.items)[0]?.[0] || 'Validation error'
        )
      } else {
        setError('Failed to create booking. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      <PublicNavbar />

      <main className="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b border-[var(--color-border)] pb-4 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Review &amp; Confirm</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">Review your tickets before confirming the booking</p>
          </div>

          {/* Event Brief */}
          <div className="bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)] space-y-1">
            <p className="text-xs font-semibold text-[var(--color-primary-500)] uppercase tracking-wider">Event</p>
            <h2 className="font-bold text-lg text-[var(--color-text)]">{event.title}</h2>
            <p className="text-xs text-[var(--color-muted)]">{event.venue}, {event.city}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Line items list */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Tickets Selected</p>
            <div className="divide-y divide-[var(--color-border)]">
              {selectedItems.map((item) => (
                <div key={item.ticket_tier_id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-[var(--color-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Rs. {item.price} &times; {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-[var(--color-text)]">
                    Rs. {item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Cost */}
          <div className="border-t border-b border-[var(--color-border)] py-4 flex justify-between items-center">
            <span className="font-bold text-[var(--color-text)]">Total Amount</span>
            <span className="text-2xl font-extrabold text-[var(--color-text)]">
              Rs. {totalCost}
            </span>
          </div>

          {/* Warning note */}
          <p className="text-[10px] text-[var(--color-muted)] text-center leading-relaxed">
            Note: All ticket bookings on Karyakram are confirmed instantly. There is no payment processing required in this demo version.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-center shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                  </svg>
                  Confirming...
                </span>
              ) : 'Confirm Booking'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="w-full border border-[var(--color-border)] text-[var(--color-text)] font-semibold py-2.5 px-4 rounded-xl text-center hover:bg-[var(--color-bg)] transition duration-200 cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
