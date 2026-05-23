import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      toast.success('Welcome back!');
      navigate(res.user.role === 'admin' && redirectTo === '/' ? '/admin' : redirectTo, { replace: true });
    } else {
      toast.error(res.error);
    }
  };

  return (
    <main className="auth-page" data-testid="login-page">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              data-testid="login-email"
              autoComplete="email"
            />
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              data-testid="login-password"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn-primary auth-submit" disabled={submitting} data-testid="login-submit">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-alt">
          New to KHOGA? <Link to="/register" state={{ from: redirectTo }}>Create an account</Link>
        </p>
      </div>
    </main>
  );
}
