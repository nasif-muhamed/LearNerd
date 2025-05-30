import { createContext, useContext, useEffect, useState } from 'react';
import useAccessToken from '../hooks/useAccessToken';
import useRole from '../hooks/useRole';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, endpoint }) => {
    const role = useRole()
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8004'; // WebSocket base URL
    const token = useAccessToken(role);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        console.log('webSocket provider:', endpoint)
        if (!token || !endpoint) return;

        const websocket = new WebSocket(`${WS_BASE_URL}${endpoint}?token=${token}`);

        websocket.onopen = () => console.log('Chat WebSocket connected');
        websocket.onerror = (error) => console.error('Chat WebSocket error:', error);
        websocket.onclose = () => console.log('Chat WebSocket disconnected');

        setWs(websocket);

        return () => websocket.close();
    }, [token, endpoint]);

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useChatWebSocket = () => useContext(WebSocketContext);

