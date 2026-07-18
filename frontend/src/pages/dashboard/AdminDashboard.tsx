import { useEffect, useState } from 'react'
import { listPendingOrganizers, approveOrganizer } from '../../api/users'
import { listPendingEvents, approveOrRejectEvent, publishEvent } from '../../api/events'
import useAuthStore from '../../store/authStore'
import type { OrganizerProfile } from '../../types/auth'
import type { AdminEventReview } from '../../types/events'

type TabType = 'organizers' | 'events'

export default function AdminDashboard() {
  const { logout } = useAuthStore()
  const [pendingOrgs, setPendingOrgs] = useState<OrganizerProfile[]>([])
  const [pendingEvents, setPendingEvents] = useState<AdminEventReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('organizers')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orgs, events] = await Promise.allSettled([
        listPendingOrganizers(),
        listPendingEvents(),
      ])
      if (orgs.status === 'fulfilled') setPendingOrgs(orgs.value.data)
      if (events.status === 'fulfilled') setPendingEvents(events.value.data)
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleApproveOrg = async (userId: number, action: 'approve' | 'reject') => {
    let reason: string | undefined = undefined
    if (action === 'reject') {
      const input = window.prompt('Please enter a reason for rejecting this organizer:')
      if (input === null) return // user cancelled
      if (!input.trim()) {
        alert('Rejection reason is required.')
        return
      }
      reason = input.trim()
    } else {
      if (!window.confirm('Are you sure you want to approve this organizer?')) return
    }
    
    try {
      await approveOrganizer(userId, { action, reason })
      alert(`Organizer successfully ${action}d.`)
      fetchData()
    } catch (err) {
      console.error(err)
      alert(`Failed to ${action} organizer.`)
    }
  }

  const handleApproveEvent = async (pk: number, action: 'approve' | 'reject') => {
    let reason: string | undefined = undefined
    if (action === 'reject') {
      const input = window.prompt('Please enter a reason for rejecting this event:')
      if (input === null) return // user cancelled
      if (!input.trim()) {
        alert('Rejection reason is required.')
        return
      }
      reason = input.trim()
    } else {
      if (!window.confirm('Are you sure you want to approve this event?')) return
    }

    try {
      await approveOrRejectEvent(pk, { action, reason })
      alert(`Event successfully ${action}d.`)
      fetchData()
    } catch (err) {
      console.error(err)
      alert(`Failed to ${action} event.`)
    }
  }

  const handlePublishEvent = async (pk: number) => {
    if (!window.confirm('Are you sure you want to publish this event to the public directory?')) return
    try {
      await publishEvent(pk)
      alert('Event published successfully!')
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Failed to publish event.')
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') {
      return (
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          Approved &middot; Ready to Publish
        </span>
      )
    }
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        Awaiting Review
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      {/* Clean Admin Navbar */}
      <nav className="w-full bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-primary-500)] font-bold text-lg tracking-tight select-none">
            Karyakram Admin
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Control Panel
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </nav>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1 space-y-8">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Administrator Dashboard</h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Manage organizer applications and event publishing queues</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('organizers')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'organizers'
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Organizers ({pendingOrgs.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              Events Queue ({pendingEvents.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="size-8 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'organizers' && (
              <section className="space-y-4 animate-fade-in">
                {pendingOrgs.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[var(--color-border)] rounded-2xl p-8">
                    <p className="text-sm text-[var(--color-muted)]">No pending organizer applications.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingOrgs.map((org) => (
                      <div
                        key={org.id}
                        className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-[var(--color-text)]">{org.organization_name}</h3>
                          <p className="text-sm text-[var(--color-muted)]">@{org.user.username} &middot; {org.user.email}</p>
                          <div className="pt-2 text-xs text-[var(--color-muted)] flex flex-wrap gap-x-4 gap-y-1">
                            <span><strong>PAN:</strong> {org.pan_number || 'N/A'}</span>
                            <span><strong>Bank:</strong> {org.bank_name || 'N/A'} (A/C: {org.bank_account_number || 'N/A'})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveOrg(org.user.id, 'reject')}
                            className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveOrg(org.user.id, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer"
                          >
                            Approve Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'events' && (
              <section className="space-y-4 animate-fade-in">
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[var(--color-border)] rounded-2xl p-8">
                    <p className="text-sm text-[var(--color-muted)]">No pending events awaiting review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-lg text-[var(--color-text)]">{event.title}</h3>
                            {getStatusBadge(event.status)}
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">
                            Organized by <strong>{event.organizer_name}</strong> &middot; Category: {event.category.name}
                          </p>
                          <p className="text-xs text-[var(--color-muted)] pt-1">
                            Schedule: {new Date(event.start_datetime).toLocaleDateString()} to {new Date(event.end_datetime).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {event.status === 'SUBMITTED' ? (
                            <>
                              <button
                                onClick={() => handleApproveEvent(event.id, 'reject')}
                                className="border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
                              >
                                Reject Event
                              </button>
                              <button
                                onClick={() => handleApproveEvent(event.id, 'approve')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer"
                              >
                                Approve
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handlePublishEvent(event.id)}
                              className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                            >
                              Publish Event
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
