// frontend/src/pages/admin/AdminUpdateUserPassword.jsx

import { useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../dashboard/DashboardLayout";

import { adminUpdateUserPassword } from "../../api/admin";

function AdminUpdateUserPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ============================================================
  // VALIDATION
  // ============================================================

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const isFormValid =
    email.trim() &&
    newPassword.trim() &&
    confirmPassword.trim() &&
    passwordsMatch;

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter the user's email.");

      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      setLoading(true);

      // Payload expected by backend
      const payload = {
        email: email.trim(),
        new_password: newPassword,
      };

      console.group("[AdminUpdateUserPassword] UPDATE PASSWORD");

      console.log("[AdminUpdateUserPassword] Email:", payload.email);

      // Never log actual passwords
      console.log("[AdminUpdateUserPassword] Payload:", {
        email: payload.email,
        new_password: "********",
      });

      const response = await adminUpdateUserPassword(payload);

      console.log("[AdminUpdateUserPassword] Response:", response);

      console.groupEnd();

      setSuccess("User password updated successfully.");

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.group("[AdminUpdateUserPassword] UPDATE PASSWORD ERROR");

      console.error("[AdminUpdateUserPassword] Error:", err);

      console.error("[AdminUpdateUserPassword] Message:", err?.message);

      console.groupEnd();

      setError(err?.message || "Unable to update user password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-xl">
          {/* ======================================================
            HEADER
        ====================================================== */}

          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate("/admin/users")}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to Users
            </button>

            <h1 className="text-2xl font-semibold text-gray-900">
              Update User Password
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter the user's email and set a new password.
            </p>
          </div>

          {/* ======================================================
            FORM
        ====================================================== */}

          <div className="rounded-xl bg-white shadow">
            <form onSubmit={handleSubmit} className="p-6">
              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  User Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="user@example.com"
                  autoComplete="email"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* New Password */}

              <div className="mt-5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Confirm Password */}

              <div className="mt-5">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {/* Password mismatch */}

                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Passwords do not match.
                  </p>
                )}

                {/* Password match */}

                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-2 text-sm text-green-600">
                    Passwords match.
                  </p>
                )}
              </div>

              {/* Error */}

              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Success */}

              {success && (
                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* Actions */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/users")}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminUpdateUserPassword;
