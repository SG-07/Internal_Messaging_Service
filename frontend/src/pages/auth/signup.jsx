import { useState } from 'react';
import { useNavigate } from 'react-router';

import { signup } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

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

function PasswordRequirements({ password }) {
  const requirements = [
    {
      label: 'At least 6 characters',
      valid: password.length >= 6,
    },
    {
      label: 'At least 1 number',
      valid: /\d/.test(password),
    },
    {
      label: 'At least 1 uppercase letter',
      valid: /[A-Z]/.test(password),
    },
    {
      label: 'At least 1 lowercase letter',
      valid: /[a-z]/.test(password),
    },
  ];

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-600">
        Password must have:
      </p>

      <ul className="mt-2 space-y-1">
        {requirements.map((requirement) => (
          <li
            key={requirement.label}
            className={`text-xs ${
              requirement.valid
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {requirement.valid ? '✓' : '✗'}{' '}
            {requirement.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

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
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

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

    if (!isValidPassword(password)) {
      setError(
        'Password does not meet all the required conditions.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password must match.');
      return;
    }

    try {
      setLoading(true);

      const response = await signup({
        fullName,
        email,
        username,
        password,
      });

      /*
       * Backend response:
       *
       * {
       *   "message": "Signup successful.",
       *   "user": {
       *     "id": "uuid",
       *     "email": "user@example.com",
       *     "username": "theirusername",
       *     "full_name": "Their Full Name",
       *     "role": "user"
       *   }
       * }
       */

      if (!response?.user) {
        throw new Error(
          'Signup succeeded, but the user information was not returned.'
        );
      }

      // Store the newly created authenticated user.
      setUser(response.user);

      // Go directly to the protected dashboard.
      navigate('/dashboard', {
        replace: true,
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

  const passwordValid = isValidPassword(formData.password);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  const canSubmit =
    !loading &&
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.username.trim() &&
    passwordValid &&
    passwordsMatch;

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

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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

          <div>
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

            <PasswordRequirements
              password={formData.password}
            />
          </div>

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

          {formData.confirmPassword && (
            <p
              className={`-mt-3 text-xs ${
                passwordsMatch
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {passwordsMatch
                ? '✓ Passwords match'
                : '✗ Passwords do not match'}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading
              ? 'Creating Account...'
              : 'Sign Up'}
          </button>
        </form>

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