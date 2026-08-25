import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router";

import { useAuth } from "../../context/AuthContext";

import {
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  removeGroupMember,
  getGroupJoinRequests,
  approveGroupJoinRequest,
  rejectGroupJoinRequest,
} from "../../api/groups";

export function useGroupDetailsLogic() {
  const navigate = useNavigate();

  const { groupId } = useParams();

  const { user } = useAuth();

  /*
   * ----------------------------------------
   * Group state
   * ----------------------------------------
   */

  const [group, setGroup] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * ----------------------------------------
   * Permissions
   * ----------------------------------------
   */

  const isAdmin = user?.role === "admin";

  const isCreator = group?.creator?.id === user?.id;

  const canDelete = isAdmin || isCreator;

  const canManage = group?.can_manage === true;

  /*
   * ----------------------------------------
   * Membership state
   * ----------------------------------------
   */

  const [joining, setJoining] = useState(false);

  const [joinError, setJoinError] = useState("");

  const [joinSuccess, setJoinSuccess] = useState("");

  /*
   * ----------------------------------------
   * Join request state
   * ----------------------------------------
   */

  const [joinRequests, setJoinRequests] = useState([]);

  const [requestsLoading, setRequestsLoading] = useState(false);

  const [requestsError, setRequestsError] = useState("");

  const [requestsPage, setRequestsPage] = useState(1);

  const [requestsHasMore, setRequestsHasMore] = useState(false);

  const [requestsTotal, setRequestsTotal] = useState(0);

  const [processingRequestId, setProcessingRequestId] = useState(null);

  const [requestActionError, setRequestActionError] = useState("");

  const [requestActionSuccess, setRequestActionSuccess] = useState("");

  /*
   * ----------------------------------------
   * Remove member state
   * ----------------------------------------
   */

  const [removingMemberId, setRemovingMemberId] = useState(null);

  const [removeMemberError, setRemoveMemberError] = useState("");

  const [removeMemberSuccess, setRemoveMemberSuccess] = useState("");

  /*
   * ----------------------------------------
   * Edit state
   * ----------------------------------------
   */

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [managerId, setManagerId] = useState("");

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState("");

  const [saveSuccess, setSaveSuccess] = useState("");

  /*
   * ----------------------------------------
   * Delete state
   * ----------------------------------------
   */

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [deleteError, setDeleteError] = useState("");

  /*
   * ----------------------------------------
   * Load group
   * ----------------------------------------
   */

  const loadGroup = useCallback(async () => {
    if (!groupId) {
      setError("A valid group ID is required.");

      setLoading(false);

      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Fetch Group");

      console.log("Payload sent:", {
        groupId,
      });

      console.log("Route params:", {
        groupId,
      });

      console.groupEnd();
    }

    try {
      setLoading(true);
      setError("");

      const response = await getGroup(groupId);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Fetch Group Response");

        console.log("Group ID:", groupId);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      const responseGroup = response?.data || null;

      if (!responseGroup) {
        throw new Error("Group details were not returned by the server.");
      }

      setGroup(responseGroup);

      setName(responseGroup.name || "");

      setDescription(responseGroup.description || "");

      setManagerId(responseGroup.manager?.id || "");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Fetch Group Error");

        console.log("Payload sent:", {
          groupId,
        });

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setGroup(null);

      setError(
        err?.message || "Unable to load group details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /*
   * ----------------------------------------
   * Load Join Requests
   * ----------------------------------------
   *
   * GET:
   * /api/groups/:groupId/requests?page=1&status=pending
   *
   * This endpoint is only required for
   * Creator/Admin/Manager.
   * ----------------------------------------
   */

  const loadJoinRequests = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!groupId || !canManage) {
        return;
      }

      try {
        setRequestsLoading(true);
        setRequestsError("");
        setRequestActionError("");

        if (import.meta.env.DEV) {
          console.group("[Group Details] Fetch Join Requests");

          console.log("Group ID:", groupId);

          console.log("Page:", page);

          console.log("Status:", "pending");

          console.log("Payload sent:", {
            groupId,
            page,
            status: "pending",
          });

          console.groupEnd();
        }

        const response = await getGroupJoinRequests(groupId, {
          page,
          status: "pending",
        });

        if (import.meta.env.DEV) {
          console.group("[Group Details] Fetch Join Requests Response");

          console.log("Group ID:", groupId);

          console.log("Full response:", response);

          console.log("Response data:", response?.data);

          console.log("Pagination:", response?.pagination);

          console.groupEnd();
        }

        const responseRequests = Array.isArray(response?.data?.requests)
          ? response.data.requests
          : [];

        const pagination = response?.pagination || {};

        setJoinRequests((previousRequests) => {
          if (!append) {
            return responseRequests;
          }

          /*
           * Prevent duplicate requests when
           * loading another page.
           */
          const existingIds = new Set(
            previousRequests.map((request) => request.id),
          );

          const newRequests = responseRequests.filter(
            (request) => !existingIds.has(request.id),
          );

          return [...previousRequests, ...newRequests];
        });

        setRequestsPage(page);

        setRequestsHasMore(pagination.has_more === true);

        setRequestsTotal(
          Number.isFinite(Number(pagination.total))
            ? Number(pagination.total)
            : responseRequests.length,
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group("[Group Details] Fetch Join Requests Error");

          console.log("Group ID:", groupId);

          console.error("Error:", err);

          console.log("Status:", err?.status);

          console.log("Message:", err?.message);

          console.groupEnd();
        }

        setRequestsError(
          err?.message ||
            "Unable to load join requests. Please try again.",
        );
      } finally {
        setRequestsLoading(false);
      }
    },
    [groupId, canManage],
  );

  /*
   * ----------------------------------------
   * Initial load
   * ----------------------------------------
   */

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  /*
   * ----------------------------------------
   * Load join requests after group loads
   * ----------------------------------------
   */

  useEffect(() => {
    if (!groupId || !canManage) {
      setJoinRequests([]);
      setRequestsPage(1);
      setRequestsHasMore(false);
      setRequestsTotal(0);

      return;
    }

    loadJoinRequests({
      page: 1,
      append: false,
    });
  }, [groupId, canManage, loadJoinRequests]);

  /*
   * ----------------------------------------
   * Load more join requests
   * ----------------------------------------
   */

  async function handleLoadMoreRequests() {
    if (
      requestsLoading ||
      !requestsHasMore ||
      !canManage ||
      !groupId
    ) {
      return;
    }

    await loadJoinRequests({
      page: requestsPage + 1,
      append: true,
    });
  }

  /*
   * ----------------------------------------
   * Join group
   * ----------------------------------------
   */

  async function handleJoin() {
    if (!groupId || joining) {
      return;
    }

    if (group?.can_join !== true) {
      setJoinError("You cannot join this group.");

      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Join Group");

      console.log("Group ID:", groupId);

      console.log("Current user:", user);

      console.log("Payload sent:", {
        groupId,
      });

      console.groupEnd();
    }

    try {
      setJoining(true);

      setJoinError("");
      setJoinSuccess("");

      const response = await joinGroup(groupId);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Join Group Response");

        console.log("Group ID:", groupId);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      await loadGroup();

      setJoinSuccess(
        response?.message || "You joined the group successfully.",
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Join Group Error");

        console.log("Group ID:", groupId);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setJoinError(
        err?.message || "Unable to join the group. Please try again.",
      );
    } finally {
      setJoining(false);
    }
  }

  /*
   * ----------------------------------------
   * Leave group
   * ----------------------------------------
   */

  async function handleLeave() {
    if (!groupId || joining) {
      return;
    }

    if (group?.can_leave !== true) {
      setJoinError("You cannot leave this group.");

      return;
    }

    const shouldLeave = window.confirm(
      `Are you sure you want to leave "${group?.name || "this group"}"? You will not be able to access/join it once you leave.`,
    );

    if (!shouldLeave) {
      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Leave Group");

      console.log("Group ID:", groupId);

      console.log("Current user:", user);

      console.log("Payload sent:", {
        groupId,
      });

      console.groupEnd();
    }

    try {
      setJoining(true);

      setJoinError("");
      setJoinSuccess("");

      const response = await leaveGroup(groupId);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Leave Group Response");

        console.log("Group ID:", groupId);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      await loadGroup();

      setJoinSuccess(
        response?.message || "You left the group successfully.",
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Leave Group Error");

        console.log("Group ID:", groupId);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setJoinError(
        err?.message || "Unable to leave the group. Please try again.",
      );
    } finally {
      setJoining(false);
    }
  }

  /*
   * ----------------------------------------
   * Approve Join Request
   * ----------------------------------------
   */

  async function handleApproveRequest(request) {
    if (
      !groupId ||
      !request?.id ||
      processingRequestId !== null
    ) {
      return;
    }

    if (!canManage) {
      setRequestActionError(
        "You do not have permission to approve join requests.",
      );

      return;
    }

    const userName =
      request?.user?.full_name ||
      request?.user?.username ||
      "This user";

    /*
     * Optional review notes.
     *
     * We use a browser prompt for now so the
     * backend contract is supported without
     * introducing another modal component.
     */
    const reviewNotes = window.prompt(
      `Review notes for approving ${userName}'s request (optional):`,
      "",
    );

    /*
     * null means the user cancelled the prompt.
     * Empty string means no notes.
     */
    if (reviewNotes === null) {
      return;
    }

    const payload = {
      review_notes: reviewNotes.trim() || undefined,
    };

    if (import.meta.env.DEV) {
      console.group("[Group Details] Approve Join Request");

      console.log("Group ID:", groupId);

      console.log("Request ID:", request.id);

      console.log("Request:", request);

      console.log("Payload sent:", payload);

      console.groupEnd();
    }

    try {
      setProcessingRequestId(request.id);

      setRequestActionError("");
      setRequestActionSuccess("");

      const response = await approveGroupJoinRequest(
        groupId,
        request.id,
        payload,
      );

      if (import.meta.env.DEV) {
        console.group("[Group Details] Approve Join Request Response");

        console.log("Group ID:", groupId);

        console.log("Request ID:", request.id);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      /*
       * Refresh group because approving a request
       * can increase member count and change
       * the members list.
       */
      await loadGroup();

      /*
       * Refresh requests from page 1 so that
       * the approved request disappears from
       * the pending list.
       */
      await loadJoinRequests({
        page: 1,
        append: false,
      });

      setRequestActionSuccess(
        response?.message ||
          `${userName}'s request to join has been approved.`,
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Approve Join Request Error");

        console.log("Group ID:", groupId);

        console.log("Request ID:", request.id);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setRequestActionError(
        err?.message ||
          "Unable to approve the join request. Please try again.",
      );
    } finally {
      setProcessingRequestId(null);
    }
  }

  /*
   * ----------------------------------------
   * Reject Join Request
   * ----------------------------------------
   */

  async function handleRejectRequest(request) {
    if (
      !groupId ||
      !request?.id ||
      processingRequestId !== null
    ) {
      return;
    }

    if (!canManage) {
      setRequestActionError(
        "You do not have permission to reject join requests.",
      );

      return;
    }

    const userName =
      request?.user?.full_name ||
      request?.user?.username ||
      "This user";

    const reviewNotes = window.prompt(
      `Review notes for rejecting ${userName}'s request (optional):`,
      "",
    );

    if (reviewNotes === null) {
      return;
    }

    const payload = {
      review_notes: reviewNotes.trim() || undefined,
    };

    if (import.meta.env.DEV) {
      console.group("[Group Details] Reject Join Request");

      console.log("Group ID:", groupId);

      console.log("Request ID:", request.id);

      console.log("Request:", request);

      console.log("Payload sent:", payload);

      console.groupEnd();
    }

    try {
      setProcessingRequestId(request.id);

      setRequestActionError("");
      setRequestActionSuccess("");

      const response = await rejectGroupJoinRequest(
        groupId,
        request.id,
        payload,
      );

      if (import.meta.env.DEV) {
        console.group("[Group Details] Reject Join Request Response");

        console.log("Group ID:", groupId);

        console.log("Request ID:", request.id);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      await loadGroup();

      await loadJoinRequests({
        page: 1,
        append: false,
      });

      setRequestActionSuccess(
        response?.message ||
          `${userName}'s request to join has been rejected.`,
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Reject Join Request Error");

        console.log("Group ID:", groupId);

        console.log("Request ID:", request.id);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setRequestActionError(
        err?.message ||
          "Unable to reject the join request. Please try again.",
      );
    } finally {
      setProcessingRequestId(null);
    }
  }

  /*
   * ----------------------------------------
   * Remove member from group
   * ----------------------------------------
   */

  async function handleRemoveMember(member) {
    if (!groupId || !member?.id) {
      return;
    }

    if (group?.can_manage !== true) {
      setRemoveMemberError("You do not have permission to remove members.");

      return;
    }

    if (removingMemberId) {
      return;
    }

    const memberName =
      member.full_name || member.username || "this member";

    const shouldRemove = window.confirm(
      `Are you sure you want to remove "${memberName}" from this group?`,
    );

    if (!shouldRemove) {
      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Remove Group Member");

      console.log("Group ID:", groupId);

      console.log("Member:", member);

      console.log("Member ID:", member.id);

      console.log("Current user:", user);

      console.log("Can manage:", group?.can_manage);

      console.log("Payload sent:", {
        groupId,
        userId: member.id,
      });

      console.groupEnd();
    }

    try {
      setRemovingMemberId(member.id);

      setRemoveMemberError("");
      setRemoveMemberSuccess("");

      const response = await removeGroupMember(groupId, member.id);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Remove Group Member Response");

        console.log("Group ID:", groupId);

        console.log("Member ID:", member.id);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      await loadGroup();

      setRemoveMemberSuccess(
        response?.message ||
          `${memberName} has been removed from the group.`,
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Remove Group Member Error");

        console.log("Group ID:", groupId);

        console.log("Member ID:", member.id);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setRemoveMemberError(
        err?.message ||
          "Unable to remove the member. Please try again.",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  /*
   * ----------------------------------------
   * Open edit mode
   * ----------------------------------------
   */

  function handleStartEdit() {
    if (!group) {
      return;
    }

    setSaveError("");
    setSaveSuccess("");

    setName(group.name || "");

    setDescription(group.description || "");

    setManagerId(group.manager?.id || "");

    setIsEditing(true);
  }

  /*
   * ----------------------------------------
   * Cancel edit
   * ----------------------------------------
   */

  function handleCancelEdit() {
    if (saving) {
      return;
    }

    setSaveError("");
    setSaveSuccess("");

    setName(group?.name || "");

    setDescription(group?.description || "");

    setManagerId(group?.manager?.id || "");

    setIsEditing(false);
  }

  /*
   * ----------------------------------------
   * Save group
   * ----------------------------------------
   */

  async function handleSave() {
    if (!groupId || !group) {
      setSaveError("A valid group is required.");

      return;
    }

    const trimmedName = name.trim();

    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setSaveError("Please enter a group name.");

      return;
    }

    if (trimmedName.length > 255) {
      setSaveError("Group name cannot exceed 255 characters.");

      return;
    }

    const payload = {
      name: trimmedName,
      description: trimmedDescription || null,
    };

    if (isAdmin) {
      payload.manager_id = managerId.trim() || null;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Update Group");

      console.log("Group ID:", groupId);

      console.log("Current user:", user);

      console.log("Is admin:", isAdmin);

      console.log("Payload sent:", payload);

      console.groupEnd();
    }

    try {
      setSaving(true);

      setSaveError("");
      setSaveSuccess("");

      const response = await updateGroup(groupId, payload);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Update Group Response");

        console.log("Group ID:", groupId);

        console.log("Payload sent:", payload);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      const updatedGroup = response?.data || null;

      if (updatedGroup) {
        setGroup(updatedGroup);

        setName(updatedGroup.name || "");

        setDescription(updatedGroup.description || "");

        setManagerId(updatedGroup.manager?.id || "");
      } else {
        await loadGroup();
      }

      setSaveSuccess(
        response?.message || "Group updated successfully.",
      );

      setIsEditing(false);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Update Group Error");

        console.log("Group ID:", groupId);

        console.log("Payload sent:", payload);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setSaveError(
        err?.message || "Unable to update group. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ----------------------------------------
   * Delete confirmation
   * ----------------------------------------
   */

  function handleOpenDelete() {
    if (!canDelete || deleting) {
      return;
    }

    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  function handleCloseDelete() {
    if (deleting) {
      return;
    }

    setDeleteError("");
    setShowDeleteConfirm(false);
  }

  /*
   * ----------------------------------------
   * Delete group
   * ----------------------------------------
   */

  async function handleDelete() {
    if (!groupId) {
      setDeleteError("A valid group ID is required.");

      return;
    }

    if (!canDelete) {
      setDeleteError(
        "You do not have permission to delete this group.",
      );

      return;
    }

    if (import.meta.env.DEV) {
      console.group("[Group Details] Delete Group");

      console.log("Group ID:", groupId);

      console.log("Current user:", user);

      console.log("Is admin:", isAdmin);

      console.log("Is creator:", isCreator);

      console.log("Can delete:", canDelete);

      console.log("Payload sent:", {
        groupId,
      });

      console.groupEnd();
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await deleteGroup(groupId);

      if (import.meta.env.DEV) {
        console.group("[Group Details] Delete Group Response");

        console.log("Group ID:", groupId);

        console.log("Full response:", response);

        console.log("Response data:", response?.data);

        console.log("Response message:", response?.message);

        console.groupEnd();
      }

      navigate("/groups", {
        replace: true,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Group Details] Delete Group Error");

        console.log("Group ID:", groupId);

        console.error("Error:", err);

        console.log("Status:", err?.status);

        console.log("Message:", err?.message);

        console.groupEnd();
      }

      setDeleteError(
        err?.message || "Unable to delete group. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * ----------------------------------------
   * Navigation
   * ----------------------------------------
   */

  function handleBack() {
    navigate("/groups");
  }

  return {
    group,

    groupId,

    user,

    isAdmin,

    isCreator,

    canDelete,

    canManage,

    loading,

    error,

    /*
     * Membership
     */

    joining,

    joinError,

    joinSuccess,

    handleJoin,

    handleLeave,

    /*
     * Members
     */

    removingMemberId,

    removeMemberError,

    removeMemberSuccess,

    handleRemoveMember,

    /*
     * Join Requests
     */

    joinRequests,

    requestsLoading,

    requestsError,

    requestsPage,

    requestsHasMore,

    requestsTotal,

    processingRequestId,

    requestActionError,

    requestActionSuccess,

    loadJoinRequests,

    handleLoadMoreRequests,

    handleApproveRequest,

    handleRejectRequest,

    /*
     * Edit
     */

    isEditing,

    name,
    setName,

    description,
    setDescription,

    managerId,
    setManagerId,

    saving,

    saveError,

    saveSuccess,

    /*
     * Delete
     */

    showDeleteConfirm,

    deleting,

    deleteError,

    handleStartEdit,

    handleCancelEdit,

    handleSave,

    handleOpenDelete,

    handleCloseDelete,

    handleDelete,

    /*
     * Navigation
     */

    handleBack,

    reload: loadGroup,
  };
}