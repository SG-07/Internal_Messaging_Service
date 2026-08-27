import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { managerGetDepartmentUsers } from "../../api/manager";


function ManagerDepartmentUsers() {
  const navigate = useNavigate();

  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    loadUsers();
  }, []);


  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response =
        await managerGetDepartmentUsers();

      setUsers(
        response?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load department users:",
        err
      );

      setError(
        err.message ||
          "Failed to load department users."
      );
    } finally {
      setLoading(false);
    }
  }


  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const name =
        user.full_name || "";

      const username =
        user.username || "";

      const email =
        user.email || "";

      return (
        name.toLowerCase().includes(query) ||
        username.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [users, search]);


  if (loading) {
    return (
      <div className="p-6">
        Loading department users...
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">
          Department Users
        </h1>

        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Department Users
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View active users in your department.
        </p>
      </div>


      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by name, username or email..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>


      {/* Users */}
      <div className="overflow-hidden rounded-xl bg-white shadow">

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search
              ? "No users match your search."
              : "No department users found."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {filteredUsers.map((user) => {
              const userId =
                user.id || user.user_id;

              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/manager/department/users/${userId}`
                    )
                  }
                  className="flex w-full items-center justify-between p-5 text-left transition hover:bg-gray-50"
                >

                  <div className="min-w-0">

                    <h2 className="truncate font-medium text-gray-900">
                      {user.full_name ||
                        user.username ||
                        "Unknown User"}
                    </h2>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {user.email || "No email"}
                    </p>

                  </div>


                  <div className="ml-4 flex shrink-0 items-center gap-4">

                    {user.role && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                        {user.role}
                      </span>
                    )}

                    <span className="text-sm text-blue-600">
                      View →
                    </span>

                  </div>

                </button>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}


export default ManagerDepartmentUsers;