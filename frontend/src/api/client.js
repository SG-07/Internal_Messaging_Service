// frontend/src/api/client.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  const data = await response.json().catch(() => null);

  /*
   * --------------------------------------------------
   * Authentication failure
   * --------------------------------------------------
   */
  if (response.status === 401) {
    const isAuthEndpoint =
      path.includes('/api/auth/login') ||
      path.includes('/api/auth/signup');

    if (!isAuthEndpoint) {
      if (import.meta.env.DEV) {
        console.warn(
          '[API Client] Authentication failed. Session may have expired:',
          path
        );
      }

      window.dispatchEvent(
        new CustomEvent('auth-expired')
      );
    }
  }

  /*
   * --------------------------------------------------
   * General API errors
   * --------------------------------------------------
   */
  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        'Something went wrong. Please try again.'
    );

    error.status = response.status;

    throw error;
  }

  return data;
}