// src/pages/groups/GroupLogic.js

import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

import {
  createGroup,
  getGroups,
  joinGroup,
  reviewGroupRequest,
} from "../../api/groups";

// ------- CREATE GROUP -------
export function useGroupLogic() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [name, setName] = useState("");

  const [isOpen, setIsOpen] = useState(true);

  const [department, setDepartment] = useState("");

  const [managerEmail, setManagerEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [createdGroup, setCreatedGroup] = useState(null);

  const [reviewingGroupId, setReviewingGroupId] = useState(null);

  const [reviewError, setReviewError] = useState("");

  const [reviewSuccess, setReviewSuccess] = useState("");

  /*
   * --------------------------------------------------
   * Submit
   * --------------------------------------------------
   */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setCreatedGroup(null);

    const trimmedName = name.trim();
    const trimmedDepartment = isAdmin ? department.trim() : "";
    const trimmedManagerEmail = managerEmail.trim();

    // ============================================================
    // Frontend validation
    // ============================================================

    if (!trimmedName) {
      setError("Please enter a group name.");
      return;
    }

    if (trimmedName.length > 255) {
      setError("Group name cannot exceed 255 characters.");
      return;
    }

    // ------------------------------------------------------------
    // Only ADMIN creating a CLOSED group must provide a manager.
    //
    // Non-admin:
    //   - Closed group is allowed without managerEmail.
    //   - Backend assigns the current user as manager.
    // ------------------------------------------------------------
    if (!isOpen && isAdmin && !trimmedManagerEmail) {
      setError(
        "Manager email is required when an admin creates a closed group.",
      );
      return;
    }

    // Validate manager email only when an admin supplied it.
    if (
      !isOpen &&
      isAdmin &&
      trimmedManagerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedManagerEmail)
    ) {
      setError("Please enter a valid manager email address.");
      return;
    }

    try {
      setLoading(true);

      if (import.meta.env.DEV) {
        console.group("[CreateGroup] Creating group");
        console.log("User:", user);
        console.log("Is admin:", isAdmin);
        console.log("Name:", trimmedName);
        console.log("Is open:", isOpen);
        console.log("Department:", trimmedDepartment || null);
        console.log(
          "Manager Email:",
          isAdmin && !isOpen ? trimmedManagerEmail || null : null,
        );
        console.groupEnd();
      }

      // ============================================================
      // Build request
      // ============================================================

      const departmentToSend = isAdmin
        ? trimmedDepartment || null
        : user?.department || null;

      // Manager is only explicitly supplied by an admin.
      //
      // For non-admin closed groups, managerEmail is null because
      // the backend should assign req.user.id as the manager.
      const managerEmailToSend =
        isAdmin && !isOpen ? trimmedManagerEmail || null : null;

      const response = await createGroup(
        trimmedName,
        isOpen,
        departmentToSend,
        managerEmailToSend,
      );

      if (import.meta.env.DEV) {
        console.group("[CreateGroup] API response");
        console.log("Response:", response);
        console.log("Created group:", response?.data);
        console.groupEnd();
      }

      const group = response?.data || null;

      setCreatedGroup(group);
      setSuccess(response?.message || "Group created successfully.");

      // ============================================================
      // Reset form after successful creation
      // ============================================================

      setName("");
      setIsOpen(true);
      setDepartment("");
      setManagerEmail("");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[CreateGroup] Failed to create group");
        console.error("Error:", err);
        console.log("Message:", err?.message);
        console.log("Status:", err?.status);
        console.groupEnd();
      }

      setError(err?.message || "Unable to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Navigation
   * --------------------------------------------------
   */

  function handleCancel() {
    navigate("/groups");
  }

  function handleCreateAnother() {
    setError("");

    setSuccess("");

    setCreatedGroup(null);

    setName("");

    setIsOpen(true);

    setDepartment("");

    setManagerEmail("");
  }

  return {
    name,

    setName,

    isOpen,

    setIsOpen,

    department,

    setDepartment,

    managerEmail,

    setManagerEmail,

    loading,

    error,

    success,

    createdGroup,

    handleSubmit,

    handleCancel,

    handleCreateAnother,
  };
}

// ------- FETCH GROUPS -------

export function useGroupsLogic() {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [groups, setGroups] = useState([]);

  const [page, setPage] = useState(1);

  const [department, setDepartment] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    has_more: false,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [joiningGroupId, setJoiningGroupId] = useState(null);

  const [joinError, setJoinError] = useState("");

  const [joinSuccess, setJoinSuccess] = useState("");

  /*
   * --------------------------------------------------
   * Review group state
   * --------------------------------------------------
   *
   * IMPORTANT:
   * These states belong to useGroupsLogic().
   * Previously they only existed inside useGroupLogic(),
   * which caused:
   *
   * ReferenceError: reviewingGroupId is not defined
   *
   * --------------------------------------------------
   */

  const [reviewingGroupId, setReviewingGroupId] = useState(null);

  const [reviewError, setReviewError] = useState("");

  const [reviewSuccess, setReviewSuccess] = useState("");

  /*
   * --------------------------------------------------
   * Fetch groups
   * --------------------------------------------------
   */

  const loadGroups = useCallback(async () => {
    const payload = {
      page,

      ...(isAdmin &&
        department && {
          department,
        }),
    };

    if (import.meta.env.DEV) {
      console.group("[Groups] Fetch Groups");

      console.log("User:", user);

      console.log("Is admin:", isAdmin);

      console.log("Page:", page);

      console.log("Department:", department);

      console.log("Request payload:", payload);

      console.groupEnd();
    }

    try {
      setLoading(true);

      setError("");

      const response = await getGroups(payload);

      if (import.meta.env.DEV) {
        console.group("[Groups] Fetch Groups Response");

        console.log("Request payload:", payload);

        console.log("Response:", response);

        console.log("Groups:", response?.data);

        console.log("Pagination:", response?.pagination);

        console.groupEnd();
      }

      /*
       * --------------------------------------------------
       * Extract groups
       * --------------------------------------------------
       */

      const responseGroups = response?.data;

      setGroups(Array.isArray(responseGroups) ? responseGroups : []);

      /*
       * --------------------------------------------------
       * Extract pagination
       * --------------------------------------------------
       */

      const responsePagination = response?.pagination || {};

      setPagination({
        page: Number(responsePagination.page) || page,

        limit: Number(responsePagination.limit) || 20,

        total: Number(responsePagination.total) || 0,

        has_more: responsePagination.has_more === true,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Groups] Fetch Groups Error");

        console.log("Request payload:", payload);

        console.error("Error:", err);

        console.log("Error message:", err?.message);

        console.log("Error status:", err?.status);

        console.groupEnd();
      }

      setGroups([]);

      setPagination({
        page,

        limit: 20,

        total: 0,

        has_more: false,
      });

      setError(err?.message || "Unable to load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, department, isAdmin, user]);

  /*
   * --------------------------------------------------
   * Load whenever page/filter/user changes
   * --------------------------------------------------
   */

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  /*
   * --------------------------------------------------
   * Join group
   * --------------------------------------------------
   */

  async function handleJoinGroup(groupId) {
    if (!groupId) {
      setJoinError("A valid group ID is required.");

      return;
    }

    setJoinError("");

    setJoinSuccess("");

    setJoiningGroupId(groupId);

    if (import.meta.env.DEV) {
      console.group("[Groups] Join Group");

      console.log("Group ID:", groupId);

      console.log("User:", user);

      console.groupEnd();
    }

    try {
      const response = await joinGroup(groupId);

      if (import.meta.env.DEV) {
        console.group("[Groups] Join Group Response");

        console.log("Group ID:", groupId);

        console.log("Response:", response);

        console.groupEnd();
      }

      setJoinSuccess(response?.message || "You joined the group successfully.");

      /*
       * Refresh the group list after joining.
       * This keeps membership-related fields
       * returned by the backend in sync.
       */

      await loadGroups();

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Groups] Join Group Error");

        console.log("Group ID:", groupId);

        console.error("Error:", err);

        console.log("Error message:", err?.message);

        console.log("Error status:", err?.status);

        console.groupEnd();
      }

      setJoinError(err?.message || "Unable to join group. Please try again.");

      throw err;
    } finally {
      setJoiningGroupId(null);
    }
  }

  /*
   * --------------------------------------------------
   * Review group request
   * --------------------------------------------------
   */

  async function handleReviewGroup(groupId, decision) {
    if (!isAdmin) {
      setReviewError("You are not authorized to review group requests.");

      return;
    }

    if (!groupId) {
      setReviewError("A valid group ID is required.");

      return;
    }

    if (!["approved", "rejected"].includes(decision)) {
      setReviewError("Invalid group review decision.");

      return;
    }

    setReviewError("");

    setReviewSuccess("");

    setReviewingGroupId(groupId);

    if (import.meta.env.DEV) {
      console.group("[Groups] Review Group");

      console.log("Group ID:", groupId);

      console.log("Decision:", decision);

      console.log("User:", user);

      console.groupEnd();
    }

    try {
      const response = await reviewGroupRequest(groupId, decision);

      if (import.meta.env.DEV) {
        console.group("[Groups] Review Group Response");

        console.log("Group ID:", groupId);

        console.log("Decision:", decision);

        console.log("Response:", response);

        console.groupEnd();
      }

      setReviewSuccess(
        response?.message ||
          `Group ${
            decision === "approved" ? "approved" : "rejected"
          } successfully.`,
      );

      /*
       * Refresh the groups list so the reviewed group
       * immediately reflects its new status.
       */

      await loadGroups();

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.group("[Groups] Review Group Error");

        console.log("Group ID:", groupId);

        console.log("Decision:", decision);

        console.error("Error:", err);

        console.log("Error message:", err?.message);

        console.log("Error status:", err?.status);

        console.groupEnd();
      }

      setReviewError(
        err?.message || "Unable to review group request. Please try again.",
      );

      throw err;
    } finally {
      setReviewingGroupId(null);
    }
  }

  /*
   * --------------------------------------------------
   * Department filter
   * --------------------------------------------------
   */

  function handleDepartmentChange(value) {
    if (!isAdmin) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Groups] Department changed:", value);
    }

    setDepartment(value);

    setPage(1);
  }

  /*
   * --------------------------------------------------
   * Previous page
   * --------------------------------------------------
   */

  function handlePreviousPage() {
    if (page <= 1) {
      return;
    }

    setPage((currentPage) => currentPage - 1);
  }

  /*
   * --------------------------------------------------
   * Next page
   * --------------------------------------------------
   */

  function handleNextPage() {
    if (!pagination.has_more) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  }

  /*
   * --------------------------------------------------
   * Clear filter
   * --------------------------------------------------
   */

  function handleClearFilter() {
    if (!isAdmin) {
      return;
    }

    setDepartment("");

    setPage(1);
  }

  return {
    groups,

    page,

    department,

    pagination,

    loading,

    error,

    isAdmin,

    /*
     * Join group
     */

    joiningGroupId,

    joinError,

    joinSuccess,

    handleJoinGroup,

    /*
     * Review group
     */

    reviewingGroupId,

    reviewError,

    reviewSuccess,

    handleReviewGroup,

    /*
     * Filters / Pagination
     */

    setDepartment: handleDepartmentChange,

    handleClearFilter,

    handlePreviousPage,

    handleNextPage,

    /*
     * Reload
     */

    reload: loadGroups,
  };
}
