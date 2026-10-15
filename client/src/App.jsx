import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkerPage from './pages/WorkerPage';
import AdminMapPage from './pages/AdminMapPage';
import AdminWorkerPage from './pages/AdminWorkerPage';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.employee_type)) {
    return <Navigate to={user.employee_type === 'worker' ? '/worker' : '/admin'} replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="center">Loading…</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={!user ? '/login' : user.employee_type === 'worker' ? '/worker' : '/admin'}
            replace
          />
        }
      />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/worker"
        element={
          <Protected roles={['worker']}>
            <WorkerPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={['admin', 'manager']}>
            <AdminMapPage />
          </Protected>
        }
      />
      <Route
        path="/admin/worker/:userId"
        element={
          <Protected roles={['admin', 'manager']}>
            <AdminWorkerPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
