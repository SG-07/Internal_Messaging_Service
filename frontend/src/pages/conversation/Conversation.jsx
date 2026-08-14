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

  async function handleActionStatusChange(status) {
    if (import.meta.env.DEV) {
      console.log(
        '[Conversation] Action status requested:',
        status
      );
    }
  }

  async function handleDecisionChange(status) {
    if (import.meta.env.DEV) {
      console.log(
        '[Conversation] Decision status requested:',
        status
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading conversation...
        </p>
      </div>
    );
  }

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

  if (!conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Conversation not found.
        </p>
      </div>
    );
  }

  const category = (
    conversation.category ||
    conversation.conversation_type ||
    ''
  ).toLowerCase();

  const canRespond = false;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-white shadow-sm">

        <ConversationHeader
          subject={conversation.subject}
          category={category}
        />

        <ConversationInfo
          conversation={conversation}
        />

        {category === 'action_required' && (
          <ActionSection
            status={
              conversation.action_status ||
              'PENDING'
            }
            canRespond={canRespond}
            onStatusChange={
              handleActionStatusChange
            }
          />
        )}

        {category === 'approval_required' && (
          <ApprovalSection
            status={
              conversation.decision_status ||
              'PENDING'
            }
            canRespond={canRespond}
            onDecisionChange={
              handleDecisionChange
            }
          />
        )}

        <FollowUpSection
          followUpAfter={
            conversation.follow_up_after
          }
          status={
            conversation.follow_up_status ||
            'Waiting for response'
          }
        />

        <main className="flex-1">
          <MessageThread
            messages={messages}
            onMarkAsRead={handleMarkAsRead}
          />
        </main>

        <ReplyBox
          onSendReply={handleSendReply}
        />
      </div>
    </div>
  );
}

export default Conversation;