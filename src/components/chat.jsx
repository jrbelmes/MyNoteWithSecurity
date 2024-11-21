import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiMoreVertical, FiSearch, FiPaperclip, FiMic, FiSend, FiX, FiChevronLeft } from 'react-icons/fi';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState({
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('name'),
    picture: localStorage.getItem('profile_pic')
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [reactions, setReactions] = useState({});
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConversation) {
      fetchChatHistory(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    fetchAllChats();
    // Set up periodic refresh every 10 seconds
    const intervalId = setInterval(fetchAllChats, 10000);
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this only runs once on mount

  const fetchAllChats = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('operation', 'fetchChatHistory');
      formData.append('userId', currentUser.id);

      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const chatsByConversation = (data.data || []).reduce((acc, msg) => {
          const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
          const otherName = msg.sender_id === currentUser.id 
            ? `${msg.receiver_fname} ${msg.receiver_lname}`
            : `${msg.sender_fname} ${msg.sender_lname}`;
            
          if (!acc[otherId]) {
            acc[otherId] = {
              messages: [],
              name: otherName
            };
          }
          acc[otherId].messages.push({
            id: msg.chat_id,
            text: msg.message,
            timestamp: new Date(msg.created_at),
            status: 'delivered',
            isOwn: msg.sender_id === currentUser.id,
            senderPic: msg.sender_pic,
            receiverPic: msg.receiver_pic
          });
          return acc;
        }, {});

        const newConversations = Object.entries(chatsByConversation).map(([userId, data]) => {
          const lastMessage = data.messages[0];
          const otherUserPic = lastMessage.isOwn ? lastMessage.receiverPic : lastMessage.senderPic;
          return {
            id: userId,
            name: data.name,
            lastMessage: lastMessage.text,
            timestamp: lastMessage.timestamp,
            unread: data.messages.filter(m => !m.isOwn && !m.read).length,
            picture: otherUserPic
          };
        });

        setConversations(newConversations);

        if (activeConversation) {
          setMessages(chatsByConversation[activeConversation.id]?.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchChatHistory = async (receiverId) => {
    try {
      const formData = new URLSearchParams();
      formData.append('operation', 'fetchChatHistory');
      formData.append('userId', currentUser.id);

      const response = await fetch('http://localhost/coc/gsd/fetch2.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        const relevantMessages = data.data.filter(msg => 
          (msg.sender_id === currentUser.id && msg.receiver_id === receiverId) ||
          (msg.receiver_id === currentUser.id && msg.sender_id === receiverId)
        );

        const formattedMessages = relevantMessages.map(msg => ({
          id: msg.chat_id,
          text: msg.message,
          timestamp: new Date(msg.created_at),
          status: 'delivered',
          isOwn: msg.sender_id === currentUser.id,
          senderPic: msg.sender_pic,
          senderName: `${msg.sender_fname} ${msg.sender_lname}`,
          receiverName: `${msg.receiver_fname} ${msg.receiver_lname}`
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isOwn && (
        <div className="flex flex-col items-center mr-2">
          <img
            src={message.senderPic ? `http://localhost/coc/gsd/${message.senderPic}` : 'default-avatar.png'}
            className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity ring-2 ring-indigo-100"
            alt="avatar"
            onError={(e) => { e.target.src = 'default-avatar.png' }}
          />
          <span className="text-[10px] text-gray-400 mt-1 font-medium">{format(new Date(message.timestamp), 'HH:mm')}</span>
        </div>
      )}
      <div className="message-container max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-100' 
              : 'bg-white border-0 shadow-sm bg-opacity-90 backdrop-blur-sm'
          } shadow-lg hover:shadow-xl transition-all duration-200`}
        >
          {message.fileUrl && (
            <div className="mb-3 rounded-xl overflow-hidden">
              {message.fileType?.startsWith('image') ? (
                <img src={message.fileUrl} alt="attachment" className="w-full rounded-lg hover:opacity-90 transition-opacity" />
              ) : message.fileType?.startsWith('audio') ? (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <audio controls className="w-full">
                    <source src={message.fileUrl} type={message.fileType} />
                  </audio>
                </div>
              ) : (
                <a href={message.fileUrl} 
                   className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                   target="_blank" 
                   rel="noopener noreferrer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download attachment
                </a>
              )}
            </div>
          )}
          <p className="break-words text-[13px] leading-relaxed font-medium">{message.text}</p>
        </div>
        <div className="reactions-container mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {reactions[message.id]?.map((reaction, index) => (
            <span key={index} className="text-sm bg-white shadow-sm rounded-full px-2 py-1">{reaction}</span>
          ))}
          <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <span role="img" aria-label="add reaction">😊</span>
          </button>
        </div>
      </div>
      {isOwn && (
        <div className="flex flex-col items-center ml-2">
          <img
            src={localStorage.getItem('profile_pic') ? `http://localhost/coc/gsd/${localStorage.getItem('profile_pic')}` : 'default-avatar.png'}
            className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity ring-2 ring-indigo-100"
            alt="avatar"
            onError={(e) => { e.target.src = 'default-avatar.png' }}
          />
          <span className="text-[10px] text-gray-400 mt-1 font-medium">{format(new Date(message.timestamp), 'HH:mm')}</span>
        </div>
      )}
    </div>
  );

  const renderInputArea = () => (
    <div className="border-t bg-white/90 backdrop-blur-lg p-4 shadow-lg">
      {selectedFile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100"
        >
          <span className="text-sm text-indigo-700 truncate font-medium">{selectedFile.name}</span>
          <button 
            onClick={() => setSelectedFile(null)} 
            className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </motion.div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Attach file"
        >
          <FiPaperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Add emoji"
        >
          <span role="img" aria-label="emoji">😊</span>
        </button>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-200'}`}
          title="Record voice message"
        >
          <FiMic className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium placeholder:text-gray-400"
          />
         
        </div>
        <button
          onClick={handleSend}
          className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks((chunks) => [...chunks, event.data]);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      setSelectedFile(new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' }));
      setAudioChunks([]);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation) return;
  
    const messageText = newMessage.trim();
    // Clear message input immediately for better UX
    setNewMessage('');
  
    const chatData = {
      operation: 'saveChat',
      data: {
        sender_id: parseInt(currentUser.id),
        receiver_id: parseInt(activeConversation.id),
        message: messageText
      }
    };
  
    try {
      const response = await fetch('http://localhost/coc/gsd/insert_master.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      if (result.status === 'success' && result.chat_id) {
        const newMsg = {
          id: result.chat_id,
          text: messageText,
          timestamp: new Date(),
          status: 'sent',
          isOwn: true
        };
        setMessages(prev => [...prev, newMsg]);
        // Only fetch all chats after successfully sending a message
        fetchAllChats();
      } else {
        console.error('Error sending message:', result.message);
        // Optionally show an error toast/notification here
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show an error toast/notification here
    }
  };

  const handleNewConversation = (user) => {
    const newConversation = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      lastMessage: '',
      timestamp: new Date(),
      unread: 0,
    };
    setConversations(prev => {
      if (!prev.find(conv => conv.id === user.id)) {
        return [...prev, newConversation];
      }
      return prev;
    });
    setActiveConversation(newConversation);
    setShowNewChat(false);
    setSearchEmail('');
  };

  const searchEmails = async (query) => {
    if (!query || query.length < 2) { // Only search if query is at least 2 characters
      setSearchResults([]);
      return;
    }
  
    setIsLoading(true);
    setErrorMessage('');
  
    try {
      const response = await fetch('http://localhost/coc/gsd/user.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
          operation: 'fetchUserByEmailOrFullname',
          searchTerm: query
        })
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Filter out the current user from search results
        const filteredResults = result.data.filter(user => user.users_id !== currentUser.id);
        const userEmails = filteredResults.map(user => ({
          email: user.users_email,
          name: `${user.users_fname} ${user.users_mname} ${user.users_lname}`.trim(),
          id: user.users_id,
          picture: user.users_pic
        }));
        setSearchResults(userEmails);
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

  // Add debounce function
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
  };

  // Add debounced search
  const debouncedSearchTerm = useDebounce(searchEmail, 500);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (debouncedSearchTerm) {
        searchEmails(debouncedSearchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);
  
    return () => clearTimeout(timeoutId);
  }, [debouncedSearchTerm]);

  // Update the search input handler
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchEmail(value);
    // searchEmails will be called automatically through the debounced effect
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 right-4 ${isOpen ? 'h-[600px]' : 'h-12'} transition-all duration-300`}>
      {isOpen ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col h-full w-[400px] bg-gradient-to-b from-white to-gray-50 rounded-t-2xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="bg-white p-4 border-b backdrop-blur-lg bg-opacity-90 rounded-t-2xl flex items-center justify-between">
            <h3 className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Messages</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <FiMessageCircle className="w-5 h-5 text-indigo-600" />
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              <button onClick={closeChat} className="p-1 hover:bg-gray-200 rounded">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {showNewChat ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={handleSearchInputChange}
                    placeholder="Search email..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleNewConversation(user)}
                    className="p-3 hover:bg-white/80 cursor-pointer rounded-xl transition-colors backdrop-blur-sm"
                  >
                    <div className="flex items-center">
                      <img 
                        src={user.picture ? `http://localhost/coc/gsd/${user.picture}` : 'default-avatar.png'} 
                        className="w-8 h-8 rounded-full mr-3" 
                        alt="avatar"
                        onError={(e) => { e.target.src = 'default-avatar.png' }}
                      />
                      <div>
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-sm text-gray-500 block">{user.email}</span>
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
                <div className="p-4 border-b backdrop-blur-lg bg-white/90 flex items-center">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="p-1 hover:bg-gray-200 rounded mr-2"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <img 
                    src={activeConversation.picture ? `http://localhost/coc/gsd/${activeConversation.picture}` : 'default-avatar.png'} 
                    className="w-8 h-8 rounded-full mr-3" 
                    alt="avatar"
                    onError={(e) => { e.target.src = 'default-avatar.png' }}
                  />
                  <div>
                    <span className="font-semibold block">{activeConversation.name}</span>
                    <span className="text-sm text-gray-500">{activeConversation.email}</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/50 to-white/50">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.isOwn}
                    />
                  ))}
                </div>

                {renderInputArea()}
              </div>
            ) : (
              <div>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="p-4 border-b hover:bg-white/80 cursor-pointer transition-colors backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img 
                          src={conv.picture ? `http://localhost/coc/gsd/${conv.picture}` : 'default-avatar.png'} 
                          className="w-10 h-10 rounded-full mr-3" 
                          alt="avatar"
                          onError={(e) => { e.target.src = 'default-avatar.png' }}
                        />
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
        </motion.div>
      ) : (
        <div 
          onClick={toggleChat}
          className="w-[350px] h-full bg-white/90 backdrop-blur-lg rounded-t-xl shadow-lg cursor-pointer hover:bg-gray-50/90 flex items-center justify-between px-4 border border-gray-100"
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
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;
