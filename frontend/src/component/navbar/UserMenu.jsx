import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { logout } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

function UserMenu({ user }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      // Logout from backend
      await logout();

      // Clear global authentication state
      setUser(null);

      // Close menu
      setOpen(false);

      // Go to login
      navigate('/auth/login', {
        replace: true,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[UserMenu] Logout failed:',
          error
        );
      }
    } finally {
      setLoggingOut(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth/login"
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Login
        </Link>

        <Link
          to="/auth/signup"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const username =
    user.username ||
    user.full_name ||
    user.email ||
    'User';

  return (
    <div className="relative">

      {/* User button */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={loggingOut}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <span>
          {username}
        </span>

        <span
          className={`text-xs transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="menu"
        >

          {/* Username */}
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {username}
            </p>

            {user.email && (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            )}
          </div>

          {/* Update Username */}
          <Link
            to="/profile/username"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Update Username
          </Link>

          {/* Update Password */}
          <Link
            to="/profile/password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Update Password
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            role="menuitem"
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950"
          >
            {loggingOut
              ? 'Logging out...'
              : 'Logout'}
          </button>

        </div>
      )}
    </div>
  );
}

export default UserMenu;