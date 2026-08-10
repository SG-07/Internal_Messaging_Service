// frontend/src/api/auth.js

import { request } from './client';

export function signup(payload) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}

export function getCurrentUser() {
  return request('/api/auth/me');
}

export function checkUsernameAvailability(username) {
  return request(
    `/api/auth/check-username?username=${encodeURIComponent(username)}`
  );
}

export function checkEmailAvailability(email) {
  return request(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`
  );
}
