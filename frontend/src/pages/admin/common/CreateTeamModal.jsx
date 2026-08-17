import { useState } from 'react';

import { createAdminTeam } from '../../../api/admin';

function CreateTeamModal({
  open,
  onClose,
  onCreated,
}) {
  const [name, setName] = useState('');
  const [managerEmail, setManagerEmail] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState('');

  if (!open) {
    return null;
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setName('');
    setManagerEmail('');
    setError('');

    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedManagerEmail =
      managerEmail.trim();

    if (!trimmedName) {
      setError('Team name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: trimmedName,

        ...(trimmedManagerEmail && {
          managerId: trimmedManagerEmail,
        }),
      };

      if (import.meta.env.DEV) {
        console.group(
          '[CreateTeamModal] Create Team'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.groupEnd();
      }

      const response =
        await createAdminTeam(payload);

      if (import.meta.env.DEV) {
        console.group(
          '[CreateTeamModal] Create Team Response'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.log(
          'Received response:',
          response
        );

        console.groupEnd();
      }

      if (onCreated) {
        await onCreated(response);
      }

      setName('');
      setManagerEmail('');
      setError('');

      onClose();

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          '[CreateTeamModal] Create Team Error'
        );

        console.error('Error:', err);

        console.log(
          'Error message:',
          err.message
        );

        console.groupEnd();
      }

      setError(
        err.message ||
          'Unable to create team. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create Team
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create a new team for your organization.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <div className="space-y-5 px-6 py-6">

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Team name */}
            <div>
              <label
                htmlFor="team-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Team name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="team-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                disabled={loading}
                placeholder="Enter team name"
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* Manager email */}
            <div>
              <label
                htmlFor="manager-email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Manager email
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (optional)
                </span>
              </label>

              <input
                id="manager-email"
                type="email"
                value={managerEmail}
                onChange={(event) =>
                  setManagerEmail(
                    event.target.value
                  )
                }
                disabled={loading}
                placeholder="manager@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Leave blank if the team does not have a
                manager yet.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Creating...'
                : 'Create Team'}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default CreateTeamModal;