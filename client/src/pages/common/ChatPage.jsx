import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import ChatArea from '../../components/user/common/chat/ChatArea'
import Sidebar from '../../components/user/common/chat/ChatSidebar'
// import api from '../../services/api/axiosInterceptor';
import { WebSocketProvider } from '../../context/WebSocketContext';

const ChatPage = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [selectedChat, setSelectedChat] = useState(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [endpoint, setEndpoint] = useState(null)

    return (
        <div className="flex h-full bg-background text-foreground overflow-hidden">
            <WebSocketProvider endpoint={endpoint}>

                {!isMobileSidebarOpen && (
                    <button 
                        className={`fixed z-10 top-20 left-4 md:hidden bg-primary rounded-full p-2 shadow-lg ${selectedChat ? 'hidden' : ''}`}
                        onClick={() => setIsMobileSidebarOpen(true)}
                    >
                        <Menu size={20} />
                    </button>
                )}
                
                <Sidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    selectedChat={selectedChat} 
                    setSelectedChat={setSelectedChat} 
                    isMobileSidebarOpen={isMobileSidebarOpen} 
                    setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
                />
                
                <ChatArea 
                    selectedChat={selectedChat} 
                    setSelectedChat={setSelectedChat}
                    // messages={messages} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    // message={message} 
                    // setMessage={setMessage} 
                    // handleSendMessage={handleSendMessage} 
                    // handleKeyPress={handleKeyPress} 
                    isMobileSidebarOpen={isMobileSidebarOpen} 
                    setEndpoint={setEndpoint}
                />
            </WebSocketProvider>
        </div>
    );
};

export default ChatPage;