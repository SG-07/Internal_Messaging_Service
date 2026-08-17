// frontend/src/pages/admin/teams/AdminTeams.jsx

import { useEffect, useState } from 'react';

import {
  getAdminTeams,
  reviewAdminTeam,
  deleteAdminTeam,
} from '../../../api/admin';

import DashboardLayout from '../../dashboard/DashboardLayout';
import CreateTeamModal from '../common/CreateTeamModal';
import TeamsTable from './TeamsTable';

function AdminTeams() {
  const [teams, setTeams] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionLoading, setActionLoading] =
    useState(false);

  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  useEffect(() => {
    async function loadTeams() {
      const payload = {
        page,
        limit,
      };

      if (import.meta.env.DEV) {
        console.group('[AdminTeams] Fetch Teams');
        console.log('Request payload:', payload);
        console.groupEnd();
      }

      try {
        setLoading(true);
        setError('');

        const response = await getAdminTeams(payload);

        if (import.meta.env.DEV) {
          console.group(
            '[AdminTeams] Fetch Teams Response'
          );

          console.log(
            'Request payload:',
            payload
          );

          console.log(
            'Received response:',
            response
          );

          console.groupEnd();
        }

        const responseTeams =
          response?.teams ||
          response?.data?.teams ||
          response?.data ||
          [];

        setTeams(
          Array.isArray(responseTeams)
            ? responseTeams
            : []
        );

        const pages =
          response?.totalPages ||
          response?.data?.totalPages ||
          response?.pagination?.totalPages ||
          response?.data?.pagination?.totalPages ||
          1;

        setTotalPages(Number(pages) || 1);

      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            '[AdminTeams] Fetch Teams Error'
          );

          console.log(
            'Request payload:',
            payload
          );

          console.error('Error:', err);

          console.log(
            'Error message:',
            err.message
          );

          console.groupEnd();
        }

        setTeams([]);

        setError(
          err.message ||
            'Unable to load teams. Please try again.'
        );

      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [page, limit]);

  async function handleReview(teamId, decision) {
    if (!teamId || actionLoading) {
      return;
    }

    const payload = {
      teamId,
      decision,
    };

    if (import.meta.env.DEV) {
      console.group(
        '[AdminTeams] Review Team'
      );

      console.log(
        'Request payload:',
        payload
      );

      console.groupEnd();
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await reviewAdminTeam(
        teamId,
        decision
      );

      if (import.meta.env.DEV) {
        console.group(
          '[AdminTeams] Review Team Response'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.log(
          'Received response:',
          response
        );

        console.groupEnd();
      }

      setTeams((currentTeams) =>
        currentTeams.map((team) => {
          const currentTeamId =
            team.id || team.team_id;

          if (currentTeamId !== teamId) {
            return team;
          }

          return {
            ...team,
            status: decision,
          };
        })
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          '[AdminTeams] Review Team Error'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.error('Error:', err);

        console.log(
          'Error message:',
          err.message
        );

        console.groupEnd();
      }

      setError(
        err.message ||
          'Unable to update team. Please try again.'
      );

    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(teamId) {
    if (!teamId || actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this team?'
    );

    if (!confirmed) {
      return;
    }

    const payload = {
      teamId,
    };

    if (import.meta.env.DEV) {
      console.group(
        '[AdminTeams] Delete Team'
      );

      console.log(
        'Request payload:',
        payload
      );

      console.groupEnd();
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await deleteAdminTeam(
        teamId
      );

      if (import.meta.env.DEV) {
        console.group(
          '[AdminTeams] Delete Team Response'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.log(
          'Received response:',
          response
        );

        console.groupEnd();
      }

      setTeams((currentTeams) =>
        currentTeams.filter((team) => {
          const currentTeamId =
            team.id || team.team_id;

          return currentTeamId !== teamId;
        })
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          '[AdminTeams] Delete Team Error'
        );

        console.log(
          'Request payload:',
          payload
        );

        console.error('Error:', err);

        console.log(
          'Error message:',
          err.message
        );

        console.groupEnd();
      }

      setError(
        err.message ||
          'Unable to delete team. Please try again.'
      );

    } finally {
      setActionLoading(false);
    }
  }

  /*
   * Called after CreateTeamModal successfully
   * creates a team.
   */
  async function handleTeamCreated(response) {
    if (import.meta.env.DEV) {
      console.group(
        '[AdminTeams] Team Created'
      );

      console.log(
        'Received response:',
        response
      );

      console.groupEnd();
    }

    /*
     * The API may return the newly created team
     * directly or inside data.
     */
    const createdTeam =
      response?.team ||
      response?.data?.team ||
      response?.data ||
      null;

    if (createdTeam && typeof createdTeam === 'object') {
      /*
       * Add the newly created team to the current
       * page immediately.
       */
      setTeams((currentTeams) => [
        createdTeam,
        ...currentTeams,
      ]);

      return;
    }

    /*
     * If the API response does not contain the
     * created team, reload the current page.
     */
    try {
      const refreshResponse =
        await getAdminTeams({
          page,
          limit,
        });

      const refreshedTeams =
        refreshResponse?.teams ||
        refreshResponse?.data?.teams ||
        refreshResponse?.data ||
        [];

      setTeams(
        Array.isArray(refreshedTeams)
          ? refreshedTeams
          : []
      );

      const pages =
        refreshResponse?.totalPages ||
        refreshResponse?.data?.totalPages ||
        refreshResponse?.pagination?.totalPages ||
        refreshResponse?.data?.pagination?.totalPages ||
        1;

      setTotalPages(Number(pages) || 1);

    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[AdminTeams] Failed to refresh teams after creation:',
          err
        );
      }

      setError(
        err.message ||
          'Team was created, but the team list could not be refreshed.'
      );
    }
  }

  function handlePreviousPage() {
    if (page > 1) {
      setPage(
        (currentPage) => currentPage - 1
      );
    }
  }

  function handleNextPage() {
    if (page < totalPages) {
      setPage(
        (currentPage) => currentPage + 1
      );
    }
  }

  function handleOpenCreateModal() {
    setError('');
    setCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    setCreateModalOpen(false);
  }

  return (
    <DashboardLayout>

      <div className="min-h-screen bg-gray-100">

        <main className="mx-auto max-w-7xl px-6 py-6 pb-8">

          <section className="rounded-xl bg-white shadow">

            {/* Header */}
            <div className="flex items-start justify-between gap-6 border-b px-6 py-5">

              <div>

                <h1 className="text-xl font-semibold text-gray-900">
                  Teams
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage teams, team membership, and team status.
                </p>

              </div>

              {/* Create Team */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                disabled={loading || actionLoading}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Team
              </button>

            </div>

            {/* Error */}
            {error && (
              <div className="border-b px-6 py-4">

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm text-red-700">
                    {error}
                  </p>

                </div>

              </div>
            )}

            {/* Teams table */}
            <TeamsTable
              teams={teams}
              loading={loading}
              actionLoading={actionLoading}
              onReview={handleReview}
              onDelete={handleDelete}
            />

            {/* Pagination */}
            {!loading &&
              teams.length > 0 && (
                <div className="flex items-center justify-between border-t px-6 py-4">

                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={page <= 1}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>

                  </div>

                </div>
              )}

          </section>

        </main>

      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        onCreated={handleTeamCreated}
      />

    </DashboardLayout>
  );
}

export default AdminTeams;