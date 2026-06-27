import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from "../context/LanguageContext";

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
  const { t, lang, setLang } = useLanguage();

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
        <h1 className="auth-title">{t('register_btn')}</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label">
            {t('full_name')}
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="auth-input" data-testid="register-name" />
          </label>
          <label className="auth-label">
            {t('email')}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="auth-input" data-testid="register-email" autoComplete="email" />
          </label>
          <label className="auth-label">
            {t('phone')}
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="auth-input" data-testid="register-phone" />
          </label>
          <label className="auth-label">
            {t('password')}
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="auth-input" data-testid="register-password" autoComplete="new-password" />
          </label>
          <button type="submit" className="btn-primary auth-submit" disabled={submitting} data-testid="register-submit">
            {submitting ? t('loading') : t('register_btn')}
          </button>
        </form>
        <p className="auth-alt">
          {t('has_account')} <Link to="/login" state={{ from: redirectTo }}>{t('login_btn')}</Link>
        </p>
      </div>
    </main>
  );
}
