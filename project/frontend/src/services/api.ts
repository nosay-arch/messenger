import { getCsrfToken } from './utils';
import { User } from '../types';

export async function fetchWithCSRF(url: string, options: RequestInit = {}) {
  const csrf = getCsrfToken();
  const headers = new Headers(options.headers);
  headers.set('X-CSRFToken', csrf);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response;
}

export const authAPI = {
  login: (username: string, password: string) =>
    fetchWithCSRF('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }).then(res => res.json()),

  register: (username: string, password: string) =>
    fetchWithCSRF('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }).then(res => res.json()),

  logout: () =>
    fetchWithCSRF('/auth/logout', { method: 'POST' }),

  me: (): Promise<User | null> =>
    fetch('/api/auth/me', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).then(res => (res.ok ? res.json() : null)),
};

export const usersAPI = {
  search: (query: string) =>
    fetch(`/api/users?q=${encodeURIComponent(query)}`).then(res => res.json()),

  getProfile: (userId: number) =>
    fetch(`/api/users/${userId}/profile`).then(res => res.json()),

  getProfileByUsername: (username: string) =>
    fetch(`/api/users/by-username/${encodeURIComponent(username)}`).then(res => res.json()),
};

export const profileAPI = {
  get: () =>
    fetch('/api/profile', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }).then(res => res.json()),

  update: (bio: string) =>
    fetchWithCSRF('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio }),
    }).then(res => res.json()),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return fetchWithCSRF('/api/profile/avatar', {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
};
