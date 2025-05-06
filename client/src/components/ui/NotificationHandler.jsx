import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector, useDispatch } from "react-redux";
import { changeNotificationCount } from '../../redux/features/authSlice';


const NotificationHandler = () => {
    const role = useSelector((state) => state.auth?.role);
    const authUserId = useSelector((state) => state.auth?.user?.id);
    const userId = role == 'admin' ? 9 : authUserId;
    console.log('NotificationHandler::::::::::::::::', userId)
    const [ws, setWs] = useState(null);
    const dispatch = useDispatch()

    useEffect(() => {
        if ((!userId && role == 'admin') || !role) return;
        // Establish WebSocket connection
        const websocket = new WebSocket(`ws://localhost:8004/ws/notifications/${userId}/`);
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
        };
    
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('message recieved:', data)
            toast.info(`${data.message}`, {
                position: 'top-left',
                autoClose: 3000,
            });
            dispatch(changeNotificationCount('add'))
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
    }, [userId]);
  
    // No need to render Toaster here since it's in main.jsx
    return null;
};

export default NotificationHandler;
