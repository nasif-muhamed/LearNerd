import axios from 'axios';
import tokenManager from './tokenManager';

const tokenMgr = new tokenManager();
const BASE_URL = 'http://127.0.0.1:8000/api/v1/' // Base URL for the APIGateway

// Create an axios instance with the base URL
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const accessToken = tokenMgr.getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is due to an expired token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                const refreshToken = tokenMgr.getRefreshToken();
                const response = await axios.post(`${BASE_URL}/users/token/refresh/`, {
                    refreshToken,
                });

                // Update the tokens in localStorage
                tokenMgr.setAccessToken(response.data.accessToken);
                tokenMgr.setRefreshToken(response.data.refreshToken);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // If token refresh fails, redirect to login
                tokenMgr.clearTokens();
                window.location.href = '/logout'; // Redirect to logout page
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
export { tokenMgr };