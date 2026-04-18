import { Link, NavLink } from "react-router-dom";
import { BusFront, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const links = [
    ["Home", "/"],
    ["Features", "/#features"],
    ["About", "/#about"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="section flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-ink">
          <span className="rounded-lg bg-brand p-2 text-white">
            <BusFront size={22} />
          </span>
          RouteMind
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="transition hover:text-coral">
              {label}
            </a>
          ))}
          {user ? (
            <NavLink to={`/${user.role}`} className="text-brand">
              Dashboard
            </NavLink>
          ) : (
            <NavLink to="/login" className="text-brand">
              Login
            </NavLink>
          )}
          {user ? (
            <button onClick={logout} className="soft-button bg-slate-100 py-2 text-ink">
              Logout
            </button>
          ) : null}
        </nav>
        <button onClick={() => setOpen((value) => !value)} className="rounded-lg border border-slate-200 p-2 md:hidden">
          <Menu />
        </button>
      </div>
      {open ? (
        <div className="section pb-4 md:hidden">
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold">
            {links.map(([label, href]) => (
              <a key={label} href={href} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                {label}
              </a>
            ))}
            <Link to="/login" className="rounded-lg px-3 py-2 text-brand hover:bg-slate-50">
              Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
