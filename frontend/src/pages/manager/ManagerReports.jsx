// frontend/src/pages/manager/ManagerReports.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { managerGetReports } from "../../api/manager";

function ManagerReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    has_more: false,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD REPORTS
  // ============================================================

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const endpoint = "/api/manager/reports";

    console.log(
      "[ManagerReports] → Loading reports",
      {
        endpoint,
        method: "GET",
      }
    );

    try {
      setLoading(true);
      setError("");

      const response =
        await managerGetReports();

      console.log(
        "[ManagerReports] ← Reports response",
        {
          endpoint,
          response,
        }
      );

      // ========================================================
      // BACKEND RESPONSE
      //
      // {
      //   success: true,
      //   message: "...",
      //   data: [],
      //   pagination: {}
      // }
      // ========================================================

      const data =
        Array.isArray(response?.data)
          ? response.data
          : [];

      const responsePagination =
        response?.pagination || {};

      console.log(
        "[ManagerReports] Parsed reports data",
        {
          data,
          isArray: Array.isArray(data),
          count: data.length,
          pagination: responsePagination,
        }
      );

      setReports(data);

      setPagination({
        page:
          responsePagination.page ?? 1,

        limit:
          responsePagination.limit ?? 20,

        total:
          responsePagination.total ??
          data.length,

        has_more:
          responsePagination.has_more ??
          false,
      });

    } catch (err) {
      console.error(
        "[ManagerReports] ← Failed to load reports",
        {
          endpoint,
          error: err,
          message: err?.message,
        }
      );

      setError(
        err?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);

      console.log(
        "[ManagerReports] Loading finished"
      );
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function formatValue(value) {
    if (!value) {
      return "Unknown";
    }

    return String(value)
      .toLowerCase()
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
  // STATUS CLASS
  // ============================================================

  function getStatusClass(status) {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "pending":
        return "bg-yellow-50 text-yellow-700";

      case "reviewed":
        return "bg-blue-50 text-blue-700";

      case "resolved":
        return "bg-green-50 text-green-700";

      case "dismissed":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "—";
    }

    return date.toLocaleString();
  }

  // ============================================================
  // GET REPORTER NAME
  // ============================================================

  function getReporterName(report) {
    return (
      report?.reported_by?.full_name ||
      report?.reported_by?.username ||
      "Unknown user"
    );
  }

  // ============================================================
  // GET REPORTER USERNAME
  // ============================================================

  function getReporterUsername(report) {
    const username =
      report?.reported_by?.username;

    if (!username) {
      return "";
    }

    return `@${username}`;
  }

  // ============================================================
  // PENDING COUNT
  // ============================================================

  const pendingCount =
    reports.filter(
      (report) =>
        String(report?.status || "")
          .toLowerCase() === "pending"
    ).length;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-xl bg-white p-8 text-center shadow-sm">

            <p className="text-sm text-gray-500">
              Loading reports...
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
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 px-6 py-8">

        <div className="mx-auto max-w-7xl">

          <div className="rounded-xl bg-white p-8 shadow-sm">

            <div className="flex items-start justify-between gap-4">

              <div>

                <h1 className="text-2xl font-semibold text-gray-900">
                  Reports
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Review reports from your department.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard")
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back
              </button>

            </div>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-medium text-red-700">
                Unable to load reports
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={loadReports}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try Again
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
    <div className="min-h-[calc(100vh-80px)] bg-gray-100 px-6 py-8">

      <div className="mx-auto max-w-7xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex items-start justify-between gap-4">

          <div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Reports
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review and manage reports from your department.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </button>

        </div>

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          {/* Total Reports */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Reports
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {pagination.total}
            </p>

          </div>

          {/* Pending Reports */}

          <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Pending Review
            </p>

            <p className="mt-2 text-2xl font-semibold text-yellow-700">
              {pendingCount}
            </p>

          </div>

        </div>

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {reports.length === 0 ? (

          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">

              <span className="text-xl text-gray-500">
                ✓
              </span>

            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No reports found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              There are currently no reports available
              for review.
            </p>

          </div>

        ) : (

          /* ====================================================
              REPORT LIST
          ==================================================== */

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <div className="hidden border-b border-gray-200 bg-gray-50 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entity
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reason
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reported By
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Submitted
              </div>

              <div className="col-span-2" />

            </div>

            {/* ==================================================
                REPORT ROWS
            ================================================== */}

            <div className="divide-y divide-gray-200">

              {reports.map((report) => {

                const reportId =
                  report?.id;

                const reporterName =
                  getReporterName(report);

                const reporterUsername =
                  getReporterUsername(report);

                return (
                  <div
                    key={reportId}
                    className="px-6 py-5 transition hover:bg-gray-50"
                  >

                    {/* =================================================
                        DESKTOP
                    ================================================= */}

                    <div className="hidden items-center gap-4 md:grid md:grid-cols-12">

                      {/* Entity */}

                      <div className="col-span-2">

                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {formatValue(
                            report.entity_type
                          )}
                        </span>

                        <p className="mt-2 max-w-full truncate text-xs text-gray-400">
                          {report.entity_id}
                        </p>

                      </div>

                      {/* Reason */}

                      <div className="col-span-2">

                        <p className="text-sm font-medium text-gray-900">
                          {formatValue(
                            report.reason
                          )}
                        </p>

                      </div>

                      {/* Reporter */}

                      <div className="col-span-2">

                        <p className="truncate text-sm font-medium text-gray-700">
                          {reporterName}
                        </p>

                        {reporterUsername && (
                          <p className="mt-1 text-xs text-gray-400">
                            {reporterUsername}
                          </p>
                        )}

                      </div>

                      {/* Status */}

                      <div className="col-span-2">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {formatValue(
                            report.status
                          )}
                        </span>

                      </div>

                      {/* Submitted */}

                      <div className="col-span-2">

                        <p className="text-xs text-gray-500">
                          {formatDate(
                            report.created_at
                          )}
                        </p>

                        {report.reviewed_at && (
                          <p className="mt-1 text-xs text-gray-400">
                            Reviewed:{" "}
                            {formatDate(
                              report.reviewed_at
                            )}
                          </p>
                        )}

                      </div>

                      {/* Review */}

                      <div className="col-span-2 text-right">

                        <button
                          type="button"
                          disabled={!reportId}
                          onClick={() => {

                            const path =
                              `/manager/reported-items/${reportId}`;

                            console.log(
                              "[ManagerReports] → Opening report",
                              {
                                reportId,
                                report,
                                path,
                              }
                            );

                            navigate(path);
                          }}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Review
                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        MOBILE
                    ================================================= */}

                    <div className="md:hidden">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {formatValue(
                              report.entity_type
                            )}
                          </span>

                          <h2 className="mt-2 text-sm font-semibold text-gray-900">
                            {formatValue(
                              report.reason
                            )}
                          </h2>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {formatValue(
                            report.status
                          )}
                        </span>

                      </div>

                      {/* Entity ID */}

                      <div className="mt-3">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Entity ID
                        </p>

                        <p className="mt-1 break-all text-xs text-gray-600">
                          {report.entity_id || "—"}
                        </p>

                      </div>

                      {/* Reporter */}

                      <div className="mt-3">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Reported By
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          {reporterName}
                        </p>

                        {reporterUsername && (
                          <p className="mt-1 text-xs text-gray-400">
                            {reporterUsername}
                          </p>
                        )}

                      </div>

                      {/* Date */}

                      <div className="mt-3">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(
                            report.created_at
                          )}
                        </p>

                      </div>

                      {/* Review */}

                      <button
                        type="button"
                        disabled={!reportId}
                        onClick={() => {

                          const path =
                            `/manager/reported-items/${reportId}`;

                          console.log(
                            "[ManagerReports] → Opening report",
                            {
                              reportId,
                              report,
                              path,
                            }
                          );

                          navigate(path);
                        }}
                        className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Review Report
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* ==================================================
                PAGINATION INFO
            ================================================== */}

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">

              <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">

                <p>
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {reports.length}
                  </span>{" "}
                  report
                  {reports.length !== 1
                    ? "s"
                    : ""}
                </p>

                <p>
                  Page{" "}
                  <span className="font-medium text-gray-700">
                    {pagination.page}
                  </span>

                  {pagination.has_more && (
                    <>
                      {" "}
                      · More reports available
                    </>
                  )}
                </p>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default ManagerReports;