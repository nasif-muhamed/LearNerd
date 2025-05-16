// // websocketInterceptor.js
// import { store } from '../../redux/app/store';
// import { toast } from 'sonner';
// import axios from 'axios';

// // Base URLs
// const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8004'; // WebSocket base URL
// const API_BASE_URL = import.meta.env.VITE_BASE_URL + 'api/v1/'; // API base URL for token refresh

// // Helper functions to get tokens from Redux store
// const getAccessToken = () => store.getState().auth.accessToken;
// const getRefreshToken = () => store.getState().auth.refreshToken;

// // WebSocket connection manager class
// class WebSocketManager {
//     constructor() {
//         this.socket = null;
//         this.url = `${WS_BASE_URL}/ws/notifications/`;
//         this.reconnectAttempts = 0;
//         this.maxReconnectAttempts = 5;
//         this.reconnectDelay = 3000; // 3 seconds
//     }

//     // Connect to WebSocket
//     connect(endpoint) {
//         const accessToken = getAccessToken();
//         if (!accessToken) {
//             console.error('No access token available. Cannot connect to WebSocket.');
//             store.dispatch({ type: 'auth/logout' });
//             return;
//         }

//         // Create WebSocket URL with token in query string
//         const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
//         const wsUrl = `${WS_BASE_URL}${normalizedEndpoint}?token=${accessToken}`;
//         this.socket = new WebSocket(wsUrl);

//         // Handle WebSocket events
//         this.socket.onopen = () => {
//             console.log('WebSocket connected');
//             this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
//         };

//         this.socket.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             console.log('WebSocket message received:', data);
//             // Handle incoming notifications (e.g., dispatch to Redux or show toast)
//         };

//         this.socket.onclose = (event) => {
//             console.log('WebSocket closed:', event.code, event.reason);
//             // Handle token expiration (customize close code based on your server)
//             if (event.code === 4001 || event.reason.includes('token_not_valid')) {
//                 this.handleTokenExpiration();
//             } else {
//                 this.attemptReconnect();
//             }
//         };

//         this.socket.onerror = (error) => {
//             console.error('WebSocket error:', error);
//         };
//     }

//     // Handle token expiration
//     async handleTokenExpiration() {
//         const refreshToken = getRefreshToken();
//         if (!refreshToken) {
//             console.error('No refresh token available. Logging out.');
//             store.dispatch({ type: 'auth/logout' });
//             return;
//         }

//         try {
//             // Attempt to refresh the token
//             const response = await axios.post(`${API_BASE_URL}users/token/refresh/`, {
//                 refresh: refreshToken,
//             });

//             // Update Redux store with new access token
//             store.dispatch({
//                 type: 'auth/updateAcess',
//                 payload: {
//                 access: response.data.access,
//                 },
//             });

//             console.log('Token refreshed. Reconnecting WebSocket...');
//             this.connect(); // Reconnect with new token
//         } catch (refreshError) {
//             console.error('Failed to refresh token:', refreshError);
//             store.dispatch({ type: 'auth/logout' });
//             toast.error('Session expired. Please log in again.');
//         }
//     }

//     // Attempt to reconnect after a delay
//     attemptReconnect() {
//         if (this.reconnectAttempts < this.maxReconnectAttempts) {
//             this.reconnectAttempts += 1;
//             console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
//             setTimeout(() => {
//                 this.connect();
//             }, this.reconnectDelay);
//         } else {
//             console.error('Max reconnect attempts reached. Logging out.');
//             store.dispatch({ type: 'auth/logout' });
//             toast.error('Unable to reconnect. Please log in again.');
//         }
//     }

//     // Send a message (if needed)
//     sendMessage(message) {
//         if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//             this.socket.send(JSON.stringify(message));
//         } else {
//             console.error('WebSocket is not connected.');
//         }
//     }

//     // Close the WebSocket connection
//     disconnect() {
//         if (this.socket) {
//             this.socket.close();
//             this.socket = null;
//             console.log('WebSocket disconnected');
//         }
//     }
// }

// // Create a singleton instance
// const wsManager = new WebSocketManager();

// export default wsManager;

