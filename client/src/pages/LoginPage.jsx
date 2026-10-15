import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employee_id, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(employee_id.trim(), password);
      navigate(user.employee_type === 'worker' ? '/worker' : '/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page auth-page">
      <header className="brand">
        <h1>LoneStar WFM</h1>
        <p>Workforce check-in</p>
      </header>
      <form className="card" onSubmit={onSubmit}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <label>
          Employee ID
          <input
            value={employee_id}
            onChange={(e) => setEmployeeId(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted">
          New worker? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
