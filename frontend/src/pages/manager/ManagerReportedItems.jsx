import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  managerGetReportedItems,
} from "../../api/manager";

function ManagerReportedItems() {
  const navigate = useNavigate();

  const [reportedItems, setReportedItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD REPORTED ITEMS
  // ============================================================

  useEffect(() => {
    async function loadReportedItems() {
      try {
        setLoading(true);
        setError("");

        console.group(
          "[ManagerReportedItems] Loading reported items"
        );

        console.log(
          "[ManagerReportedItems] Calling API:",
          "managerGetReportedItems()"
        );

        const response =
          await managerGetReportedItems();

        // ------------------------------------------------------
        // RAW API RESPONSE
        // ------------------------------------------------------

        console.log(
          "[ManagerReportedItems] API response:",
          response
        );

        console.log(
          "[ManagerReportedItems] Response type:",
          typeof response
        );

        // ------------------------------------------------------
        // RESPONSE STRUCTURE
        // ------------------------------------------------------

        console.log(
          "[ManagerReportedItems] response.reports:",
          response?.reports
        );

        console.log(
          "[ManagerReportedItems] response.reported_items:",
          response?.reported_items
        );

        console.log(
          "[ManagerReportedItems] response.data:",
          response?.data
        );

        // ------------------------------------------------------
        // EXTRACT ITEMS
        // ------------------------------------------------------

        const items =
          response?.reports ||
          response?.reported_items ||
          response?.data ||
          response ||
          [];

        console.log(
          "[ManagerReportedItems] Extracted items:",
          items
        );

        console.log(
          "[ManagerReportedItems] Extracted items is array:",
          Array.isArray(items)
        );

        console.log(
          "[ManagerReportedItems] Extracted items count:",
          Array.isArray(items)
            ? items.length
            : "Not an array"
        );

        // ------------------------------------------------------
        // SET STATE
        // ------------------------------------------------------

        const finalItems =
          Array.isArray(items)
            ? items
            : [];

        console.log(
          "[ManagerReportedItems] Final reportedItems:",
          finalItems
        );

        setReportedItems(finalItems);

        console.groupEnd();
      } catch (err) {
        console.error(
          "[ManagerReportedItems] Failed to load reported items:",
          err
        );

        console.error(
          "[ManagerReportedItems] Error message:",
          err?.message
        );

        console.error(
          "[ManagerReportedItems] Full error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load reported items."
        );
      } finally {
        setLoading(false);
      }
    }

    console.log(
      "[ManagerReportedItems] Component mounted."
    );

    loadReportedItems();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  // ============================================================
  // FORMAT ENTITY TYPE
  // ============================================================

  function formatEntityType(value) {
    if (!value) {
      return "Unknown";
    }

    return value
      .replace(/_/g, " ")
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  // ============================================================
  // FORMAT REASON
  // ============================================================

  function formatReason(value) {
    if (!value) {
      return "Other";
    }

    return value
      .replace(/_/g, " ")
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  // ============================================================
  // REVIEW REPORT
  // ============================================================

  function handleReview(report) {
    const reportId =
      report?.id ||
      report?.report_id;

    console.group(
      "[ManagerReportedItems] Review report"
    );

    console.log(
      "[ManagerReportedItems] Full report:",
      report
    );

    console.log(
      "[ManagerReportedItems] report.id:",
      report?.id
    );

    console.log(
      "[ManagerReportedItems] report.report_id:",
      report?.report_id
    );

    console.log(
      "[ManagerReportedItems] Resolved report ID:",
      reportId
    );

    if (!reportId) {
      console.error(
        "[ManagerReportedItems] Report ID is missing. Cannot navigate."
      );

      console.groupEnd();
      return;
    }

    const destination =
      `/manager/reported-items/${reportId}`;

    console.log(
      "[ManagerReportedItems] Navigating to:",
      destination
    );

    console.groupEnd();

    navigate(destination);
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">

          <div className="rounded-xl bg-white p-6 shadow">

            <p className="text-sm text-gray-500">
              Loading reported items...
            </p>

          </div>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-xl bg-white p-6 shadow">

            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load reported items
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Go Back
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-6xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-2xl font-semibold text-gray-900">
            Reported Items
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review pending reports from your department.
          </p>

        </div>

        {/* ======================================================
            DEBUG SUMMARY
        ====================================================== */}

        {import.meta.env.DEV && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Development Debug
            </p>

            <div className="mt-2 space-y-1 text-sm text-blue-900">

              <p>
                Reports loaded:{" "}
                <strong>
                  {reportedItems.length}
                </strong>
              </p>

              <p>
                Loading:{" "}
                <strong>
                  {String(loading)}
                </strong>
              </p>

              <p>
                Error:{" "}
                <strong>
                  {error || "None"}
                </strong>
              </p>

            </div>

          </div>
        )}

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {reportedItems.length === 0 ? (

          <div className="rounded-xl bg-white p-10 text-center shadow">

            <h2 className="text-lg font-semibold text-gray-900">
              No pending reports
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              There are currently no reported items
              requiring review.
            </p>

          </div>

        ) : (

          /* ====================================================
              REPORTED ITEMS TABLE
          ==================================================== */

          <div className="overflow-hidden rounded-xl bg-white shadow">

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">

                  <tr>

                    <th className="px-6 py-4">
                      Entity
                    </th>

                    <th className="px-6 py-4">
                      Reason
                    </th>

                    <th className="px-6 py-4">
                      Reported By
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {reportedItems.map(
                    (report) => {

                      const reportId =
                        report?.id ||
                        report?.report_id;

                      return (
                        <tr
                          key={reportId}
                          className="transition hover:bg-gray-50"
                        >

                          {/* Entity */}

                          <td className="px-6 py-4">

                            <div className="font-medium text-gray-900">
                              {formatEntityType(
                                report.entity_type
                              )}
                            </div>

                            <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              ID:{" "}
                              {report.entity_id ||
                                "—"}
                            </div>

                          </td>

                          {/* Reason */}

                          <td className="px-6 py-4">

                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">

                              {formatReason(
                                report.reason
                              )}

                            </span>

                          </td>

                          {/* Reporter */}

                          <td className="px-6 py-4">

                            <div className="font-medium text-gray-900">

                              {
                                report.reporter_name ||
                                report.reported_by_name ||
                                report.reporter?.full_name ||
                                report.reporter?.username ||
                                "Unknown"
                              }

                            </div>

                            <div className="mt-1 text-xs text-gray-500">

                              {
                                report.reporter_email ||
                                report.reporter?.email ||
                                ""
                              }

                            </div>

                          </td>

                          {/* Date */}

                          <td className="px-6 py-4 text-gray-600">

                            {formatDate(
                              report.created_at
                            )}

                          </td>

                          {/* Action */}

                          <td className="px-6 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                handleReview(
                                  report
                                )
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                              Review
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>
    </div>
  );
}

export default ManagerReportedItems;