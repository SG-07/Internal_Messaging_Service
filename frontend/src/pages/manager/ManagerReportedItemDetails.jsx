// frontend/src/pages/manager/ManagerReportedItemDetails.jsx

import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  managerGetReportedItem,
  managerReviewReport,
} from "../../api/manager";

function ManagerReportedItemDetails() {
  const navigate = useNavigate();

  const { reportId } = useParams();

  const [report, setReport] = useState(null);

  const [entity, setEntity] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updating, setUpdating] = useState(false);

  const [status, setStatus] = useState("");

  const [resolutionNotes, setResolutionNotes] =
    useState("");

  const [updateError, setUpdateError] =
    useState("");

  // ============================================================
  // LOAD REPORT
  // ============================================================

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        console.group(
          "[ManagerReportedItemDetails] LOAD REPORT"
        );

        console.log(
          "[ManagerReportedItemDetails] Report ID:",
          reportId
        );

        const response =
          await managerGetReportedItem(
            reportId
          );

        console.log(
          "[ManagerReportedItemDetails] Raw API response:",
          response
        );

        // ------------------------------------------------------
        // ACTUAL BACKEND STRUCTURE
        //
        // response
        // └── data
        //     ├── report
        //     └── entity
        // ------------------------------------------------------

        const data = response?.data;

        console.log(
          "[ManagerReportedItemDetails] Response data:",
          data
        );

        if (!data) {
          throw new Error(
            "Invalid response received from server."
          );
        }

        const reportData = data?.report;
        const entityData = data?.entity;

        console.log(
          "[ManagerReportedItemDetails] Report:",
          reportData
        );

        console.log(
          "[ManagerReportedItemDetails] Entity:",
          entityData
        );

        console.log(
          "[ManagerReportedItemDetails] Messages:",
          entityData?.messages
        );

        if (!reportData) {
          throw new Error(
            "Report information was not returned by the server."
          );
        }

        // ------------------------------------------------------
        // INITIAL FORM VALUES
        // ------------------------------------------------------

        const initialStatus =
          reportData?.status || "pending";

        const initialResolutionNotes =
          reportData?.resolution_notes || "";

        // ------------------------------------------------------
        // SET STATE
        // ------------------------------------------------------

        setReport(reportData);

        setEntity(entityData || null);

        setStatus(initialStatus);

        setResolutionNotes(
          initialResolutionNotes
        );

        console.log(
          "[ManagerReportedItemDetails] State initialized:",
          {
            report: reportData,
            entity: entityData,
            messageCount:
              entityData?.messages?.length || 0,
            status: initialStatus,
            resolutionNotes:
              initialResolutionNotes,
          }
        );

        console.groupEnd();
      } catch (err) {
        console.error(
          "[ManagerReportedItemDetails] Failed to load report:",
          err
        );

        setError(
          err?.message ||
            "Unable to load report details."
        );
      } finally {
        setLoading(false);

        console.log(
          "[ManagerReportedItemDetails] Loading finished."
        );
      }
    }

    if (!reportId) {
      setError("Report ID is missing.");
      setLoading(false);

      console.error(
        "[ManagerReportedItemDetails] Report ID is missing."
      );

      return;
    }

    loadReport();
  }, [reportId]);

  // ============================================================
  // FORMAT TEXT
  // ============================================================

  function formatText(value) {
    if (!value) {
      return "—";
    }

    return String(value)
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
  // FORMAT DATE
  // ============================================================

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
  // FORMAT MESSAGE TIME
  // ============================================================

  function formatMessageTime(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // ============================================================
  // GET REPORTER NAME
  // ============================================================

  function getReporterName() {
    return (
      report?.reported_by?.full_name ||
      report?.reported_by?.username ||
      report?.reporter_name ||
      report?.reporter_username ||
      report?.reporter_email ||
      "Unknown user"
    );
  }

  // ============================================================
  // GET REPORTER EMAIL
  // ============================================================

  function getReporterEmail() {
    return (
      report?.reported_by?.email ||
      report?.reporter_email ||
      ""
    );
  }

  // ============================================================
  // GET MESSAGE SENDER NAME
  // ============================================================

  function getMessageSenderName(message) {
    return (
      message?.sender?.full_name ||
      message?.sender?.username ||
      message?.sender_name ||
      "Unknown user"
    );
  }

  // ============================================================
  // UPDATE REPORT
  // ============================================================

  async function handleUpdate() {
    try {
      setUpdating(true);
      setUpdateError("");

      const payload = {
        status,
        resolution_notes:
          resolutionNotes.trim(),
      };

      console.group(
        "[ManagerReportedItemDetails] UPDATE REPORT"
      );

      console.log(
        "[ManagerReportedItemDetails] Report ID:",
        reportId
      );

      console.log(
        "[ManagerReportedItemDetails] Payload:",
        payload
      );

      const response =
        await managerReviewReport(
          reportId,
          payload
        );

      console.log(
        "[ManagerReportedItemDetails] Update response:",
        response
      );

      // ------------------------------------------------------
      // SUPPORT ACTUAL BACKEND RESPONSE
      //
      // response.data.report
      // ------------------------------------------------------

      const responseData =
        response?.data || response;

      const updatedReport =
        responseData?.report ||
        response?.report ||
        responseData;

      console.log(
        "[ManagerReportedItemDetails] Updated report:",
        updatedReport
      );

      if (
        updatedReport &&
        typeof updatedReport === "object"
      ) {
        setReport((previousReport) => ({
          ...previousReport,
          ...updatedReport,
        }));

        const updatedStatus =
          updatedReport?.status || status;

        const updatedNotes =
          updatedReport?.resolution_notes ??
          resolutionNotes;

        setStatus(updatedStatus);

        setResolutionNotes(updatedNotes);
      } else {
        // If backend doesn't return the updated
        // report, keep the local form state.
        setReport((previousReport) => ({
          ...previousReport,
          status,
          resolution_notes:
            resolutionNotes.trim(),
        }));
      }

      console.log(
        "[ManagerReportedItemDetails] Report updated successfully."
      );

      console.groupEnd();
    } catch (err) {
      console.error(
        "[ManagerReportedItemDetails] UPDATE REPORT ERROR:",
        err
      );

      setUpdateError(
        err?.message ||
          "Unable to update report."
      );
    } finally {
      setUpdating(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading report details...
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
          <div className="rounded-xl bg-white p-8 shadow-sm">

            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load report
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/manager/reported-items"
                  )
                }
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Back to Reports
              </button>

            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // REPORT NOT FOUND
  // ============================================================

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">

            <h1 className="text-xl font-semibold text-gray-900">
              Report not found
            </h1>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/manager/reported-items"
                )
              }
              className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back to Reports
            </button>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CONVERSATION DATA
  // ============================================================

  const messages = Array.isArray(
    entity?.messages
  )
    ? entity.messages
    : [];

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
            onClick={() =>
              navigate(
                "/manager/reported-items"
              )
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Reports
          </button>

          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

            <div>

              <h1 className="text-2xl font-semibold text-gray-900">
                Review Report
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review the reported content and decide
                how the report should be handled.
              </p>

            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
                status === "pending"
                  ? "bg-yellow-50 text-yellow-700"
                  : status === "reviewed"
                  ? "bg-blue-50 text-blue-700"
                  : status === "resolved"
                  ? "bg-green-50 text-green-700"
                  : status === "dismissed"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {formatText(status)}
            </span>

          </div>

        </div>

        {/* ======================================================
            REPORT DETAILS
        ====================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Report Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information submitted by the user who
              reported this content.
            </p>

          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">

            {/* Reason */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Reason
              </p>

              <p className="mt-1 font-medium text-red-600">
                {formatText(report.reason)}
              </p>
            </div>

            {/* Status */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Current Status
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatText(report.status)}
              </p>
            </div>

            {/* Reported By */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Reported By
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {getReporterName()}
              </p>

              {getReporterEmail() && (
                <p className="mt-1 text-sm text-gray-500">
                  {getReporterEmail()}
                </p>
              )}
            </div>

            {/* Reported At */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Reported At
              </p>

              <p className="mt-1 text-sm text-gray-900">
                {formatDate(
                  report.reported_at ||
                    report.created_at
                )}
              </p>
            </div>

          </div>

          {/* Description */}

          <div className="border-t border-gray-200 p-6">

            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Report Description
            </p>

            <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
              {report.description ||
                "No additional description was provided."}
            </div>

          </div>

          {/* Report ID */}

          <div className="border-t border-gray-200 px-6 py-4">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Report ID
              </span>

              <span className="break-all font-mono text-xs text-gray-500">
                {report.id || "—"}
              </span>

            </div>

          </div>

        </div>

        {/* ======================================================
            REPORTED ENTITY / CONVERSATION
        ====================================================== */}

        {entity?.type === "conversation" && (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Conversation Header */}

            <div className="border-b border-gray-200 p-6">

              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Reported Conversation
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-gray-900">
                    {entity.subject ||
                      "Untitled Conversation"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {formatText(
                      entity.conversation_type
                    )}{" "}
                    conversation
                  </p>

                </div>

                <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                  {messages.length}{" "}
                  {messages.length === 1
                    ? "message"
                    : "messages"}
                </span>

              </div>

            </div>

            {/* Conversation Metadata */}

            <div className="grid gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 sm:grid-cols-2">

              <div>

                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Conversation ID
                </p>

                <p className="mt-1 break-all font-mono text-xs text-gray-600">
                  {entity.id || "—"}
                </p>

              </div>

              <div>

                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Created At
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {formatDate(
                    entity.created_at
                  )}
                </p>

              </div>

            </div>

            {/* Messages */}

            <div className="p-6">

              {messages.length === 0 ? (

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">

                  <p className="text-sm font-medium text-gray-700">
                    No messages found
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    This conversation currently has
                    no messages available for review.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {messages.map(
                    (message, index) => (

                      <div
                        key={
                          message?.id ||
                          `message-${index}`
                        }
                        className="rounded-xl border border-gray-200 bg-white p-4"
                      >

                        {/* Message Header */}

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                              {getMessageSenderName(
                                message
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-gray-900">
                                {getMessageSenderName(
                                  message
                                )}
                              </p>

                              {message?.sender
                                ?.username &&
                                message.sender
                                  .full_name && (
                                  <p className="text-xs text-gray-400">
                                    @
                                    {
                                      message
                                        .sender
                                        .username
                                    }
                                  </p>
                                )}

                            </div>

                          </div>

                          <p className="text-xs text-gray-400">
                            {formatMessageTime(
                              message?.created_at
                            )}
                          </p>

                        </div>

                        {/* Message Content */}

                        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3">

                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                            {message?.content ||
                              message?.body ||
                              "No message content"}
                          </p>

                        </div>

                        {/* Message ID */}

                        {import.meta.env.DEV &&
                          message?.id && (
                            <p className="mt-2 break-all font-mono text-[10px] text-gray-300">
                              Message ID:{" "}
                              {message.id}
                            </p>
                          )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>
        )}

        {/* ======================================================
            OTHER ENTITY TYPES
        ====================================================== */}

        {entity &&
          entity.type !== "conversation" && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-200 p-6">

                <h2 className="text-lg font-semibold text-gray-900">
                  Reported Content
                </h2>

              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Entity Type
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {formatText(entity.type)}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Entity ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-gray-600">
                    {entity.id || "—"}
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ======================================================
            REVIEW ACTION
        ====================================================== */}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Review Decision
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the report after reviewing the
              reported content.
            </p>

          </div>

          <div className="p-6">

            {/* Status */}

            <div>

              <label
                htmlFor="report-status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="report-status"
                value={status}
                disabled={updating}
                onChange={(event) => {
                  const newStatus =
                    event.target.value;

                  console.log(
                    "[ManagerReportedItemDetails] Status changed:",
                    {
                      previousStatus: status,
                      newStatus,
                    }
                  );

                  setStatus(newStatus);
                }}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >

                <option value="pending">
                  Pending
                </option>

                <option value="reviewed">
                  Reviewed
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="dismissed">
                  Dismissed
                </option>

              </select>

            </div>

            {/* Resolution Notes */}

            <div className="mt-5">

              <label
                htmlFor="resolution-notes"
                className="block text-sm font-medium text-gray-700"
              >
                Resolution Notes
              </label>

              <textarea
                id="resolution-notes"
                rows={5}
                value={resolutionNotes}
                disabled={updating}
                onChange={(event) =>
                  setResolutionNotes(
                    event.target.value
                  )
                }
                placeholder="Explain what action was taken or why the report was dismissed..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

              <p className="mt-1 text-xs text-gray-400">
                {resolutionNotes.length} characters
              </p>

            </div>

            {/* Update Error */}

            {updateError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm text-red-700">
                  {updateError}
                </p>

              </div>
            )}

            {/* Actions */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  navigate(
                    "/manager/reported-items"
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updating}
                onClick={handleUpdate}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating
                  ? "Updating..."
                  : "Update Report"}
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default ManagerReportedItemDetails;