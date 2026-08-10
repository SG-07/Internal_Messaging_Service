// frontend/src/pages/auth/signup/signup.jsx

import { useState } from 'react';
import { signup, login } from '../../../api/auth';

export default function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    // Required field validation
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    // Password confirmation validation
    if (form.password !== form.confirmPassword) {
      setError('Password and Confirm Password must match.');
      return;
    }

    setLoading(true);

    try {
      // Create account
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Automatically login after successful signup
      const loginResponse = await login({
        email: form.email,
        password: form.password,
      });

      /*
       * The backend API will ultimately define the authentication
       * response contract.
       */
      if (loginResponse?.token) {
        localStorage.setItem('authToken', loginResponse.token);
      }

      // Success popup/status
      setSuccess('Signup successful. You are now logged in.');

      // Clear form after successful signup
      setForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Sign Up</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>

          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">
            Confirm Password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      {success && (
        <div role="status" aria-live="polite">
          <p>{success}</p>

          <button
            type="button"
            onClick={() => setSuccess('')}
          >
            Close
          </button>
        </div>
      )}
    </main>
  );
}
