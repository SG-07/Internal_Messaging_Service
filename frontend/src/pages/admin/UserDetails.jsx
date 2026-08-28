// frontend/src/pages/admin/UserDetails.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import DashboardLayout from '../dashboard/DashboardLayout';
import {
  getUserProfile,
  updateUserManager,
  updateUserStatus,
  updateUserDepartment,
  updateUserTeamStatus,
} from '../../api/admin';

import DashboardLayout from '../dashboard/DashboardLayout';

const DEPARTMENTS = [
  'HR',
  'Administrator',
  'IT',
  'Sales',
  'Marketing',
];

function UserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [savingManager, setSavingManager] = useState(false);
  const [savingDepartment, setSavingDepartment] =
    useState(false);
  const [savingStatus, setSavingStatus] =
    useState(false);
  const [savingTeamStatus, setSavingTeamStatus] =
    useState(false);

  const [managerId, setManagerId] = useState('');
  const [department, setDepartment] = useState('');

  const [showStatusModal, setShowStatusModal] =
    useState(false);

  const [statusComment, setStatusComment] =
    useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] =
    useState('');

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

        if (userData) {
          setManagerId(
            userData.manager_id || ''
          );

          setDepartment(
            userData.department || ''
          );
        }
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
   * Clear action messages
   * --------------------------------------------------
   */
  function clearActionMessages() {
    setActionError('');
    setActionSuccess('');
  }

  /*
   * --------------------------------------------------
   * Update manager
   * --------------------------------------------------
   */
  async function handleManagerUpdate() {
    clearActionMessages();

    try {
      setSavingManager(true);

      const payload = {
        manager_id:
          managerId.trim() || null,
      };

      if (import.meta.env.DEV) {
        console.group(
          '[UserDetails] Update Manager'
        );
        console.log('User ID:', userId);
        console.log('Payload:', payload);
        console.groupEnd();
      }

      await updateUserManager(
        userId,
        payload
      );

      setUser((currentUser) => ({
        ...currentUser,
        manager_id:
          managerId.trim() || null,
      }));

      setActionSuccess(
        'Manager updated successfully.'
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[UserDetails] Failed to update manager:',
          err
        );
      }

      setActionError(
        err?.message ||
          'Unable to update manager.'
      );
    } finally {
      setSavingManager(false);
    }
  }

  /*
   * --------------------------------------------------
   * Update department
   * --------------------------------------------------
   */
  async function handleDepartmentUpdate() {
    clearActionMessages();

    try {
      setSavingDepartment(true);

      const payload = {
        department:
          department.trim() || null,
      };

      if (import.meta.env.DEV) {
        console.group(
          '[UserDetails] Update Department'
        );
        console.log('User ID:', userId);
        console.log('Payload:', payload);
        console.groupEnd();
      }

      await updateUserDepartment(
        userId,
        payload
      );

      setUser((currentUser) => ({
        ...currentUser,
        department:
          department.trim() || null,
      }));

      setActionSuccess(
        'Department updated successfully.'
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[UserDetails] Failed to update department:',
          err
        );
      }

      setActionError(
        err?.message ||
          'Unable to update department.'
      );
    } finally {
      setSavingDepartment(false);
    }
  }

  /*
   * --------------------------------------------------
   * Open active / pause dialog
   * --------------------------------------------------
   */
  function handleStatusButtonClick() {
    clearActionMessages();
    setStatusComment('');
    setShowStatusModal(true);
  }

  /*
   * --------------------------------------------------
   * Update active status
   * --------------------------------------------------
   */
  async function handleStatusUpdate() {
    if (!statusComment.trim()) {
      setActionError(
        'Please enter a comment explaining this status change.'
      );
      return;
    }

    clearActionMessages();

    const nextStatus =
      user?.is_active === false;

    try {
      setSavingStatus(true);

      const payload = {
        is_active: nextStatus,
        comment: statusComment.trim(),
      };

      if (import.meta.env.DEV) {
        console.group(
          '[UserDetails] Update User Status'
        );
        console.log('User ID:', userId);
        console.log('Payload:', payload);
        console.groupEnd();
      }

      await updateUserStatus(
        userId,
        payload
      );

      setUser((currentUser) => ({
        ...currentUser,
        is_active: nextStatus,
      }));

      setShowStatusModal(false);
      setStatusComment('');

      setActionSuccess(
        nextStatus
          ? 'User activated successfully.'
          : 'User paused successfully.'
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[UserDetails] Failed to update status:',
          err
        );
      }

      setActionError(
        err?.message ||
          'Unable to update user status.'
      );
    } finally {
      setSavingStatus(false);
    }
  }

  /*
   * --------------------------------------------------
   * Update team status
   * --------------------------------------------------
   */
  async function handleTeamStatusUpdate(
    nextStatus
  ) {
    clearActionMessages();

    try {
      setSavingTeamStatus(true);

      const payload = {
        team_status: nextStatus,
      };

      if (import.meta.env.DEV) {
        console.group(
          '[UserDetails] Update Team Status'
        );
        console.log('User ID:', userId);
        console.log('Payload:', payload);
        console.groupEnd();
      }

      await updateUserTeamStatus(
        userId,
        payload
      );

      setUser((currentUser) => ({
        ...currentUser,
        team_status: nextStatus,
      }));

      setActionSuccess(
        'Team status updated successfully.'
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[UserDetails] Failed to update team status:',
          err
        );
      }

      setActionError(
        err?.message ||
          'Unable to update team status.'
      );
    } finally {
      setSavingTeamStatus(false);
    }
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
              View and manage account, department,
              manager, and team information.
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

            {/* Action messages */}
            {(actionError ||
              actionSuccess) && (
              <div className="px-6 pt-6">

                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">
                      {actionError}
                    </p>
                  </div>
                )}

                {actionSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <p className="text-sm text-green-700">
                      {actionSuccess}
                    </p>
                  </div>
                )}

              </div>
            )}

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
                      {formatValue(
                        user.email
                      )}
                    </p>
                  </div>

                </div>

                {/* Account status */}
                <div className="flex flex-col items-start gap-3 sm:items-end">

                  {user.is_active === false ? (
                    <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                      Paused
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleStatusButtonClick
                    }
                    disabled={savingStatus}
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      user.is_active === false
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {user.is_active === false
                      ? 'Activate User'
                      : 'Pause User'}
                  </button>

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
                      ? 'Paused'
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

                {/* Department */}
                <EditableField
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  saving={savingDepartment}
                  onSave={
                    handleDepartmentUpdate
                  }
                  type="select"
                  options={DEPARTMENTS}
                />

                {/* Manager */}
                <EditableField
                  label="Manager ID"
                  value={managerId}
                  onChange={setManagerId}
                  saving={savingManager}
                  onSave={
                    handleManagerUpdate
                  }
                  placeholder="Enter manager UUID"
                />

                <InfoField
                  label="Current Team ID"
                  value={
                    user.current_team_id
                  }
                  breakAll
                />

                <InfoField
                  label="Previous Team ID"
                  value={
                    user.previous_team_id
                  }
                  breakAll
                />

              </div>

            </div>

            {/* Team Status */}
            <div className="px-6 py-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Team Status
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage whether this user's current
                    team assignment is active.
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                    {formatTeamStatus(
                      user.team_status
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={
                      savingTeamStatus ||
                      !user.current_team_id
                    }
                    onClick={() =>
                      handleTeamStatusUpdate(
                        user.team_status ===
                          'active'
                          ? 'inactive'
                          : 'active'
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingTeamStatus
                      ? 'Updating...'
                      : user.team_status ===
                        'active'
                      ? 'Deactivate Team Status'
                      : 'Activate Team Status'}
                  </button>

                </div>

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

      {/* Pause / Activate Modal */}
      {showStatusModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="border-b px-6 py-5">

              <h2 className="text-lg font-semibold text-gray-900">
                {user.is_active === false
                  ? 'Activate User'
                  : 'Pause User'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {user.is_active === false
                  ? 'Please provide a comment explaining why the user is being activated.'
                  : 'Please provide a comment explaining why the user is being paused.'}
              </p>

            </div>

            <div className="px-6 py-5">

              <label className="block text-sm font-medium text-gray-700">
                Comment
              </label>

              <textarea
                value={statusComment}
                onChange={(event) =>
                  setStatusComment(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Enter reason for this status change..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={savingStatus}
              />

              {actionError && (
                <p className="mt-2 text-sm text-red-600">
                  {actionError}
                </p>
              )}

            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusComment('');
                  setActionError('');
                }}
                disabled={savingStatus}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleStatusUpdate
                }
                disabled={
                  savingStatus ||
                  !statusComment.trim()
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  user.is_active === false
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {savingStatus
                  ? 'Saving...'
                  : user.is_active === false
                  ? 'Activate User'
                  : 'Pause User'}
              </button>

            </div>

          </div>

        </div>
      )}

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
          breakAll ? 'break-all' : ''
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

/*
 * --------------------------------------------------
 * Editable field
 * --------------------------------------------------
 */
function EditableField({
  label,
  value,
  onChange,
  onSave,
  saving,
  placeholder = '',
  type = 'text',
  options = [],
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">

      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <div className="mt-2 flex gap-2">

        {type === 'select' ? (
          <select
            value={value || ''}
            onChange={(event) =>
              onChange(event.target.value)
            }
            disabled={saving}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              No Department
            </option>

            {options.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={placeholder}
            disabled={saving}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

      </div>

    </div>
    
  );
}

export default UserDetails;