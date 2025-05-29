import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Loader } from 'lucide-react';
import handleError from '../../../../utils/handleError';
import { useChatWebSocket } from '../../../../context/WebSocketContext';

const MessageInput = ({ setActiveTyper, selectedItem }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const ws = useChatWebSocket();
    const typingTimeoutRef = useRef(null);
    const lastTypingSentRef = useRef(0);

    const sendTypingEvent = (isTyping) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const now = Date.now();
        if (now - lastTypingSentRef.current >= 2000) { // Throttle to every 2 seconds
            ws.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping
            }));
            lastTypingSentRef.current = now;
        }
    };


    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (e.target.value.trim() === '') return;
        sendTypingEvent(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingEvent(false);
        }, 3000); // Stop typing after 3 seconds of inactivity
    };

    const handleSendMessage = async (content, messageType) => {
        console.log('send message:', content)
        if (content.trim() === '' || !ws || ws.readyState !== WebSocket.OPEN) return;
        try{
            setLoading(true)
            // const body = {
            //     content: content,
            //     message_type: messgeType,
            // }
            // const response = await api.post(`chats/rooms/${roomId}/messages/`, body);
            // const result = response.data;
            ws.send(JSON.stringify({
                message,
                message_type: messageType
            }));

            // setMessages([...messages, result]);
            // ws.send(JSON.stringify({
            //     type: 'typing',
            //     is_typing: false
            // }));

            setMessage('');
            setActiveTyper(null);
            clearTimeout(typingTimeoutRef.current);
            // console.log('send message resp:', response)
        }catch (error){
            console.log('error fetching chat list:', error)
            handleError(error, 'Error sending message')
        }finally{
            setLoading(false)
        }

    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(message, 'text');
        }
    };
    
    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    is_typing: false
                }));
            }
        };
    }, [ws]);


    return (
        <div className="p-4 border-t border-border">
            <div className="relative flex items-center">
                {/* <button className="p-2 text-muted-foreground hover:text-foreground">
                    <Paperclip size={20} />
                </button> */}
                <textarea
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted rounded-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-accent resize-none h-12 max-h-32"
                    rows={1}
                />
                <button 
                    onClick={() => handleSendMessage(message, 'text')}
                    disabled={message.trim() === ''}
                    className={`ml-2 p-2 rounded-full ${message.trim() === '' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}
                >
                    {loading ? <Loader/> : <Send size={20} />}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
