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
  getGroup,
} from '../../api/groups';


export function useGroupDetailsLogic() {
  const navigate = useNavigate();

  const {
    groupId,
  } = useParams();


  /*
   * ----------------------------------------
   * State
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


        /*
         * ----------------------------------------
         * Frontend request debug
         * ----------------------------------------
         */

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


          /*
           * API request
           */

          const response =
            await getGroup(groupId);


          /*
           * ----------------------------------------
           * Frontend response debug
           * ----------------------------------------
           */

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


          /*
           * ----------------------------------------
           * Extract group
           * ----------------------------------------
           */

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
   * Navigation
   * ----------------------------------------
   */

  function handleBack() {
    navigate('/groups');
  }


  return {
    group,

    groupId,

    loading,

    error,

    handleBack,

    reload:
      loadGroup,
  };
}