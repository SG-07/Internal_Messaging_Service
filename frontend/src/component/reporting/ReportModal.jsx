// src/components/reporting/ReportModal.jsx

import { useEffect, useState } from "react";

import {
  createReport,
} from "../../api/reporting";

import {
  REPORT_REASONS,
} from "./reportConstants";


function ReportModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName = "this item",
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  // Reset modal state whenever it opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDescription("");
      setError("");
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);


  // Do not render when closed
  if (!isOpen) {
    return null;
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");


    if (!entityType) {
      setError("Report entity type is missing.");
      return;
    }


    if (!entityId) {
      setError("Report entity ID is missing.");
      return;
    }


    if (!reason) {
      setError("Please select a reason.");
      return;
    }


    if (description.length > 1000) {
      setError(
        "Description cannot exceed 1000 characters."
      );
      return;
    }


    try {
      setIsSubmitting(true);


      await createReport({
        entity_type: entityType,
        entity_id: entityId,
        reason,
        description:
          description.trim() || null,
      });


      setSuccess(true);


      // Give the user a moment to see success
      setTimeout(() => {
        onClose();
      }, 1200);


    } catch (error) {
      setError(
        error?.message ||
          "Failed to submit report."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* ==================================================
            Header
        ================================================== */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report {entityName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Help us understand what is wrong with this content.
            </p>
          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg px-2 py-1 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>


        {/* ==================================================
            Body
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-6 py-5"
        >

          {/* Success */}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Report submitted successfully.
            </div>
          )}


          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {/* Reason */}

          <div>
            <label
              htmlFor="report-reason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason
            </label>

            <select
              id="report-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              disabled={isSubmitting || success}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">
                Select a reason
              </option>

              {REPORT_REASONS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>


          {/* Description */}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="report-description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <span className="text-xs text-gray-400">
                {description.length}/1000
              </span>
            </div>


            <textarea
              id="report-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              disabled={isSubmitting || success}
              maxLength={1000}
              rows={5}
              placeholder="Describe the issue (optional)"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
          </div>


          {/* ==================================================
              Actions
          ================================================== */}

          <div className="flex justify-end gap-3 border-t pt-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                isSubmitting ||
                success
              }
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Submitting..."
                : success
                  ? "Reported"
                  : "Submit Report"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}


export default ReportModal;