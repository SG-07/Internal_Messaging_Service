// frontend/src/pages/groups/GroupDetailsLogic.js

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  getGroup,
  updateGroup,
} from '../../api/groups';


export function useGroupDetailsLogic() {
  const navigate = useNavigate();

  const {
    groupId,
  } = useParams();

  const {
    user,
  } = useAuth();


  /*
   * ----------------------------------------
   * Permissions
   * ----------------------------------------
   */

  const isAdmin =
    user?.role === 'admin';


  /*
   * ----------------------------------------
   * Group state
   * ----------------------------------------
   */

  const [group, setGroup] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  /*
   * ----------------------------------------
   * Edit state
   * ----------------------------------------
   */

  const [isEditing, setIsEditing] =
    useState(false);

  const [name, setName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [managerId, setManagerId] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState('');

  const [saveSuccess, setSaveSuccess] =
    useState('');


  /*
   * ----------------------------------------
   * Load group
   * ----------------------------------------
   */

  const loadGroup =
    useCallback(
      async () => {

        if (!groupId) {
          setError(
            'A valid group ID is required.'
          );

          setLoading(false);

          return;
        }


        if (import.meta.env.DEV) {
          console.group(
            '[Group Details] Fetch Group'
          );

          console.log(
            'Payload sent:',
            {
              groupId,
            }
          );

          console.log(
            'Route params:',
            {
              groupId,
            }
          );

          console.groupEnd();
        }


        try {
          setLoading(true);
          setError('');


          const response =
            await getGroup(groupId);


          if (import.meta.env.DEV) {
            console.group(
              '[Group Details] Fetch Group Response'
            );

            console.log(
              'Group ID:',
              groupId
            );

            console.log(
              'Full response:',
              response
            );

            console.log(
              'Response data:',
              response?.data
            );

            console.log(
              'Response message:',
              response?.message
            );

            console.groupEnd();
          }


          const responseGroup =
            response?.data || null;


          if (!responseGroup) {
            throw new Error(
              'Group details were not returned by the server.'
            );
          }


          setGroup(
            responseGroup
          );


          /*
           * Keep edit fields synchronized
           * with the latest server response.
           */

          setName(
            responseGroup.name || ''
          );

          setDescription(
            responseGroup.description || ''
          );

          setManagerId(
            responseGroup.manager?.id || ''
          );


        } catch (err) {

          if (import.meta.env.DEV) {
            console.group(
              '[Group Details] Fetch Group Error'
            );

            console.log(
              'Payload sent:',
              {
                groupId,
              }
            );

            console.error(
              'Error:',
              err
            );

            console.log(
              'Status:',
              err?.status
            );

            console.log(
              'Message:',
              err?.message
            );

            console.groupEnd();
          }


          setGroup(null);

          setError(
            err?.message ||
              'Unable to load group details. Please try again.'
          );

        } finally {
          setLoading(false);
        }

      },
      [
        groupId,
      ]
    );


  /*
   * ----------------------------------------
   * Initial load
   * ----------------------------------------
   */

  useEffect(
    () => {
      loadGroup();
    },
    [
      loadGroup,
    ]
  );


  /*
   * ----------------------------------------
   * Open edit mode
   * ----------------------------------------
   */

  function handleStartEdit() {
    if (!group) {
      return;
    }


    setSaveError('');
    setSaveSuccess('');


    setName(
      group.name || ''
    );

    setDescription(
      group.description || ''
    );

    setManagerId(
      group.manager?.id || ''
    );


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


    setSaveError('');
    setSaveSuccess('');


    setName(
      group?.name || ''
    );

    setDescription(
      group?.description || ''
    );

    setManagerId(
      group?.manager?.id || ''
    );


    setIsEditing(false);
  }


  /*
   * ----------------------------------------
   * Save group
   * ----------------------------------------
   */

  async function handleSave() {
    if (!groupId || !group) {
      setSaveError(
        'A valid group is required.'
      );

      return;
    }


    const trimmedName =
      name.trim();

    const trimmedDescription =
      description.trim();


    /*
     * Frontend validation
     */

    if (!trimmedName) {
      setSaveError(
        'Please enter a group name.'
      );

      return;
    }


    if (
      trimmedName.length > 255
    ) {
      setSaveError(
        'Group name cannot exceed 255 characters.'
      );

      return;
    }


    /*
     * Only include fields that are
     * allowed for this frontend user.
     */

    const payload = {
      name:
        trimmedName,

      description:
        trimmedDescription || null,
    };


    /*
     * Manager can only be changed
     * by an admin in the frontend.
     *
     * Backend must still enforce this.
     */

    if (isAdmin) {
      payload.manager_id =
        managerId.trim() || null;
    }


    if (import.meta.env.DEV) {
      console.group(
        '[Group Details] Update Group'
      );

      console.log(
        'Group ID:',
        groupId
      );

      console.log(
        'Current user:',
        user
      );

      console.log(
        'Is admin:',
        isAdmin
      );

      console.log(
        'Payload sent:',
        payload
      );

      console.groupEnd();
    }


    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');


      const response =
        await updateGroup(
          groupId,
          payload
        );


      if (import.meta.env.DEV) {
        console.group(
          '[Group Details] Update Group Response'
        );

        console.log(
          'Group ID:',
          groupId
        );

        console.log(
          'Payload sent:',
          payload
        );

        console.log(
          'Full response:',
          response
        );

        console.log(
          'Response data:',
          response?.data
        );

        console.log(
          'Response message:',
          response?.message
        );

        console.groupEnd();
      }


      /*
       * Use the updated group returned
       * by the API when available.
       */

      const updatedGroup =
        response?.data || null;


      if (updatedGroup) {

        setGroup(
          updatedGroup
        );

        setName(
          updatedGroup.name || ''
        );

        setDescription(
          updatedGroup.description || ''
        );

        setManagerId(
          updatedGroup.manager?.id || ''
        );

      } else {

        /*
         * If the update endpoint does not
         * return the complete group object,
         * fetch it again.
         */

        await loadGroup();
      }


      setSaveSuccess(
        response?.message ||
        'Group updated successfully.'
      );


      setIsEditing(false);


    } catch (err) {

      if (import.meta.env.DEV) {
        console.group(
          '[Group Details] Update Group Error'
        );

        console.log(
          'Group ID:',
          groupId
        );

        console.log(
          'Payload sent:',
          payload
        );

        console.error(
          'Error:',
          err
        );

        console.log(
          'Status:',
          err?.status
        );

        console.log(
          'Message:',
          err?.message
        );

        console.groupEnd();
      }


      setSaveError(
        err?.message ||
        'Unable to update group. Please try again.'
      );

    } finally {
      setSaving(false);
    }
  }


  /*
   * ----------------------------------------
   * Navigation
   * ----------------------------------------
   */

  function handleBack() {
    navigate('/groups');
  }


  return {
    group,

    groupId,

    user,

    isAdmin,

    loading,

    error,

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

    handleStartEdit,

    handleCancelEdit,

    handleSave,

    handleBack,

    reload:
      loadGroup,
  };
}