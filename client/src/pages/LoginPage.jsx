import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import ThemeToggle from '../components/ThemeToggle';

const FEATURES = [
  {
    title: 'Worker management',
    text: 'Roster, roles and employee-ID sign-in for every field team.',
  },
  {
    title: 'Task check-ins',
    text: 'Photo proof of work with comments, stamped with GPS and time.',
  },
  {
    title: 'Location intelligence',
    text: 'Live map, movement history and alerts when staff leave site.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employee_id, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add('login-pro');
    return () => document.body.classList.remove('login-pro');
  }, []);

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
    <div className="login-shell">
      <aside className="login-visual">
        <img className="login-visual-bg" src="/login/login-hero.jpg" alt="" />
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <div className="login-brand">
            <span className="brand-mark">LS</span>
            <span className="brand-name">LoneStar WFM</span>
          </div>

          <div className="login-visual-copy">
            <p className="login-eyebrow">Field workforce platform</p>
            <h1>Every worker, task and location — in one view.</h1>
            <ul className="login-feature-list">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <strong>{f.title}</strong>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="login-gallery">
            <figure>
              <img src="/login/login-map.jpg" alt="Live worker map with route" />
              <figcaption>Live map &amp; routes</figcaption>
            </figure>
            <figure>
              <img src="/login/login-team.jpg" alt="Field team checking in" />
              <figcaption>Photo check-ins</figcaption>
            </figure>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel-top">
          <div className="login-brand login-brand-mobile">
            <span className="brand-mark">LS</span>
            <span className="brand-name">LoneStar WFM</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="login-mobile-banner">
          <img src="/login/login-hero.jpg" alt="" />
          <div className="login-mobile-banner-text">
            <p className="login-eyebrow">Field workforce platform</p>
            <p className="login-mobile-headline">Workers, tasks &amp; location in one view</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <h2>Welcome back</h2>
          <p className="login-form-sub">Sign in with your employee ID to continue.</p>

          {error && <div className="login-error">{error}</div>}

          <label className="login-field">
            <span>Employee ID</span>
            <input
              value={employee_id}
              onChange={(e) => setEmployeeId(e.target.value)}
              autoComplete="username"
              placeholder="e.g. ADMIN001"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="password-reveal"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-chips">
            {FEATURES.map((f) => (
              <span key={f.title} className="login-chip">
                {f.title}
              </span>
            ))}
          </div>

          <p className="login-register">
            New field worker? <Link to="/register">Create an account</Link>
          </p>
        </form>

        <p className="login-legal">© {new Date().getFullYear()} LoneStar WFM · Secure access</p>
      </main>
    </div>
  );
}
