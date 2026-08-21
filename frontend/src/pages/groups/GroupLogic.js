// frontend/src/pages/groups/GroupLogic.js

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

import {
  createGroup,
  getGroups,
} from '../../api/groups';


// ------- CREATE GROUP  -------

export function useGroupLogic() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const [department, setDepartment] =
    useState('');

  const [managerId, setManagerId] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [createdGroup, setCreatedGroup] =
    useState(null);


  /*
   * --------------------------------------------------
   * Submit
   * --------------------------------------------------
   */
  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setCreatedGroup(null);

    const trimmedName = name.trim();

    const trimmedDepartment =
      isAdmin
        ? department.trim()
        : '';

    const trimmedManagerId =
      managerId.trim();


    // Frontend validation

    if (!trimmedName) {
      setError(
        'Please enter a group name.'
      );
      return;
    }

    if (trimmedName.length > 255) {
      setError(
        'Group name cannot exceed 255 characters.'
      );
      return;
    }


    try {
      setLoading(true);

      if (import.meta.env.DEV) {
        console.group(
          '[CreateGroup] Creating group'
        );

        console.log(
          'User:',
          user
        );

        console.log(
          'Is admin:',
          isAdmin
        );

        console.log(
          'Name:',
          trimmedName
        );

        console.log(
          'Is open:',
          isOpen
        );

        console.log(
          'Department:',
          trimmedDepartment || null
        );

        console.log(
          'Manager ID:',
          trimmedManagerId || null
        );

        console.groupEnd();
      }


      //    ------------ Build request -------------
      const response = await createGroup(
        trimmedName,
        isOpen,
        isAdmin
          ? trimmedDepartment || null
          : null,
        trimmedManagerId || null
      );


      if (import.meta.env.DEV) {
        console.group(
          '[CreateGroup] API response'
        );

        console.log(
          'Response:',
          response
        );

        console.log(
          'Created group:',
          response?.data
        );

        console.groupEnd();
      }


      const group =
        response?.data || null;

      setCreatedGroup(group);

      setSuccess(
        response?.message ||
          'Group created successfully.'
      );


      /*
       * Reset form after successful creation.
       */
      setName('');
      setIsOpen(true);
      setDepartment('');
      setManagerId('');

    } catch (err) {

      if (import.meta.env.DEV) {
        console.group(
          '[CreateGroup] Failed to create group'
        );

        console.error(
          'Error:',
          err
        );

        console.log(
          'Message:',
          err?.message
        );

        console.log(
          'Status:',
          err?.status
        );

        console.groupEnd();
      }

      setError(
        err?.message ||
          'Unable to create group. Please try again.'
      );

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
    navigate('/groups');
  }


  function handleCreateAnother() {
    setError('');
    setSuccess('');
    setCreatedGroup(null);

    setName('');
    setIsOpen(true);
    setDepartment('');
    setManagerId('');
  }


  return {
    name,
    setName,

    isOpen,
    setIsOpen,

    department,
    setDepartment,

    managerId,
    setManagerId,

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

  const isAdmin =
    user?.role === 'admin';


  const [groups, setGroups] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [department, setDepartment] =
    useState('');

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      has_more: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  /*
   * --------------------------------------------------
   * Fetch groups
   * --------------------------------------------------
   */
  const loadGroups = useCallback(
    async () => {

      const payload = {
        page,

        ...(isAdmin &&
          department && {
            department,
          }),
      };


      if (import.meta.env.DEV) {
        console.group(
          '[Groups] Fetch Groups'
        );

        console.log(
          'User:',
          user
        );

        console.log(
          'Is admin:',
          isAdmin
        );

        console.log(
          'Page:',
          page
        );

        console.log(
          'Department:',
          department
        );

        console.log(
          'Request payload:',
          payload
        );

        console.groupEnd();
      }


      try {
        setLoading(true);
        setError('');


        const response =
          await getGroups(payload);


        if (import.meta.env.DEV) {
          console.group(
            '[Groups] Fetch Groups Response'
          );

          console.log(
            'Request payload:',
            payload
          );

          console.log(
            'Response:',
            response
          );

          console.log(
            'Groups:',
            response?.data
          );

          console.log(
            'Pagination:',
            response?.pagination
          );

          console.groupEnd();
        }


        /*
         * --------------------------------------------------
         * Extract groups
         * --------------------------------------------------
         */

        const responseGroups =
          response?.data;


        setGroups(
          Array.isArray(responseGroups)
            ? responseGroups
            : []
        );


        /*
         * --------------------------------------------------
         * Extract pagination
         * --------------------------------------------------
         */

        const responsePagination =
          response?.pagination || {};


        setPagination({
          page:
            Number(
              responsePagination.page
            ) || page,

          limit:
            Number(
              responsePagination.limit
            ) || 20,

          total:
            Number(
              responsePagination.total
            ) || 0,

          has_more:
            responsePagination.has_more === true,
        });

      } catch (err) {

        if (import.meta.env.DEV) {
          console.group(
            '[Groups] Fetch Groups Error'
          );

          console.log(
            'Request payload:',
            payload
          );

          console.error(
            'Error:',
            err
          );

          console.log(
            'Error message:',
            err?.message
          );

          console.log(
            'Error status:',
            err?.status
          );

          console.groupEnd();
        }


        setGroups([]);

        setPagination({
          page,
          limit: 20,
          total: 0,
          has_more: false,
        });

        setError(
          err?.message ||
            'Unable to load groups. Please try again.'
        );

      } finally {
        setLoading(false);
      }

    },
    [
      page,
      department,
      isAdmin,
      user,
    ]
  );


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
   * Department filter
   * --------------------------------------------------
   */

  function handleDepartmentChange(value) {
    if (!isAdmin) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        '[Groups] Department changed:',
        value
      );
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

    setPage(
      currentPage =>
        currentPage - 1
    );
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

    setPage(
      currentPage =>
        currentPage + 1
    );
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

    setDepartment('');
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

    setDepartment:
      handleDepartmentChange,

    handleClearFilter,

    handlePreviousPage,

    handleNextPage,

    reload:
      loadGroups,
  };
}