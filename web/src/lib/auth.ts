import { api, setTokens, clearTokens } from './api';

export interface AuthUser {
  userId: string;
  role: 'direction' | 'coordinator';
  email: string;
  full_name: string;
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post('/auth/login', { email, password });
  setTokens(data.access_token, data.refresh_token);
}

export async function logout(): Promise<void> {
  import('js-cookie').then((Cookies) => {
    const refresh = Cookies.default.get('refresh_token');
    if (refresh) api.post('/auth/logout', { refresh_token: refresh }).catch(() => {});
  });
  clearTokens();
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { userId: payload.sub, role: payload.role, email: payload.email ?? '', full_name: payload.name ?? '' };
  } catch {
    return null;
  }
}
