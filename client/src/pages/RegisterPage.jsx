import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const empty = {
  username: '',
  email: '',
  password: '',
  gender: '',
  passport_number: '',
  mobile_number: '',
  employee_id: '',
  employee_type: 'worker',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
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
        <p>Create account</p>
      </header>
      <form className="card" onSubmit={onSubmit}>
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        <label>
          Username
          <input value={form.username} onChange={(e) => set('username', e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label>
          Employee ID
          <input value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
          />
        </label>
        <label>
          Mobile number
          <input value={form.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} />
        </label>
        <label>
          Gender
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Passport number
          <input value={form.passport_number} onChange={(e) => set('passport_number', e.target.value)} />
        </label>
        <label>
          Employee type
          <select value={form.employee_type} onChange={(e) => set('employee_type', e.target.value)}>
            <option value="worker">Worker</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
