import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrganizerSummary } from '../../api/dashboard'
import { getMyOrganizerProfile } from '../../api/users'
import { listOrganizerEvents, submitEvent, deleteEvent } from '../../api/events'
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

  const handleDeleteEvent = async (pk: number) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }
    try {
      await deleteEvent(pk)
      alert('Event deleted successfully.')
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete event.')
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'APPROVED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      {/* Clean Navbar */}
      <nav className="w-full bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <span className="text-[var(--color-primary-500)] font-bold text-lg tracking-tight select-none">
          Karyakram Organizer
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {profile?.organization_name || 'Organizer Dashboard'}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1 space-y-8">
        {/* Verification Alert */}
        {!isApproved && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <svg className="size-5 shrink-0 text-amber-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="font-bold">Organizer Account Pending Approval</p>
              <p className="text-xs text-amber-700 mt-1">Your organization profile is currently being reviewed by our administrators. You will be able to create events once approved.</p>
            </div>
          </div>
        )}

        {/* Dashboard summary overview */}
        {isApproved && summary && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Overview</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Events', value: summary.total_events },
                { label: 'Published', value: summary.published_events },
                { label: 'Pending Review', value: summary.pending_events },
                { label: 'Tickets Sold', value: summary.total_tickets_sold },
                { label: 'Total Revenue', value: `Rs. ${summary.total_revenue}`, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">{label}</p>
                  <p className={`text-2xl font-black mt-2 ${highlight ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-text)]'}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Section */}
        {isApproved && (
          <section className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">My Events</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">Manage and track your hosted events and visibility states</p>
              </div>
              <button
                onClick={() => navigate('/organizer/events/create')}
                className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Event
              </button>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center items-center py-20">
                <div className="size-8 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--color-border)] rounded-xl space-y-3">
                <svg className="size-12 text-[var(--color-muted)] mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">No events created</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-1">Get started by creating your first event draft details.</p>
                </div>
                <button
                  onClick={() => navigate('/organizer/events/create')}
                  className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-[var(--color-primary-100)] transition"
                >
                  Create Event
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-slate-50 text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">Visibility</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {events.map((event) => {
                      const isDraftOrRejected = event.status === 'DRAFT' || event.status === 'REJECTED'
                      return (
                        <tr key={event.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-[var(--color-text)]">{event.title}</p>
                            <p className="text-xs text-[var(--color-muted)] mt-1">
                              {new Date(event.start_datetime).toLocaleDateString()} &middot; {event.category.name}
                            </p>
                            {event.rejection_reason && (
                              <div className="mt-2 text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg p-2 max-w-md">
                                <strong>Rejection Reason:</strong> {event.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {event.visibility}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusStyle(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {isDraftOrRejected ? (
                                <>
                                  <button
                                    onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                                    className="bg-white border border-[var(--color-border)] hover:bg-slate-50 text-[var(--color-text)] text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleSubmitForReview(event.id)}
                                    className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                                  >
                                    Submit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-[var(--color-muted)] italic mr-2">Locked for Review</span>
                              )}
                            </div>
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
      </main>
    </div>
  )
}
