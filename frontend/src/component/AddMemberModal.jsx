// frontend/src/component/AddMemberModal.jsx
import {
  useEffect,
  useState,
} from "react";


function AddMemberModal({
  open,
  groupId,
  getPotentialMembers,
  addMember,

  onClose,
  onAdded,
}) {
  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [addingUserId, setAddingUserId] =
    useState(null);

  const [error, setError] =
    useState("");


  /*
   * ----------------------------------------
   * Load potential members
   * ----------------------------------------
   */

  useEffect(() => {
    if (!open || !groupId) {
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      try {
        setLoading(true);
        setError("");

        const response =
          await getPotentialMembers(
            groupId,
            {
              page: 1,
              email: search.trim(),
            }
          );

        if (cancelled) {
          return;
        }

        if (import.meta.env.DEV) {
          console.group(
            "[AddMemberModal] Potential Members"
          );

          console.log(
            "Group ID:",
            groupId
          );

          console.log(
            "Search:",
            search
          );

          console.log(
            "Response:",
            response
          );

          console.groupEnd();
        }

        const responseUsers =
          response?.data?.addable_users ||
          response?.addable_users ||
          [];

        setUsers(
          Array.isArray(responseUsers)
            ? responseUsers
            : []
        );

      } catch (err) {
        if (cancelled) {
          return;
        }

        if (import.meta.env.DEV) {
          console.group(
            "[AddMemberModal] Load Users Error"
          );

          console.error(err);

          console.groupEnd();
        }

        setUsers([]);

        setError(
          err?.message ||
            "Unable to load users."
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };

  }, [
    open,
    groupId,
    search,
    getPotentialMembers,
  ]);


  /*
   * ----------------------------------------
   * Close modal
   * ----------------------------------------
   */

  function handleClose() {
    if (addingUserId) {
      return;
    }

    setSearch("");
    setUsers([]);
    setError("");

    onClose?.();
  }


  /*
   * ----------------------------------------
   * Add member
   * ----------------------------------------
   */

  async function handleAdd(user) {
    const userId =
      user?.id;

    if (!groupId) {
      setError(
        "A valid group is required."
      );

      return;
    }

    if (!userId) {
      setError(
        "Unable to identify this user."
      );

      return;
    }

    try {
      setAddingUserId(
        String(userId)
      );

      setError("");

      if (import.meta.env.DEV) {
        console.group(
          "[AddMemberModal] Add Member"
        );

        console.log(
          "Group ID:",
          groupId
        );

        console.log(
          "User ID:",
          userId
        );

        console.groupEnd();
      }

      const response =
        await addMember(
          groupId,
          userId
        );

      if (import.meta.env.DEV) {
        console.group(
          "[AddMemberModal] Add Member Response"
        );

        console.log(
          "Response:",
          response
        );

        console.groupEnd();
      }

      /*
       * Remove immediately from the UI.
       */

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (currentUser) =>
              String(
                currentUser?.id
              ) !==
              String(userId)
          )
      );

      /*
       * Let GroupDetail refresh its
       * group/member information.
       */

      await onAdded?.(
        response,
        user
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          "[AddMemberModal] Add Member Error"
        );

        console.error(err);

        console.groupEnd();
      }

      setError(
        err?.message ||
          "Unable to add member. Please try again."
      );

    } finally {
      setAddingUserId(null);
    }
  }


  /*
   * ----------------------------------------
   * Closed
   * ----------------------------------------
   */

  if (!open) {
    return null;
  }


  return (
    <div
      className="
        fixed inset-0 z-[60]
        flex items-center justify-center
        bg-black/40 px-4
      "
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
        className="
          flex max-h-[80vh]
          w-full max-w-lg
          flex-col overflow-hidden
          rounded-xl bg-white
          shadow-xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* Header */}

        <div
          className="
            flex items-start
            justify-between
            border-b px-6 py-5
          "
        >

          <div>

            <h2
              className="
                text-lg font-semibold
                text-gray-900
              "
            >
              Add Member
            </h2>

            <p
              className="
                mt-1 text-sm
                text-gray-500
              "
            >
              Search for a user and
              add them to this group.
            </p>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={
              Boolean(addingUserId)
            }
            aria-label="Close"
            className="
              rounded-md px-2 py-1
              text-xl leading-none
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>

        </div>


        {/* Search */}

        <div
          className="
            border-b px-6 py-4
          "
        >

          <label
            htmlFor="add-member-search"
            className="
              mb-2 block
              text-sm font-medium
              text-gray-700
            "
          >
            Search by email
          </label>

          <input
            id="add-member-search"
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by email..."
            disabled={loading}
            autoFocus
            className="
              w-full rounded-lg
              border border-gray-300
              bg-white
              px-3 py-2.5
              text-sm text-gray-900
              outline-none
              transition
              placeholder:text-gray-400
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-gray-100
            "
          />

        </div>


        {/* Error */}

        {error && (
          <div className="px-6 pt-4">

            <div
              className="
                rounded-lg
                border border-red-200
                bg-red-50
                px-4 py-3
              "
            >

              <p
                className="
                  text-sm text-red-700
                "
              >
                {error}
              </p>

            </div>

          </div>
        )}


        {/* Users */}

        <div
          className="
            min-h-0 flex-1
            overflow-y-auto
            px-6 py-4
          "
        >

          {loading ? (

            <div
              className="
                py-10 text-center
              "
            >

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                Searching users...
              </p>

            </div>

          ) : users.length > 0 ? (

            <div
              className="
                divide-y
                rounded-lg border
              "
            >

              {users.map((user) => {

                const userId =
                  user?.id;

                const userName =
                  user?.full_name ||
                  user?.username ||
                  "Unknown User";

                const userEmail =
                  user?.email ||
                  "—";

                const isAdding =
                  String(
                    addingUserId
                  ) ===
                  String(userId);

                return (
                  <div
                    key={userId}
                    className="
                      flex items-center
                      justify-between
                      gap-4
                      px-4 py-4
                    "
                  >

                    <div
                      className="
                        min-w-0
                      "
                    >

                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                          text-gray-900
                        "
                      >
                        {userName}
                      </p>

                      <p
                        className="
                          mt-1 truncate
                          text-sm
                          text-gray-500
                        "
                      >
                        {userEmail}
                      </p>

                      {user?.department && (
                        <p
                          className="
                            mt-1
                            text-xs
                            text-gray-400
                          "
                        >
                          {user.department}
                        </p>
                      )}

                    </div>

                    <button
                      type="button"
                      disabled={
                        Boolean(
                          addingUserId
                        )
                      }
                      onClick={() =>
                        handleAdd(user)
                      }
                      className="
                        shrink-0
                        rounded-lg
                        bg-blue-600
                        px-3.5 py-2
                        text-xs
                        font-semibold
                        text-white
                        transition
                        hover:bg-blue-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {isAdding
                        ? "Adding..."
                        : "Add"}
                    </button>

                  </div>
                );
              })}

            </div>

          ) : (

            <div
              className="
                py-10 text-center
              "
            >

              <p
                className="
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                {search.trim()
                  ? "No users found."
                  : "No users available to add."}
              </p>

              <p
                className="
                  mt-1 text-sm
                  text-gray-500
                "
              >
                {search.trim()
                  ? "Try another email address."
                  : "There are currently no users who can be added to this group."}
              </p>

            </div>
          )}

        </div>


        {/* Footer */}

        <div
          className="
            flex justify-end
            border-t bg-gray-50
            px-6 py-4
          "
        >

          <button
            type="button"
            onClick={handleClose}
            disabled={
              Boolean(addingUserId)
            }
            className="
              rounded-lg
              border border-gray-300
              bg-white
              px-4 py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Done
          </button>

        </div>

      </div>
    </div>
  );
}

export default AddMemberModal;