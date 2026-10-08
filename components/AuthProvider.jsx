'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authRequest } from '@/lib/auth-api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [authError, setAuthError] = useState('');

  const restoreSession = useCallback(async () => {
    setStatus('loading');
    setAuthError('');
    try {
      const response = await authRequest('/auth/me');
      setUser(response.data.user);
      setStatus('authenticated');
      return response.data.user;
    } catch (error) {
      setUser(null);
      if (error.status === 401) {
        setStatus('anonymous');
        return null;
      }
      setAuthError(error.message);
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signOut = useCallback(async () => {
    await authRequest('/auth/logout', { method: 'POST' });
    setUser(null);
    setAuthError('');
    setStatus('anonymous');
  }, []);

  const value = useMemo(() => ({
    user,
    status,
    authError,
    restoreSession,
    signOut,
    setAuthenticatedUser(nextUser) {
      setUser(nextUser);
      setAuthError('');
      setStatus('authenticated');
    },
    clearUser() {
      setUser(null);
      setStatus('anonymous');
    },
  }), [user, status, authError, restoreSession, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider.');
  return auth;
}

export function RequireAuth({ children }) {
  const { status, authError, restoreSession } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname || '/dashboard')}`);
    }
  }, [status, pathname, router]);

  if (status === 'authenticated') return children;
  if (status === 'error') {
    return (
      <main className="auth-guard-message" role="alert">
        <h1>We could not verify your session.</h1>
        <p>{authError}</p>
        <button type="button" onClick={() => void restoreSession()}>Try again</button>
      </main>
    );
  }
  return <main className="auth-guard-loading" role="status" aria-live="polite">Checking your secure workspace…</main>;
}
