import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getMyReports } from "../../api/reporting";

function MyReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD MY REPORTS
  // ============================================================

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyReports();

        const data =
          response?.reports ||
          response?.data ||
          response;

        setReports(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "[MyReports] Failed to load reports:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your reports."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  function formatEntityType(value) {
    if (!value) {
      return "Unknown";
    }

    return value
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function formatReason(value) {
    if (!value) {
      return "Unknown";
    }

    return value
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function formatStatus(status) {
    if (!status) {
      return "Unknown";
    }

    return status
      .charAt(0)
      .toUpperCase() +
      status.slice(1).toLowerCase();
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
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-100 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your reports...
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
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">

            <h1 className="text-xl font-semibold text-gray-900">
              My Reports
            </h1>

            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Back to Dashboard
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

      <div className="mx-auto max-w-6xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              My Reports
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Reports you have submitted.
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
            EMPTY STATE
        ====================================================== */}

        {reports.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <span className="text-xl text-gray-500">
                !
              </span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No reports yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Reports you submit will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Go to Dashboard
            </button>

          </div>
        ) : (

          /* ====================================================
             REPORT LIST
          ==================================================== */

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Desktop header */}

            <div className="hidden border-b border-gray-200 bg-gray-50 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Type
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reason
              </div>

              <div className="col-span-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </div>

              <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Submitted
              </div>

            </div>

            {/* Reports */}

            <div className="divide-y divide-gray-200">

              {reports.map((report) => (

                <button
                  key={report.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/reports/${report.id}`
                    )
                  }
                  className="block w-full px-6 py-5 text-left transition hover:bg-gray-50"
                >

                  {/* Desktop */}

                  <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-4">

                    <div className="col-span-2">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {formatEntityType(
                          report.entity_type
                        )}
                      </span>
                    </div>

                    <div className="col-span-2 text-sm font-medium text-gray-900">
                      {formatReason(
                        report.reason
                      )}
                    </div>

                    <div className="col-span-4">
                      <p className="truncate text-sm text-gray-600">
                        {report.description ||
                          "No description"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {formatStatus(
                          report.status
                        )}
                      </span>
                    </div>

                    <div className="col-span-2 text-xs text-gray-500">
                      {formatDate(
                        report.created_at
                      )}
                    </div>

                  </div>

                  {/* Mobile */}

                  <div className="md:hidden">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {formatEntityType(
                            report.entity_type
                          )}
                        </span>

                        <h2 className="mt-2 text-sm font-semibold text-gray-900">
                          {formatReason(
                            report.reason
                          )}
                        </h2>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {formatStatus(
                          report.status
                        )}
                      </span>

                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {report.description ||
                        "No description"}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      {formatDate(
                        report.created_at
                      )}
                    </p>

                  </div>

                </button>

              ))}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default MyReports;