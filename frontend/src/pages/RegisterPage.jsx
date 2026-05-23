import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    const res = await register(name, email, password, phone);
    setSubmitting(false);
    if (res.success) {
      toast.success('Account created!');
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(res.error);
    }
  };

  return (
    <main className="auth-page" data-testid="register-page">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label">
            Full Name
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="auth-input" data-testid="register-name" />
          </label>
          <label className="auth-label">
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="auth-input" data-testid="register-email" autoComplete="email" />
          </label>
          <label className="auth-label">
            Phone (optional)
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="auth-input" data-testid="register-phone" />
          </label>
          <label className="auth-label">
            Password (min 8 chars)
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="auth-input" data-testid="register-password" autoComplete="new-password" />
          </label>
          <button type="submit" className="btn-primary auth-submit" disabled={submitting} data-testid="register-submit">
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-alt">
          Already have an account? <Link to="/login" state={{ from: redirectTo }}>Sign In</Link>
        </p>
      </div>
    </main>
  );
}
