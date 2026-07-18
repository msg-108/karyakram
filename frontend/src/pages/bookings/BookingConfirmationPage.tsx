import { useLocation, useNavigate } from 'react-router-dom'
import PublicNavbar from '../../components/PublicNavbar'
import type { BookingDetail } from '../../types/bookings'

interface LocationState {
  booking?: BookingDetail
}

export default function BookingConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  if (!state || !state.booking) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 text-center max-w-sm shadow-sm">
            <h3 className="text-lg font-bold text-[var(--color-text)]">No booking details</h3>
            <p className="text-sm text-[var(--color-muted)] mt-1">Please return to your dashboard to view your booking history.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 bg-[var(--color-primary-500)] text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-[var(--color-primary-600)] transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { booking } = state

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      <PublicNavbar />

      <main className="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center animate-fade-in">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Confirmed Icon Header */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-[var(--color-border)] space-y-3">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="size-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Booking Confirmed!</h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">Your reservation code is <span className="font-mono font-bold text-[var(--color-text)]">#{booking.id}</span></p>
            </div>
          </div>

          {/* Event details */}
          <div className="space-y-3 bg-[var(--color-bg)] rounded-xl p-4 border border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-primary-500)] uppercase tracking-wider">Event Details</p>
            <h2 className="font-bold text-[var(--color-text)]">{booking.event_title}</h2>
            <div className="space-y-1 text-xs text-[var(--color-muted)]">
              <p className="flex items-center gap-1.5">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {formatDate(booking.event_start_datetime)}
              </p>
              <p className="flex items-center gap-1.5">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {booking.event_venue}
              </p>
            </div>
          </div>

          {/* Ticket items */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Tickets Issued</p>
            <div className="divide-y divide-[var(--color-border)] border-b border-[var(--color-border)]">
              {booking.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-[var(--color-text)]">{item.ticket_tier_name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Quantity: {item.quantity} &middot; Price: Rs. {item.price_at_purchase}
                    </p>
                  </div>
                  <span className="font-bold text-[var(--color-text)]">
                    Rs. {parseFloat(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-center py-2">
            <span className="font-bold text-[var(--color-text)]">Total Paid</span>
            <span className="text-xl font-extrabold text-[var(--color-text)]">
              Rs. {booking.total_amount}
            </span>
          </div>

          {/* Instructions note */}
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3.5 text-center leading-relaxed">
            Please show this confirmation screen or your reservation code <strong>#{booking.id}</strong> at the venue entrance.
          </div>

          {/* Action */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-semibold py-3 px-4 rounded-xl text-center shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
