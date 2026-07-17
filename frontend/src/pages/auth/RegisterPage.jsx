import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PublicNavbar from "../../components/PublicNavbar";

// Fields that match backend UserRegisterSerializer:
//   username, email, password, password_confirm, first_name, last_name
// Fields that match backend OrganizerRegisterSerializer (above + ):
//   organization_name, organization_description, website_url,
//   citizenship_number, pan_number, bank_name, bank_account_number,
//   citizenship_document (file), pan_document (file)
const USER_INITIAL = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirm: "",
  agreed: false,
};

const ORGANIZER_INITIAL = {
  ...USER_INITIAL,
  organization_name: "",
  organization_description: "",
  website_url: "",
  citizenship_number: "",
  pan_number: "",
  bank_name: "",
  bank_account_number: "",
};

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[var(--color-muted)] mt-1">{hint}</p>}
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

function EyeIcon({ open }) {
  return open ? (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState(USER_INITIAL);
  const [files, setFiles] = useState({ citizenship_document: null, pan_document: null });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const isOrganizer = role === "organizer";

  const handleRoleChange = (r) => {
    setRole(r);
    setForm(r === "organizer" ? { ...ORGANIZER_INITIAL } : { ...USER_INITIAL });
    setFiles({ citizenship_document: null, pan_document: null });
    setErrors({});
  };

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const setFile = (field) => (e) => {
    setFiles((f) => ({ ...f, [field]: e.target.files[0] || null }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isOrganizer) {
        // Organizer endpoint accepts multipart/form-data (file uploads)
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k !== "agreed") fd.append(k, v);
        });
        if (files.citizenship_document) fd.append("citizenship_document", files.citizenship_document);
        if (files.pan_document) fd.append("pan_document", files.pan_document);

        await api.post("/auth/register/organizer/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // User endpoint accepts JSON
        const { agreed, ...payload } = form;
        await api.post("/auth/register/user/", payload);
      }

      navigate("/verify", { state: { email: form.email, role } });
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <PublicNavbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex w-[42%] flex-col justify-between bg-[var(--color-primary-500)] p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--color-primary-700)] opacity-40 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[var(--color-accent-500)] opacity-20 blur-2xl" />
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
            <div className="w-56 h-56 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="size-24 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M16.5 6v.75a3.75 3.75 0 0 1 0 7.5V15m0-9H7.5m9 0h1.125c.621 0 1.125.504 1.125 1.125v2.25c0 .207-.168.375-.375.375a2.25 2.25 0 0 0 0 4.5c.207 0 .375.168.375.375v2.25c0 .621-.504 1.125-1.125 1.125H7.5M7.5 15H6.375A1.125 1.125 0 0 1 5.25 13.875v-2.25A.375.375 0 0 1 5.625 11.25a2.25 2.25 0 0 0 0-4.5.375.375 0 0 1-.375-.375v-2.25C5.25 3.504 5.754 3 6.375 3H7.5m0 12v.75M7.5 6V5.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl leading-snug">
                Join Karyakram<br />Today
              </h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                {isOrganizer
                  ? "Start hosting events — complete your organizer profile and get approved."
                  : "Create your account and start discovering events across Nepal."}
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-6">
            {[{ value: "500+", label: "Events" }, { value: "12K+", label: "Attendees" }, { value: "200+", label: "Organizers" }].map(({ value, label }) => (
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

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Create your account</h1>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                You're a few steps away from joining Karyakram
              </p>
            </div>

            {/* Role toggle */}
            <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-1 mb-6">
              {["user", "organizer"].map((r) => (
                <button key={r} type="button" onClick={() => handleRoleChange(r)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    role === r
                      ? "bg-[var(--color-primary-500)] text-white shadow-sm"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}>
                  {r === "user" ? "Attendee" : "Organizer"}
                </button>
              ))}
            </div>

            {/* Global errors */}
            {(errors.non_field_errors || errors.detail) && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
                {errors.non_field_errors?.[0] || errors.detail}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── Shared fields ── */}

              {/* Username */}
              <Field label="Username" required error={errors.username?.[0]}
                hint="3–30 characters. Letters, digits, dot, underscore, hyphen only.">
                <Input value={form.username} onChange={set("username")}
                  placeholder="sita_gharti" required autoComplete="username" />
              </Field>

              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" required error={errors.first_name?.[0]}>
                  <Input value={form.first_name} onChange={set("first_name")}
                    placeholder="Sita" required />
                </Field>
                <Field label="Last Name" required error={errors.last_name?.[0]}>
                  <Input value={form.last_name} onChange={set("last_name")}
                    placeholder="Gharti" required />
                </Field>
              </div>

              {/* Email */}
              <Field label="Email" required error={errors.email?.[0]}>
                <Input type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" required autoComplete="email" />
              </Field>

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password" required error={errors.password?.[0]}>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} value={form.password}
                      onChange={set("password")} placeholder="••••••••" required
                      autoComplete="new-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" required error={errors.password_confirm?.[0]}>
                  <div className="relative">
                    <Input type={showConfirm ? "text" : "password"} value={form.password_confirm}
                      onChange={set("password_confirm")} placeholder="••••••••" required
                      className="pr-10" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </Field>
              </div>

              {/* ── Organizer-only fields ── */}
              {isOrganizer && (
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider pt-1">
                    Organization Details
                  </p>

                  <Field label="Organization Name" required error={errors.organization_name?.[0]}>
                    <Input value={form.organization_name} onChange={set("organization_name")}
                      placeholder="Acme Events Pvt. Ltd." required />
                  </Field>

                  <Field label="Organization Description" error={errors.organization_description?.[0]}>
                    <textarea
                      value={form.organization_description}
                      onChange={(e) => { setForm(f => ({ ...f, organization_description: e.target.value })); }}
                      placeholder="Brief description of your organization…"
                      rows={2}
                      className="w-full border border-[var(--color-border)] bg-white rounded-lg px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition resize-none"
                    />
                  </Field>

                  <Field label="Website URL" error={errors.website_url?.[0]}>
                    <Input type="url" value={form.website_url} onChange={set("website_url")}
                      placeholder="https://yourorg.com" />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Citizenship Number" required error={errors.citizenship_number?.[0]}
                      hint="Format: XX-XX-XXXXXXX">
                      <Input value={form.citizenship_number} onChange={set("citizenship_number")}
                        placeholder="12-34-5678901" required />
                    </Field>
                    <Field label="PAN Number" required error={errors.pan_number?.[0]}
                      hint="9 digits">
                      <Input value={form.pan_number} onChange={set("pan_number")}
                        placeholder="123456789" maxLength={9} required />
                    </Field>
                  </div>

                  <Field label="Bank Name" required error={errors.bank_name?.[0]}>
                    <Input value={form.bank_name} onChange={set("bank_name")}
                      placeholder="Nepal Investment Bank" required />
                  </Field>

                  <Field label="Bank Account Number" required error={errors.bank_account_number?.[0]}>
                    <Input value={form.bank_account_number} onChange={set("bank_account_number")}
                      placeholder="Account number" required />
                  </Field>

                  {/* Document uploads */}
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider pt-1">
                    Verification Documents
                  </p>

                  <Field label="Citizenship Document" required error={errors.citizenship_document?.[0]}
                    hint="Image or PDF of your citizenship certificate">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-3 cursor-pointer hover:border-[var(--color-primary-500)] transition group">
                        <svg className="size-5 text-[var(--color-muted)] group-hover:text-[var(--color-primary-500)] transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm text-[var(--color-muted)] group-hover:text-[var(--color-text)] truncate transition">
                          {files.citizenship_document ? files.citizenship_document.name : "Choose file…"}
                        </span>
                        <input type="file" accept="image/*,.pdf" onChange={setFile("citizenship_document")}
                          className="hidden" required />
                      </label>
                      {files.citizenship_document && (
                        <button type="button" onClick={() => setFiles(f => ({ ...f, citizenship_document: null }))}
                          className="text-[var(--color-muted)] hover:text-red-500 transition">
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </Field>

                  <Field label="PAN Document" required error={errors.pan_document?.[0]}
                    hint="Image or PDF of your PAN card">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-3 cursor-pointer hover:border-[var(--color-primary-500)] transition group">
                        <svg className="size-5 text-[var(--color-muted)] group-hover:text-[var(--color-primary-500)] transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm text-[var(--color-muted)] group-hover:text-[var(--color-text)] truncate transition">
                          {files.pan_document ? files.pan_document.name : "Choose file…"}
                        </span>
                        <input type="file" accept="image/*,.pdf" onChange={setFile("pan_document")}
                          className="hidden" required />
                      </label>
                      {files.pan_document && (
                        <button type="button" onClick={() => setFiles(f => ({ ...f, pan_document: null }))}
                          className="text-[var(--color-muted)] hover:text-red-500 transition">
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </Field>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input id="agreed" type="checkbox" checked={form.agreed} onChange={set("agreed")} required
                  className="size-4 mt-0.5 rounded border-[var(--color-border)] accent-[var(--color-primary-500)] cursor-pointer" />
                <label htmlFor="agreed" className="text-sm text-[var(--color-muted)] cursor-pointer select-none">
                  I agree to the{" "}
                  <a href="#" className="text-[var(--color-primary-500)] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-[var(--color-primary-500)] hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Buttons */}
              <div className={`flex gap-3 pt-1 ${isOrganizer ? "" : "flex-col"}`}>
                {isOrganizer && (
                  <button type="button" onClick={() => handleRoleChange("user")}
                    className="flex-1 border border-[var(--color-border)] text-[var(--color-text)] font-medium rounded-lg py-2.5 text-sm hover:bg-[var(--color-bg)] transition-colors">
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                      </svg>
                      {isOrganizer ? "Submitting…" : "Creating account…"}
                    </span>
                  ) : isOrganizer ? "Submit Application" : "Create Account"}
                </button>
              </div>

            </form>

            <p className="text-center text-sm text-[var(--color-muted)] mt-5">
              Already have an account?{" "}
              <a href="/login" className="text-[var(--color-primary-500)] font-medium hover:underline">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
