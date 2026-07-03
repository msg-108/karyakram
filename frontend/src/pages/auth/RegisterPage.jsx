import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PublicNavbar from "../../components/PublicNavbar";

const INITIAL = {
  first_name: "", last_name: "", email: "",
  password: "", password_confirm: "",
  phone_number: "", date_of_birth: "",
  role: "user", agreed: false,
  // organizer fields
  organization_name: "", citizenship: "NP",
  citizenship_number: "", pan_number: "",
  bank_name: "", bank_account_number: "",
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full border border-[var(--color-border)] bg-white rounded-lg
                  px-4 py-2.5 text-sm text-[var(--color-text)]
                  placeholder:text-[var(--color-muted)] outline-none
                  focus:ring-2 focus:ring-[var(--color-primary-500)]
                  focus:border-transparent transition ${className}`}
    />
  );
}

export default function RegisterPage() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.post("/auth/register/", form);
      // Pass email + role to verify page so it can show the right success message
      navigate("/verify", { state: { email: form.email, role: form.role } });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setErrors(data);
      } else {
        setErrors({ non_field_errors: ["Something went wrong. Please try again."] });
      }
    } finally {
      setLoading(false);
    }
  };

  const isOrganizer = form.role === "organizer";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <PublicNavbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex w-[42%] flex-col justify-between
                        bg-[var(--color-primary-500)] p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                            bg-[var(--color-primary-700)] opacity-40 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                            bg-[var(--color-accent-500)] opacity-20 blur-2xl" />
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          <div className="relative">
            <span className="text-white font-bold text-2xl tracking-tight">Karyakram</span>
          </div>

          <div className="relative flex flex-col items-center text-center gap-8">
            <div className="w-56 h-56 rounded-3xl bg-white/10 border border-white/20
                            flex items-center justify-center backdrop-blur-sm">
              <svg className="size-24 text-white/60" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1">
                <path d="M16.5 6v.75a3.75 3.75 0 0 1 0 7.5V15m0-9H7.5m9 0h1.125c.621
                         0 1.125.504 1.125 1.125v2.25c0 .207-.168.375-.375.375a2.25 2.25
                         0 0 0 0 4.5c.207 0 .375.168.375.375v2.25c0 .621-.504 1.125-1.125
                         1.125H7.5M7.5 15H6.375A1.125 1.125 0 0 1 5.25 13.875v-2.25A.375.375
                         0 0 1 5.625 11.25a2.25 2.25 0 0 0 0-4.5.375.375 0 0
                         1-.375-.375v-2.25C5.25 3.504 5.754 3 6.375 3H7.5m0 12v.75M7.5 6V5.25"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl leading-snug">
                Join Karyakram<br />Today
              </h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                Create your account and start discovering or hosting events across Nepal.
              </p>
            </div>
          </div>

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
        <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Create your account
              </h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                You are a few steps away from joining Karyakram
              </p>
            </div>

            {/* Role toggle */}
            <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)]
                            rounded-lg p-1 mb-6">
              {["user", "organizer"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                    form.role === r
                      ? "bg-[var(--color-primary-500)] text-white shadow-sm"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {r === "user" ? "Attendee" : "Organizer"}
                </button>
              ))}
            </div>

            {/* Global errors */}
            {errors.non_field_errors && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                              rounded-lg px-4 py-3 mb-5">
                {errors.non_field_errors[0]}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={errors.first_name?.[0]}>
                  <Input
                    value={form.first_name} onChange={set("first_name")}
                    placeholder="John" required
                  />
                </Field>
                <Field label="Last Name" error={errors.last_name?.[0]}>
                  <Input
                    value={form.last_name} onChange={set("last_name")}
                    placeholder="Doe" required
                  />
                </Field>
              </div>

              {/* Email */}
              <Field label="Email" error={errors.email?.[0]}>
                <Input
                  type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" required autoComplete="email"
                />
              </Field>

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password" error={errors.password?.[0]}>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={form.password} onChange={set("password")}
                      placeholder="••••••••" required autoComplete="new-password"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      {showPass ? (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" error={errors.password_confirm?.[0]}>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={form.password_confirm} onChange={set("password_confirm")}
                      placeholder="••••••••" required className="pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      {showConfirm ? (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Phone */}
              <Field label="Phone Number" error={errors.phone_number?.[0]}>
                <Input
                  type="tel" value={form.phone_number} onChange={set("phone_number")}
                  placeholder="98XXXXXXXX" required
                />
              </Field>

              {/* Date of Birth */}
              <Field label="Date of Birth" error={errors.date_of_birth?.[0]}>
                <Input
                  type="date" value={form.date_of_birth} onChange={set("date_of_birth")}
                  required
                />
              </Field>

              {/* ── Organizer extra fields ── */}
              {isOrganizer && (
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider pt-1">
                    Organization Details
                  </p>

                  <Field label="Organization Name" error={errors.organization_name?.[0]}>
                    <Input
                      value={form.organization_name} onChange={set("organization_name")}
                      placeholder="Acme Events Pvt. Ltd." required={isOrganizer}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Citizenship Number" error={errors.citizenship_number?.[0]}>
                      <Input
                        value={form.citizenship_number} onChange={set("citizenship_number")}
                        placeholder="XX-XX-XXXXXXX" required={isOrganizer}
                      />
                    </Field>
                    <Field label="PAN Number" error={errors.pan_number?.[0]}>
                      <Input
                        value={form.pan_number} onChange={set("pan_number")}
                        placeholder="9 digits" maxLength={9} required={isOrganizer}
                      />
                    </Field>
                  </div>

                  <Field label="Bank Name" error={errors.bank_name?.[0]}>
                    <Input
                      value={form.bank_name} onChange={set("bank_name")}
                      placeholder="Nepal Investment Bank" required={isOrganizer}
                    />
                  </Field>

                  <Field label="Bank Account Number" error={errors.bank_account_number?.[0]}>
                    <Input
                      value={form.bank_account_number} onChange={set("bank_account_number")}
                      placeholder="XXXXXXXXXXXXXXXXXX" required={isOrganizer}
                    />
                  </Field>
                </div>
              )}

              {/* Terms checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="agreed" type="checkbox"
                  checked={form.agreed} onChange={set("agreed")}
                  required
                  className="size-4 mt-0.5 rounded border-[var(--color-border)]
                             accent-[var(--color-primary-500)] cursor-pointer"
                />
                <label htmlFor="agreed"
                       className="text-sm text-[var(--color-muted)] cursor-pointer select-none">
                  I agree to the{" "}
                  <a href="#" className="text-[var(--color-primary-500)] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[var(--color-primary-500)] hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Buttons */}
              <div className={`flex gap-3 pt-1 ${isOrganizer ? "" : "flex-col"}`}>
                {isOrganizer && (
                  <button
                    type="button"
                    onClick={() => setForm(INITIAL)}
                    className="flex-1 border border-[var(--color-border)] text-[var(--color-text)]
                               font-medium rounded-lg py-2.5 text-sm hover:bg-[var(--color-bg)]
                               transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                             disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                             rounded-lg py-2.5 text-sm transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                      </svg>
                      Registering…
                    </span>
                  ) : isOrganizer ? "Register" : "Next"}
                </button>
              </div>

            </form>

            <p className="text-center text-sm text-[var(--color-muted)] mt-5">
              Already have an account?{" "}
              <a href="/login"
                 className="text-[var(--color-primary-500)] font-medium hover:underline">
                Login
              </a>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}