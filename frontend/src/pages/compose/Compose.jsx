// frontend/src/pages/compose/Compose.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createConversation } from '../../api/conversations';

function Compose() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    type: 'information',
    body: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const {
      recipient,
      subject,
      type,
      body,
    } = formData;

    // Required-field validation
    if (!recipient || !subject || !body) {
      setError('Recipient, subject, and message are required.');
      return;
    }

    try {
      setLoading(true);

      // Backend creates the conversation and first message
      await createConversation({
        recipient_id: recipient,
        subject,
        type,
        body,
      });

      setSuccess('Message sent successfully.');

      setFormData({
        recipient: '',
        subject: '',
        type: 'information',
        body: '',
      });

      // Return to dashboard after successful send
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(
        err.message ||
          'Unable to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
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

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
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
                disabled={loading}
                required
                placeholder="Enter username or user ID"
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
                disabled={loading}
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
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="information">
                  Information
                </option>

                <option value="discussion">
                  Discussion
                </option>

                <option value="action_required">
                  Action Required
                </option>

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
                disabled={loading}
                required
                rows={10}
                placeholder="Write your message..."
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Compose;