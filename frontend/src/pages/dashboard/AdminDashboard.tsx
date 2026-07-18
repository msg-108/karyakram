/**
 * AdminDashboard.tsx
 *
 * Fixes vs the old AdminDashboard.jsx:
 *  1. No shared /dashboard/ endpoint — admin dashboard calls its real endpoints:
 *     GET /api/admin/organizers/pending/ and GET /api/admin/events/pending/
 *  2. handleLogout() only calls logout() — no POST /auth/logout/
 *  3. Admin detection is now done via isStaff from the JWT claim,
 *     not user?.is_staff or user?.is_superuser from a non-existent user object
 *
 * Note: No unified admin stats endpoint exists yet in the backend.
 * Pending organizer list + pending event list are the two real admin routes.
 */
import { useEffect, useState } from 'react'
import { listPendingOrganizers, approveOrganizer } from '../../api/users'
import { listPendingEvents, approveOrRejectEvent, publishEvent } from '../../api/events'
import useAuthStore from '../../store/authStore'
import type { OrganizerProfile } from '../../types/auth'
import type { AdminEventReview } from '../../types/events'

export default function AdminDashboard() {
  const { logout } = useAuthStore()
  const [pendingOrgs, setPendingOrgs] = useState<OrganizerProfile[]>([])
  const [pendingEvents, setPendingEvents] = useState<AdminEventReview[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const [orgs, events] = await Promise.allSettled([
      listPendingOrganizers(),
      listPendingEvents(),
    ])
    if (orgs.status === 'fulfilled') setPendingOrgs(orgs.value.data)
    if (events.status === 'fulfilled') setPendingEvents(events.value.data)
    setLoading(false)
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
    }
    await approveOrganizer(userId, { action, reason })
    fetchData()
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
    }
    await approveOrRejectEvent(pk, { action, reason })
    fetchData()
  }

  const handlePublishEvent = async (pk: number) => {
    await publishEvent(pk)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Admin Panel</h1>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Administrator
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>

        {loading ? (
          <p className="text-[var(--color-muted)] text-sm">Loading…</p>
        ) : (
          <>
            {/* Pending organizers */}
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                Pending Organizers ({pendingOrgs.length})
              </h2>
              {pendingOrgs.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No pending organizer applications.</p>
              ) : (
                <div className="space-y-3">
                  {pendingOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="bg-white border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{org.organization_name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{org.user.email} — @{org.user.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveOrg(org.user.id, 'approve')}
                          className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveOrg(org.user.id, 'reject')}
                          className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pending events */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                Pending Events ({pendingEvents.length})
              </h2>
              {pendingEvents.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">No pending events for review.</p>
              ) : (
                <div className="space-y-3">
                  {pendingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{event.title}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          by {event.organizer_name} &middot; {event.category.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {event.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleApproveEvent(event.id, 'approve')}
                              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveEvent(event.id, 'reject')}
                              className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {event.status === 'APPROVED' && (
                          <button
                            onClick={() => handlePublishEvent(event.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
