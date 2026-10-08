const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export class AuthApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

export async function authRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...options.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new AuthApiError('Could not reach the account service. Check your connection and try again.', 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new AuthApiError(payload?.message || 'The account request could not be completed.', response.status);
  }
  return payload;
}
