// frontend/src/api/auth.js

import { request } from './client';

const isDevelopment = import.meta.env.DEV;

function debugLog(label, data) {
  if (!isDevelopment) {
    return;
  }

  console.group(`[API DEBUG] ${label}`);
  console.log(data);
  console.groupEnd();
}

function sanitizePayload(payload) {
  if (!payload) {
    return payload;
  }

  return {
    ...payload,
    ...(payload.password && {
      password: '********',
    }),
  };
}

export async function signup(payload) {
  debugLog('SIGNUP → Request Payload', {
    endpoint: '/api/auth/signup',
    method: 'POST',
    payload: sanitizePayload(payload),
  });

  try {
    const response = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    debugLog('SIGNUP ← Response', {
      endpoint: '/api/auth/signup',
      response,
    });

    return response;
  } catch (error) {
    debugLog('SIGNUP ← Error Response', {
      endpoint: '/api/auth/signup',
      error: error.message,
    });

    throw error;
  }
}

export async function login(payload) {
  debugLog('LOGIN → Request Payload', {
    endpoint: '/api/auth/login',
    method: 'POST',
    payload: sanitizePayload(payload),
  });

  try {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    debugLog('LOGIN ← Response', {
      endpoint: '/api/auth/login',
      response,
    });

    return response;
  } catch (error) {
    debugLog('LOGIN ← Error Response', {
      endpoint: '/api/auth/login',
      error: error.message,
    });

    throw error;
  }
}

export async function logout() {
  debugLog('LOGOUT → Request', {
    endpoint: '/api/auth/logout',
    method: 'POST',
  });

  try {
    const response = await request('/api/auth/logout', {
      method: 'POST',
    });

    debugLog('LOGOUT ← Response', {
      endpoint: '/api/auth/logout',
      response,
    });

    return response;
  } catch (error) {
    debugLog('LOGOUT ← Error Response', {
      endpoint: '/api/auth/logout',
      error: error.message,
    });

    throw error;
  }
}

export async function getCurrentUser() {
  debugLog('CURRENT USER → Request', {
    endpoint: '/api/auth/me',
    method: 'GET',
  });

  try {
    const response = await request('/api/auth/me');

    debugLog('CURRENT USER ← Response', {
      endpoint: '/api/auth/me',
      response,
    });

    return response;
  } catch (error) {
    debugLog('CURRENT USER ← Error Response', {
      endpoint: '/api/auth/me',
      error: error.message,
    });

    throw error;
  }
}