// import useAccessToken from './useAccessToken';
// import { useSelector } from 'react-redux';
import { store } from '../redux/app/store';

const getAccessToken = () => store.getState().auth.accessToken;

const useWebSocket = (endpoint) => {
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8004'; // WebSocket base URL
    // const token = useAccessToken();
    // const token = useSelector((state) => state.auth.accessToken);
    const token = getAccessToken();
    if (!token) {
        console.error('No access token available. Cannot connect to WebSocket.');
        return;
    }
    const ws = new WebSocket(`${WS_BASE_URL}${endpoint}?token=${token}`);
    return ws;
}

export default useWebSocket