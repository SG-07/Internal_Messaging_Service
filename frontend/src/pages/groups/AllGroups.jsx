// src/pages/groups/AllGroups.jsx
import { useNavigate } from "react-router";

import DashboardLayout from "../dashboard/DashboardLayout";

import { useGroupsLogic } from "./GroupLogic";


function Groups() {
  const navigate = useNavigate();


  const {
    groups,

    page,

    department,

    pagination,

    loading,

    error,

    isAdmin,

    reviewingGroupId,

    reviewError,

    reviewSuccess,

    handleReviewGroup,

    setDepartment,

    handleClearFilter,

    handlePreviousPage,

    handleNextPage,
  } = useGroupsLogic();


  /*
   * --------------------------------------------------
   * Open group details
   * --------------------------------------------------
   */

  function handleViewGroup(groupId) {
    if (!groupId) {
      if (import.meta.env.DEV) {
        console.error(
          "[Groups] Cannot open group details: missing group ID",
        );
      }

      return;
    }


    if (import.meta.env.DEV) {
      console.group(
        "[Groups] Open Group Details",
      );

      console.log(
        "Payload sent:",
        {
          groupId,
        },
      );

      console.log(
        "Navigate to:",
        `/groups/${groupId}`,
      );

      console.groupEnd();
    }


    navigate(
      `/groups/${groupId}`,
    );
  }


  /*
   * --------------------------------------------------
   * Handle group row click
   * --------------------------------------------------
   *
   * Pending admin groups are NOT clickable.
   *
   * They can only be approved/rejected.
   *
   * --------------------------------------------------
   */

  function handleGroupRowClick(group) {
    if (!group?.id) {
      return;
    }


    /*
     * Admin + pending:
     * Do not open details.
     */

    if (
      isAdmin &&
      group.status === "pending"
    ) {
      return;
    }


    handleViewGroup(group.id);
  }


  return (
    <DashboardLayout>

      <section className="rounded-xl bg-white shadow">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="border-b px-6 py-5">

          <h1 className="text-xl font-semibold text-gray-900">
            Groups
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View groups available in the organization.
          </p>

        </div>


        {/* ================================================== */}
        {/* ADMIN FILTERS */}
        {/* ================================================== */}

        {isAdmin && (
          <div className="border-b bg-gray-50 px-6 py-4">

            <div className="flex flex-wrap items-end gap-4">

              <div className="w-full max-w-xs">

                <label
                  htmlFor="group-department-filter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department
                </label>


                <select
                  id="group-department-filter"
                  value={department}
                  onChange={(event) =>
                    setDepartment(
                      event.target.value,
                    )
                  }
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                >

                  <option value="">
                    All Departments
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Administrator">
                    Administrator
                  </option>

                  <option value="IT">
                    IT
                  </option>

                  <option value="Sales">
                    Sales
                  </option>

                  <option value="Marketing">
                    Marketing
                  </option>

                </select>

              </div>


              {department && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Filter
                </button>
              )}

            </div>

          </div>
        )}


        {/* ================================================== */}
        {/* GENERAL ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="border-b px-6 py-4">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}


        {/* ================================================== */}
        {/* REVIEW ERROR */}
        {/* ================================================== */}

        {reviewError && (
          <div className="border-b px-6 py-4">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm font-medium text-red-700">
                {reviewError}
              </p>

            </div>

          </div>
        )}


        {/* ================================================== */}
        {/* REVIEW SUCCESS */}
        {/* ================================================== */}

        {reviewSuccess && (
          <div className="border-b px-6 py-4">

            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">

              <p className="text-sm font-medium text-green-700">
                {reviewSuccess}
              </p>

            </div>

          </div>
        )}


        {/* ================================================== */}
        {/* GROUPS TABLE */}
        {/* ================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead>

              <tr className="border-b bg-white text-left">

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Group
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Department
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Manager
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {/* ================================================== */}
              {/* LOADING */}
              {/* ================================================== */}

              {loading && (
                <tr>

                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center"
                  >

                    <p className="text-sm text-gray-500">
                      Loading groups...
                    </p>

                  </td>

                </tr>
              )}


              {/* ================================================== */}
              {/* EMPTY */}
              {/* ================================================== */}

              {!loading &&
                groups.length === 0 && (
                  <tr>

                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >

                      <h3 className="text-lg font-semibold text-gray-900">
                        No groups found
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">

                        {department
                          ? `No groups found in ${department}.`
                          : "There are no groups to display."}

                      </p>

                    </td>

                  </tr>
                )}


              {/* ================================================== */}
              {/* GROUPS */}
              {/* ================================================== */}

              {!loading &&
                groups.map((group) => {

                  const isPending =
                    group?.status ===
                    "pending";

                  const isPendingAdminGroup =
                    isAdmin &&
                    isPending;


                  return (
                    <tr
                      key={group.id}
                      onClick={() =>
                        handleGroupRowClick(
                          group,
                        )
                      }
                      className={
                        isPendingAdminGroup
                          ? "border-b last:border-b-0"
                          : "cursor-pointer border-b last:border-b-0 transition hover:bg-gray-50"
                      }
                    >

                      {/* ================================================== */}
                      {/* GROUP */}
                      {/* ================================================== */}

                      <td className="px-6 py-4">

                        <div>

                          <p className="font-medium text-gray-900">
                            {group.name ||
                              "—"}
                          </p>


                          {group.id && (
                            <p className="mt-1 text-xs text-gray-400">
                              {group.id}
                            </p>
                          )}

                        </div>

                      </td>


                      {/* ================================================== */}
                      {/* TYPE */}
                      {/* ================================================== */}

                      <td className="px-6 py-4">

                        {group.is_open ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            Open
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
                            Restricted
                          </span>
                        )}

                      </td>


                      {/* ================================================== */}
                      {/* DEPARTMENT */}
                      {/* ================================================== */}

                      <td className="px-6 py-4 text-sm text-gray-700">

                        {group.department || (
                          <span className="text-gray-400">
                            Cross-department
                          </span>
                        )}

                      </td>


                      {/* ================================================== */}
                      {/* MANAGER */}
                      {/* ================================================== */}

                      <td className="px-6 py-4">

                        {group.manager ? (
                          <div>

                            <p className="text-sm font-medium text-gray-900">
                              {group.manager.full_name ||
                                group.manager.username ||
                                "—"}
                            </p>


                            {group.manager.email && (
                              <p className="mt-1 text-xs text-gray-500">
                                {group.manager.email}
                              </p>
                            )}

                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No manager
                          </span>
                        )}

                      </td>


                      {/* ================================================== */}
                      {/* STATUS */}
                      {/* ================================================== */}

                      <td className="px-6 py-4">

                        <StatusBadge
                          status={
                            group.status
                          }
                        />

                      </td>


                      {/* ================================================== */}
                      {/* CREATED */}
                      {/* ================================================== */}

                      <td className="px-6 py-4 text-sm text-gray-700">

                        {formatDate(
                          group.created_at,
                        )}

                      </td>


                      {/* ================================================== */}
                      {/* ACTIONS */}
                      {/* ================================================== */}

                      <td
                        className="px-6 py-4 text-right"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >

                        {isPendingAdminGroup ? (

                          /*
                           * ------------------------------------------------
                           * ADMIN + PENDING
                           * ------------------------------------------------
                           */

                          <div className="flex justify-end gap-2">

                            {/* APPROVE */}

                            <button
                              type="button"
                              disabled={
                                reviewingGroupId ===
                                group.id
                              }
                              onClick={() =>
                                handleReviewGroup(
                                  group.id,
                                  "approved",
                                )
                              }
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {reviewingGroupId ===
                              group.id
                                ? "Processing..."
                                : "Approve"}

                            </button>


                            {/* REJECT */}

                            <button
                              type="button"
                              disabled={
                                reviewingGroupId ===
                                group.id
                              }
                              onClick={() =>
                                handleReviewGroup(
                                  group.id,
                                  "rejected",
                                )
                              }
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {reviewingGroupId ===
                              group.id
                                ? "Processing..."
                                : "Reject"}

                            </button>

                          </div>

                        ) : (

                          /*
                           * ------------------------------------------------
                           * NORMAL GROUP
                           * ------------------------------------------------
                           */

                          <button
                            type="button"
                            onClick={() =>
                              handleViewGroup(
                                group.id,
                              )
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            View Details
                          </button>

                        )}

                      </td>

                    </tr>
                  );
                })}

            </tbody>

          </table>

        </div>


        {/* ================================================== */}
        {/* PAGINATION */}
        {/* ================================================== */}

        {!loading &&
          groups.length > 0 && (

            <div className="flex items-center justify-between border-t px-6 py-4">

              <div>

                <p className="text-sm text-gray-500">
                  Page {page}
                </p>


                {pagination.total > 0 && (
                  <p className="mt-1 text-xs text-gray-400">

                    {pagination.total}{" "}

                    {pagination.total === 1
                      ? "group"
                      : "groups"}{" "}

                    total

                  </p>
                )}

              </div>


              <div className="flex items-center gap-2">

                {/* Previous */}

                <button
                  type="button"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    page <= 1 ||
                    loading
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>


                {/* Next */}

                <button
                  type="button"
                  onClick={
                    handleNextPage
                  }
                  disabled={
                    !pagination.has_more ||
                    loading
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </section>

    </DashboardLayout>
  );
}


/*
 * ============================================================
 * STATUS BADGE
 * ============================================================
 */

function StatusBadge({ status }) {

  if (status === "approved") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Approved
      </span>
    );
  }


  if (status === "pending") {
    return (
      <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
        Pending
      </span>
    );
  }


  if (status === "rejected") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Rejected
      </span>
    );
  }


  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
      {status || "—"}
    </span>
  );
}


/*
 * ============================================================
 * DATE
 * ============================================================
 */

function formatDate(value) {

  if (!value) {
    return "—";
  }


  const date = new Date(value);


  if (Number.isNaN(date.getTime())) {
    return "—";
  }


  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}


export default Groups;