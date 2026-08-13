import ConversationListItem from './ConversationListItem';

function ConversationList({ conversations, onConversationClick }) {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 divide-y divide-gray-200 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          onClick={onConversationClick}
        />
      ))}
    </div>
  );
}

export default ConversationList;