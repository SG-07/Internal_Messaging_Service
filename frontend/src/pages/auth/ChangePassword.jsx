// src/pages/auth/ChangePassword.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { changePassword } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

function ChangePassword() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    newPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [loading, setLoading] = useState(false);

  /*
   * After successful password change:
   *
   * 10 seconds
   *    ↓
   * 9 seconds
   *    ↓
   * ...
   *    ↓
   * 0 seconds
   *    ↓
   * Clear frontend auth state
   *    ↓
   * Redirect to login
   */
  useEffect(() => {
    if (!success) {
      return;
    }

    if (countdown <= 0) {
      // Backend has already invalidated the session.
      // Now clear the frontend authentication state.
      setUser(null);

      navigate('/auth/login', {
        replace: true,
      });

      return;
    }

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    success,
    countdown,
    navigate,
    setUser,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((data) => ({
      ...data,
      [name]: value,
    }));

    setError('');
  }

  function isValidPassword(password) {
    return (
      password.length >= 6 &&
      /\d/.test(password) &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password)
    );
  }

  function handleRelogin() {
    // Clear frontend authentication state
    // before going to login.
    setUser(null);

    navigate('/auth/login', {
      replace: true,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    const {
      password,
      newPassword,
    } = formData;

    if (!password || !newPassword) {
      setError('All fields are required.');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError(
        'New password must be at least 6 characters and contain at least 1 number, 1 uppercase letter, and 1 lowercase letter.'
      );
      return;
    }

    if (password === newPassword) {
      setError(
        'New password must be different from your current password.'
      );
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        password,
        newPassword,
      });

      /*
       * IMPORTANT:
       *
       * Do NOT call setUser(null) here.
       *
       * The backend has already invalidated the session,
       * but we need to keep the frontend user state temporarily
       * so ProtectedRoute does not immediately redirect us.
       *
       * The frontend auth state will be cleared when:
       *
       * 1. Countdown reaches 0, or
       * 2. User clicks "Log In Again".
       */

      setFormData({
        password: '',
        newPassword: '',
      });

      setCountdown(10);
      setSuccess(true);
    } catch (err) {
      setError(
        err.message ||
          'Unable to change password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const newPasswordValid = isValidPassword(
    formData.newPassword
  );

  /*
   * Success screen
   */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

          {/* Success Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl text-green-600">
              ✓
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900">
            Password Changed
          </h1>

          {/* Message */}
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your password has been changed successfully.
            Your current session has been ended for security.
          </p>

          {/* Countdown */}
          <p className="mt-4 text-sm font-medium text-gray-700">
            Redirecting to login in{' '}
            <span className="font-bold text-blue-600">
              {countdown}
            </span>{' '}
            seconds...
          </p>

          {/* Relogin */}
          <button
            type="button"
            onClick={handleRelogin}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Log In Again
          </button>

        </div>
      </div>
    );
  }

  /*
   * Change password form
   */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Update your account password
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Current Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="current-password"
                placeholder="Enter your current password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (show) => !show
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                {showPassword
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              New Password
            </label>

            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={
                  showNewPassword
                    ? 'text'
                    : 'password'
                }
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Enter your new password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (show) => !show
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                {showNewPassword
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600">
                New password must have:
              </p>

              <ul className="mt-2 space-y-1">

                {/* Length */}
                <li
                  className={`text-xs ${
                    formData.newPassword.length >= 6
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formData.newPassword.length >= 6
                    ? '✓'
                    : '✗'}{' '}
                  At least 6 characters
                </li>

                {/* Number */}
                <li
                  className={`text-xs ${
                    /\d/.test(
                      formData.newPassword
                    )
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {/\d/.test(
                    formData.newPassword
                  )
                    ? '✓'
                    : '✗'}{' '}
                  At least 1 number
                </li>

                {/* Uppercase */}
                <li
                  className={`text-xs ${
                    /[A-Z]/.test(
                      formData.newPassword
                    )
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {/[A-Z]/.test(
                    formData.newPassword
                  )
                    ? '✓'
                    : '✗'}{' '}
                  At least 1 uppercase letter
                </li>

                {/* Lowercase */}
                <li
                  className={`text-xs ${
                    /[a-z]/.test(
                      formData.newPassword
                    )
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {/[a-z]/.test(
                    formData.newPassword
                  )
                    ? '✓'
                    : '✗'}{' '}
                  At least 1 lowercase letter
                </li>

              </ul>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading ||
              !formData.password ||
              !newPasswordValid
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading
              ? 'Changing Password...'
              : 'Change Password'}
          </button>
        </form>

        {/* Back */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline disabled:opacity-50"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

export default ChangePassword;