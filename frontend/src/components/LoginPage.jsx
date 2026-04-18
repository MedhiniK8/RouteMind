import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BusFront, LockKeyhole } from "lucide-react";
import Layout from "./layout/Layout";
import { useAuth } from "../context/AuthContext";

const credentials = {
  student: ["student@routemind.dev", "student123"],
  driver: ["driver@routemind.dev", "driver123"],
  admin: ["admin@routemind.dev", "admin123"],
};

export default function LoginPage() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState(credentials.student[0]);
  const [password, setPassword] = useState(credentials.student[1]);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to={`/${user.role}`} replace />;

  function chooseRole(nextRole) {
    setRole(nextRole);
    setEmail(credentials[nextRole][0]);
    setPassword(credentials[nextRole][1]);
  }

  async function submit(event) {
    event.preventDefault();
    const loggedIn = await login(email, password, role);
    toast.success(`Welcome ${loggedIn.name}`);
    navigate(`/${loggedIn.role}`);
  }

  return (
    <Layout>
      <section className="section grid min-h-[calc(100vh-12rem)] items-center gap-10 py-12 lg:grid-cols-2">
        <div>
          <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-coral">Demo-ready role access</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink">Login to RouteMind</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Use a role account to open the student, driver, or management dashboard. The app falls back to demo data if the backend is not running.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {Object.keys(credentials).map((item) => (
              <button
                key={item}
                onClick={() => chooseRole(item)}
                className={`rounded-lg border px-4 py-3 text-sm font-bold capitalize transition ${
                  role === item ? "border-brand bg-cyan-50 text-brand" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-brand p-3 text-white">
              <BusFront />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-ink">Secure Login</h2>
              <p className="text-sm text-slate-500">JWT auth with role routing</p>
            </div>
          </div>
          <label className="mt-6 block text-sm font-bold text-slate-700">Email</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
          <label className="mt-4 block text-sm font-bold text-slate-700">Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3" />
          <button className="soft-button mt-6 w-full bg-brand text-white">
            <LockKeyhole size={18} /> Login as {role}
          </button>
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Student: student@routemind.dev / student123<br />
            Driver: driver@routemind.dev / driver123<br />
            Admin: admin@routemind.dev / admin123
          </div>
        </form>
      </section>
    </Layout>
  );
}
