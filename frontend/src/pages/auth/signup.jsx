// frontend/src/pages/auth/signup.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { signup } from '../../api/auth';

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  loading,
  show,
  onToggle,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className={onToggle ? 'relative' : ''}>
        <input
          id={id}
          name={id}
          type={show ? 'text' : type}
          value={value}
          onChange={onChange}
          required
          disabled={loading}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  useEffect(() => {
    if (redirectCountdown === null) return;

    if (redirectCountdown === 0) {
      navigate('/auth/login');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((count) => count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((data) => ({
      ...data,
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

    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match.');
      return;
    }

    try {
      setLoading(true);

      await signup({
        fullName,
        email,
        username,
        password,
      });

      setSuccess(
        'Account created successfully! Please check your email and verify your account before logging in.'
      );

      setRedirectCountdown(10);

      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      });

      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Account
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Sign up to create your account
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
            <p>{success}</p>

            <p className="mt-2 font-medium">
              Redirecting to login in {redirectCountdown} seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <InputField
              id="fullName"
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              loading={loading}
            />

            <InputField
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              loading={loading}
            />

            <InputField
              id="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              loading={loading}
            />

            <InputField
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              loading={loading}
              show={showPassword}
              onToggle={() =>
                setShowPassword((show) => !show)
              }
            />

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              loading={loading}
              show={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword((show) => !show)
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

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
  );
}

export default Signup;