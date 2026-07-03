import { useNavigate, useLocation } from "react-router-dom";

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">

        <span
          onClick={() => navigate("/")}
          className="text-[var(--color-primary-500)] font-bold text-lg tracking-tight cursor-pointer select-none"
        >
          Karyakram
        </span>

        {/* Register on login page, Login on all other public pages */}
        {path === "/login" ? (
          <button
            onClick={() => navigate("/register")}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-white
                       bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]
                       rounded-lg transition-colors"
          >
            Register
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="hidden sm:block px-4 py-2 text-sm font-medium
                       text-[var(--color-primary-500)] border border-[var(--color-primary-500)]
                       hover:bg-[var(--color-primary-50)] rounded-lg transition-colors"
          >
            Login
          </button>
        )}

      </div>
    </nav>
  );
}