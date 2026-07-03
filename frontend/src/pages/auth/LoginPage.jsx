import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import PublicNavbar from "../../components/PublicNavbar";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const set = (field) => (e) =>
    setForm({
      ...form,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login/", {
        email: form.email,
        password: form.password,
      });
      login(data.user, data.access, data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Navbar */}
      <PublicNavbar />

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ── */}
        <div
          className="hidden lg:flex w-[42%] flex-col justify-between
                        bg-[var(--color-primary-500)] p-12 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large blurred circle top-right */}
            <div
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                            bg-[var(--color-primary-700)] opacity-40 blur-3xl"
            />
            {/* Small circle bottom-left */}
            <div
              className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                            bg-[var(--color-accent-500)] opacity-20 blur-2xl"
            />
            {/* Grid dot pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="dots"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          {/* Top — brand */}
          <div className="relative">
            <span className="text-white font-bold text-2xl tracking-tight">
              Karyakram
            </span>
          </div>

          {/* Middle — illustration placeholder + tagline */}
          <div className="relative flex flex-col items-center text-center gap-8">
            {/* Ticket illustration */}
            <div
              className="w-56 h-56 rounded-3xl bg-white/10 border border-white/20
                            flex items-center justify-center backdrop-blur-sm"
            >
              <svg
                className="size-24 text-white/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  d="M16.5 6v.75a3.75 3.75 0 0 1 0 7.5V15m0-9H7.5m9 0h1.125c.621 0
                         1.125.504 1.125 1.125v2.25c0 .207-.168.375-.375.375a2.25 2.25 0
                         0 0 0 4.5c.207 0 .375.168.375.375v2.25c0 .621-.504
                         1.125-1.125 1.125H7.5M7.5 15H6.375A1.125 1.125 0 0 1
                         5.25 13.875v-2.25A.375.375 0 0 1 5.625 11.25a2.25 2.25 0
                         0 0 0-4.5.375.375 0 0 1-.375-.375v-2.25C5.25 3.504 5.754 3
                         6.375 3H7.5m0 12v.75M7.5 6V5.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-white font-bold text-2xl leading-snug">
                Discover &amp; Book
                <br />
                Events in Nepal
              </h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                From concerts to conferences — find, manage, and attend events
                that matter to you.
              </p>
            </div>
          </div>

          {/* Bottom — social proof */}
          <div className="relative flex items-center gap-6">
            {[
              { value: "500+", label: "Events" },
              { value: "12K+", label: "Attendees" },
              { value: "200+", label: "Organizers" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Welcome back
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Sign in to your Karyakram account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2.5 bg-red-50 border border-red-200
                              text-red-600 text-sm rounded-lg px-4 py-3 mb-6"
              >
                <svg
                  className="size-4 mt-0.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948
                           3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949
                           3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12
                           15.75h.007v.008H12v-.008Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full border border-[var(--color-border)] bg-white rounded-lg
                             px-4 py-2.5 text-sm text-[var(--color-text)]
                             placeholder:text-[var(--color-muted)] outline-none
                             focus:ring-2 focus:ring-[var(--color-primary-500)]
                             focus:border-transparent transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-primary-500)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full border border-[var(--color-border)] bg-white rounded-lg
                               px-4 py-2.5 pr-10 text-sm text-[var(--color-text)]
                               placeholder:text-[var(--color-muted)] outline-none
                               focus:ring-2 focus:ring-[var(--color-primary-500)]
                               focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                                     text-[var(--color-muted)] hover:text-[var(--color-text)]
                                     transition-colors"
                  >
                    {showPass ? (
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338
                                 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228
                                 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162
                                 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228
                                 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21
                                 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242
                                 4.242L9.88 9.88"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51
                                 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431
                                 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638
                                 0-8.573-3.007-9.963-7.178Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={set("remember")}
                  className="size-4 rounded border-[var(--color-border)]
                             accent-[var(--color-primary-500)] cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-[var(--color-muted)] cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                           disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                           rounded-lg py-2.5 text-sm transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="size-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-[var(--color-muted)] mt-6">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-[var(--color-primary-500)] font-medium hover:underline"
              >
                Create account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
