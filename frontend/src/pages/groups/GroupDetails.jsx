// frontend/src/pages/groups/GroupDetails.jsx

import { useState } from "react";

import DashboardLayout from "../dashboard/DashboardLayout";
import AddMemberModal from "../../component/AddMemberModal";

import { useGroupDetailsLogic } from "./GroupDetailsLogic";

import { getPotentialMembers, addGroupMember } from "../../api/groups";

function GroupDetails() {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const {
    group,
    groupId,
    loading,
    error,

    isAdmin,
    isCreator,
    canDelete,

    joining,
    joinError,
    joinSuccess,
    handleJoin,
    handleLeave,

    isEditing,
    name,
    setName,
    description,
    setDescription,
    managerId,
    setManagerId,

    saving,
    saveError,
    saveSuccess,

    showDeleteConfirm,
    deleting,
    deleteError,

    handleStartEdit,
    handleCancelEdit,
    handleSave,

    handleOpenDelete,
    handleCloseDelete,
    handleDelete,

    handleBack,
    reload,
  } = useGroupDetailsLogic();

  const canManage = group?.can_manage === true;

  /*
   * ----------------------------------------
   * Loading
   * ----------------------------------------
   */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Groups
          </button>

          <div className="rounded-xl bg-white p-12 text-center shadow">
            <div className="mx-auto flex h-10 w-10 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Loading group details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ----------------------------------------
   * Error
   * ----------------------------------------
   */

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Groups
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load group
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reload}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to Groups
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ----------------------------------------
   * No Group
   * ----------------------------------------
   */

  if (!group) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            ← Back to Groups
          </button>

          <div className="rounded-xl bg-white p-12 text-center shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Group not found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The requested group could not be found.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const members = Array.isArray(group.members) ? group.members : [];

  const pendingRequests = Array.isArray(group.pending_join_requests)
    ? group.pending_join_requests
    : [];

  /*
   * ----------------------------------------
   * Group Details
   * ----------------------------------------
   */

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}

        <button
          type="button"
          onClick={handleBack}
          className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          ← Back to Groups
        </button>

        {/* Main Card */}

        <div className="rounded-xl bg-white shadow">
          {/* Header */}

          <div className="flex flex-col gap-5 border-b px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Group Details
              </p>

              <h1 className="mt-2 break-words text-2xl font-bold text-gray-900">
                {group.name || "Unnamed Group"}
              </h1>

              <p className="mt-2 break-all text-sm text-gray-500">
                ID: {group.id || groupId}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AccessBadge isOpen={group.is_open} />

              <StatusBadge status={group.status} />

              {/* Join Group */}

              {group.can_join === true && (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining ? "Joining..." : "Join Group"}
                </button>
              )}

              {/* Leave Group */}

              {group.can_leave === true && (
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={joining}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining ? "Leaving..." : "Leave Group"}
                </button>
              )}

              {/* Edit Group */}

              {canManage && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Group
                </button>
              )}
            </div>
          </div>

          {/* Save Success */}

          {saveSuccess && (
            <div className="border-b border-green-200 bg-green-50 px-6 py-4">
              <p className="text-sm font-medium text-green-700">
                {saveSuccess}
              </p>
            </div>
          )}

          {/* Join Success */}

          {joinSuccess && (
            <div className="border-b border-green-200 bg-green-50 px-6 py-4">
              <p className="text-sm font-medium text-green-700">
                {joinSuccess}
              </p>
            </div>
          )}

          {/* Join Error */}

          {joinError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4">
              <p className="text-sm font-medium text-red-700">{joinError}</p>
            </div>
          )}

          {/* Statistics */}

          <div className="grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <StatItem
              label="Total Members"
              value={group.total_members ?? members.length}
            />

            <StatItem label="Pending Requests" value={pendingRequests.length} />

            <StatItem
              label="Department"
              value={group.department || "Cross-department"}
            />
          </div>

          {/* Main Content */}

          <div className="grid gap-6 p-6 lg:grid-cols-3">
            {/* Edit Group */}

            {isEditing && (
              <section className="rounded-xl border border-blue-200 bg-blue-50 lg:col-span-3">
                <div className="border-b border-blue-200 px-5 py-4">
                  <h2 className="font-semibold text-gray-900">Edit Group</h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Update the group information.
                  </p>
                </div>

                <div className="space-y-5 p-5">
                  {saveError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                  )}

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
                      onChange={(event) => setName(event.target.value)}
                      disabled={saving}
                      maxLength={255}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    />
                  </div>

                  {/* Description */}

                  <div>
                    <label
                      htmlFor="group-description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="group-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      disabled={saving}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                      placeholder="Enter a group description..."
                    />
                  </div>

                  {/* Manager */}

                  {isAdmin && (
                    <div>
                      <label
                        htmlFor="group-manager-id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Manager ID
                      </label>

                      <input
                        id="group-manager-id"
                        type="text"
                        value={managerId}
                        onChange={(event) => setManagerId(event.target.value)}
                        disabled={saving}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                        placeholder="Leave empty to remove manager"
                      />
                    </div>
                  )}

                  {/* Actions */}

                  <div className="flex flex-wrap gap-3 border-t pt-5">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Left Content */}

            <div className="space-y-6 lg:col-span-2">
              {/* Group Information */}

              <section className="rounded-xl border border-gray-200">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold text-gray-900">
                    Group Information
                  </h2>
                </div>

                <div className="divide-y">
                  <DetailRow label="Group Name" value={group.name} />

                  <DetailRow
                    label="Department"
                    value={group.department || "Cross-department"}
                  />

                  <DetailRow
                    label="Description"
                    value={group.description || "No description provided."}
                  />

                  <DetailRow
                    label="Access Type"
                    value={group.is_open ? "Open Group" : "Restricted Group"}
                  />

                  <DetailRow
                    label="Status"
                    value={<StatusBadge status={group.status} />}
                  />

                  <DetailRow
                    label="Created"
                    value={formatDateTime(group.created_at)}
                  />
                </div>
              </section>

              {/* Members */}

              <section className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Members</h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {group.total_members ?? members.length}{" "}
                      {(group.total_members ?? members.length) === 1
                        ? "member"
                        : "members"}
                    </p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(true)}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      + Add Member
                    </button>
                  )}
                </div>

                {members.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500">No members found.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {members.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </div>
                )}
              </section>

              {/* Pending Join Requests */}

              {pendingRequests.length > 0 && (
                <section className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="border-b px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                      Pending Join Requests
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {pendingRequests.length} pending{" "}
                      {pendingRequests.length === 1 ? "request" : "requests"}
                    </p>
                  </div>

                  <div className="divide-y">
                    {pendingRequests.map((request, index) => (
                      <div
                        key={request.id || request.user_id || index}
                        className="px-5 py-4"
                      >
                        <p className="font-medium text-gray-900">
                          {request.full_name ||
                            request.username ||
                            "Unknown User"}
                        </p>

                        {request.email && (
                          <p className="mt-1 text-sm text-gray-500">
                            {request.email}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Sidebar */}

            <div className="space-y-6">
              {/* Creator */}

              <section className="rounded-xl border border-gray-200">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold text-gray-900">Created By</h2>
                </div>

                <div className="p-5">
                  {group.creator ? (
                    <UserInfo user={group.creator} />
                  ) : (
                    <p className="text-sm text-gray-500">
                      Creator information is unavailable.
                    </p>
                  )}
                </div>
              </section>

              {/* Manager */}

              <section className="rounded-xl border border-gray-200">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold text-gray-900">Group Manager</h2>
                </div>

                <div className="p-5">
                  {group.manager ? (
                    <UserInfo user={group.manager} />
                  ) : (
                    <p className="text-sm text-gray-500">
                      No manager assigned.
                    </p>
                  )}
                </div>
              </section>

              {/* Your Membership */}

              <section className="rounded-xl border border-gray-200">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold text-gray-900">
                    Your Membership
                  </h2>
                </div>

                <div className="divide-y">
                  <DetailRow
                    label="Membership Status"
                    value={formatMembershipStatus(group.user_membership_status)}
                  />

                  <DetailRow
                    label="Can Join"
                    value={<BooleanBadge value={group.can_join} />}
                  />

                  <DetailRow
                    label="Can Leave"
                    value={<BooleanBadge value={group.can_leave} />}
                  />

                  <DetailRow
                    label="Can Manage"
                    value={<BooleanBadge value={group.can_manage} />}
                  />
                </div>
              </section>

              {/* Pending Request */}

              {group.user_pending_request && (
                <section className="rounded-xl border border-yellow-200 bg-yellow-50">
                  <div className="p-5">
                    <h2 className="font-semibold text-yellow-900">
                      Join Request Pending
                    </h2>

                    <p className="mt-2 text-sm text-yellow-800">
                      You already have a pending request to join this group.
                    </p>
                  </div>
                </section>
              )}

              {/* Danger Zone */}

              {canDelete && (
                <section className="overflow-hidden rounded-xl border border-red-200 bg-white">
                  <div className="border-b border-red-200 bg-red-50 px-5 py-4">
                    <h2 className="font-semibold text-red-800">Danger Zone</h2>

                    <p className="mt-1 text-sm text-red-700">
                      Permanently delete this group and its associated data.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 px-5 py-5">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Delete this group
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        This action cannot be undone.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenDelete}
                      disabled={deleting}
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Group
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Add Member Modal */}

        <AddMemberModal
          open={showAddMemberModal}
          groupId={groupId}
          getPotentialMembers={getPotentialMembers}
          addMember={addGroupMember}
          onClose={() => setShowAddMemberModal(false)}
          onAdded={async () => {
            await reload();
          }}
        />

        {/* Delete Confirmation Modal */}

        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            role="presentation"
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-group-title"
            >
              <div className="border-b border-gray-200 px-6 py-5">
                <h2
                  id="delete-group-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Delete Group?
                </h2>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete{" "}
                  <strong className="font-semibold text-gray-900">
                    {group.name}
                  </strong>
                  ?
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  This action cannot be undone. All associated group data will
                  be permanently deleted.
                </p>

                {deleteError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseDelete}
                  disabled={deleting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/*
 * --------------------------------------------------
 * Statistics
 * --------------------------------------------------
 */

function StatItem({ label, value }) {
  return (
    <div className="px-6 py-5">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-xl font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

/*
 * --------------------------------------------------
 * Detail Row
 * --------------------------------------------------
 */

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-sm text-gray-500">{label}</span>

      <div className="text-sm font-medium text-gray-900 sm:text-right">
        {value ?? "—"}
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * User Information
 * --------------------------------------------------
 */

function UserInfo({ user }) {
  const initials = getInitials(user.full_name || user.username);

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
        {initials}
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">
          {user.full_name || user.username || "Unknown User"}
        </p>

        {user.username && (
          <p className="mt-1 text-sm text-gray-500">@{user.username}</p>
        )}

        {user.email && (
          <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>
        )}
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * Member Row
 * --------------------------------------------------
 */

function MemberRow({ member }) {
  const initials = getInitials(member.full_name || member.username);

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {member.full_name || member.username || "Unknown User"}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
            {member.username && <span>@{member.username}</span>}

            {member.department && <span>{member.department}</span>}
          </div>

          {member.email && (
            <p className="mt-1 break-all text-xs text-gray-400">
              {member.email}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
          {member.role || "member"}
        </span>

        {member.joined_at && (
          <p className="mt-2 text-xs text-gray-400">
            Joined {formatDateTime(member.joined_at)}
          </p>
        )}
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * Access Badge
 * --------------------------------------------------
 */

function AccessBadge({ isOpen }) {
  return (
    <span
      className={
        isOpen
          ? "rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
          : "rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700"
      }
    >
      {isOpen ? "Open Group" : "Restricted Group"}
    </span>
  );
}

/*
 * --------------------------------------------------
 * Status Badge
 * --------------------------------------------------
 */

function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
        Approved
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700">
        Pending
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium capitalize text-gray-700">
      {status || "Unknown"}
    </span>
  );
}

/*
 * --------------------------------------------------
 * Boolean Badge
 * --------------------------------------------------
 */

function BooleanBadge({ value }) {
  if (value === true) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Yes
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      No
    </span>
  );
}

/*
 * --------------------------------------------------
 * Helpers
 * --------------------------------------------------
 */

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatMembershipStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getInitials(value) {
  if (!value) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default GroupDetails;
