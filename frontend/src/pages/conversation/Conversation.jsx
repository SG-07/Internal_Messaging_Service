// frontend/src/pages/conversation/Conversation.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import {
  getConversation,
  getConversationMessages,
  markMessageAsRead,
  deleteMessage,
} from '../../api/conversations';


function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deletingMessageId, setDeletingMessageId] =
    useState(null);


  //Load conversation and messages
  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setError('');

        const conversationResult =
          await getConversation(id);

        const messagesResult =
          await getConversationMessages(id);

        setConversation(
          conversationResult.conversation ||
          conversationResult
        );

        setMessages(
          messagesResult.messages ||
          messagesResult
        );
      } catch (err) {
        setError(
          err.message ||
          'Unable to load conversation.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadConversation();
    }
  }, [id]);


  //Mark a message as read
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
      console.error(
        'Failed to mark message as read:',
        err
      );
    }
  }


  //Delete a message
  async function handleDelete(messageId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this message?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMessageId(messageId);

      await deleteMessage(messageId);

      /*
       * Soft delete:
       * Keep the message in the conversation,
       * but mark it as deleted.
       */
      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          return {
            ...message,
            deleted_at: new Date().toISOString(),
          };
        })
      );
    } catch (err) {
      setError(
        err.message ||
        'Unable to delete the message.'
      );
    } finally {
      setDeletingMessageId(null);
    }
  }


  //Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Loading conversation...
        </p>
      </div>
    );
  }


  //Error state/
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
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }


  //Conversation not found
  if (!conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Conversation not found.
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Dashboard
        </button>


        {/* Conversation container */}
        <div className="overflow-hidden rounded-2xl bg-white shadow">

          {/* Conversation header */}
          <div className="border-b border-gray-200 px-6 py-5">
            <h1 className="text-2xl font-semibold text-gray-900">
              {conversation.subject ||
                'Conversation'}
            </h1>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">

              {conversation.status && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {conversation.status}
                </span>
              )}

              {conversation.type && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {conversation.type}
                </span>
              )}

            </div>
          </div>


          {/* Messages */}
          <div className="divide-y divide-gray-200">

            {messages.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No messages in this conversation.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="px-6 py-6"
                >

                  {/* Message header */}
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="font-semibold text-gray-900">
                        {message.sender?.fullName ||
                          message.sender?.fullname ||
                          message.fullName ||
                          message.fullname ||
                          message.sender_name ||
                          'Unknown User'}
                      </p>

                      {message.sender?.email && (
                        <p className="text-sm text-gray-500">
                          {message.sender.email}
                        </p>
                      )}
                    </div>


                    {message.created_at && (
                      <time className="text-xs text-gray-500">
                        {new Date(
                          message.created_at
                        ).toLocaleString()}
                      </time>
                    )}

                  </div>


                  {/* Message body */}
                  <div className="mt-4">

                    {message.deleted_at ? (
                      <p className="text-sm italic text-gray-500">
                        This message was deleted.
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {message.body}
                      </p>
                    )}

                  </div>


                  {/* Message actions */}
                  {!message.deleted_at && (
                    <div className="mt-4 flex gap-4">

                      {!message.is_read && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkAsRead(
                              message.id
                            )
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Mark as read
                        </button>
                      )}


                      <button
                        type="button"
                        disabled={
                          deletingMessageId ===
                          message.id
                        }
                        onClick={() =>
                          handleDelete(
                            message.id
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingMessageId ===
                        message.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>

                    </div>
                  )}

                </div>
              ))
            )}

          </div>

        </div>

      </div>
    </div>
  );
}


export default Conversation;
