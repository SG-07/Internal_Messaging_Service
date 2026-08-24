// frontend/src/pages/groups/GroupDetails.jsx

import DashboardLayout
  from '../dashboard/DashboardLayout';

import {
  useGroupDetailsLogic,
} from './GroupDetailsLogic';


function GroupDetails() {
  const {
    group,

    groupId,

    loading,

    error,

    handleBack,

    reload,
  } = useGroupDetailsLogic();


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

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

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
   * No group
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


  const members =
    Array.isArray(group.members)
      ? group.members
      : [];


  const pendingRequests =
    Array.isArray(
      group.pending_join_requests
    )
      ? group.pending_join_requests
      : [];


  /*
   * ----------------------------------------
   * Group details
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


        {/* Header */}

        <div className="rounded-xl bg-white shadow">

          <div className="flex flex-col gap-5 border-b px-6 py-6 sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Group Details
              </p>

              <h1 className="mt-2 break-words text-2xl font-bold text-gray-900">
                {group.name || 'Unnamed Group'}
              </h1>

              <p className="mt-2 break-all text-sm text-gray-500">
                ID: {group.id || groupId}
              </p>

            </div>


            <div className="flex flex-wrap gap-2">

              <AccessBadge
                isOpen={group.is_open}
              />

              <StatusBadge
                status={group.status}
              />

            </div>

          </div>


          {/* Statistics */}

          <div className="grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <StatItem
              label="Total Members"
              value={
                group.total_members ??
                members.length
              }
            />

            <StatItem
              label="Pending Requests"
              value={
                pendingRequests.length
              }
            />

            <StatItem
              label="Department"
              value={
                group.department ||
                'Cross-department'
              }
            />

          </div>


          {/* Main content */}

          <div className="grid gap-6 p-6 lg:grid-cols-3">


            {/* Left / Main Details */}

            <div className="space-y-6 lg:col-span-2">


              {/* Group Information */}

              <section className="rounded-xl border border-gray-200">

                <div className="border-b px-5 py-4">

                  <h2 className="font-semibold text-gray-900">
                    Group Information
                  </h2>

                </div>


                <div className="divide-y">

                  <DetailRow
                    label="Group Name"
                    value={group.name}
                  />

                  <DetailRow
                    label="Department"
                    value={
                      group.department ||
                      'Cross-department'
                    }
                  />

                  <DetailRow
                    label="Access Type"
                    value={
                      group.is_open
                        ? 'Open Group'
                        : 'Restricted Group'
                    }
                  />

                  <DetailRow
                    label="Status"
                    value={
                      <StatusBadge
                        status={group.status}
                      />
                    }
                  />

                  <DetailRow
                    label="Created"
                    value={
                      formatDateTime(
                        group.created_at
                      )
                    }
                  />

                  <DetailRow
                    label="Last Updated"
                    value={
                      formatDateTime(
                        group.updated_at
                      )
                    }
                  />

                </div>

              </section>


              {/* Members */}

              <section className="overflow-hidden rounded-xl border border-gray-200">

                <div className="flex items-center justify-between border-b px-5 py-4">

                  <div>

                    <h2 className="font-semibold text-gray-900">
                      Members
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {group.total_members ?? members.length}{' '}
                      {(
                        group.total_members ??
                        members.length
                      ) === 1
                        ? 'member'
                        : 'members'}
                    </p>

                  </div>

                </div>


                {members.length === 0 ? (

                  <div className="px-5 py-10 text-center">

                    <p className="text-sm text-gray-500">
                      No members found.
                    </p>

                  </div>

                ) : (

                  <div className="divide-y">

                    {members.map(
                      (member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                        />
                      )
                    )}

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
                      {pendingRequests.length}{' '}
                      pending{' '}
                      {pendingRequests.length === 1
                        ? 'request'
                        : 'requests'}
                    </p>

                  </div>


                  <div className="divide-y">

                    {pendingRequests.map(
                      (request, index) => (

                        <div
                          key={
                            request.id ||
                            request.user_id ||
                            index
                          }
                          className="px-5 py-4"
                        >

                          <p className="font-medium text-gray-900">
                            {request.full_name ||
                              request.username ||
                              'Unknown User'}
                          </p>

                          {request.email && (
                            <p className="mt-1 text-sm text-gray-500">
                              {request.email}
                            </p>
                          )}

                        </div>

                      )
                    )}

                  </div>

                </section>

              )}

            </div>


            {/* Right sidebar */}

            <div className="space-y-6">


              {/* Creator */}

              <section className="rounded-xl border border-gray-200">

                <div className="border-b px-5 py-4">

                  <h2 className="font-semibold text-gray-900">
                    Created By
                  </h2>

                </div>


                <div className="p-5">

                  {group.creator ? (

                    <UserInfo
                      user={group.creator}
                    />

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

                  <h2 className="font-semibold text-gray-900">
                    Group Manager
                  </h2>

                </div>


                <div className="p-5">

                  {group.manager ? (

                    <UserInfo
                      user={group.manager}
                    />

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
                    value={
                      formatMembershipStatus(
                        group.user_membership_status
                      )
                    }
                  />

                  <DetailRow
                    label="Can Join"
                    value={
                      <BooleanBadge
                        value={group.can_join}
                      />
                    }
                  />

                  <DetailRow
                    label="Can Leave"
                    value={
                      <BooleanBadge
                        value={group.can_leave}
                      />
                    }
                  />

                  <DetailRow
                    label="Can Manage"
                    value={
                      <BooleanBadge
                        value={group.can_manage}
                      />
                    }
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
                      You already have a pending request
                      to join this group.
                    </p>

                  </div>

                </section>

              )}

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}


/*
 * --------------------------------------------------
 * Statistics
 * --------------------------------------------------
 */

function StatItem({
  label,
  value,
}) {
  return (
    <div className="px-6 py-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value ?? '—'}
      </p>

    </div>
  );
}


/*
 * --------------------------------------------------
 * Detail Row
 * --------------------------------------------------
 */

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">

      <span className="text-sm text-gray-500">
        {label}
      </span>

      <div className="text-sm font-medium text-gray-900 sm:text-right">

        {value ?? '—'}

      </div>

    </div>
  );
}


/*
 * --------------------------------------------------
 * User Information
 * --------------------------------------------------
 */

function UserInfo({
  user,
}) {
  const initials =
    getInitials(
      user.full_name ||
      user.username
    );

  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">

        {initials}

      </div>


      <div className="min-w-0">

        <p className="truncate font-medium text-gray-900">

          {user.full_name ||
            user.username ||
            'Unknown User'}

        </p>


        {user.username && (
          <p className="mt-1 text-sm text-gray-500">

            @{user.username}

          </p>
        )}


        {user.email && (
          <p className="mt-1 break-all text-sm text-gray-500">

            {user.email}

          </p>
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

function MemberRow({
  member,
}) {
  const initials =
    getInitials(
      member.full_name ||
      member.username
    );

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">

          {initials}

        </div>


        <div className="min-w-0">

          <p className="truncate font-medium text-gray-900">

            {member.full_name ||
              member.username ||
              'Unknown User'}

          </p>


          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">

            {member.username && (
              <span>
                @{member.username}
              </span>
            )}

            {member.department && (
              <span>
                {member.department}
              </span>
            )}

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

          {member.role || 'member'}

        </span>


        {member.joined_at && (
          <p className="mt-2 text-xs text-gray-400">

            Joined{' '}
            {formatDateTime(
              member.joined_at
            )}

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

function AccessBadge({
  isOpen,
}) {
  return (
    <span
      className={
        isOpen
          ? 'rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700'
          : 'rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700'
      }
    >
      {isOpen
        ? 'Open Group'
        : 'Restricted Group'}
    </span>
  );
}


/*
 * --------------------------------------------------
 * Status Badge
 * --------------------------------------------------
 */

function StatusBadge({
  status,
}) {
  if (status === 'approved') {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
        Approved
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700">
        Pending
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium capitalize text-gray-700">

      {status || 'Unknown'}

    </span>
  );
}


/*
 * --------------------------------------------------
 * Boolean Badge
 * --------------------------------------------------
 */

function BooleanBadge({
  value,
}) {
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
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleString();
}


function formatMembershipStatus(status) {
  if (!status) {
    return 'Unknown';
  }

  return status
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}


function getInitials(value) {
  if (!value) {
    return '?';
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      word =>
        word.charAt(0).toUpperCase()
    )
    .join('');
}


export default GroupDetails;