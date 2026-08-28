import { useEffect, useState } from "react";
import DashboardLayout from "../dashboard/DashboardLayout";
import {
  useNavigate,
  useParams,
} from "react-router";

import {
  adminGetReportedItem,
  adminReviewReport,
} from "../../api/admin";

function AdminReportedItemDetails() {
  const navigate = useNavigate();

  const { reportId } = useParams();


  // ============================================================
  // STATE
  // ============================================================

  const [report, setReport] =
    useState(null);

  const [entity, setEntity] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updating, setUpdating] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [resolutionNotes, setResolutionNotes] =
    useState("");

  const [updateError, setUpdateError] =
    useState("");


  // ============================================================
  // PAGE DEBUG
  // ============================================================

  useEffect(() => {
    console.group(
      "[AdminReportedItemDetails] Page mounted"
    );

    console.log(
      "[AdminReportedItemDetails] reportId:",
      reportId
    );

    console.log(
      "[AdminReportedItemDetails] path:",
      window.location.pathname
    );

    console.groupEnd();
  }, [reportId]);


  // ============================================================
  // LOAD REPORT
  // ============================================================

  useEffect(() => {

    async function loadReport() {

      try {

        setLoading(true);
        setError("");

        console.group(
          "[AdminReportedItemDetails] LOAD REPORT"
        );

        console.log(
          "[AdminReportedItemDetails] Report ID:",
          reportId
        );

        const response =
          await adminGetReportedItem(
            reportId
          );

        console.log(
          "[AdminReportedItemDetails] Raw response:",
          response
        );


        // --------------------------------------------------------
        // EXTRACT DATA
        // --------------------------------------------------------

        const data =
          response?.data ||
          response;

        console.log(
          "[AdminReportedItemDetails] Extracted data:",
          data
        );


        const extractedReport =
          data?.report;

        const extractedEntity =
          data?.entity;


        console.log(
          "[AdminReportedItemDetails] Extracted report:",
          extractedReport
        );

        console.log(
          "[AdminReportedItemDetails] Extracted entity:",
          extractedEntity
        );


        if (!extractedReport) {
          throw new Error(
            "Report information was not returned by the server."
          );
        }


        // --------------------------------------------------------
        // INITIAL STATE
        // --------------------------------------------------------

        const initialStatus =
          extractedReport.status ||
          "pending";

        const initialNotes =
          extractedReport.resolution_notes ||
          "";


        setReport(
          extractedReport
        );

        setEntity(
          extractedEntity || null
        );

        setStatus(
          initialStatus
        );

        setResolutionNotes(
          initialNotes
        );


        console.log(
          "[AdminReportedItemDetails] State initialized:",
          {
            report:
              extractedReport,
            entity:
              extractedEntity,
            status:
              initialStatus,
            resolutionNotes:
              initialNotes,
          }
        );

        console.groupEnd();

      } catch (err) {

        console.group(
          "[AdminReportedItemDetails] LOAD ERROR"
        );

        console.error(
          "Error:",
          err
        );

        console.error(
          "Message:",
          err?.message
        );

        console.groupEnd();


        setError(
          err?.message ||
          "Unable to load report details."
        );

      } finally {

        setLoading(false);

        console.log(
          "[AdminReportedItemDetails] Loading finished."
        );
      }
    }


    if (!reportId) {

      setError(
        "Report ID is missing."
      );

      setLoading(false);

      return;
    }


    loadReport();

  }, [reportId]);


  // ============================================================
  // HELPERS
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


  function getReporterName() {

    return (
      report?.reported_by?.full_name ||
      report?.reported_by?.username ||
      report?.reporter?.full_name ||
      report?.reporter?.username ||
      report?.reporter_name ||
      "Unknown"
    );
  }


  function getSenderName(message) {

    return (
      message?.sender?.full_name ||
      message?.sender?.username ||
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
        "[AdminReportedItemDetails] UPDATE REPORT"
      );

      console.log(
        "[AdminReportedItemDetails] Report ID:",
        reportId
      );

      console.log(
        "[AdminReportedItemDetails] Payload:",
        payload
      );


      const response =
        await adminReviewReport(
          reportId,
          payload
        );


      console.log(
        "[AdminReportedItemDetails] Update response:",
        response
      );


      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      const updatedData =
        response?.data ||
        response;

      const updatedReport =
        updatedData?.report ||
        updatedData;


      console.log(
        "[AdminReportedItemDetails] Updated report:",
        updatedReport
      );


      // --------------------------------------------------------
      // UPDATE REPORT STATE
      // --------------------------------------------------------

      setReport(
        (previousReport) => ({
          ...previousReport,
          ...updatedReport,
        })
      );


      // --------------------------------------------------------
      // UPDATE FORM STATE
      // --------------------------------------------------------

      setStatus(
        updatedReport?.status ||
        status
      );


      setResolutionNotes(
        updatedReport?.resolution_notes ??
        resolutionNotes
      );


      console.log(
        "[AdminReportedItemDetails] Report updated successfully."
      );

      console.groupEnd();

    } catch (err) {

      console.error(
        "[AdminReportedItemDetails] UPDATE ERROR:",
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

          <div className="rounded-xl bg-white p-6 shadow">

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

          <div className="rounded-xl bg-white p-6 shadow">

            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load report
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/reports"
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
  // NOT FOUND
  // ============================================================

  if (!report) {

    return (
      <div className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-xl bg-white p-6 shadow">

            <h1 className="text-xl font-semibold text-gray-900">
              Report not found
            </h1>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/reports"
                )
              }
              className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              Back to Reports
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
                "/admin/reports"
              )
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Reports
          </button>


          <h1 className="text-2xl font-semibold text-gray-900">
            Review Report
          </h1>


          <p className="mt-1 text-sm text-gray-500">
            Review the reported content and decide how the report should be handled.
          </p>

        </div>


        {/* ======================================================
            REPORT INFORMATION
        ====================================================== */}

        <div className="rounded-xl bg-white shadow">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Report Information
            </h2>

          </div>


          <div className="grid gap-6 p-6 md:grid-cols-2">


            {/* Report ID */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Report ID
              </p>

              <p className="mt-1 break-all text-sm text-gray-900">
                {report.id || "—"}
              </p>

            </div>


            {/* Entity ID */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Entity ID
              </p>

              <p className="mt-1 break-all text-sm text-gray-900">
                {report.entity_id ||
                  entity?.id ||
                  "—"}
              </p>

            </div>


            {/* Entity Type */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Entity Type
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {formatText(
                  report.entity_type ||
                  entity?.type
                )}
              </p>

            </div>


            {/* Reason */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Reason
              </p>

              <p className="mt-1 font-medium text-red-600">
                {formatText(
                  report.reason
                )}
              </p>

            </div>


            {/* Reporter */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Reported By
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {getReporterName()}
              </p>

              {report?.reported_by?.username && (
                <p className="mt-1 text-sm text-gray-500">
                  @{report.reported_by.username}
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

        </div>


        {/* ======================================================
            REPORTED ENTITY
        ====================================================== */}

        {entity && (

          <div className="mt-6 rounded-xl bg-white shadow">

            <div className="border-b border-gray-200 p-6">

              <h2 className="text-lg font-semibold text-gray-900">
                Reported Content
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review the content that was reported.
              </p>

            </div>


            <div className="p-6">


              {/* ==================================================
                  CONVERSATION
              ================================================== */}

              {entity.type === "conversation" && (

                <div>


                  {/* Conversation Header */}

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                          Conversation
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-gray-900">

                          {entity.subject ||
                            "No subject"}

                        </h3>

                      </div>


                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">

                        {formatText(
                          entity.conversation_type
                        )}

                      </span>

                    </div>


                    <p className="mt-3 text-xs text-gray-500">

                      Created:{" "}

                      {formatDate(
                        entity.created_at
                      )}

                    </p>

                  </div>


                  {/* ==================================================
                      MESSAGES
                  ================================================== */}

                  <div className="mt-6">

                    <div className="mb-3 flex items-center justify-between">

                      <h3 className="text-sm font-semibold text-gray-900">
                        Messages
                      </h3>

                      <span className="text-xs text-gray-500">
                        {entity.messages?.length || 0} messages
                      </span>

                    </div>


                    {!entity.messages ||
                    entity.messages.length === 0 ? (

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">

                        <p className="text-sm text-gray-500">
                          No messages found in this conversation.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-3">

                        {entity.messages.map(
                          (message) => (

                            <div
                              key={
                                message.id
                              }
                              className="rounded-lg border border-gray-200 bg-white p-4"
                            >

                              <div className="flex items-start justify-between gap-4">

                                <div>

                                  <p className="text-sm font-semibold text-gray-900">

                                    {getSenderName(
                                      message
                                    )}

                                  </p>

                                  {message?.sender?.username && (
                                    <p className="text-xs text-gray-400">
                                      @{message.sender.username}
                                    </p>
                                  )}

                                </div>


                                <p className="shrink-0 text-xs text-gray-400">

                                  {formatDate(
                                    message.created_at
                                  )}

                                </p>

                              </div>


                              <div className="mt-3 rounded-md bg-gray-50 p-3">

                                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">

                                  {message.content ||
                                    message.body ||
                                    "—"}

                                </p>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                </div>

              )}


              {/* ==================================================
                  UNKNOWN ENTITY
              ================================================== */}

              {entity.type !== "conversation" && (

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                  <p className="text-sm text-yellow-800">

                    This report refers to a{" "}

                    <strong>
                      {formatText(
                        entity.type
                      )}
                    </strong>

                    . The entity details are available, but this page does not yet have a dedicated viewer for this entity type.

                  </p>

                </div>

              )}

            </div>

          </div>

        )}


        {/* ======================================================
            REVIEW DECISION
        ====================================================== */}

        <div className="mt-6 rounded-xl bg-white shadow">

          <div className="border-b border-gray-200 p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Review Decision
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the report status and record the action taken.
            </p>

          </div>


          <div className="p-6">


            {/* Status */}

            <div>

              <label
                htmlFor="admin-report-status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>


              <select
                id="admin-report-status"
                value={status}
                disabled={updating}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                htmlFor="admin-resolution-notes"
                className="block text-sm font-medium text-gray-700"
              >
                Resolution Notes
              </label>


              <textarea
                id="admin-resolution-notes"
                rows={5}
                value={resolutionNotes}
                disabled={updating}
                onChange={(event) =>
                  setResolutionNotes(
                    event.target.value
                  )
                }
                placeholder="Add notes about your review or action taken..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              />

            </div>


            {/* Error */}

            {updateError && (

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                {updateError}

              </div>

            )}


            {/* Actions */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  navigate(
                    "/admin/reports"
                  )
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={updating}
                onClick={handleUpdate}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </DashboardLayout>
  );
}

export default AdminReportedItemDetails;