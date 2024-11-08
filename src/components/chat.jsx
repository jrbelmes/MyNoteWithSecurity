import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([
    { id: 1, email: 'user1@example.com', name: 'User One', lastMessage: 'Hello there', timestamp: new Date(), unread: 2 },
    { id: 2, email: 'user2@example.com', name: 'User Two', lastMessage: 'See you tomorrow', timestamp: new Date(), unread: 0 },
  ]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsVisible(false);
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchTerm('');
    }
  };

  const filteredMessages = messages.filter(message => 
    message.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && (
        <img
          src={message.avatar || 'default-avatar.png'}
          className="w-8 h-8 rounded-full mr-2"
          alt="avatar"
        />
      )}
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100'
        }`}
      >
        <p>{message.text}</p>
        <span className="text-xs mt-1 block opacity-70">
          {format(new Date(message.timestamp), 'HH:mm')}
          {isOwn && (
            <span className="ml-2">
              {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '✓✓✓'}
            </span>
          )}
        </span>
      </div>
    </div>
  );

  const handleSend = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        timestamp: new Date(),
        status: 'sent',
        isOwn: true,
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleNewConversation = (admin) => {
    const newConversation = {
      id: Date.now(),
      email: admin.email,
      name: admin.name,
      lastMessage: '',
      timestamp: new Date(),
      unread: 0,
    };
    setConversations([...conversations, newConversation]);
    setActiveConversation(newConversation);
    setShowNewChat(false);
    setSearchEmail('');
  };

  const searchEmails = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
  
    setIsLoading(true);
    setErrorMessage('');
    console.log('Searching for email:', query); // Added console log
  
    try {
      const formData = new FormData();
      formData.append('operation', 'fetchSuperAdminByEmail');
      formData.append('email', query);

      const response = await fetch('http://localhost/coc/gsd/user.php', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      console.log('Search results:', result);
      
      // Modified this section to handle the response structure
      if (result.status === 'success' && Array.isArray(result.data)) {
        const adminEmails = result.data.map(admin => ({
          email: admin.super_admin_email,
          name: admin.super_admin_name,
          id: admin.super_admin_id
        }));
        setSearchResults(adminEmails);
        console.log('Processed results:', adminEmails); // Debug log
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching emails:', error);
      setErrorMessage('Failed to search emails');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 right-4 ${isOpen ? 'h-[600px]' : 'h-12'} transition-all duration-300`}>
      {isOpen ? (
        <div className="flex flex-col h-full w-[350px] bg-white rounded-t-lg shadow-lg">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold">Messages</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 19h18v-2H3v2zm0-6h18v-2H3v2zm0-8v2h18V5H3z"/>
                </svg>
              </button>
              <button onClick={closeChat} className="p-1 hover:bg-gray-200 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {showNewChat ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      searchEmails(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchEmails(searchEmail);
                      }
                    }}
                    placeholder="Search email..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                {searchResults.map((admin) => (
                  <div
                    key={admin.id}
                    onClick={() => handleNewConversation(admin)}
                    className="p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
                  >
                    <div className="flex items-center">
                      <img src="default-avatar.png" className="w-8 h-8 rounded-full mr-3" alt="avatar" />
                      <div>
                        <span className="font-semibold">{admin.name}</span>
                        <span className="text-sm text-gray-500 block">{admin.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="p-3 text-center text-gray-500">
                    Searching...
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 text-center text-red-500">
                    {errorMessage}
                  </div>
                )}
              </div>
            ) : activeConversation ? (
              <div className="flex flex-col h-full">
                {/* Chat header */}
                <div className="p-4 border-b flex items-center">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="p-1 hover:bg-gray-200 rounded mr-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <img src="default-avatar.png" className="w-8 h-8 rounded-full mr-3" alt="avatar" />
                  <div>
                    <span className="font-semibold block">{activeConversation.name}</span>
                    <span className="text-sm text-gray-500">{activeConversation.email}</span>
                  </div>
                </div>
                
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.isOwn}
                    />
                  ))}
                </div>

                {/* Input area */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded-full focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSend}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img src="default-avatar.png" className="w-10 h-10 rounded-full mr-3" alt="avatar" />
                        <div>
                          <h4 className="font-semibold">{conv.name}</h4>
                          <p className="text-sm text-gray-500">{conv.email}</p>
                          <p className="text-xs text-gray-400">{conv.lastMessage}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(conv.timestamp), 'HH:mm')}
                        {conv.unread > 0 && (
                          <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          onClick={toggleChat}
          className="w-[350px] h-full bg-gray-50 rounded-t-lg shadow-lg cursor-pointer hover:bg-gray-100 flex items-center justify-between px-4"
        >
          <div className="flex items-center">
            <img src="default-avatar.png" className="w-6 h-6 rounded-full mr-2" alt="avatar" />
            <span className="font-semibold">Chat Room</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeChat();
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;
