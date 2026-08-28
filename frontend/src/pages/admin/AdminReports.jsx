import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "../dashboard/DashboardLayout";
import {
  adminGetReports,
} from "../../api/admin";

function AdminReports() {
  const navigate = useNavigate();

  const [reports, setReports] =
    useState([]);

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
    const endpoint =
      "/api/admin/reports";

    console.log(
      "[AdminReports] → Loading reports",
      {
        endpoint,
        method: "GET",
      }
    );

    try {
      setLoading(true);
      setError("");

      const response =
        await adminGetReports();

      console.log(
        "[AdminReports] ← Reports response",
        {
          endpoint,
          response,
        }
      );

      const data =
        response?.reports ||
        response?.data ||
        response;

      console.log(
        "[AdminReports] Parsed reports",
        {
          data,
          isArray:
            Array.isArray(data),
          count:
            Array.isArray(data)
              ? data.length
              : 0,
        }
      );

      setReports(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "[AdminReports] ← Failed to load reports",
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
        "[AdminReports] Loading finished"
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
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString();
  }


  function getStatusClass(status) {
    switch (
      status?.toLowerCase()
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


  function getReporterName(report) {
    return (
      report?.reporter_name ||
      report?.reported_by_name ||
      report?.reporter_username ||
      report?.reported_by?.full_name ||
      report?.reported_by?.username ||
      report?.reporter?.full_name ||
      report?.reporter?.username ||
      "Unknown user"
    );
  }


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
                  Review and manage all reports.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard")
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Back to Dashboard
              </button>

            </div>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">

              <p className="text-sm text-red-700">
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
    <DashboardLayout>
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
              Review and manage reports across the organization.
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
            SUMMARY
        ====================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total Reports
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {reports.length}
            </p>

          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Pending
            </p>

            <p className="mt-2 text-2xl font-semibold text-yellow-600">
              {
                reports.filter(
                  (report) =>
                    report.status?.toLowerCase() ===
                    "pending"
                ).length
              }
            </p>

          </div>


          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Resolved
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-600">
              {
                reports.filter(
                  (report) =>
                    report.status?.toLowerCase() ===
                    "resolved"
                ).length
              }
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
              There are currently no reports available for review.
            </p>

          </div>

        ) : (


          /* ====================================================
              REPORT TABLE
          ==================================================== */

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">


            {/* Table Header */}

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


            {/* Rows */}

            <div className="divide-y divide-gray-200">

              {reports.map(
                (report) => (

                  <div
                    key={report.id}
                    className="px-6 py-5 transition hover:bg-gray-50"
                  >

                    {/* DESKTOP */}

                    <div className="hidden items-center gap-4 md:grid md:grid-cols-12">


                      {/* Entity */}

                      <div className="col-span-2">

                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">

                          {formatValue(
                            report.entity_type
                          )}

                        </span>

                      </div>


                      {/* Reason */}

                      <div className="col-span-2 text-sm font-medium text-gray-900">

                        {formatValue(
                          report.reason
                        )}

                      </div>


                      {/* Reporter */}

                      <div className="col-span-2">

                        <p className="truncate text-sm text-gray-700">

                          {getReporterName(
                            report
                          )}

                        </p>

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


                      {/* Date */}

                      <div className="col-span-2 text-xs text-gray-500">

                        {formatDate(
                          report.created_at ||
                          report.reported_at
                        )}

                      </div>


                      {/* Review */}

                      <div className="col-span-2 text-right">

                        <button
                          type="button"
                          onClick={() => {

                            const path =
                              `/admin/reports/${report.id}`;

                            console.log(
                              "[AdminReports] Opening report",
                              {
                                reportId:
                                  report.id,
                                report,
                                path,
                              }
                            );

                            navigate(path);

                          }}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Review
                        </button>

                      </div>

                    </div>


                    {/* MOBILE */}

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


                      <p className="mt-3 text-sm text-gray-600">

                        Reported by:{" "}

                        {getReporterName(
                          report
                        )}

                      </p>


                      <p className="mt-2 text-xs text-gray-400">

                        {formatDate(
                          report.created_at ||
                          report.reported_at
                        )}

                      </p>


                      <button
                        type="button"
                        onClick={() => {

                          const path =
                            `/admin/reports/${report.id}`;

                          console.log(
                            "[AdminReports] Opening report",
                            {
                              reportId:
                                report.id,
                              report,
                              path,
                            }
                          );

                          navigate(path);

                        }}
                        className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                      >
                        Review Report
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </div>

    </div>
    </DashboardLayout>
  );
}

export default AdminReports;