import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, Info, Search, MoreVertical, Circle, Check, CheckCheck } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
}

interface Chat {
  id: string;
  userId: string;
  messages: Message[];
}

const Messenger: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatInfo, setShowChatInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock users data
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Ahmed Mohamed',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      status: 'online',
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c4ca?w=100',
      status: 'away',
      lastSeen: '5 minutes ago'
    },
    {
      id: '3',
      name: 'Jean AI',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      status: 'online',
      unreadCount: 1
    },
    {
      id: '4',
      name: 'Team Support',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
      status: 'offline',
      lastSeen: '2 hours ago'
    },
    {
      id: '5',
      name: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      status: 'online'
    }
  ];

  // Initialize chats with mock data
  useEffect(() => {
    const mockChats: Chat[] = mockUsers.map(user => ({
      id: `chat-${user.id}`,
      userId: user.id,
      messages: [
        {
          id: `msg-${user.id}-1`,
          senderId: user.id,
          text: `Hello! This is ${user.name}. How can I help you today?`,
          timestamp: new Date(Date.now() - 3600000),
          isRead: true,
          isDelivered: true
        },
        ...(user.id === '1' ? [{
          id: `msg-${user.id}-2`,
          senderId: 'me',
          text: 'Hi! I need some assistance with the marketplace.',
          timestamp: new Date(Date.now() - 3000000),
          isRead: false,
          isDelivered: true
        }] : [])
      ]
    }));
    setChats(mockChats);
  }, []);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('messenger-chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('messenger-chats', JSON.stringify(chats));
  }, [chats]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat, chats]);

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: messageInput,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true
    };

    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === selectedChat
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );

    setMessageInput('');

    // Simulate auto-reply after 1 second
    setTimeout(() => {
      const autoReply: Message = {
        id: `msg-${Date.now()}-reply`,
        senderId: chats.find(c => c.id === selectedChat)?.userId || '',
        text: 'Thank you for your message! I will get back to you soon.',
        timestamp: new Date(),
        isRead: false,
        isDelivered: true
      };

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChat
            ? { ...chat, messages: [...chat.messages, autoReply] }
            : chat
        )
      );
    }, 1000);
  };

  const getUserById = (userId: string) => {
    return mockUsers.find(user => user.id === userId);
  };

  const getSelectedChat = () => {
    return chats.find(chat => chat.id === selectedChat);
  };

  const getCurrentUser = () => {
    const selectedChatData = getSelectedChat();
    return selectedChatData ? getUserById(selectedChatData.userId) : null;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const UserListItem = ({ user }: { user: User }) => {
    const chat = chats.find(c => c.userId === user.id);
    const lastMessage = chat?.messages[chat.messages.length - 1];
    const isSelected = selectedChat === `chat-${user.id}`;

    return (
      <div
        onClick={() => setSelectedChat(`chat-${user.id}`)}
        className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
      >
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
            {lastMessage && (
              <span className="text-xs text-gray-500">
                {formatTime(new Date(lastMessage.timestamp))}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {lastMessage ? lastMessage.text : 'No messages yet'}
            </p>
            {user.unreadCount && user.unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {user.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isMe = message.senderId === 'me';
    const sender = isMe ? null : getUserById(message.senderId);

    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
          {!isMe && (
            <div className="flex items-center gap-2 mb-1">
              <img
                src={sender?.avatar}
                alt={sender?.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xs text-gray-600">{sender?.name}</span>
            </div>
          )}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isMe
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500">
              {formatTime(new Date(message.timestamp))}
            </span>
            {isMe && (
              <span className="text-gray-500">
                {message.isRead ? (
                  <CheckCheck className="w-4 h-4 text-blue-600" />
                ) : message.isDelivered ? (
                  <Check className="w-4 h-4" />
                ) : null}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const currentUser = getCurrentUser();
  const selectedChatData = getSelectedChat();

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map(user => (
            <UserListItem key={user.id} user={user} />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat && currentUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(currentUser.status)} rounded-full border-2 border-white`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentUser.name}</h3>
                  <p className="text-sm text-gray-500">
                    {currentUser.status === 'online' ? 'Active now' : 
                     currentUser.lastSeen || currentUser.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {selectedChatData?.messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Info Panel */}
      {showChatInfo && currentUser && (
        <div className="w-80 border-l p-6 bg-white">
          <div className="text-center mb-6">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-full mx-auto mb-3"
            />
            <h3 className="font-semibold text-lg">{currentUser.name}</h3>
            <p className="text-sm text-gray-500">
              {currentUser.status === 'online' ? 'Active now' : 
               currentUser.lastSeen || currentUser.status}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Status</h4>
              <p className="text-sm text-gray-600 capitalize">{currentUser.status}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Shared Media</h4>
              <p className="text-sm text-gray-600">No shared media yet</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Notifications</h4>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Mute notifications</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messenger;