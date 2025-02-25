import axios from 'axios';
import { store } from '../../redux/app/store';

const BASE_URL = 'http://127.0.0.1:8000/api/v1/'; // Base URL for the APIGateway

// axios instance with the base URL
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Helper function to get tokens from Redux store
const getAccessToken = () => store.getState().auth.accessToken;
const getRefreshToken = () => store.getState().auth.refreshToken;

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
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
                const refreshToken = getRefreshToken();
                console.log('getRefreshToken:', refreshToken);
                const response = await axios.post(`${BASE_URL}users/token/refresh/`, {
                    refreshToken,
                });

                // Dispatch updated tokens to Redux store
                store.dispatch({
                    type: 'auth/login',
                    payload: {
                        accessToken: response.data.access,
                    },
                });

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If token refresh fails, dispatch logout and redirect
                store.dispatch({ type: 'auth/logout' });
                window.location.href = '/logout'; // Redirect to logout page
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;