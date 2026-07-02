import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login/", form);
      login(data.user, data.access, data.refresh);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 w-full max-w-md shadow-sm"
      >
        {/* Logo / brand mark */}
        <div className="mb-6">
          <span className="text-[var(--color-primary-500)] font-bold text-xl tracking-tight">
            Karyakram
          </span>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mt-1">
            Sign in
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-sm text-[var(--color-muted)] mt-4 text-center">
          No account?{" "}
          <a
            href="/register"
            className="text-[var(--color-primary-500)] hover:underline font-medium"
          >
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
