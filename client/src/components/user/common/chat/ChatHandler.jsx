// src/components/ChatHandler.jsx
import { useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { addMessage } from '../../redux/features/chatSlice';
import { useChatWebSocket } from '../../../../context/WebSocketContext'; 
import useUser from '../../../../hooks/useUser';

const ChatHandler = ({ roomId, setMessages, setActiveTyper, setSelectedChat }) => {
    const ws = useChatWebSocket();
    const user = useUser()
    // const dispatch = useDispatch();

    useEffect(() => {
        if (!ws) return;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('message received in chat handler:', data);
            if (data.type === 'message'){
                const newMessage = data['message']
                if (newMessage.sender.user_id !== user.id){
                    newMessage.is_read = 'yes'
                    ws.send(JSON.stringify({
                        type: 'read_receipt',
                        message: newMessage.id
                    }));
                }
                setMessages(prev => [...prev, newMessage]);
                setActiveTyper(null)

            } else if (data.type === 'typing'){
                setActiveTyper(data)

            } else if (data.type === 'read_receipt'){
                const userId = data['user_id']
                if (userId !== user.id) {
                    console.log('inside if to change setMessages')
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.is_read === 'no' ? { ...msg, is_read: 'yes' } : msg
                        )
                    );
                }
                
            } else if (data.type === 'online_status'){
                console.log('insed user_online_status')
                const isOnline = data['is_online']
                const userId = data['is_online']
                if (userId != user.id){
                    setSelectedChat(prev => {
                        return {...prev, online_user_count: isOnline ? prev.online_user_count+1 : prev.online_user_count-1}
                    })
                }
                
            } else if (data.type === 'room_online_status'){
                console.log('insed room_online_status')
                const userCount = data['online_user_count']
                setSelectedChat(prev => {
                    return {...prev, online_user_count: userCount}
                })

            } else if (data.type === 'group_meeting_status') {
                setSelectedChat(prev => ({
                    ...prev,
                    meeting: data.meeting
                }))
            }

            // dispatch(addMessage({
            //     roomId,
            //     message: {
            //         id: Date.now(),
            //         content: data.message,
            //         sender: {
            //             user_id: data.sender_id,
            //             full_name: data.sender_name
            //         },
            //         timestamp: data.timestamp
            //     }
            // }));
        };

        return () => {
            ws.onmessage = null;
        };
    }, [ws, roomId]);

    return null;
};

export default ChatHandler;