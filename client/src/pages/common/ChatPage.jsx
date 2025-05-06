import { useState, useEffect, useRef } from 'react';
import { Search, Send, Users, UserCircle, ChevronLeft, MoreVertical, Paperclip, Smile, Check, Menu } from 'lucide-react';

// Mock data for demonstration
const mockPersonalChats = [
  { id: 1, name: "Sarah Johnson", avatar: null, lastMessage: "Thanks for the help with the project!", time: "10:30 AM", unread: 2 },
  { id: 2, name: "Michael Chen", avatar: null, lastMessage: "When is the next live session?", time: "Yesterday", unread: 0 },
  { id: 3, name: "Alex Rodriguez", avatar: null, lastMessage: "I've submitted my assignment", time: "Yesterday", unread: 0 },
  { id: 4, name: "Emily Williams", avatar: null, lastMessage: "Can you explain the concept again?", time: "Monday", unread: 1 },
];

const mockCommunityChats = [
  { id: 101, name: "Frontend Development", avatar: null, lastMessage: "Any tips for optimizing React performance?", time: "11:45 AM", unread: 5, members: 28 },
  { id: 102, name: "Python Study Group", avatar: null, lastMessage: "Check out this new Django tutorial", time: "Yesterday", unread: 0, members: 42 },
  { id: 103, name: "UI/UX Design", avatar: null, lastMessage: "What design tools do you recommend?", time: "Sunday", unread: 3, members: 19 },
];

const mockMessages = [
  { id: 1, sender: "Sarah Johnson", content: "Hey there! How's the course going?", time: "10:15 AM", isUser: false },
  { id: 2, sender: "You", content: "It's going well! I'm working on the final project now.", time: "10:20 AM", isUser: true },
  { id: 3, sender: "Sarah Johnson", content: "That's great! Do you need any help with it?", time: "10:25 AM", isUser: false },
  { id: 4, sender: "You", content: "Thanks for asking! I might need some guidance with the API integration later.", time: "10:28 AM", isUser: true },
  { id: 5, sender: "Sarah Johnson", content: "No problem at all. Thanks for the help with the project!", time: "10:30 AM", isUser: false },
];

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messageEndRef = useRef(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Mobile sidebar toggle */}
      {!isMobileSidebarOpen && (
        <button 
          className="fixed z-10 top-20 left-4 md:hidden bg-primary rounded-full p-2 shadow-lg"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}
      
      {/* Sidebar */}
      <div className={`${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-300 w-full md:w-80 lg:w-96 
          border-r border-border bg-sidebar-background flex flex-col h-full 
          fixed md:relative z-20`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="flex gap-2">
            <button 
              className="md:hidden p-2 rounded-full hover:bg-muted"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'personal' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('personal')}
          >
            <UserCircle size={18} className="inline mr-2" />
            Personal
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'community' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('community')}
          >
            <Users size={18} className="inline mr-2" />
            Community
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-muted rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'personal' ? (
            mockPersonalChats.map(chat => (
              <div 
                key={chat.id}
                className={`p-4 flex items-center gap-3 hover:bg-muted/30 cursor-pointer transition-colors ${selectedChat && selectedChat.id === chat.id ? 'bg-muted/50' : ''}`}
                onClick={() => {
                  setSelectedChat(chat);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="relative">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-medium">{chat.name.charAt(0)}</span>
                    </div>
                  )}
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
              </div>
            ))
          ) : (
            mockCommunityChats.map(chat => (
              <div 
                key={chat.id}
                className={`p-4 flex items-center gap-3 hover:bg-muted/30 cursor-pointer transition-colors ${selectedChat && selectedChat.id === chat.id ? 'bg-muted/50' : ''}`}
                onClick={() => {
                  setSelectedChat(chat);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="relative">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-lg font-medium">{chat.name.charAt(0)}</span>
                    </div>
                  )}
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5 flex items-center">
                      <Users size={12} className="mr-1" />
                      {chat.members}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex-col h-full relative ${isMobileSidebarOpen ? 'hidden' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                {selectedChat.avatar ? (
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-md font-medium">{selectedChat.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{selectedChat.name}</h3>
                  {activeTab === 'community' && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Users size={12} className="mr-1" />
                      {selectedChat.members} members
                    </p>
                  )}
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-muted">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${msg.isUser ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-2`}>
                    {!msg.isUser && (
                      <div className="font-medium text-xs mb-1">{msg.sender}</div>
                    )}
                    <p>{msg.content}</p>
                    <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end gap-1">
                      {msg.time}
                      {msg.isUser && <Check size={14} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-border">
              <div className="relative flex items-center">
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <Paperclip size={20} />
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted rounded-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-accent resize-none h-12 max-h-32"
                  rows={1}
                />
                <button className="p-2 text-muted-foreground hover:text-foreground ml-1">
                  <Smile size={20} />
                </button>
                <button 
                  onClick={handleSendMessage}
                  disabled={message.trim() === ''}
                  className={`ml-2 p-2 rounded-full ${message.trim() === '' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">Start chatting</h3>
              <p className="text-muted-foreground mb-6">Select a conversation to start messaging</p>
              <button 
                className="btn-primary"
                onClick={() => setActiveTab('personal')}
              >
                Browse messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;