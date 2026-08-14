import { useState } from 'react';
import { useNavigate } from 'react-router';

import DashboardSidebar from './dashboard/DashboardSidebar';

function Sent() {
  const navigate = useNavigate();

  const [emails] = useState([]);

  function openCompose() {
    navigate('/compose');
  }

  function openEmail(emailId) {
    navigate(`/conversation/${emailId}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-8">

        {/* Sidebar */}
        <DashboardSidebar
          onCompose={openCompose}
        />

        {/* Main content */}
        <section className="flex min-h-[calc(100vh-130px)] min-w-0 flex-1 flex-col rounded-xl bg-white shadow">

          {/* Header */}
          <div className="shrink-0 border-b px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Sent
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Messages you have sent
            </p>
          </div>

          {/* Empty state */}
          {emails.length === 0 && (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl">
                    ↑
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  No sent messages
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Messages you send will appear here.
                </p>

                <button
                  type="button"
                  onClick={openCompose}
                  className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Compose a Message
                </button>

              </div>
            </div>
          )}

          {/* Sent messages */}
          {emails.length > 0 && (
            <div className="divide-y divide-gray-100">
              {emails.map((email) => (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => openEmail(email.id)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">

                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {email.subject || '(No subject)'}
                      </p>

                      <span className="shrink-0 text-xs text-gray-500">
                        {email.date}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-gray-600">
                      To: {email.recipient}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {email.preview}
                    </p>

                  </div>
                </button>
              ))}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default Sent;