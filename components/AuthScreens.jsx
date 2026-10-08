'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { authRequest } from '@/lib/auth-api';
import { useAuth } from '@/components/AuthProvider';
import './auth-screens.css';

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

function TurnstileField({ resetKey, onToken }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!siteKey) {
      setMessage('Account security is not configured. Please try again later.');
      return undefined;
    }

    let widgetId;
    let disposed = false;
    let script = document.querySelector('script[data-lily-turnstile]');
    const mountWidget = () => {
      if (disposed || !window.turnstile || widgetId !== undefined) return;
      const container = document.getElementById(`lily-turnstile-${resetKey}`);
      if (!container) return;
      setMessage('');
      widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('');
          setMessage('The security check could not load. Refresh and try again.');
        },
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.lilyTurnstile = 'true';
      script.addEventListener('load', mountWidget);
      script.addEventListener('error', () => setMessage('The security check could not load. Refresh and try again.'), { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', mountWidget, { once: true });
      mountWidget();
    }

    return () => {
      disposed = true;
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [resetKey, onToken]);

  return (
    <div className="lily-captcha">
      <span className="lily-auth-label">Security check</span>
      <div id={`lily-turnstile-${resetKey}`} className="lily-captcha-widget" />
      {message && <p className="lily-captcha-message" role="alert">{message}</p>}
    </div>
  );
}

export default function AuthScreens({ mode }) {
  const router = useRouter();
  const { setAuthenticatedUser, clearUser } = useAuth();
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [returnTo, setReturnTo] = useState('/dashboard');
  const [codeDestination, setCodeDestination] = useState('');
  const [step, setStep] = useState(mode === 'reset-password' ? 2 : 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryEmail = params.get('email') || '';
    if (queryEmail) setEmail(queryEmail);
    setCodeDestination(params.get('destination') || queryEmail);
    if (params.has('verified')) setNotice('Your email is verified. Sign in to continue.');
    if (params.has('reset')) setNotice('Your password has been reset. Sign in with your new password.');
    if (params.has('password')) setNotice('Your password has been changed. Sign in with your new password.');
    const requestedReturn = params.get('returnTo') || '/dashboard';
    if (requestedReturn.startsWith('/') && !requestedReturn.startsWith('//')) setReturnTo(requestedReturn);
  }, []);

  const login = mode === 'login';
  const signup = mode === 'signup';
  const verification = mode === 'verify-email';
  const reset = mode === 'reset-password' || mode === 'forgot-password';
  const resetPassword = reset && step === 2;
  const title = login ? 'Welcome back' : signup ? 'Make room for what’s next' : verification ? 'Check your inbox' : resetPassword ? 'Choose a new password' : 'Reset your password';
  const eyebrow = login ? 'YOUR WORKSPACE AWAITS' : signup ? 'START WITH YOUR STORY' : verification ? 'ONE LAST STEP' : 'ACCOUNT SUPPORT';
  const subtitle = login ? 'Sign in to continue where you left off.' : signup ? 'Create your free account to get started.' : verification ? `Enter the 4-digit code sent to ${codeDestination || email || 'your email address'}.` : resetPassword ? 'Use the 4-digit code from your email, then choose a new password.' : 'We’ll send a secure reset code if an account matches that address.';

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!captchaToken) {
      setError('Complete the security check before continuing.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    if ((signup || resetPassword) && password !== confirmPassword) {
      setError('Those passwords do not match yet.');
      return;
    }
    setBusy(true);
    try {
      if (login) {
        const response = await authRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: String(form.get('email')).trim(),
            password,
            rememberMe: form.get('rememberMe') === 'on',
            captchaToken,
          }),
        });
        setAuthenticatedUser(response.data.user);
        router.replace(returnTo);
        return;
      }
      if (signup) {
        const submittedEmail = String(form.get('email')).trim();
        await authRequest('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            name: String(form.get('name')).trim(),
            email: submittedEmail,
            password,
            confirmPassword,
            captchaToken,
          }),
        });
        router.push(`/verify-email?email=${encodeURIComponent(submittedEmail)}`);
        return;
      }
      if (verification) {
        const response = await authRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), code: String(form.get('code')).trim(), captchaToken }),
        });
        if (response.data?.emailChanged) clearUser();
        router.replace('/login?verified=1');
        return;
      }
      if (!resetPassword) {
        const submittedEmail = String(form.get('email')).trim();
        await authRequest('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: submittedEmail, captchaToken }),
        });
        setEmail(submittedEmail);
        setStep(2);
        setNotice('If an account exists for that address, a reset code is on its way.');
        return;
      }
      await authRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: String(form.get('code')).trim(),
          password,
          confirmPassword,
          captchaToken,
        }),
      });
      router.replace('/login?reset=1');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      setCaptchaToken('');
      setCaptchaReset((current) => current + 1);
    }
  }

  async function resendVerification() {
    setError('');
    setNotice('');
    if (!captchaToken) {
      setError('Complete the security check before requesting another code.');
      return;
    }
    setBusy(true);
    try {
      await authRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), captchaToken }),
      });
      setNotice('If this address needs verification, a new code will be sent.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      setCaptchaToken('');
      setCaptchaReset((current) => current + 1);
    }
  }

  return (
    <main className="lily-auth">
      <aside className="lily-auth-story">
        <Link href="/" className="lily-auth-brand" aria-label="Lily home"><span className="lily-auth-mark">L</span> lily<span>.</span></Link>
        <div className="lily-auth-story-copy">
          <span className="lily-auth-eyebrow"><Sparkles size={14} /> A MORE THOUGHTFUL CAREER TOOL</span>
          <h1>Your work has<br />a <em>story worth telling.</em></h1>
          <p>Bring it into focus with a little clarity, thoughtful design, and support that keeps your experience yours.</p>
          <div className="lily-auth-story-note"><ShieldCheck size={17} /><span>Private by design. Your career story stays yours.</span></div>
        </div>
        <div className="lily-auth-story-card">
          <span>YOUR NEXT CHAPTER, IN FOCUS</span>
          <b>Clearer words.<br />More confident next steps.</b>
          <div className="lily-auth-card-lines"><i /><i /><i /></div>
        </div>
        <span className="lily-auth-footnote">LILY STUDIO · CAREER TOOLS, WITH CARE</span>
      </aside>

      <section className="lily-auth-panel" aria-labelledby="auth-heading">
        <div className="lily-auth-form-wrap">
          <Link href="/" className="lily-auth-back"><ArrowLeft size={15} /> Back to home</Link>
          <span className="lily-auth-eyebrow">{eyebrow}</span>
          <h2 id="auth-heading">{title}</h2>
          <p className="lily-auth-subtitle">{subtitle}</p>
          {notice && <div className="lily-auth-notice" role="status"><CheckCircle2 size={17} />{notice}</div>}
          {error && <div className="lily-auth-error" role="alert">{error}</div>}
          {login && error.startsWith('Verify your email') && <p className="lily-auth-subtitle"><Link href={`/verify-email?email=${encodeURIComponent(email)}`}>Verify your email address</Link> to finish setting up your account.</p>}

          <form className="lily-auth-form" onSubmit={submit} noValidate={false}>
            {signup && <label className="lily-auth-field">
              <span>Full name</span><span className="lily-auth-input"><UserRound size={17} /><input name="name" autoComplete="name" placeholder="Your name" minLength={2} maxLength={100} required /></span>
            </label>}
            {(!verification && (login || signup || !resetPassword)) && <label className="lily-auth-field">
              <span>Email address</span><span className="lily-auth-input"><Mail size={17} /><input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" maxLength={254} required /></span>
            </label>}
            {verification && <label className="lily-auth-field">
              <span>Email address</span><span className="lily-auth-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={254} required /></span>
            </label>}
            {verification && <label className="lily-auth-field">
              <span>Verification code</span><span className="lily-auth-input"><LockKeyhole size={17} /><input name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="0000" autoComplete="one-time-code" required /></span>
            </label>}
            {resetPassword && <label className="lily-auth-field">
              <span>4-digit reset code</span><span className="lily-auth-input"><LockKeyhole size={17} /><input name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="0000" autoComplete="one-time-code" required /></span>
            </label>}
            {(login || signup || resetPassword) && <label className="lily-auth-field">
              <span>{resetPassword ? 'New password' : 'Password'}</span><span className="lily-auth-input"><LockKeyhole size={17} /><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={login ? 'current-password' : 'new-password'} minLength={8} maxLength={72} placeholder="At least 8 characters" required /><button type="button" className="lily-auth-reveal" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
            </label>}
            {(signup || resetPassword) && <>
              <label className="lily-auth-field">
                <span>Confirm password</span><span className="lily-auth-input"><LockKeyhole size={17} /><input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={72} placeholder="Enter your password again" required /></span>
              </label>
              <p className="lily-auth-hint">Use at least 8 characters, with uppercase and lowercase letters, a number, and a symbol.</p>
            </>}
            {login && <label className="lily-auth-remember"><input type="checkbox" name="rememberMe" /><span>Keep me signed in on this device</span></label>}
            <TurnstileField resetKey={captchaReset} onToken={setCaptchaToken} />
            <button className="lily-auth-submit" type="submit" disabled={busy || !captchaToken}>
              {busy ? 'Please wait…' : login ? 'Sign in' : signup ? 'Create account' : verification ? 'Verify email' : resetPassword ? 'Reset password' : 'Send reset code'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          {verification && <button type="button" className="lily-auth-text-button" onClick={resendVerification} disabled={busy}>Send a new verification code</button>}
          {reset && resetPassword && <button type="button" className="lily-auth-text-button" onClick={() => { setStep(1); setNotice(''); setError(''); }}>Send another reset code</button>}
          <div className="lily-auth-links">
            {login && <><Link href="/forgot-password">Forgot password?</Link><span>New to Lily? <Link href="/signup">Create an account</Link></span></>}
            {signup && <span>Already have an account? <Link href="/login">Sign in</Link></span>}
            {verification && <span>Already verified? <Link href="/login">Sign in</Link></span>}
            {reset && <span>Remembered your password? <Link href="/login">Back to sign in</Link></span>}
          </div>
          <p className="lily-auth-privacy">By continuing, you agree to use Lily Studio responsibly. Your account data is protected and never sold.</p>
        </div>
      </section>
    </main>
  );
}
