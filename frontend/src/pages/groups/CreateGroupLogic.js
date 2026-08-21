// frontend/src/pages/groups/CreateGroupLogic.js

import { useState } from 'react';
import { useNavigate } from 'react-router';

import { createGroup } from '../../api/groups';

export function useCreateGroupLogic() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      department.trim();
    const trimmedManagerId =
      managerId.trim();

    /*
     * --------------------------------------------------
     * Frontend validation
     * --------------------------------------------------
     */

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

      const response =
        await createGroup(
          trimmedName,
          isOpen,
          trimmedDepartment || null,
          trimmedManagerId || null
        );

      if (import.meta.env.DEV) {
        console.log(
          '[CreateGroup] API response:',
          response
        );
      }

      const group =
        response?.data || null;

      setCreatedGroup(group);

      setSuccess(
        response?.message ||
          'Group created successfully.'
      );

      /*
       * Reset the form after successful creation.
       */
      setName('');
      setIsOpen(true);
      setDepartment('');
      setManagerId('');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[CreateGroup] Failed to create group:',
          err
        );
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
    navigate('/dashboard');
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