// frontend/src/pages/admin/UserDetails.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { getUserProfile } from '../../api/admin';
import DashboardLayout from '../dashboard/DashboardLayout';

function UserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
   * --------------------------------------------------
   * Load user
   * --------------------------------------------------
   */
  useEffect(() => {
    async function loadUser() {
      if (!userId) {
        setError('User ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        if (import.meta.env.DEV) {
          console.log(
            '[UserDetails] Fetching user:',
            userId
          );
        }

        const response =
          await getUserProfile(userId);

        if (import.meta.env.DEV) {
          console.log(
            '[UserDetails] User response:',
            response
          );
        }

        const userData =
          response?.data || null;

        setUser(userData);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(
            '[UserDetails] Failed to load user:',
            err
          );
        }

        setUser(null);

        setError(
          err?.message ||
            'Unable to fetch user profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  /*
   * --------------------------------------------------
   * Helpers
   * --------------------------------------------------
   */
  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString();
  }

  function formatValue(value) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    return value;
  }

  function formatRole(role) {
    if (!role) {
      return '—';
    }

    return role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function formatTeamStatus(status) {
    if (!status) {
      return '—';
    }

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  /*
   * --------------------------------------------------
   * Navigation
   * --------------------------------------------------
   */
  function handleBack() {
    navigate('/admin/users');
  }

  return (
    <DashboardLayout>

      <section className="rounded-xl bg-white shadow">

        {/* Header */}
        <div className="border-b px-6 py-5">

          <button
            type="button"
            onClick={handleBack}
            className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Users
          </button>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              User Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View account, department, manager, and
              team information.
            </p>
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center px-6 py-12">
            <p className="text-sm text-gray-500">
              Loading user details...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="px-6 py-8">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Users
            </button>

          </div>
        )}

        {/* User details */}
        {!loading && !error && user && (
          <div className="divide-y">

            {/* Profile summary */}
            <div className="px-6 py-6">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                    {(
                      user.full_name ||
                      user.username ||
                      user.email ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {user.full_name ||
                        user.username ||
                        'Unnamed User'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      @{formatValue(
                        user.username
                      )}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatValue(user.email)}
                    </p>
                  </div>

                </div>

                {/* Account status */}
                <div>
                  {user.is_active === false ? (
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  )}
                </div>

              </div>

            </div>

            {/* Account Information */}
            <div className="px-6 py-6">

              <h3 className="text-base font-semibold text-gray-900">
                Account Information
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <InfoField
                  label="Full Name"
                  value={user.full_name}
                />

                <InfoField
                  label="Username"
                  value={user.username}
                />

                <InfoField
                  label="Email"
                  value={user.email}
                />

                <InfoField
                  label="Role"
                  value={formatRole(user.role)}
                />

                <InfoField
                  label="User ID"
                  value={user.id}
                  breakAll
                />

                <InfoField
                  label="Account Status"
                  value={
                    user.is_active === false
                      ? 'Inactive'
                      : 'Active'
                  }
                />

              </div>

            </div>

            {/* Organization Information */}
            <div className="px-6 py-6">

              <h3 className="text-base font-semibold text-gray-900">
                Organization
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <InfoField
                  label="Department"
                  value={user.department}
                />

                <InfoField
                  label="Manager ID"
                  value={user.manager_id}
                  breakAll
                />

                <InfoField
                  label="Current Team ID"
                  value={user.current_team_id}
                  breakAll
                />

                <InfoField
                  label="Previous Team ID"
                  value={user.previous_team_id}
                  breakAll
                />

                <InfoField
                  label="Team Status"
                  value={formatTeamStatus(
                    user.team_status
                  )}
                />

              </div>

            </div>

            {/* Team Status History */}
            <div className="px-6 py-6">

              <h3 className="text-base font-semibold text-gray-900">
                Team Status History
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <InfoField
                  label="Status Changed By"
                  value={
                    user.team_status_changed_by
                  }
                  breakAll
                />

                <InfoField
                  label="Status Changed At"
                  value={formatDate(
                    user.team_status_changed_at
                  )}
                />

              </div>

            </div>

            {/* Account Dates */}
            <div className="px-6 py-6">

              <h3 className="text-base font-semibold text-gray-900">
                Account Dates
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

                <InfoField
                  label="Created At"
                  value={formatDate(
                    user.created_at
                  )}
                />

                <InfoField
                  label="Updated At"
                  value={formatDate(
                    user.updated_at
                  )}
                />

              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Back
              </button>

            </div>

          </div>
        )}

      </section>

    </DashboardLayout>
  );
}

/*
 * --------------------------------------------------
 * Information field
 * --------------------------------------------------
 */
function InfoField({
  label,
  value,
  breakAll = false,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">

      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm text-gray-900 ${
          breakAll
            ? 'break-all'
            : ''
        }`}
      >
        {value === null ||
        value === undefined ||
        value === ''
          ? '—'
          : value}
      </p>

    </div>
  );
}

export default UserDetails;