// frontend/src/pages/auth/signup.jsx

import { useState } from 'react';
import {
  signup,
  login,
  checkUsernameAvailability,
  checkEmailAvailability,
} from '../../api/auth';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const {
      name,
      email,
      username,
      password,
      confirmPassword,
    } = formData;

    // Basic required-field validation
    if (
      !name ||
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

      // Check username availability
      const usernameResult =
        await checkUsernameAvailability(username);

      if (!usernameResult.available) {
        setError('Username is already taken.');
        return;
      }

      // Check email availability
      const emailResult =
        await checkEmailAvailability(email);

      if (!emailResult.available) {
        setError('Email is already registered.');
        return;
      }

      // Create account
      await signup({
        name,
        email,
        username,
        password,
      });

      // Automatically log in after successful signup
      await login({
        username,
        password,
      });

      //pop up alert to notify the user that they have successfully signed up and logged in
      alert('Signup successful! You are now logged in.');

      setFormData({
        name: '',
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
    <div>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
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
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
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
            value={formData.password}
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
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default Signup;
