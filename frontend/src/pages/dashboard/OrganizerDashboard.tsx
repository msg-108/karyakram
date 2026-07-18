import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrganizerSummary } from '../../api/dashboard'
import { getMyOrganizerProfile } from '../../api/users'
import { listOrganizerEvents, submitEvent } from '../../api/events'
import useAuthStore from '../../store/authStore'
import type { OrganizerDashboardSummary } from '../../types/dashboard'
import type { OrganizerProfile } from '../../types/auth'
import type { OrganizerEventListItem } from '../../types/events'

export default function OrganizerDashboard() {
  const { logout, isApproved } = useAuthStore()
  const [summary, setSummary] = useState<OrganizerDashboardSummary | null>(null)
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [events, setEvents] = useState<OrganizerEventListItem[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  const navigate = useNavigate()

  const fetchDashboardData = async () => {
    getOrganizerSummary()
      .then((r) => setSummary(r.data))
      .catch(() => null)

    getMyOrganizerProfile()
      .then((r) => setProfile(r.data))
      .catch(() => null)

    setLoadingEvents(true)
    listOrganizerEvents()
      .then((r) => setEvents(r.data))
      .catch(() => null)
      .finally(() => setLoadingEvents(false))
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleSubmitForReview = async (pk: number) => {
    try {
      await submitEvent(pk)
      alert('Event submitted for review successfully!')
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      alert('Failed to submit event.')
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700'
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-700'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-700'
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {profile?.organization_name || 'Organizer Dashboard'}
            </h1>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {isApproved ? 'Approved Organizer' : 'Pending Approval'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isApproved && (
              <button
                onClick={() => navigate('/organizer/events/create')}
                className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition cursor-pointer"
              >
                Create Event
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {!isApproved && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
            Your organizer account is pending approval by the Karyakram team.
          </div>
        )}

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Events', value: summary.total_events },
              { label: 'Published', value: summary.published_events },
              { label: 'Tickets Sold', value: summary.total_tickets_sold },
              { label: 'Pending Review', value: summary.pending_events },
              { label: 'Total Revenue', value: `Rs. ${summary.total_revenue}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-[var(--color-text)] mt-1">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Organizer events list */}
        {isApproved && (
          <section className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">My Events</h2>
            {loadingEvents ? (
              <div className="flex justify-center items-center py-10">
                <div className="size-6 border-2 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-[var(--color-muted)]">You have not created any events yet.</p>
                <button
                  onClick={() => navigate('/organizer/events/create')}
                  className="mt-3 text-xs font-semibold text-[var(--color-primary-500)] hover:underline"
                >
                  Create your first event
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-muted)] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Event Details</th>
                      <th className="py-3 px-2">Visibility</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {events.map((event) => {
                      const canSubmit = event.status === 'DRAFT' || event.status === 'REJECTED'
                      return (
                        <tr key={event.id} className="text-sm">
                          <td className="py-4 px-2">
                            <p className="font-bold text-[var(--color-text)]">{event.title}</p>
                            <p className="text-xs text-[var(--color-muted)]">
                              Starts: {new Date(event.start_datetime).toLocaleDateString()} &middot; {event.category.name}
                            </p>
                            {event.rejection_reason && (
                              <p className="text-xs text-red-500 font-semibold mt-1">Rejection reason: {event.rejection_reason}</p>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {event.visibility}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            {canSubmit ? (
                              <button
                                onClick={() => handleSubmitForReview(event.id)}
                                className="bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] text-[var(--color-primary-700)] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-primary-100)] transition cursor-pointer"
                              >
                                Submit for Review
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--color-muted)] italic">No actions available</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
