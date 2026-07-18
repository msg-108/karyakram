import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicEvent } from '../../api/events'
import PublicNavbar from '../../components/PublicNavbar'
import useAuthStore from '../../store/authStore'
import type { EventDetail } from '../../types/events'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state: mapping tier ID -> quantity chosen
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const { accessToken, role, isStaff } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    getPublicEvent(slug)
      .then((r) => {
        setEvent(r.data)
        // Initialize quantities to 0 for all active tiers
        const initialQs: Record<number, number> = {}
        r.data.ticket_tiers.forEach((tier) => {
          if (tier.is_active && tier.remaining_quantity > 0) {
            initialQs[tier.id] = 0
          }
        })
        setQuantities(initialQs)
      })
      .catch((err) => {
        setError('Event not found or failed to load.')
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  const handleQtyChange = (tierId: number, maxQty: number, value: number) => {
    const cleanVal = Math.max(0, Math.min(maxQty, value))
    setQuantities((prev) => ({
      ...prev,
      [tierId]: cleanVal,
    }))
  }

  const getSelectedItems = () => {
    if (!event) return []
    return event.ticket_tiers
      .filter((tier) => (quantities[tier.id] || 0) > 0)
      .map((tier) => ({
        ticket_tier_id: tier.id,
        name: tier.name,
        price: parseFloat(tier.price),
        quantity: quantities[tier.id],
      }))
  }

  const handleProceedToBook = () => {
    if (!event) return

    if (!accessToken) {
      // Redirect to login, but could save selection or prefill redirect
      navigate('/login')
      return
    }

    if (role === 'ORGANIZER') {
      alert('Organizer accounts cannot book tickets. Please log in as an Attendee.')
      return
    }

    if (isStaff) {
      alert('Administrator accounts cannot book tickets. Please log in as an Attendee.')
      return
    }

    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      alert('Please select at least one ticket.')
      return
    }

    // Navigate to booking page with selected items in state
    navigate(`/events/${event.slug}/book`, {
      state: {
        event: {
          id: event.id,
          title: event.title,
          venue: event.venue,
          city: event.city,
        },
        selectedItems,
      },
    })
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-10 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 text-center max-w-sm">
            <p className="font-bold">{error || 'Event not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 inline-flex text-xs font-semibold underline hover:text-red-800"
            >
              Back to all events
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectedItems = getSelectedItems()
  const totalCost = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col font-sans">
      <PublicNavbar />

      {/* Main container */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Info & Tiers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Banner Banner */}
          <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="h-64 sm:h-96 w-full bg-slate-100 relative">
              {event.banner ? (
                <img
                  src={event.banner}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-50)] flex items-center justify-center">
                  <span className="text-[var(--color-primary-500)] text-xl font-bold">Karyakram</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <span className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--color-primary-100)]">
                {event.category.name}
              </span>
              <h1 className="text-3xl font-extrabold text-[var(--color-text)] mt-3">
                {event.title}
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-2">
                Organized by <span className="font-semibold text-[var(--color-text)]">{event.organizer_name}</span>
              </p>
            </div>
          </div>

          {/* Description details */}
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
              Event Description
            </h2>
            <p className="text-sm text-[var(--color-text)] whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Ticket Tiers selection */}
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
              Select Tickets
            </h2>
            {event.ticket_tiers.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No tickets available for this event.</p>
            ) : (
              <div className="space-y-4">
                {event.ticket_tiers.map((tier) => {
                  const isSoldOut = tier.remaining_quantity <= 0
                  const isInactive = !tier.is_active
                  const qty = quantities[tier.id] || 0

                  return (
                    <div
                      key={tier.id}
                      className={`border border-[var(--color-border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isSoldOut || isInactive ? 'opacity-50 bg-slate-50' : 'bg-white hover:border-[var(--color-primary-100)]'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[var(--color-text)]">{tier.name}</h3>
                          {isSoldOut && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Sold Out</span>
                          )}
                          {isInactive && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Unavailable</span>
                          )}
                        </div>
                        {tier.description && (
                          <p className="text-xs text-[var(--color-muted)]">{tier.description}</p>
                        )}
                        <p className="text-xs text-[var(--color-muted)]">
                          {tier.remaining_quantity} / {tier.quantity} tickets remaining
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Price</p>
                          <p className="text-lg font-bold text-[var(--color-text)]">Rs. {tier.price}</p>
                        </div>

                        {!(isSoldOut || isInactive) && (
                          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(tier.id, tier.remaining_quantity, qty - 1)}
                              disabled={qty <= 0}
                              className="px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 text-[var(--color-text)] disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 text-sm font-bold text-[var(--color-text)] min-w-[24px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(tier.id, tier.remaining_quantity, qty + 1)}
                              disabled={qty >= tier.remaining_quantity}
                              className="px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 text-[var(--color-text)] disabled:opacity-30 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {event.terms_and_conditions && (
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
                Terms &amp; Conditions
              </h2>
              <p className="text-xs text-[var(--color-muted)] whitespace-pre-line leading-relaxed">
                {event.terms_and_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Right 1 col: Checkout/Action sticky card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
              Event Details
            </h2>

            {/* Timings */}
            <div className="space-y-4 text-sm text-[var(--color-text)]">
              <div className="flex gap-3">
                <svg className="size-5 text-[var(--color-primary-500)] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008Z" />
                </svg>
                <div>
                  <p className="font-semibold">Date &amp; Time</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{formatDate(event.start_datetime)}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">to {formatDate(event.end_datetime)}</p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex gap-3">
                <svg className="size-5 text-[var(--color-primary-500)] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <div>
                  <p className="font-semibold">Venue</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{event.venue}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{event.address}, {event.city}</p>
                </div>
              </div>

              {/* District & Province */}
              <div className="flex gap-3">
                <svg className="size-5 text-[var(--color-primary-500)] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <div>
                  <p className="font-semibold">Location Region</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{event.district}, {event.province}</p>
                </div>
              </div>

              {/* Registration Deadline */}
              {event.registration_deadline && (
                <div className="flex gap-3">
                  <svg className="size-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-600">Registration Deadline</p>
                    <p className="text-xs text-red-500 mt-0.5">{formatDate(event.registration_deadline)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Total price & proceed */}
            <div className="border-t border-[var(--color-border)] pt-5">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Total Booking Cost</p>
                  <p className="text-3xl font-extrabold text-[var(--color-text)]">Rs. {totalCost}</p>
                </div>
                {selectedItems.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-100)]">
                    {selectedItems.reduce((acc, i) => acc + i.quantity, 0)} tickets
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleProceedToBook}
                disabled={selectedItems.length === 0}
                className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-center shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
              >
                Proceed to Book
              </button>

              {!accessToken && (
                <p className="text-[10px] text-[var(--color-muted)] text-center mt-2.5">
                  You need to be signed in to book tickets.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
