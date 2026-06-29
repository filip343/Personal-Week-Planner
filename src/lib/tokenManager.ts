export type TokenResponse = {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

const SCOPE = 'https://www.googleapis.com/auth/calendar';
const STORAGE_KEY = 'wp_token';

let tokenClient: TokenClient | null = null;
let currentToken: string | null = null;
let tokenExpiry = 0;

let pendingResolve: ((token: string) => void) | null = null;
let pendingReject: ((err: Error) => void) | null = null;
let pending = false;

function persistToken(token: string, expiry: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiry }));
  } catch {}
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Reloads a previously persisted access token into memory if it is still valid. */
export function restoreSession(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { token, expiry } = JSON.parse(raw) as { token?: string; expiry?: number };
    if (token && typeof expiry === 'number' && Date.now() < expiry) {
      currentToken = token;
      tokenExpiry = expiry;
    } else {
      clearStoredToken();
    }
  } catch {
    clearStoredToken();
  }
}

export function initTokenClient(): void {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.oauth2) return;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (response: TokenResponse) => {
      pending = false;
      if (response.error || !response.access_token) {
        const err = new Error(response.error_description ?? response.error ?? 'Token request failed');
        pendingReject?.(err);
      } else {
        currentToken = response.access_token;
        tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
        persistToken(currentToken, tokenExpiry);
        pendingResolve?.(currentToken);
      }
      pendingResolve = null;
      pendingReject = null;
    },
    error_callback: (err: unknown) => {
      pending = false;
      pendingReject?.(err instanceof Error ? err : new Error('Authentication cancelled'));
      pendingResolve = null;
      pendingReject = null;
    },
  });
}

export function isTokenValid(): boolean {
  return !!currentToken && Date.now() < tokenExpiry;
}

export function clearToken(): void {
  if (currentToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(currentToken);
  }
  currentToken = null;
  tokenExpiry = 0;
  clearStoredToken();
}

export function getToken(silent = false): Promise<string> {
  if (currentToken && Date.now() < tokenExpiry) {
    return Promise.resolve(currentToken);
  }

  return new Promise<string>((resolve, reject) => {
    if (pending) {
      const prevResolve = pendingResolve;
      const prevReject = pendingReject;
      pendingResolve = (t) => { prevResolve?.(t); resolve(t); };
      pendingReject = (e) => { prevReject?.(e); reject(e); };
      return;
    }

    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    pendingResolve = resolve;
    pendingReject = reject;
    pending = true;
    tokenClient.requestAccessToken({ prompt: silent ? '' : undefined });
  });
}

export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retried = false
): Promise<Response> {
  const token = await getToken(retried);
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401 && !retried) {
    currentToken = null;
    clearStoredToken();
    return authedFetch(input, init, true);
  }
  return res;
}
