import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import handleError from '../../../../utils/handleError';
import api from '../../../../services/api/axiosInterceptor';
import adminUserApi from '../../../../services/api/adminUserAxiosInterceptor';
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import ChatHandler from './ChatHandler';
import ExpiredChatNotice from './ExpiredChatNotice'
import useRole from '../../../../hooks/useRole';

// const mockMessages = [
//   { id: 1, sender: "Sarah Johnson", content: "Hey there! How's the course going?", time: "10:15 AM", isUser: false },
//   { id: 2, sender: "You", content: "It's going well! I'm working on the final project now.", time: "10:20 AM", isUser: true },
//   { id: 3, sender: "Sarah Johnson", content: "That's great! Do you need any help with it?", time: "10:25 AM", isUser: false },
//   { id: 4, sender: "You", content: "Thanks for asking! I might need some guidance with the API integration later.", time: "10:28 AM", isUser: true },
//   { id: 5, sender: "Sarah Johnson", content: "No problem at all. Thanks for the help with the project!", time: "10:30 AM", isUser: false },
// ];

const ChatArea = ({ selectedChat, setSelectedChat, activeTab, setActiveTab, isMobileSidebarOpen, setEndpoint }) => {
    const role = useRole()
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTyper, setActiveTyper] = useState(null);
    const roomId = selectedChat ? selectedChat.id : null;
    const endpoint = roomId ? `/ws/chat/${roomId}/` : null;
    // const expiryDate = selectedChat ? selectedChat.expires_at : null;
    // const [expired, setExpired] = useState(false)
    const isChatExpired = () => {
        if (!selectedChat || !selectedChat.expires_at) return false;
        const expiryDate = new Date(selectedChat.expires_at);
        const currentDate = new Date();
        return currentDate > expiryDate;
    };

    const expired = isChatExpired();

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const urlEnd = `chats/rooms/${roomId}/messages/`
            let response;
            if (role === 'admin') response = await adminUserApi.get(urlEnd);
            else response = await api.get(urlEnd);

            console.log('fetch messages resp:', response);
            const result = response.data;
            // const readResults = result.map((message) => {
            //     if (message.is_read === 'no') {
            //         return {
            //             ...message, is_read: true
            //         }
            //     }
            // }) 
            setMessages(result);
            // setMessages(result);
        } catch (error) {
            console.log('error fetching chat list:', error);
            handleError(error, 'Error fetching messages');
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!roomId) return;
        setEndpoint(endpoint)
        fetchMessages();
    }, [roomId]);

    return (
        <div className={`flex-1 flex-col h-full relative ${isMobileSidebarOpen ? 'hidden' : 'flex'}`}>
            {roomId && <ChatHandler setActiveTyper={setActiveTyper} setMessages={setMessages} roomId={roomId} setSelectedChat={setSelectedChat} />}

            {selectedChat ? (
                <>
                    <ChatHeader selectedChat={selectedChat} activeTab={activeTab} />
                    <MessageList activeTyper={activeTyper} messages={messages} loading={loading} activeTab={activeTab} />
                    
                    {expired && !selectedChat.temp_chat ? (
                        <ExpiredChatNotice expiryDate={selectedChat.expires_at} />
                    ) : (
                        
                        <MessageInput
                            setActiveTyper={setActiveTyper}
                            // message={message} 
                            // setMessages={setMessages}
                            // messages={messages}
                            // roomId={roomId}
                            // setMessage={setMessage}
                            // handleSendMessage={handleSendMessage} 
                            // handleKeyPress={handleKeyPress} 
                        />
                    )}
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
    );
};
  
export default ChatArea;
