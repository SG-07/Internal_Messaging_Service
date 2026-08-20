import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import DashboardLayout from '../dashboard/DashboardLayout';
import { getMyWorkflowRequests } from '../../api/conversations';

function MyWorkflowRequests() {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyWorkflowRequests();
  }, [page]);

  async function loadMyWorkflowRequests() {
    try {
      setLoading(true);
      setError('');

      const response = await getMyWorkflowRequests(page);

      if (response?.success) {
        setWorkflows(response.data || []);
        setPagination(response.pagination || null);
      } else {
        setWorkflows([]);
        setPagination(null);
        setError(
          response?.message ||
            'Unable to fetch your requests.'
        );
      }
    } catch (err) {
      console.error(
        'Failed to load my workflow requests:',
        err
      );

      setWorkflows([]);
      setPagination(null);

      setError(
        err.message ||
          'Unable to fetch your requests.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleWorkflowClick(workflow) {
    navigate(`/conversation/${workflow.id}`);
  }

  function formatStatus(status) {
    if (!status) {
      return '';
    }

    return status.replace(/_/g, ' ');
  }

  function getStatusClass(status) {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';

      case 'MORE_INFO':
        return 'bg-orange-100 text-orange-800';

      case 'APPROVED':
        return 'bg-green-100 text-green-800';

      case 'REJECTED':
        return 'bg-red-100 text-red-800';

      case 'WILL_DO':
        return 'bg-blue-100 text-blue-800';

      case 'DONE':
        return 'bg-green-100 text-green-800';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  function getTypeClass(type) {
    if (type === 'approval') {
      return 'bg-purple-100 text-purple-800';
    }

    return 'bg-blue-100 text-blue-800';
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Workflow Requests
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Workflow requests you created and are monitoring.
            </p>
          </div>

          {pagination && (
            <div className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
              {pagination.total}{' '}
              {pagination.total === 1 ? 'request' : 'requests'}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading your workflow requests...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadMyWorkflowRequests}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && workflows.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800">
              No workflow requests
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              You have not created any workflow requests yet.
            </p>
          </div>
        )}

        {/* Workflow List */}
        {!loading && !error && workflows.length > 0 && (
          <>
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => handleWorkflowClick(workflow)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    {/* Badges */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTypeClass(
                          workflow.type
                        )}`}
                      >
                        {workflow.type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          workflow.status
                        )}`}
                      >
                        {formatStatus(workflow.status)}
                      </span>
                    </div>

                    {/* Subject */}
                    <h2 className="truncate text-base font-semibold text-gray-900">
                      {workflow.subject}
                    </h2>

                    {/* Updated */}
                    <p className="mt-2 text-xs text-gray-500">
                      Updated{' '}
                      {workflow.updated_at
                        ? new Date(
                            workflow.updated_at
                          ).toLocaleString()
                        : 'Unknown'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="ml-4 text-xl text-gray-400">
                    →
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((currentPage) => currentPage - 1)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.has_more}
                  onClick={() =>
                    setPage((currentPage) => currentPage + 1)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyWorkflowRequests;