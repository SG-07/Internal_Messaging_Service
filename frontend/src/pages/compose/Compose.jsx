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

function Compose() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    recipient: "",
    subject: "",
    type: "information",
    body: "",
  });

  const [tone, setTone] = useState("professional");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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
  // AI Compose
  // --------------------------------------------------

  async function handleComposeWithAI() {
    setError("");
    setSuccess("");

    const { recipient, subject, type, body } = formData;

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
        recipientId: recipient,
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
        err.message || "Unable to improve message. Please try again.",
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

    const { recipient, subject, type, body } = formData;

    if (!recipient || !subject || !body.trim()) {
      setError("Recipient, subject, and message are required.");
      return;
    }

    try {
      setLoading(true);

      // Existing backend flow.
      // AI does not create the conversation.
      await createConversation({
        recipient_id: recipient,
        subject,
        type,
        body,
      });

      setSuccess("Message sent successfully.");

      setFormData({
        recipient: "",
        subject: "",
        type: "information",
        body: "",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err.message || "Unable to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isBusy = loading || aiLoading;

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
                Send a new message to another user.
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
              {/* Recipient */}
              <div>
                <label
                  htmlFor="recipient"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  To
                </label>

                <input
                  id="recipient"
                  name="recipient"
                  type="text"
                  value={formData.recipient}
                  onChange={handleChange}
                  disabled={isBusy}
                  required
                  placeholder="Enter receiver's mail address"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
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
                  <option value="information">Information</option>
                  <option value="discussion">Discussion</option>
                  <option value="action_required">Action Required</option>
                  <option value="approval_required">
                    Approval Required
                  </option>
                </select>
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
                    Rewrite your draft in a chosen tone. You can edit the
                    result before sending.
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
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                    >
                      {TONES.map((option) => (
                        <option key={option.value} value={option.value}>
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
                    {aiLoading ? "Improving..." : "Improve with AI"}
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