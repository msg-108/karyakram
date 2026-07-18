import { useEffect, useState } from 'react'
import { getUserSummary } from '../../api/dashboard'
import { getMe } from '../../api/users'
import { listBookings, cancelBooking } from '../../api/bookings'
import useAuthStore from '../../store/authStore'
import type { UserDashboardSummary } from '../../types/dashboard'
import type { UserPublic } from '../../types/auth'
import type { BookingListItem } from '../../types/bookings'
import PublicNavbar from '../../components/PublicNavbar'

export default function UserDashboard() {
  const { logout } = useAuthStore()
  const [summary, setSummary] = useState<UserDashboardSummary | null>(null)
  const [me, setMe] = useState<UserPublic | null>(null)
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const fetchDashboardData = async () => {
    getUserSummary()
      .then((r) => setSummary(r.data))
      .catch(() => null)

    getMe()
      .then((r) => setMe(r.data))
      .catch(() => null)

    setLoadingBookings(true)
    listBookings()
      .then((r) => setBookings(r.data))
      .catch(() => null)
      .finally(() => setLoadingBookings(false))
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleCancelBooking = async (pk: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The stock will be released back to the event.')) {
      return
    }
    try {
      await cancelBooking(pk)
      alert('Booking cancelled successfully.')
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      alert('Failed to cancel booking.')
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      <PublicNavbar />

      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {me ? `Welcome, ${me.first_name || me.username}` : 'Attendee Dashboard'}
            </h1>
            <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Attendee Profile
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>

        {/* Stats Summary */}
        {summary && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Bookings', value: summary.total_bookings },
              { label: 'Upcoming Events', value: summary.upcoming_events },
              { label: 'Total Spent', value: `Rs. ${summary.total_spent}`, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-black mt-2 ${highlight ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-text)]'}`}>{value}</p>
              </div>
            ))}
          </section>
        )}

        {/* Booking History */}
        <section className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">My Booking History</h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">View and manage your ticket reservations</p>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center items-center py-20">
              <div className="size-8 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--color-border)] rounded-xl space-y-3">
              <svg className="size-12 text-[var(--color-muted)] mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.75 3.75 0 0 1 0 7.5V15m0-9H7.5" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">No bookings found</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">You have not booked tickets for any events yet.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-slate-50 text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[var(--color-text)]">
                        {booking.event_title}
                        <div className="text-[10px] text-[var(--color-muted)] font-normal mt-0.5">Booking #{booking.id}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-[var(--color-muted)]">
                        {new Date(booking.event_start_datetime).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[var(--color-text)]">
                        Rs. {booking.total_amount}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
