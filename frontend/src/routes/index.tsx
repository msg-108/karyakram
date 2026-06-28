import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Search, ChevronLeft, ChevronRight, MapPin, Calendar, Clock,
  Ticket, Menu, Music, Mic2, Utensils, Sparkles, Trophy, Theater,
  ShieldCheck, QrCode, CreditCard, ArrowRight, Heart, Users,
  Instagram, Twitter, Facebook, Youtube,
} from "lucide-react";

import logo from "@/assets/karyakram-logo.png";
import heroRock from "@/assets/hero-rock.jpg";
import heroEdm from "@/assets/hero-edm.jpg";
import heroComedy from "@/assets/hero-comedy.jpg";
import heroCultural from "@/assets/hero-cultural.jpg";
import heroFood from "@/assets/hero-food.jpg";
import heroNewYear from "@/assets/hero-newyear.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karyakram — Premium Event Ticketing in Nepal" },
      { name: "description", content: "Discover and book concerts, festivals, comedy nights and cultural events. Cinematic experiences. Instant QR tickets." },
      { property: "og:title", content: "Karyakram — Premium Event Ticketing" },
      { property: "og:description", content: "Discover and book concerts, festivals, comedy nights and cultural events." },
    ],
  }),
  component: Index,
});

type Banner = {
  id: number; title: string; subtitle: string; image: string;
  location: string; date: string; time: string; category: string; price: string;
};

const banners: Banner[] = [
  { id: 1, title: "Sutra: A Rock Odyssey", subtitle: "An electrifying night of pure adrenaline as Nepal's loudest stages collide under one roof.", image: heroRock, location: "Dasharath Stadium, Kathmandu", date: "Sat, Dec 14", time: "7:00 PM", category: "Concert", price: "Rs. 2,500" },
  { id: 2, title: "Echo EDM Festival 2026", subtitle: "Three nights. Twelve headliners. A pulsing landscape of light, bass and pure euphoria.", image: heroEdm, location: "Hyatt Grounds, Bouddha", date: "Fri, Jan 17", time: "8:00 PM", category: "Festival", price: "Rs. 3,800" },
  { id: 3, title: "The Late Night Set", subtitle: "An intimate evening with the sharpest comedians in town. Velvet, whiskey and unfiltered humour.", image: heroComedy, location: "Mandala Theatre, Anamnagar", date: "Thu, Dec 19", time: "9:00 PM", category: "Comedy", price: "Rs. 1,200" },
  { id: 4, title: "Indra Jatra Cultural Night", subtitle: "Traditional dances under lantern light — a celebration of heritage reimagined for a modern stage.", image: heroCultural, location: "Patan Durbar Square", date: "Sun, Sep 28", time: "6:30 PM", category: "Cultural", price: "Rs. 800" },
  { id: 5, title: "Himalayan Food Carnival", subtitle: "Sixty kitchens, one open sky, and flavours from every corner of the country.", image: heroFood, location: "Tundikhel, Kathmandu", date: "Sat, Nov 02", time: "12:00 PM", category: "Food", price: "Rs. 500" },
  { id: 6, title: "New Year's Eve Gala", subtitle: "Rooftop fireworks, a live orchestra and the city skyline as your stage. Welcome 2027 in style.", image: heroNewYear, location: "Soaltee, Tahachal", date: "Tue, Dec 31", time: "10:00 PM", category: "Gala", price: "Rs. 6,000" },
];

const categories = [
  { name: "Concerts", icon: Music },
  { name: "Comedy", icon: Mic2 },
  { name: "Festivals", icon: Sparkles },
  { name: "Food", icon: Utensils },
  { name: "Sports", icon: Trophy },
  { name: "Theatre", icon: Theater },
];

const featured = [
  { id: 1, title: "Sutra: A Rock Odyssey", image: heroRock, date: "Dec 14", venue: "Dasharath Stadium", organizer: "Karyakram Live", price: "Rs. 2,500", left: 42 },
  { id: 2, title: "Echo EDM Festival", image: heroEdm, date: "Jan 17", venue: "Hyatt Grounds", organizer: "Pulse Collective", price: "Rs. 3,800", left: 128 },
  { id: 3, title: "New Year's Eve Gala", image: heroNewYear, date: "Dec 31", venue: "Soaltee Tahachal", organizer: "Karyakram Live", price: "Rs. 6,000", left: 18 },
];

const upcoming = [
  { id: 1, title: "Indra Jatra Cultural Night", image: heroCultural, date: "Sep 28", location: "Patan", price: "Rs. 800" },
  { id: 2, title: "Himalayan Food Carnival", image: heroFood, date: "Nov 02", location: "Tundikhel", price: "Rs. 500" },
  { id: 3, title: "The Late Night Set", image: heroComedy, date: "Dec 19", location: "Anamnagar", price: "Rs. 1,200" },
  { id: 4, title: "Sutra: A Rock Odyssey", image: heroRock, date: "Dec 14", location: "Dasharath", price: "Rs. 2,500" },
  { id: 5, title: "Echo EDM Festival", image: heroEdm, date: "Jan 17", location: "Bouddha", price: "Rs. 3,800" },
];

const organizers = [
  { name: "Karyakram Live", events: 42, image: heroRock },
  { name: "Pulse Collective", events: 28, image: heroEdm },
  { name: "Mandala Theatre", events: 19, image: heroComedy },
  { name: "Heritage Trust", events: 34, image: heroCultural },
  { name: "Tundikhel Co.", events: 12, image: heroFood },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Categories />
      <Featured />
      <Upcoming />
      <Organizers />
      <WhyUs />
      <Footer />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = ["Home", "Events", "Categories", "Organizers", "About", "Contact"];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}>
      <div className="mx-auto max-w-[1400px] px-6">
        <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-6 rounded-2xl px-5 py-3 transition-all duration-500 ${scrolled ? "glass-strong shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]" : "bg-transparent"}`}>
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="Karyakram" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Karyakram</span>
          </a>
          <nav className="hidden lg:flex items-center justify-center gap-9 text-sm font-medium">
            {items.map((i) => (
              <a key={i} href="#" className="nav-link">{i}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 transition-all duration-300 ${searchFocus ? "w-80 border-primary/60 shadow-glow" : "w-56"}`}>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search events, artists, cities..."
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="hidden md:inline-flex items-center justify-center rounded-full border border-foreground/15 px-5 py-2 text-sm font-medium text-foreground transition hover:border-foreground/40 hover:bg-foreground/5">
              Login
            </button>
            <button
              className="hidden md:inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow"
              style={{ background: "var(--gradient-primary)" }}
            >
              Register
            </button>
            <button onClick={() => setOpen((v) => !v)} className="lg:hidden grid h-10 w-10 place-items-center rounded-full glass">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden mt-3 glass-strong rounded-2xl p-5 animate-fade-up">
            <nav className="flex flex-col gap-3 text-base font-medium">
              {items.map((i) => (
                <a key={i} href="#" className="nav-link inline-block w-fit">{i}</a>
              ))}
            </nav>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full border border-foreground/15 py-2 text-sm">Login</button>
              <button className="flex-1 rounded-full py-2 text-sm font-semibold" style={{ background: "var(--gradient-primary)" }}>Register</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const len = banners.length;
  const next = () => setI((p) => (p + 1) % len);
  const prev = () => setI((p) => (p - 1 + len) % len);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  });

  return (
    <section className="relative px-4 pt-28 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div
          className="relative overflow-hidden rounded-3xl shadow-elevated ring-1 ring-foreground/5"
          style={{ height: "min(680px, 78vh)" }}
        >
          {/* Slides */}
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ${idx === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <img src={b.image} alt={b.title} className="h-full w-full object-cover scale-105" />
            </div>
          ))}

          {/* Strong gradient from bottom — this is what makes text readable without a box */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          {/* Extra side gradient so left text pops */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          {/* NOW BOOKING badge */}
          <div className="absolute left-6 top-6 sm:left-8 sm:top-8 z-10 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Now booking
            </span>
          </div>

          {/* ── INFO EMBEDDED IN HERO — no box, just text on gradient ── */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-10 sm:px-12 sm:pb-12 animate-fade-up">

            {/* Category pill */}
            <span className="inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white mb-4">
              {banners[i].category}
            </span>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.1] text-white mb-3 max-w-2xl">
              {banners[i].title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-white/65 leading-relaxed max-w-xl mb-7 line-clamp-2">
              {banners[i].subtitle}
            </p>

            {/* Meta + CTA row */}
            <div className="flex flex-wrap items-end justify-between gap-6">
              {/* Venue / Date / Time */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Venue</div>
                    <div className="text-sm font-medium text-white/90">{banners[i].location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Date</div>
                    <div className="text-sm font-medium text-white/90">{banners[i].date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Time</div>
                    <div className="text-sm font-medium text-white/90">{banners[i].time}</div>
                  </div>
                </div>
              </div>

              {/* Price + buttons */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">From</div>
                  <div className="font-display text-2xl font-bold text-white">{banners[i].price}</div>
                </div>
                <button className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/10">
                  Learn More
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Ticket className="h-4 w-4" /> Book Tickets
                </button>
              </div>
            </div>
          </div>

          {/* Arrows */}
          <button onClick={prev} className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full glass transition hover:bg-white/20">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full glass transition hover:bg-white/20">
            <ChevronRight className="h-5 w-5 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead eyebrow="Browse" title="Quick Categories" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-5">
          {categories.map((c) => (
            <button
              key={c.name}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-surface hover:shadow-glow"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition group-hover:bg-primary/20">
                <c.icon className="h-5 w-5 text-primary-glow" />
              </div>
              <span className="text-sm font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className="mb-10 grid grid-cols-[1fr_auto] items-end gap-4">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.25em] text-primary-glow">{eyebrow}</div>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">{title}</h2>
      </div>
      {action && (
        <a href="#" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
          {action} <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function Featured() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead eyebrow="Curated" title="Featured Events" action="View all" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => (
            <article
              key={e.id}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface/60 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_30px_60px_-20px_rgba(165,42,42,0.4)]"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={e.image} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full glass-strong px-3 py-1 text-[11px] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-glow" /> {e.left} tickets left
                </span>
                <button className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full glass-strong transition hover:bg-primary/30">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold">{e.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{e.date}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.venue}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">By <span className="text-foreground/80">{e.organizer}</span></div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">From</div>
                    <div className="font-display text-lg font-bold">{e.price}</div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                    style={{ background: "var(--gradient-primary)" }}>
                    Book Now <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Upcoming() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 380, behavior: "smooth" });
  };
  return (
    <section className="py-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mb-8 grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary-glow">Coming up</div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold">Upcoming Events</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/60 transition hover:border-primary/60 hover:bg-surface">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scroll(1)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/60 transition hover:border-primary/60 hover:bg-surface">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} className="flex gap-5 overflow-x-auto px-4 sm:px-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0 w-[max(0px,calc((100vw-1400px)/2))]" aria-hidden />
        {upcoming.map((e) => (
          <article key={e.id} className="group shrink-0 w-72 overflow-hidden rounded-2xl border border-border bg-surface/60 transition hover:-translate-y-1 hover:border-primary/50">
            <div className="relative h-40 overflow-hidden">
              <img src={e.image} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full glass-strong px-2.5 py-1 text-[11px] font-semibold">{e.date}</span>
            </div>
            <div className="p-4">
              <h3 className="font-display text-base font-bold line-clamp-1">{e.title}</h3>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                <span className="font-semibold text-foreground">{e.price}</span>
              </div>
            </div>
          </article>
        ))}
        <div className="shrink-0 w-6" aria-hidden />
      </div>
    </section>
  );
}

function Organizers() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <SectionHead eyebrow="Trusted" title="Popular Organizers" action="Explore all" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {organizers.map((o) => (
            <div key={o.name} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface/50 p-6 text-center transition hover:-translate-y-1 hover:border-primary/50">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-border transition group-hover:ring-primary/60">
                  <img src={o.image} alt={o.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
              </div>
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                  <Users className="h-3 w-3" /> {o.events} events
                </div>
              </div>
              <button className="mt-1 rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary-glow">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: ShieldCheck, title: "Verified Organizers", desc: "Every event partner is vetted. Every promise is on the record." },
    { icon: CreditCard, title: "Secure Online Payments", desc: "Bank-grade encryption with eSewa, Khalti and global cards." },
    { icon: QrCode, title: "Instant QR Tickets", desc: "Tickets land in your inbox the moment you book. Scan and walk in." },
  ];
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-primary-glow">Why Karyakram</div>
          <h2 className="mt-2 font-display text-3xl sm:text-5xl font-bold">A premium booking experience.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Built for the moments that matter — engineered to disappear when you arrive.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-8 transition hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-glow">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                  <f.icon className="h-5 w-5 text-primary-glow" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Company", links: ["About", "Careers", "Press", "Partners"] },
    { title: "Events", links: ["Concerts", "Festivals", "Comedy", "Cultural"] },
    { title: "Support", links: ["Help Center", "Refunds", "Contact", "Organizer Hub"] },
  ];
  return (
    <footer className="border-t border-border bg-surface/30 px-4 pt-16 pb-8 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Karyakram" className="h-9 w-9 object-contain" />
              <span className="font-display text-xl font-bold">Karyakram</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The premium ticketing platform for Nepal's most unforgettable nights.
            </p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Twitter, Facebook, Youtube].map((I, idx) => (
                <a key={idx} href="#" className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-primary/60 hover:text-primary-glow">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="transition hover:text-foreground">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="text-sm font-semibold">Stay in the loop</div>
            <p className="mt-4 text-sm text-muted-foreground">Front-row access to launches, presales and surprise drops.</p>
            <form className="mt-4 flex items-center gap-2 rounded-full border border-border bg-surface/60 p-1.5 pl-4 focus-within:border-primary/60">
              <input type="email" placeholder="you@email.com" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button type="submit" className="rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© 2026 Karyakram. Crafted in Kathmandu.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition">Privacy</a>
            <a href="#" className="hover:text-foreground transition">Terms</a>
            <a href="#" className="hover:text-foreground transition">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
