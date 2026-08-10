// frontend/src/api/client.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Something went wrong. Please try again.'
    );
  }

  return data;
}
