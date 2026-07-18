import { useEffect, useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPublicEvents, listCategories } from '../../api/events'
import PublicNavbar from '../../components/PublicNavbar'
import type { EventListItem, EventCategory } from '../../types/events'
import useAuthStore from '../../store/authStore'

export default function EventsListPage() {
  const [events, setEvents] = useState<EventListItem[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [city, setCity] = useState('')

  const navigate = useNavigate()
  const { role } = useAuthStore()

  useEffect(() => {
    if (role === 'ORGANIZER') {
      navigate('/dashboard', { replace: true })
    }
  }, [role, navigate])

  useEffect(() => {
    // Load categories once
    listCategories()
      .then((r) => setCategories(r.data))
      .catch(() => {
        // Fallback standard choices
        const fallbacks = [
          { id: 1, name: 'Comedy', slug: 'comedy' },
          { id: 2, name: 'Music', slug: 'music' },
          { id: 3, name: 'Sports', slug: 'sports' },
          { id: 4, name: 'Conference', slug: 'conference' },
          { id: 5, name: 'Workshop', slug: 'workshop' },
          { id: 6, name: 'Theatre', slug: 'theatre' },
          { id: 7, name: 'Festival', slug: 'festival' },
          { id: 8, name: 'Other', slug: 'other' },
        ] as EventCategory[]
        setCategories(fallbacks)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    listPublicEvents({
      q: search || undefined,
      category: selectedCategory || undefined,
      city: city || undefined,
    })
      .then((r) => {
        // The API returns PaginatedResponse<EventListItem>
        setEvents(r.data.results)
      })
      .catch((err) => {
        setError('Failed to load events. Please try again later.')
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [search, selectedCategory, city])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
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

      {/* Hero section */}
      <section className="bg-gradient-to-r from-[var(--color-primary-700)] to-[var(--color-primary-600)] text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 animate-fade-in">
            Discover Incredible Events
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 font-light">
            Find the best concerts, workshops, conferences, and festivals in Nepal. Book tickets instantly.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-2 flex flex-col md:flex-row gap-2 border border-white/10 backdrop-blur-md">
            <div className="flex-1 flex items-center px-3 gap-2">
              <svg className="size-5 text-[var(--color-muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.608 10.608Z" />
              </svg>
              <input
                id="search-input"
                type="text"
                placeholder="Search events, venues, cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm text-[var(--color-text)] bg-transparent outline-none placeholder:text-[var(--color-muted)]"
              />
            </div>
            <div className="w-full md:w-48 border-t md:border-t-0 md:border-l border-[var(--color-border)] flex items-center px-3 gap-2">
              <svg className="size-5 text-[var(--color-muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <input
                id="city-input"
                type="text"
                placeholder="All Cities"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-sm text-[var(--color-text)] bg-transparent outline-none placeholder:text-[var(--color-muted)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Categories Tab Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-[var(--color-border)]">
          <button
            onClick={() => startTransition(() => setSelectedCategory(''))}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === ''
                ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                : 'bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => startTransition(() => setSelectedCategory(cat.slug))}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                  : 'bg-white border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status display */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="size-10 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-500)] rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 text-center">
            {error}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          events.length === 0 ? (
            <div className="text-center py-20 bg-white border border-[var(--color-border)] rounded-2xl p-8">
              <svg className="size-16 text-[var(--color-muted)] mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">No events found</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">Try resetting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.slug}`)}
                  className="group bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 cursor-pointer flex flex-col"
                >
                  {/* Banner Image */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                    {event.banner ? (
                      <img
                        src={event.banner}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-50)] flex items-center justify-center">
                        <span className="text-[var(--color-primary-500)] text-sm font-semibold">Karyakram</span>
                      </div>
                    )}
                    {/* Category tag */}
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-[var(--color-primary-700)] border border-white/20 shadow-sm">
                      {event.category?.name || 'Event'}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-primary-500)] mb-1.5 uppercase tracking-wider">
                        {formatDate(event.start_datetime)}
                      </p>
                      <h3 className="font-bold text-lg text-[var(--color-text)] line-clamp-1 group-hover:text-[var(--color-primary-500)] transition">
                        {event.title}
                      </h3>
                      <p className="text-sm text-[var(--color-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                        {event.short_description}
                      </p>
                    </div>

                    <div className="border-t border-[var(--color-border)] pt-4 mt-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="line-clamp-1">{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                        <span>Organized by {event.organizer_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
