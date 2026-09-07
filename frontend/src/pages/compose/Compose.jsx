// frontend/src/pages/compose/Compose.jsx

import { useState } from "react";
import { useNavigate } from "react-router";

import { composeMessage } from "../../api/ai";
import { createConversation } from "../../api/conversations";

import DashboardLayout from "../dashboard/DashboardLayout";

const TONES = [
  {
    value: "friendly",
    label: "Friendly",
  },
  {
    value: "professional",
    label: "Professional",
  },
  {
    value: "deadline",
    label: "Deadline",
  },
  {
    value: "formal",
    label: "Formal",
  },
  {
    value: "apologetic",
    label: "Apologetic",
  },
];

const RESTRICTED_TYPES = [
  "action_required",
  "approval_required",
];

const DEFAULT_FORM_DATA = {
  recipients: [],
  subject: "",
  type: "information",
  body: "",
};

function Compose() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [recipientInput, setRecipientInput] = useState("");

  const [tone, setTone] = useState("professional");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const isBusy = loading || aiLoading;

  const recipientCount = formData.recipients.length;

  const isOneOnOne = recipientCount === 1;

  // --------------------------------------------------
  // Form helpers
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleToneChange(event) {
    setTone(event.target.value);
    setError("");
    setSuccess("");
  }

  // --------------------------------------------------
  // Recipients
  // --------------------------------------------------

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase();

    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.recipients.includes(email)) {
      setError("This recipient has already been added.");
      return;
    }

    setFormData((previousData) => {
      const updatedRecipients = [
        ...previousData.recipients,
        email,
      ];

      const shouldResetRestrictedType =
        updatedRecipients.length > 1 &&
        RESTRICTED_TYPES.includes(previousData.type);

      return {
        ...previousData,
        recipients: updatedRecipients,

        // Action and approval are only for one-on-one.
        type: shouldResetRestrictedType
          ? "information"
          : previousData.type,
      };
    });

    setRecipientInput("");
    setError("");
    setSuccess("");
  }

  function removeRecipient(emailToRemove) {
    setFormData((previousData) => ({
      ...previousData,
      recipients: previousData.recipients.filter(
        (email) => email !== emailToRemove
      ),
    }));

    setError("");
    setSuccess("");
  }

  function handleRecipientKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addRecipient();
    }
  }

  // --------------------------------------------------
  // AI Compose
  // --------------------------------------------------

  async function handleComposeWithAI() {
    setError("");
    setSuccess("");

    const { subject, type, body } = formData;

    if (!body.trim()) {
      setError("Write a rough draft before using AI.");
      return;
    }

    try {
      setAiLoading(true);

      const response = await composeMessage({
        draft: body,
        tone,
        subject,
        category: type,
      });

      const rewrittenMessage = response?.data?.message;

      if (!rewrittenMessage) {
        throw new Error("AI did not return a rewritten message.");
      }

      // Replace the draft with the AI result.
      // The user can still edit it before sending.
      setFormData((previousData) => ({
        ...previousData,
        body: rewrittenMessage,
      }));

      setSuccess("Message improved. Review it before sending.");
    } catch (err) {
      setError(
        err.message || "Unable to improve message. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  }

  // --------------------------------------------------
  // Send conversation
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const { recipients, subject, type, body } = formData;

    // Add any email currently typed in the input.
    const typedEmail = recipientInput.trim().toLowerCase();

    let finalRecipients = [...recipients];

    if (typedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(typedEmail)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (!finalRecipients.includes(typedEmail)) {
        finalRecipients.push(typedEmail);
      }
    }

    if (!finalRecipients.length || !subject || !body.trim()) {
      setError(
        "At least one recipient, subject, and message are required."
      );
      return;
    }

    // Action and approval are only allowed for one-on-one.
    if (
      finalRecipients.length > 1 &&
      RESTRICTED_TYPES.includes(type)
    ) {
      setError(
        "Action Required and Approval Required are available only for one-on-one conversations."
      );
      return;
    }

    try {
      setLoading(true);

      // Backend payload.
      await createConversation({
        recipient_id: finalRecipients,
        subject,
        type,
        body,
      });

      setSuccess("Message sent successfully.");

      setFormData(DEFAULT_FORM_DATA);

      setRecipientInput("");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(
        err.message || "Unable to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-lg">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Compose Message
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Send a new message to one or more users.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                role="status"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Recipients */}
              <div>
                <label
                  htmlFor="recipient"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  To
                </label>

                <div className="rounded-lg border border-gray-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">

                  {/* Added recipients */}
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.recipients.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {email}

                        <button
                          type="button"
                          onClick={() => removeRecipient(email)}
                          disabled={isBusy}
                          className="font-bold text-blue-600 hover:text-blue-900"
                          aria-label={`Remove ${email}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Email input */}
                  <input
                    id="recipient"
                    type="email"
                    value={recipientInput}
                    onChange={(event) => {
                      setRecipientInput(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    onKeyDown={handleRecipientKeyDown}
                    onBlur={addRecipient}
                    disabled={isBusy}
                    placeholder={
                      formData.recipients.length
                        ? "Add another email..."
                        : "Enter recipient(s) email "
                    }
                    className="w-full border-0 px-1 py-1 text-sm outline-none focus:ring-0 disabled:bg-gray-100"
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Press Enter or comma to add multiple recipients.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isBusy}
                  required
                  placeholder="Enter subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Conversation Type */}
              <div>
                <label
                  htmlFor="type"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Type
                </label>

                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={isBusy}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="information">
                    Information
                  </option>

                  <option value="discussion">
                    Discussion
                  </option>

                  {isOneOnOne && (
                    <>
                      <option value="action_required">
                        Action Required
                      </option>

                      <option value="approval_required">
                        Approval Required
                      </option>
                    </>
                  )}
                </select>

                {!isOneOnOne && (
                  <p className="mt-1 text-xs text-gray-500">
                    Action Required and Approval Required are
                    available only for one-on-one conversations.
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="body"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>

                <textarea
                  id="body"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  disabled={isBusy}
                  required
                  rows={10}
                  placeholder="Write your message..."
                  className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* AI Compose */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Improve with AI
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
                    Rewrite your draft in a chosen tone. You can edit
                    the result before sending.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label
                      htmlFor="tone"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Tone
                    </label>

                    <select
                      id="tone"
                      value={tone}
                      onChange={handleToneChange}
                      disabled={isBusy}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    >
                      {TONES.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleComposeWithAI}
                    disabled={isBusy || !formData.body.trim()}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {aiLoading
                      ? "Improving..."
                      : "Improve with AI"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  disabled={isBusy}
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Compose;
