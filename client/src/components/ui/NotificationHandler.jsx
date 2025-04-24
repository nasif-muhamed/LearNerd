import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSelector } from "react-redux";


const NotificationHandler = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const userId = useSelector((state) => state.auth?.user?.id);
    console.log('NotificationHandler::::::::::::::::', userId)
    const [ws, setWs] = useState(null);

    useEffect(() => {
        if (!userId) return;
        // Establish WebSocket connection
        const websocket = new WebSocket(`ws://localhost:8004/ws/notifications/${userId}/`);
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
        };
    
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('message recieved:', data)
            toast.info(`${data.message}`, {
                position: 'top-right',
                autoClose: 5000,
            });
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
