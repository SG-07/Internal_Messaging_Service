// frontend/src/pages/admin/teams/TeamEdit.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { getAdminTeam, updateAdminTeam } from '../../../api/admin';

import DashboardLayout from '../../dashboard/DashboardLayout';

function TeamEdit() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadTeam() {
      if (!teamId) {
        setError('Team ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const response =
          await getAdminTeam(teamId);

        if (import.meta.env.DEV) {
          console.group(
            '[TeamEdit] Fetch Team Response'
          );

          console.log(
            'Team ID:',
            teamId
          );

          console.log(
            'Received response:',
            response
          );

          console.groupEnd();
        }

        /*
         * Support common API response structures.
         */
        const responseTeam =
          response?.data?.data ||
          response?.data?.team ||
          response?.team ||
          response?.data ||
          null;

        if (!responseTeam) {
          throw new Error(
            'Team information was not returned.'
          );
        }

        setTeam(responseTeam);

        setName(
          responseTeam.name ||
            responseTeam.team_name ||
            ''
        );

        setDescription(
          responseTeam.description ||
            ''
        );

      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            '[TeamEdit] Fetch Team Error'
          );

          console.error(
            'Error:',
            err
          );

          console.log(
            'Error message:',
            err.message
          );

          console.groupEnd();
        }

        setError(
          err.message ||
            'Unable to load team. Please try again.'
        );

      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [teamId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError('Team name is required.');
      setSuccess('');
      return;
    }

    if (!teamId || saving) {
      return;
    }

    const payload = {
      name: trimmedName,
      description: trimmedDescription,
    };

    if (import.meta.env.DEV) {
      console.group(
        '[TeamEdit] Update Team'
      );

      console.log(
        'Team ID:',
        teamId
      );

      console.log(
        'Request payload:',
        payload
      );

      console.groupEnd();
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response =
        await updateAdminTeam(
          teamId,
          payload
        );

      if (import.meta.env.DEV) {
        console.group(
          '[TeamEdit] Update Team Response'
        );

        console.log(
          'Team ID:',
          teamId
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

      /*
       * Update the local team data.
       */
      setTeam((currentTeam) => ({
        ...(currentTeam || {}),
        ...payload,
      }));

      setSuccess(
        'Team details updated successfully.'
      );

    } catch (err) {
      if (import.meta.env.DEV) {
        console.group(
          '[TeamEdit] Update Team Error'
        );

        console.error(
          'Error:',
          err
        );

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
      setSaving(false);
    }
  }

  function handleBack() {
    navigate('/admin/teams');
  }

  if (loading) {
    return (
      <DashboardLayout>

        <div className="min-h-screen bg-gray-100">

          <main className="mx-auto max-w-7xl px-6 py-6">

            <div className="rounded-xl bg-white px-6 py-16 text-center shadow">

              <p className="text-sm text-gray-500">
                Loading team...
              </p>

            </div>

          </main>

        </div>

      </DashboardLayout>
    );
  }

  if (error && !team) {
    return (
      <DashboardLayout>

        <div className="min-h-screen bg-gray-100">

          <main className="mx-auto max-w-7xl px-6 py-6">

            <button
              type="button"
              onClick={handleBack}
              className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
            >
              ← Back to Teams
            </button>

            <section className="rounded-xl bg-white p-6 shadow">

              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                <p className="text-sm text-red-700">
                  {error}
                </p>

              </div>

            </section>

          </main>

        </div>

      </DashboardLayout>
    );
  }

  const teamName =
    team?.name ||
    team?.team_name ||
    'Team';

  const status =
    team?.status ||
    team?.team_status ||
    '—';

  const manager =
    team?.manager ||
    team?.manager_name ||
    team?.manager_username ||
    team?.manager_email ||
    '—';

  const members =
    team?.members ||
    [];

  const memberCount =
    Array.isArray(members)
      ? members.length
      : team?.member_count || 0;

  return (
    <DashboardLayout>

      <div className="min-h-screen bg-gray-100">

        <main className="mx-auto max-w-5xl px-6 py-6 pb-8">

          {/* Back */}
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Teams
          </button>

          {/* Page header */}
          <div className="mb-6">

            <h1 className="text-2xl font-semibold text-gray-900">
              Manage Team
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage team details and members.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">

              <p className="text-sm text-green-700">
                {success}
              </p>

            </div>
          )}

          <div className="space-y-6">

            {/* Team Details */}
            <section className="rounded-xl bg-white shadow">

              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold text-gray-900">
                  Team Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the team's basic information.
                </p>

              </div>

              <form onSubmit={handleSubmit}>

                <div className="space-y-5 px-6 py-6">

                  {/* Team name */}
                  <div>

                    <label
                      htmlFor="team-name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Team name
                    </label>

                    <input
                      id="team-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      placeholder="Enter team name"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                  </div>

                  {/* Description */}
                  <div>

                    <label
                      htmlFor="team-description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="team-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      disabled={saving}
                      rows={4}
                      placeholder="Describe the purpose of this team"
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                  </div>

                </div>

                {/* Form footer */}
                <div className="flex justify-end border-t bg-gray-50 px-6 py-4">

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>

                </div>

              </form>

            </section>

            {/* Team Information */}
            <section className="rounded-xl bg-white shadow">

              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold text-gray-900">
                  Team Information
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-3">

                {/* Status */}
                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                    {status}
                  </p>

                </div>

                {/* Manager */}
                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Manager
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {manager}
                  </p>

                </div>

                {/* Members */}
                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Members
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {memberCount}
                  </p>

                </div>

              </div>

            </section>

            {/* Members */}
            <section className="rounded-xl bg-white shadow">

              <div className="flex items-center justify-between border-b px-6 py-5">

                <div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    Members
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Add or remove users from this team.
                  </p>

                </div>

                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add Member
                </button>

              </div>

              {/* Members placeholder */}
              <div className="px-6 py-8">

                {Array.isArray(members) &&
                members.length > 0 ? (
                  <div className="divide-y">

                    {members.map((member) => {

                      const memberId =
                        member.id ||
                        member.user_id;

                      const memberName =
                        member.name ||
                        member.username ||
                        '—';

                      const memberEmail =
                        member.email ||
                        '—';

                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between py-4"
                        >

                          <div>

                            <p className="text-sm font-medium text-gray-900">
                              {memberName}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {memberEmail}
                            </p>

                          </div>

                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                          >
                            Remove
                          </button>

                        </div>
                      );
                    })}

                  </div>
                ) : (
                  <div className="py-8 text-center">

                    <p className="text-sm text-gray-500">
                      No members in this team.
                    </p>

                  </div>
                )}

              </div>

            </section>

          </div>

        </main>

      </div>

    </DashboardLayout>
  );
}

export default TeamEdit;