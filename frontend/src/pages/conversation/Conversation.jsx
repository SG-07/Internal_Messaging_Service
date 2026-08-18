// frontend/src/pages/conversation/Conversation.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import {
  getConversation,
  markMessageAsRead,
  sendMessage,
} from '../../api/conversations';

import ConversationHeader from './ConversationHeader';
import ConversationInfo from './ConversationInfo';
import MessageThread from './MessageThread';
import ActionSection from './ActionSection';
import ApprovalSection from './ApprovalSection';
import FollowUpSection from './FollowUpSection';
import ReplyBox from './ReplyBox';

function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --------------------------------------------------
  // Load conversation
  // --------------------------------------------------

  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setError('');

        if (import.meta.env.DEV) {
          console.log(
            '[Conversation] Loading conversation:',
            id
          );
        }

        const response = await getConversation(id);

        if (import.meta.env.DEV) {
          console.log(
            '[Conversation] Conversation response:',
            response
          );
        }

        const data =
          response?.conversation ||
          response?.data ||
          response;

        setConversation(data);
        setMessages(data?.messages || []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(
            '[Conversation] Failed to load conversation:',
            err
          );
        }

        setError(
          err.message ||
            'Unable to load conversation. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadConversation();
    }
  }, [id]);

  // --------------------------------------------------
  // Mark message as read
  // --------------------------------------------------

  async function handleMarkAsRead(messageId) {
    try {
      await markMessageAsRead(messageId);

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          return {
            ...message,
            is_read: true,
            read_at: new Date().toISOString(),
          };
        })
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[Conversation] Failed to mark message as read:',
          err
        );
      }
    }
  }

  // --------------------------------------------------
  // Send reply
  // --------------------------------------------------

  async function handleSendReply(content) {
    const payload = {
      body: content,
    };

    if (import.meta.env.DEV) {
      console.log(
        '[Conversation] Sending reply:',
        {
          endpoint: `/api/conversations/${id}/messages`,
          method: 'POST',
          payload,
        }
      );
    }

    try {
      const response = await sendMessage(
        id,
        content
      );

      if (import.meta.env.DEV) {
        console.log(
          '[Conversation] Reply response:',
          response
        );
      }

      const sentMessage = response?.data;

      if (sentMessage) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            id: sentMessage.message_id,
            content: sentMessage.content,
            body: sentMessage.content,
            sender_id: sentMessage.sender_id,
            sender_name: sentMessage.sender_name,
            created_at: sentMessage.sent_at,
          },
        ]);
      }

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[Conversation] Failed to send reply:',
          {
            error: err,
            endpoint: `/api/conversations/${id}/messages`,
            method: 'POST',
            payload,
          }
        );
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Update workflow status
  // --------------------------------------------------

  async function updateWorkflowStatus(
    type,
    status,
    comment = ''
  ) {
    const endpoint =
      type === 'action'
        ? `/api/conversations/${id}/action`
        : `/api/conversations/${id}/approval`;

    const payload = {
      status,
      comment: comment || '',
    };

    if (import.meta.env.DEV) {
      console.log(
        '[Conversation] Updating workflow:',
        {
          type,
          endpoint,
          method: 'PATCH',
          payload,
        }
      );
    }

    const response = await fetch(
      endpoint,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (import.meta.env.DEV) {
      console.log(
        '[Conversation] Workflow update response:',
        data
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          'Unable to update workflow status.'
      );
    }

    return data;
  }

  // --------------------------------------------------
  // Extract workflow from PATCH response
  // --------------------------------------------------

  function getUpdatedWorkflow(
    response,
    fallbackWorkflow,
    status
  ) {
    /*
     * Backend may return the workflow in different
     * response shapes depending on the controller.
     *
     * Prefer the backend response whenever available.
     */

    const backendWorkflow =
      response?.workflow ||
      response?.data?.workflow ||
      response?.data?.conversation?.workflow ||
      response?.conversation?.workflow;

    if (backendWorkflow) {
      return backendWorkflow;
    }

    /*
     * Fallback only when the backend does not return
     * workflow information.
     */

    const isAction =
      fallbackWorkflow?.type === 'action';

    const isFinal = isAction
      ? status === 'DONE' ||
        status === 'REJECTED'
      : status === 'APPROVED' ||
        status === 'REJECTED';

    return {
      ...fallbackWorkflow,
      status,
      is_final: isFinal,

      /*
       * MORE_INFO is not final.
       *
       * For a fallback response, we cannot know who
       * should respond next. The safest frontend behavior
       * is to disable the current buttons until the next
       * conversation fetch gives us the authoritative
       * can_respond value from the backend.
       */
      can_respond: false,
    };
  }

  // --------------------------------------------------
  // Action status change
  // --------------------------------------------------

  async function handleActionStatusChange(
    status,
    comment = ''
  ) {
    if (
      !conversation?.workflow?.can_respond ||
      conversation?.workflow?.is_final ||
      conversation?.workflow?.type !== 'action'
    ) {
      return;
    }

    try {
      const response =
        await updateWorkflowStatus(
          'action',
          status,
          comment
        );

      const updatedWorkflow =
        getUpdatedWorkflow(
          response,
          conversation.workflow,
          status
        );

      setConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,
          workflow: updatedWorkflow,
          updated_at:
            response?.updated_at ||
            response?.data?.updated_at ||
            previousConversation.updated_at,
        };
      });

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[Conversation] Failed to update action status:',
          err
        );
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Approval status change
  // --------------------------------------------------

  async function handleDecisionChange(
    status,
    comment = ''
  ) {
    if (
      !conversation?.workflow?.can_respond ||
      conversation?.workflow?.is_final ||
      conversation?.workflow?.type !== 'approval'
    ) {
      return;
    }

    try {
      const response =
        await updateWorkflowStatus(
          'approval',
          status,
          comment
        );

      const updatedWorkflow =
        getUpdatedWorkflow(
          response,
          conversation.workflow,
          status
        );

      setConversation((previousConversation) => {
        if (!previousConversation) {
          return previousConversation;
        }

        return {
          ...previousConversation,
          workflow: updatedWorkflow,
          updated_at:
            response?.updated_at ||
            response?.data?.updated_at ||
            previousConversation.updated_at,
        };
      });

      return response;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(
          '[Conversation] Failed to update approval status:',
          err
        );
      }

      throw err;
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading conversation...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-semibold text-gray-900">
            Unable to load conversation
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Conversation not found
  // --------------------------------------------------

  if (!conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Conversation not found.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Conversation category
  // --------------------------------------------------

  const category = (
    conversation.category ||
    conversation.conversation_type ||
    ''
  ).toLowerCase();

  // --------------------------------------------------
  // Workflow
  // --------------------------------------------------

  const workflow =
    conversation.workflow || null;

  const workflowType =
    workflow?.type || null;

  const workflowStatus =
    workflow?.status || 'PENDING';

  /*
   * IMPORTANT:
   *
   * Do NOT calculate canRespond from the category,
   * created_by, participants, etc.
   *
   * Backend already determines whether the current
   * logged-in user can respond.
   */
  const canRespond =
    workflow?.can_respond === true &&
    workflow?.is_final !== true;

  if (import.meta.env.DEV) {
    console.log(
      '[Conversation] Workflow state:',
      {
        category,
        workflow,
        workflowType,
        workflowStatus,
        canRespond,
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-white shadow-sm">

        {/* --------------------------------------------------
            Header
            -------------------------------------------------- */}

        <ConversationHeader
          subject={conversation.subject}
          category={category}
        />

        {/* --------------------------------------------------
            Conversation information
            -------------------------------------------------- */}

        <ConversationInfo
          conversation={conversation}
        />

        {/* --------------------------------------------------
            ACTION REQUIRED
            -------------------------------------------------- */}

        {workflowType === 'action' && (
          <ActionSection
            status={workflowStatus}
            canRespond={canRespond}
            onStatusChange={
              handleActionStatusChange
            }
          />
        )}

        {/* --------------------------------------------------
            APPROVAL REQUIRED
            -------------------------------------------------- */}

        {workflowType === 'approval' && (
          <ApprovalSection
            status={workflowStatus}
            canRespond={canRespond}
            onDecisionChange={
              handleDecisionChange
            }
          />
        )}

        {/* --------------------------------------------------
            Follow-up
            -------------------------------------------------- */}

        <FollowUpSection
          followUpAfter={
            conversation.follow_up_after
          }
          status={
            conversation.follow_up_status ||
            'Waiting for response'
          }
        />

        {/* --------------------------------------------------
            Messages
            -------------------------------------------------- */}

        <main className="flex-1">
          <MessageThread
            messages={messages}
            onMarkAsRead={handleMarkAsRead}
          />
        </main>

        {/* --------------------------------------------------
            Reply
            -------------------------------------------------- */}

        <ReplyBox
          onSendReply={handleSendReply}
        />
      </div>
    </div>
  );
}

export default Conversation;