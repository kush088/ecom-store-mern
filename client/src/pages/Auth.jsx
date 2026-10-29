import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';

export function Login({ admin = false }) {
  const { login, logout } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const u = await login(f.email, f.password);
      if (admin && u.role !== 'admin') { logout(); throw new Error('This account is not an administrator'); }
      nav(admin ? '/admin' : loc.state?.from || '/', { replace: true });
    } catch (er) { setErr(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 440 }}>
      <form className="card" onSubmit={submit}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 14 }}>{admin ? 'Admin sign in' : 'Welcome back'}</h1>
        {err && <p className="error">{err}</p>}
        <div className="field"><label>Email</label><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="field"><label>Password</label><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {!admin && <p className="muted center" style={{ marginTop: 14 }}>New here? <Link to="/register" style={{ color: 'var(--gold-d)' }}>Create an account</Link></p>}
      </form>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.password.length < 8) return setErr('Password must be at least 8 characters');
    if (f.password !== f.confirm) return setErr('Passwords do not match');
    setBusy(true);
    try { await register({ name: f.name, email: f.email, phone: f.phone, password: f.password }); nav('/'); }
    catch (er) { setErr(errMsg(er)); } finally { setBusy(false); }
  };

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <form className="card" onSubmit={submit}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 14 }}>Create account</h1>
        {err && <p className="error">{err}</p>}
        <div className="field"><label>Full name</label><input required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Email</label><input type="email" required value={f.email} onChange={set('email')} /></div>
        <div className="field"><label>Phone (optional)</label><input value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Password</label><input type="password" required value={f.password} onChange={set('password')} /></div>
        <div className="field"><label>Confirm password</label><input type="password" required value={f.confirm} onChange={set('confirm')} /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <p className="muted center" style={{ marginTop: 14 }}>Already registered? <Link to="/login" style={{ color: 'var(--gold-d)' }}>Sign in</Link></p>
      </form>
    </div>
  );
}
