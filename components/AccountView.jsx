'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authRequest } from '@/lib/auth-api';
import './account-view.css';

export default function AccountView() {
  const { user, setAuthenticatedUser, clearUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    setVerificationEmail('');
    try {
      const response = await authRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      setAuthenticatedUser(response.data.user);
      if (response.data.verificationEmail) {
        setVerificationEmail(response.data.verificationEmail);
        setNotice('Check the new address for a verification code. Your current email stays active until it is verified.');
      } else {
        setNotice('Your profile has been saved.');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await authRequest('/users/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      clearUser();
      router.replace('/login?password=changed');
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="account-view">
      <header className="page-heading">
        <div><span className="eyebrow">YOUR DETAILS</span><h1>Your Lily account.</h1><p>Manage your sign-in details and account security.</p></div>
      </header>

      {error && <div className="account-message account-message-error" role="alert">{error}</div>}
      {notice && <div className="account-message account-message-success" role="status"><Check size={16} />{notice}</div>}
      {verificationEmail && <Link className="account-verify-link" href={`/verify-email?email=${encodeURIComponent(user.email)}&destination=${encodeURIComponent(verificationEmail)}`}>Enter the email verification code <ArrowRight size={15} /></Link>}

      <section className="account-card">
        <div className="account-card-heading"><span className="account-icon"><UserRound size={18} /></span><div><h2>Profile details</h2><p>Update the name and email associated with your account.</p></div></div>
        <form className="account-form" onSubmit={saveProfile}>
          <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></label>
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required /></label>
          <button className="primary-button" type="submit" disabled={busy}><Check size={15} />{busy ? 'Saving…' : 'Save profile'}</button>
        </form>
      </section>

      <section className="account-card">
        <div className="account-card-heading"><span className="account-icon"><LockKeyhole size={18} /></span><div><h2>Change password</h2><p>Changing your password signs out every active session.</p></div></div>
        <form className="account-form" onSubmit={changePassword}>
          <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
          <div className="account-form-columns">
            <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
            <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
          </div>
          <p className="account-password-hint">Use at least 8 characters, with uppercase and lowercase letters, a number, and a symbol.</p>
          <button className="primary-button" type="submit" disabled={busy}><ShieldCheck size={15} />{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </section>

      <section className="account-facts">
        <div><span className="eyebrow">ACCOUNT INFORMATION</span><h2>Workspace details</h2></div>
        <div><span>Plan</span><b>{user?.plan === 'PREMIUM' ? 'Lily Plus' : 'Lily Free'}</b><Link href="/subscription">Manage plan <ArrowRight size={14} /></Link></div>
        <div><span>Member since</span><b>{memberSince}</b></div>
      </section>
    </div>
  );
}
