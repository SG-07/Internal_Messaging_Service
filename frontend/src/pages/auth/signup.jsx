// frontend/src/pages/auth/signup.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { signup } from '../../api/auth';

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  // Redirect to login after the countdown finishes
  useEffect(() => {
    if (redirectCountdown === null) {
      return;
    }

    if (redirectCountdown === 0) {
      navigate('/auth/login');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((previousCountdown) => {
        return previousCountdown - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setRedirectCountdown(null);

    const {
      fullName,
      email,
      username,
      password,
      confirmPassword,
    } = formData;

    // Required-field validation
    if (
      !fullName ||
      !email ||
      !username ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match.');
      return;
    }

    try {
      setLoading(true);

      // Create account
      await signup({
        fullName,
        email,
        username,
        password,
      });

      // Supabase email verification is required.
      // Do not automatically log in the user.

      setSuccess(
        'Account created successfully! Please check your email and verify your account before logging in.'
      );

      // Start 10-second countdown to login page
      setRedirectCountdown(10);

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Sign up to create your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700"
              role="status"
            >
              <p>{success}</p>

              {redirectCountdown !== null && (
                <p className="mt-2 font-medium">
                  Redirecting to login in{' '}
                  {redirectCountdown} seconds...
                </p>
              )}
            </div>
          )}

          {/* Signup Form */}
          {!success && (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Choose a username"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading
                  ? 'Creating Account...'
                  : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}

            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Log in
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Signup;
