import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./components/landing/LandingPage";
import LoginPage from "./components/LoginPage";
import StudentDashboard from "./components/dashboard/StudentDashboard";
import DriverDashboard from "./components/dashboard/DriverDashboard";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import { useAuth } from "./context/AuthContext";

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student"
        element={
          <Protected role="student">
            <StudentDashboard />
          </Protected>
        }
      />
      <Route
        path="/driver"
        element={
          <Protected role="driver">
            <DriverDashboard />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected role="admin">
            <AdminDashboard />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
