// frontend/src/pages/groups/Group.jsx

import DashboardLayout from '../dashboard/DashboardLayout';

import { useAuth } from '../../context/AuthContext';

import {
  useGroupLogic,
} from './GroupLogic';

function Group() {
  const { user } = useAuth();

  const {
    name,
    setName,

    isOpen,
    setIsOpen,

    department,
    setDepartment,

    managerId,
    setManagerId,

    loading,

    error,
    success,

    createdGroup,

    handleSubmit,
    handleCancel,
    handleCreateAnother,
  } = useGroupLogic();

  const isAdmin =
    user?.role === 'admin';

  return (
    <DashboardLayout>

      <section className="mx-auto max-w-3xl rounded-xl bg-white shadow">

        {/* Header */}
        <div className="border-b px-6 py-5">

          <h1 className="text-xl font-semibold text-gray-900">
            Create Group
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new group for collaboration and
            communication.
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="border-b px-6 py-4">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* Success */}
        {success && (
          <div className="border-b px-6 py-4">

            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">

              <p className="text-sm font-medium text-green-700">
                {success}
              </p>

              {createdGroup && (
                <div className="mt-3 space-y-1 text-sm text-green-700">

                  <p>
                    <span className="font-medium">
                      Group:
                    </span>{' '}
                    {createdGroup.name || '—'}
                  </p>

                  <p>
                    <span className="font-medium">
                      Status:
                    </span>{' '}
                    {formatStatus(
                      createdGroup.status
                    )}
                  </p>

                  {createdGroup.department && (
                    <p>
                      <span className="font-medium">
                        Department:
                      </span>{' '}
                      {createdGroup.department}
                    </p>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

        {/* Form */}
        {!createdGroup && (
          <form
            onSubmit={handleSubmit}
            className="px-6 py-6"
          >

            <div className="space-y-6">

              {/* Group Name */}
              <div>

                <label
                  htmlFor="group-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Group Name
                </label>

                <input
                  id="group-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter group name"
                  disabled={loading}
                  maxLength={255}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

              </div>

              {/* Group Visibility */}
              <div>

                <label className="block text-sm font-medium text-gray-700">
                  Group Type
                </label>

                <div className="mt-3 space-y-3">

                  {/* Open */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">

                    <input
                      type="radio"
                      name="group-visibility"
                      checked={isOpen === true}
                      onChange={() =>
                        setIsOpen(true)
                      }
                      disabled={loading}
                      className="mt-1"
                    />

                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Open Group
                      </span>

                      <span className="mt-1 block text-sm text-gray-500">
                        This group is created as an open
                        group.
                      </span>
                    </span>

                  </label>

                  {/* Closed */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">

                    <input
                      type="radio"
                      name="group-visibility"
                      checked={isOpen === false}
                      onChange={() =>
                        setIsOpen(false)
                      }
                      disabled={loading}
                      className="mt-1"
                    />

                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Restricted Group
                      </span>

                      <span className="mt-1 block text-sm text-gray-500">
                        This group may require approval
                        before it becomes active.
                      </span>
                    </span>

                  </label>

                </div>

              </div>

              {/* Department - Admin Only */}
              {isAdmin && (
                <div>

                  <label
                    htmlFor="group-department"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Department
                  </label>

                  <input
                    id="group-department"
                    type="text"
                    value={department}
                    onChange={(event) =>
                      setDepartment(
                        event.target.value
                      )
                    }
                    placeholder="Leave empty for a cross-department group"
                    disabled={loading}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Admins can optionally assign a department.
                    Leave this empty to create a cross-department
                    group.
                  </p>

                </div>
              )}

              {/* Manager ID */}
              <div>

                <label
                  htmlFor="group-manager"
                  className="block text-sm font-medium text-gray-700"
                >
                  Manager ID
                </label>

                <input
                  id="group-manager"
                  type="text"
                  value={managerId}
                  onChange={(event) =>
                    setManagerId(
                      event.target.value
                    )
                  }
                  placeholder="Optional manager UUID"
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !name.trim()
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Creating...'
                  : 'Create Group'}
              </button>

            </div>

          </form>
        )}

        {/* After successful creation */}
        {createdGroup && (
          <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleCreateAnother}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create Another
            </button>

          </div>
        )}

      </section>

    </DashboardLayout>
  );
}

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

function formatStatus(status) {
  if (!status) {
    return '—';
  }

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default Group;