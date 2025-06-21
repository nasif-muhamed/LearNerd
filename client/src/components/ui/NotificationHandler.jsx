import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector, useDispatch } from "react-redux";
import { changeMessageCount, changeNotificationCount } from '../../redux/features/authSlice';
import useAccessToken from '../../hooks/useAccessToken';
// import useWebSocket from '../../hooks/useWebSocket';

const NotificationHandler = () => {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8004'; // WebSocket base URL
    const role = useSelector((state) => state.auth?.role);
    const token = useAccessToken();
    const authUserId = useSelector((state) => state.auth?.user?.id);
    const userId = role == 'admin' ? 9 : authUserId;
    console.log('NotificationHandler::::::::::::::::', token)
    const [ws, setWs] = useState(null);
    const dispatch = useDispatch()

    useEffect(() => {
        if ((!token && role == 'admin') || !role) return;
        // Establish WebSocket connection
        const websocket = new WebSocket(`${WS_BASE_URL}/ws/notifications/?token=${token}`);
        // const websocket = useWebSocket('/ws/notifications/');
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
        };
    
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('message recieved:', data)

            if (data.notification_type === "new_message"){
                toast.info(`${data.message.sender.full_name} send ${data.message.content}`, {
                    position: 'top-left',
                    autoClose: 3000,
                });
                dispatch(changeMessageCount({actionType: 'increase', roomId: data.message.room}))
            } else if (data.notification_type === "chat_expired"){
                toast.error(`${data.message}`, {
                    position: 'top-left',
                    autoClose: 3000,
                });
            } else {

                toast.info(`${data.message}`, {
                    position: 'top-left',
                    autoClose: 3000,
                });
                dispatch(changeNotificationCount('add'))
            }

        };
    
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        websocket.onclose = () => {
            console.log('WebSocket disconnected');
        };
    
        setWs(websocket);
    
        // Cleanup on component unmount
        return () => {
            websocket.close();
        };
    }, [token]);
  
    // No need to render Toaster here since it's in main.jsx
    return null;
};

export default NotificationHandler;
