import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AccountEditPage() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      updateUser(res.data);
      toast.success(t('profile_updated'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('profile_update_error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(t('password_min_length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('password_mismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success(t('password_changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || t('password_change_error'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="account-page account-edit-page" data-testid="account-edit-page">
      <div className="breadcrumb">
        <Link to="/">{t('nav_home')}</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/account">{t('account_title')}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{t('account_edit_title')}</span>
      </div>

      <h1 className="account-title">{t('account_edit_title')}</h1>

      <section className="account-edit-section">
        <h2>{t('account_profile')}</h2>
        <form onSubmit={handleProfileSubmit} className="auth-form" style={{ maxWidth: 480 }}>
          <label className="auth-label">
            {t('full_name')}
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              data-testid="edit-name"
            />
          </label>
          <label className="auth-label">
            {t('email')}
            <input type="email" value={user.email} className="auth-input" disabled />
          </label>
          <label className="auth-label">
            {t('phone')}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="auth-input"
              dir="ltr"
              data-testid="edit-phone"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? t('loading') : t('save_profile')}
          </button>
        </form>
      </section>

      <section className="account-edit-section">
        <h2>{t('change_password_title')}</h2>
        <form onSubmit={handlePasswordSubmit} className="auth-form" style={{ maxWidth: 480 }}>
          <label className="auth-label">
            {t('current_password')}
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="auth-input"
              autoComplete="current-password"
            />
          </label>
          <label className="auth-label">
            {t('new_password')}
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="auth-input"
              autoComplete="new-password"
            />
          </label>
          <label className="auth-label">
            {t('confirm_password')}
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn-outline" disabled={savingPassword}>
            {savingPassword ? t('loading') : t('change_password_btn')}
          </button>
        </form>
      </section>
    </main>
  );
}
