import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  managerGetDepartmentUser,
} from "../../api/manager";


function ManagerDepartmentUserDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    loadUser();
  }, [userId]);


  async function loadUser() {
    try {
      setLoading(true);
      setError("");

      const response =
        await managerGetDepartmentUser(
          userId
        );

      setUser(
        response?.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load department user:",
        err
      );

      setError(
        err.message ||
          "Failed to load user."
      );
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="p-6">
        Loading user...
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-6">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/manager/department/users"
            )
          }
          className="mb-5 text-sm text-blue-600 hover:underline"
        >
          ← Back to Department Users
        </button>

        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }


  if (!user) {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          User not found.
        </p>
      </div>
    );
  }


  return (
    <div className="p-6">

      {/* Back */}
      <button
        type="button"
        onClick={() =>
          navigate(
            "/manager/department/users"
          )
        }
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← Back to Department Users
      </button>


      {/* User profile */}
      <div className="max-w-2xl rounded-xl bg-white p-6 shadow">

        <div className="mb-6 border-b border-gray-200 pb-5">

          <h1 className="text-2xl font-bold text-gray-900">
            {user.full_name ||
              user.username ||
              "Unknown User"}
          </h1>

          {user.username && (
            <p className="mt-1 text-sm text-gray-500">
              @{user.username}
            </p>
          )}

        </div>


        <div className="space-y-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email
            </p>

            <p className="mt-1 text-sm text-gray-900">
              {user.email || "—"}
            </p>
          </div>


          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Role
            </p>

            <p className="mt-1 text-sm capitalize text-gray-900">
              {user.role || "—"}
            </p>
          </div>


          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Department
            </p>

            <p className="mt-1 text-sm text-gray-900">
              {user.department || "—"}
            </p>
          </div>


          {user.is_active !== undefined && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Status
              </p>

              <p className="mt-1 text-sm text-gray-900">
                {user.is_active
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}


export default ManagerDepartmentUserDetails;