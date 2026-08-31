// src/pages/groups/MyGroupsLogic.js

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router";

import { getMyGroups } from "../../api/groups";
import { useAuth } from "../../context/AuthContext"; // ⬅ adjust to your actual auth hook/context

export function useMyGroupsLogic() {
  const navigate = useNavigate();

  const { user } = useAuth(); // ⬅ assumption: decoded JWT payload exposed here, with user.id

  /*
   * ----------------------------------------
   * Groups state
   * ----------------------------------------
   */

  const [groups, setGroups] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
   * ----------------------------------------
   * Filters
   * ----------------------------------------
   */

  const [status, setStatus] = useState("");

  const [sortBy, setSortBy] = useState("newest");

  /*
   * ----------------------------------------
   * Pagination
   * ----------------------------------------
   */

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [hasMore, setHasMore] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  /*
   * ----------------------------------------
   * Load groups
   * ----------------------------------------
   */

  const loadGroups = useCallback(
    async ({
      page: requestedPage = 1,
      append = false,
    } = {}) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = {
          page: requestedPage,
          sort_by: sortBy,
        };

        if (status) {
          params.status = status;
        }

        if (import.meta.env.DEV) {
          console.group(
            "[My Groups] Fetch Groups",
          );

          console.log(
            "Payload sent:",
            params,
          );

          console.log("Query:", {
            page: requestedPage,
            status: status || "all",
            sort_by: sortBy,
          });

          console.groupEnd();
        }

        const response = await getMyGroups(params);

        if (import.meta.env.DEV) {
          console.group(
            "[My Groups] Fetch Groups Response",
          );

          console.log(
            "Full response:",
            response,
          );

          console.log(
            "Response data:",
            response?.data,
          );

          console.log(
            "Pagination:",
            response?.pagination,
          );

          console.groupEnd();
        }

        const responseGroups = Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

        /*
         * Tag each group with whether the
         * current (JWT) user is its creator.
         */

        const taggedGroups = responseGroups.map(
          (group) => ({
            ...group,
            is_creator:
              !!user?.id &&
              group.created_by === user.id,
          }),
        );

        const pagination =
          response?.pagination || {};

        setGroups((previousGroups) => {
          if (!append) {
            return taggedGroups;
          }

          /*
           * Prevent duplicate groups when
           * loading another page.
           */

          const existingIds = new Set(
            previousGroups.map(
              (group) => group.id,
            ),
          );

          const newGroups =
            taggedGroups.filter(
              (group) =>
                !existingIds.has(group.id),
            );

          return [
            ...previousGroups,
            ...newGroups,
          ];
        });

        setPage(
          Number.isFinite(
            Number(pagination.page),
          )
            ? Number(pagination.page)
            : requestedPage,
        );

        setTotal(
          Number.isFinite(
            Number(pagination.total),
          )
            ? Number(pagination.total)
            : responseGroups.length,
        );

        setHasMore(
          pagination.has_more === true,
        );
      } catch (err) {
        if (import.meta.env.DEV) {
          console.group(
            "[My Groups] Fetch Groups Error",
          );

          console.error("Error:", err);

          console.log(
            "Status:",
            err?.status,
          );

          console.log(
            "Message:",
            err?.message,
          );

          console.groupEnd();
        }

        setError(
          err?.message ||
            "Unable to load your groups. Please try again.",
        );

        /*
         * Only clear the list on a normal
         * first-page request.
         */

        if (!append) {
          setGroups([]);
          setTotal(0);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [status, sortBy, user?.id],
  );

  /*
   * ----------------------------------------
   * Initial load / filter changes
   * ----------------------------------------
   */

  useEffect(() => {
    setPage(1);

    loadGroups({
      page: 1,
      append: false,
    });
  }, [loadGroups]);

  /*
   * ----------------------------------------
   * Change status filter
   * ----------------------------------------
   */

  function handleStatusChange(value) {
    setStatus(value);
  }

  /*
   * ----------------------------------------
   * Change sorting
   * ----------------------------------------
   */

  function handleSortChange(value) {
    setSortBy(value);
  }

  /*
   * ----------------------------------------
   * Load more
   * ----------------------------------------
   */

  async function handleLoadMore() {
    if (
      loadingMore ||
      loading ||
      !hasMore
    ) {
      return;
    }

    await loadGroups({
      page: page + 1,
      append: true,
    });
  }

  /*
   * ----------------------------------------
   * Retry
   * ----------------------------------------
   */

  async function handleRetry() {
    await loadGroups({
      page: 1,
      append: false,
    });
  }

  /*
   * ----------------------------------------
   * Open group chat
   * ----------------------------------------
   */

  function handleOpenGroup(groupId) {
    if (!groupId) {
      return;
    }

    navigate(
      `/groups/${groupId}/chat`,
    );
  }

  /*
   * ----------------------------------------
   * View group members
   * ----------------------------------------
   *
   * NOTE:
   * Verify this path against your App.jsx
   * if your existing members route uses
   * a different URL.
   */

  function handleViewMembers(groupId) {
    if (!groupId) {
      return;
    }

    navigate(
      `/groups/${groupId}/members`,
    );
  }

  /*
   * ----------------------------------------
   * View group details
   * ----------------------------------------
   *
   * NOTE:
   * Verify this path against your App.jsx
   * if your existing details route uses
   * a different URL.
   */

  function handleViewDetails(groupId) {
    if (!groupId) {
      return;
    }

    navigate(
      `/groups/${groupId}`,
    );
  }

  /*
   * ----------------------------------------
   * Back
   * ----------------------------------------
   */

  function handleBack() {
    navigate("/dashboard");
  }

  return {
    groups,

    loading,

    error,

    status,
    sortBy,

    page,
    total,
    hasMore,

    loadingMore,

    handleStatusChange,
    handleSortChange,

    handleLoadMore,
    handleRetry,

    handleOpenGroup,
    handleViewMembers,
    handleViewDetails,

    handleBack,

    reload: handleRetry,
  };
}