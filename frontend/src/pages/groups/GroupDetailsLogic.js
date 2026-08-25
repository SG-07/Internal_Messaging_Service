//frontend/src/pages/groups/GroupDetailsLogic.js
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

  /*
   * ----------------------------------------
   * Membership state
   * ----------------------------------------
   */

  const [joining, setJoining] = useState(false);

  const [joinError, setJoinError] = useState("");

  const [joinSuccess, setJoinSuccess] = useState("");

  // remove member state
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

      /*
       * Keep edit fields synchronized
       * with the latest server response.
       */

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
   * Initial load
   * ----------------------------------------
   */

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  /*
   * ----------------------------------------
   * Join group
   * ----------------------------------------
   */

  async function handleJoin() {
    if (!groupId || joining) {
      return;
    }

    /*
     * Backend permission is the final authority.
     * The frontend check only prevents an
     * obviously invalid request.
     */

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

      /*
       * Reload the group so that:
       *
       * - membership status
       * - member count
       * - can_join
       * - can_leave
       * - pending request state
       *
       * all come from the backend again.
       */

      await loadGroup();

      setJoinSuccess(response?.message || "You joined the group successfully.");
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

    /*
     * Backend permission is the final authority.
     */

    if (group?.can_leave !== true) {
      setJoinError("You cannot leave this group.");

      return;
    }

    /*
     * Prevent accidental leaving.
     */

    const shouldLeave = window.confirm(
      `Are you sure you want to leave "${group?.name || "this group"}. You will not be able to access/join it once you leave."?`,
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

      /*
       * Reload the group after leaving.
       */

      await loadGroup();

      setJoinSuccess(response?.message || "You left the group successfully.");
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
   * Remove member from group
   * ----------------------------------------
   */

  async function handleRemoveMember(member) {
    if (!groupId || !member?.id) {
      return;
    }

    /*
     * Backend permission is the final authority.
     * Frontend check only prevents an obviously
     * invalid request.
     */

    if (group?.can_manage !== true) {
      setRemoveMemberError("You do not have permission to remove members.");

      return;
    }

    /*
     * Prevent duplicate requests for the
     * same member.
     */

    if (removingMemberId) {
      return;
    }

    const memberName = member.full_name || member.username || "this member";

    /*
     * Prevent accidental removal.
     */

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
        response?.message || `${memberName} has been removed from the group.`,
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
        err?.message || "Unable to remove the member. Please try again.",
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

    /*
     * Frontend validation
     */

    if (!trimmedName) {
      setSaveError("Please enter a group name.");

      return;
    }

    if (trimmedName.length > 255) {
      setSaveError("Group name cannot exceed 255 characters.");

      return;
    }

    /*
     * Only include fields allowed
     * for this frontend user.
     */

    const payload = {
      name: trimmedName,

      description: trimmedDescription || null,
    };

    /*
     * Manager can only be changed
     * by an admin in the frontend.
     *
     * Backend must still enforce this.
     */

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

      /*
       * Use updated group returned
       * by the API when available.
       */

      const updatedGroup = response?.data || null;

      if (updatedGroup) {
        setGroup(updatedGroup);

        setName(updatedGroup.name || "");

        setDescription(updatedGroup.description || "");

        setManagerId(updatedGroup.manager?.id || "");
      } else {
        await loadGroup();
      }

      setSaveSuccess(response?.message || "Group updated successfully.");

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

      setSaveError(err?.message || "Unable to update group. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * ----------------------------------------
   * Open delete confirmation
   * ----------------------------------------
   */

  function handleOpenDelete() {
    if (!canDelete || deleting) {
      return;
    }

    setDeleteError("");
    setShowDeleteConfirm(true);
  }

  /*
   * ----------------------------------------
   * Close delete confirmation
   * ----------------------------------------
   */

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
      setDeleteError("You do not have permission to delete this group.");

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

    removingMemberId,

    removeMemberError,

    removeMemberSuccess,

    handleRemoveMember,

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

    handleBack,

    reload: loadGroup,
  };
}
