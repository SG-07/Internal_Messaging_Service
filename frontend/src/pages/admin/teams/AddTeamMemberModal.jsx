//frontend/src/pages/admin/teams/AddTeamMemberModal.jsx
import { useEffect, useMemo, useState } from 'react';

import {
  getAdminUsers,
  addTeamMember,
} from '../../../api/admin';

function AddTeamMemberModal({
  open,
  teamId,
  existingMembers = [],
  onClose,
  onAdded,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [addingUserId, setAddingUserId] =
    useState(null);

  const [error, setError] = useState('');

  /*
   * Load users whenever the modal opens.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadUsers() {
      try {
        setLoading(true);
        setError('');

        const response =
          await getAdminUsers({
            limit: 100,
          });

        if (import.meta.env.DEV) {
          console.group(
            '[AddTeamMemberModal] Users'
          );

          console.log(
            'Received response:',
            response
          );

          console.groupEnd();
        }

        /*
         * Support common API response structures.
         */
        const responseUsers =
          response?.data?.data ||
          response?.data?.users ||
          response?.users ||
          response?.data ||
          [];

        setUsers(
          Array.isArray(responseUsers)
            ? responseUsers
            : []
        );

      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            '[AddTeamMemberModal] Load Users Error'
          );

          console.error(
            'Error:',
            err
          );

          console.log(
            'Error message:',
            err.message
          );

          console.groupEnd();
        }

        setError(
          err.message ||
            'Unable to load users.'
        );

      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [open]);

  /*
   * IDs of users who are already members.
   */
  const existingMemberIds = useMemo(() => {
    return new Set(
      existingMembers
        .map(
          (member) =>
            member?.id ||
            member?.user_id
        )
        .filter(Boolean)
        .map(String)
    );
  }, [existingMembers]);

  /*
   * Only show users who are not already
   * members of this team.
   */
  const availableUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users
      .filter((user) => {
        const userId =
          user?.id ||
          user?.user_id;

        if (
          !userId ||
          existingMemberIds.has(
            String(userId)
          )
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const name =
          user?.name ||
          user?.full_name ||
          user?.username ||
          '';

        const email =
          user?.email ||
          '';

        return (
          String(name)
            .toLowerCase()
            .includes(query) ||
          String(email)
            .toLowerCase()
            .includes(query)
        );
      });
  }, [
    users,
    search,
    existingMemberIds,
  ]);

  function handleClose() {
    if (addingUserId) {
      return;
    }

    setSearch('');
    setError('');

    onClose();
  }

  async function handleAdd(user) {
    const userId =
      user?.id ||
      user?.user_id;

    if (!teamId || !userId) {
      setError(
        'Unable to identify this user.'
      );

      return;
    }

    try {
      setAddingUserId(String(userId));
      setError('');

      if (import.meta.env.DEV) {
        console.group(
          '[AddTeamMemberModal] Add Member'
        );

        console.log(
          'Team ID:',
          teamId
        );

        console.log(
          'User ID:',
          userId
        );

        console.groupEnd();
      }

      const response =
        await addTeamMember(
          teamId,
          userId
        );

      if (import.meta.env.DEV) {
        console.group(
          '[AddTeamMemberModal] Add Member Response'
        );

        console.log(
          'Received response:',
          response
        );

        console.groupEnd();
      }

      /*
       * Tell TeamEdit that the member was added.
       */
      if (onAdded) {
        await onAdded(
          response,
          user
        );
      }

      /*
       * Remove the user from the local list so
       * they cannot be added twice while the modal
       * remains open.
       */
      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => {
            const currentUserId =
              currentUser?.id ||
              currentUser?.user_id;

            return (
              String(currentUserId) !==
              String(userId)
            );
          }
        )
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          '[AddTeamMemberModal] Add Member Error'
        );

        console.error(
          'Error:',
          err
        );

        console.log(
          'Error message:',
          err.message
        );

        console.groupEnd();
      }

      setError(
        err.message ||
          'Unable to add member. Please try again.'
      );

    } finally {
      setAddingUserId(null);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add Member
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search for a user and add them to this team.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(addingUserId)}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>

        </div>

        {/* Search */}
        <div className="border-b px-6 py-4">

          <label
            htmlFor="member-search"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Search users
          </label>

          <input
            id="member-search"
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by name or email..."
            disabled={loading}
            autoFocus
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pt-4">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* Users */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">

          {loading ? (
            <div className="py-10 text-center">

              <p className="text-sm text-gray-500">
                Loading users...
              </p>

            </div>
          ) : availableUsers.length > 0 ? (
            <div className="divide-y rounded-lg border">

              {availableUsers.map((user) => {

                const userId =
                  user?.id ||
                  user?.user_id;

                const userName =
                  user?.name ||
                  user?.full_name ||
                  user?.username ||
                  'Unknown User';

                const userEmail =
                  user?.email ||
                  '—';

                const isAdding =
                  String(
                    addingUserId
                  ) ===
                  String(userId);

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between gap-4 px-4 py-4"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-sm font-medium text-gray-900">
                        {userName}
                      </p>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {userEmail}
                      </p>

                    </div>

                    <button
                      type="button"
                      disabled={
                        Boolean(addingUserId)
                      }
                      onClick={() =>
                        handleAdd(user)
                      }
                      className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAdding
                        ? 'Adding...'
                        : 'Add'}
                    </button>

                  </div>
                );
              })}

            </div>
          ) : (
            <div className="py-10 text-center">

              <p className="text-sm font-medium text-gray-700">
                {search.trim()
                  ? 'No matching users found.'
                  : 'No users available to add.'}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {search.trim()
                  ? 'Try a different name or email.'
                  : 'All available users may already be members of this team.'}
              </p>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">

          <button
            type="button"
            onClick={handleClose}
            disabled={Boolean(addingUserId)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Done
          </button>

        </div>

      </div>
    </div>
  );
}

export default AddTeamMemberModal;