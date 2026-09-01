// src/pages/teams/MyTeamsLogic.js
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

import { getMyTeams, getMyTeamRequests, requestTeam } from "../../api/teams";

export function useMyTeamsLogic() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /*
   * ============================================================
   * USER
   * ============================================================
   */

  const role = user?.role;

  const isManager = role === "manager";

  /*
   * ============================================================
   * TEAMS
   * ============================================================
   */

  const [teams, setTeams] = useState([]);

  const [pendingRequests, setPendingRequests] = useState([]);

  /*
   * ============================================================
   * LOADING / ERROR
   * ============================================================
   */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * ============================================================
   * CREATE TEAM
   * ============================================================
   */

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const [teamName, setTeamName] = useState("");

  const [creatingTeam, setCreatingTeam] = useState(false);

  const [createError, setCreateError] = useState("");

  const [createSuccess, setCreateSuccess] = useState("");

  /*
   * ============================================================
   * MANAGE TEAM MEMBERS
   * ============================================================
   */

  const [showManageMembers, setShowManageMembers] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState(null);

  /*
   * ============================================================
   * LOAD TEAMS
   * ============================================================
   */

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * --------------------------------------------------------
       * Fetch joined teams
       * --------------------------------------------------------
       */

      const teamsResponse = await getMyTeams({
        page: 1,
      });

      if (import.meta.env.DEV) {
        console.group("[My Teams] Fetch Teams");
        console.log("Response:", teamsResponse);
        console.log("Teams:", teamsResponse?.data);
        console.groupEnd();
      }

      const responseTeams = Array.isArray(teamsResponse?.data)
        ? teamsResponse.data
        : [];

      /*
       * listUserTeams returns joined teams.
       */

      const activeTeams = responseTeams.filter(
        (team) => team?.status === "active" || team?.status === "approved",
      );

      setTeams(activeTeams);

      /*
       * --------------------------------------------------------
       * Manager-only pending requests
       * --------------------------------------------------------
       */

      if (isManager) {
        const requestsResponse = await getMyTeamRequests();

        if (import.meta.env.DEV) {
          console.group("[My Teams] Fetch Team Requests");
          console.log("Response:", requestsResponse);
          console.log("Requests:", requestsResponse?.data);
          console.groupEnd();
        }

        const requests = Array.isArray(requestsResponse?.data)
          ? requestsResponse.data
          : [];

        const pending = requests.filter((team) => team?.status === "pending");

        setPendingRequests(pending);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[My Teams] Fetch Error");
        console.error("Error:", err);
        console.log("Status:", err?.status);
        console.log("Message:", err?.message);
        console.groupEnd();
      }

      setError(err?.message || "Unable to load your teams. Please try again.");

      setTeams([]);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  /*
   * ============================================================
   * OPEN TEAM
   * ============================================================
   */

  function handleOpenTeam(team) {
    if (!team?.id) {
      console.error("[My Teams] Cannot open team: team ID is missing.", team);

      return;
    }

    navigate(`/teams/${team.id}/chat`);
  }

  /*
   * ============================================================
   * MANAGE TEAM MEMBERS
   * ============================================================
   */

  function handleOpenManageMembers(team) {
    if (!team?.id) {
      console.error(
        "[My Teams] Cannot manage members: team ID is missing.",
        team,
      );

      return;
    }

    const canManage =
      isManager &&
      team?.manager_id === user?.id &&
      (team?.status === "approved" || team?.status === "active");

    if (!canManage) {
      console.warn("[My Teams] User cannot manage this team.", {
        userId: user?.id,
        managerId: team?.manager_id,
        status: team?.status,
        team,
      });

      return;
    }

    setSelectedTeam(team);
    setShowManageMembers(true);
  }

  function handleCloseManageMembers() {
    setShowManageMembers(false);
    setSelectedTeam(null);
  }

  /*
   * ============================================================
   * BACK
   * ============================================================
   */

  function handleBack() {
    navigate("/dashboard");
  }

  /*
   * ============================================================
   * CREATE TEAM MODAL
   * ============================================================
   */

  function handleOpenCreateTeam() {
    setTeamName("");
    setCreateError("");
    setCreateSuccess("");
    setShowCreateTeam(true);
  }

  function handleCloseCreateTeam() {
    if (creatingTeam) {
      return;
    }

    setShowCreateTeam(false);
    setTeamName("");
    setCreateError("");
    setCreateSuccess("");
  }

  /*
   * ============================================================
   * CREATE TEAM REQUEST
   * ============================================================
   */

  async function handleCreateTeam(event) {
    event.preventDefault();

    const name = teamName.trim();

    if (!name) {
      setCreateError("Team name is required.");
      return;
    }

    try {
      setCreatingTeam(true);
      setCreateError("");
      setCreateSuccess("");

      const response = await requestTeam({
        name,
      });

      if (import.meta.env.DEV) {
        console.group("[My Teams] Create Team");
        console.log("Payload:", { name });
        console.log("Response:", response);
        console.groupEnd();
      }

      setCreateSuccess(
        response?.message || "Team request submitted. Awaiting admin approval.",
      );

      setTeamName("");

      await loadTeams();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[My Teams] Create Team Error");
        console.error("Error:", err);
        console.log("Status:", err?.status);
        console.log("Message:", err?.message);
        console.groupEnd();
      }

      setCreateError(
        err?.message || "Unable to submit team request. Please try again.",
      );
    } finally {
      setCreatingTeam(false);
    }
  }

  /*
   * ============================================================
   * RETRY
   * ============================================================
   */

  async function handleRetry() {
    await loadTeams();
  }

  return {
    user,
    role,
    isManager,

    teams,
    pendingRequests,

    loading,
    error,

    showCreateTeam,
    teamName,
    creatingTeam,
    createError,
    createSuccess,

    setTeamName,

    handleOpenTeam,
    handleBack,
    handleRetry,

    handleOpenCreateTeam,
    handleCloseCreateTeam,
    handleCreateTeam,

    /*
     * Manage Members
     */
    showManageMembers,
    selectedTeam,
    handleOpenManageMembers,
    handleCloseManageMembers,

    reload: handleRetry,
  };
}
