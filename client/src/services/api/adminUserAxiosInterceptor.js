import axios from 'axios';
import { store } from '../../redux/app/store';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_BASE_URL + 'api/v1/'; // Base URL for the APIGateway
// axios instance with the base URL
const adminUserApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Helper function to get tokens from Redux store
const getAdminAccessToken = () => store.getState().auth.adminUserAccessToken;
const getAdminRefreshToken = () => store.getState().auth.adminUserRefreshToken;

// Request interceptor
adminUserApi.interceptors.request.use(
    (config) => {
        const accessToken = getAdminAccessToken();
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
adminUserApi.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is due to an expired token
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('error:refresh', error)
            originalRequest._retry = true;
            const errorCode = error.response?.data?.code
            console.log('errorCode:', errorCode)
            if (errorCode === 'token_not_valid'){
                const refreshToken = getAdminRefreshToken();
                console.log('refresh:', refreshToken)
                if (refreshToken){
                    try {
                        // Attempt to refresh the token
                        const response = await axios.post(`${BASE_URL}users/token/refresh/`, {
                            refresh : refreshToken
                        });
                        // console.log('current access:', getAdminAccessToken())
                        // console.log('new access:', response.data.access)
                        // Dispatch updated tokens to Redux store
                        store.dispatch({
                            type: 'auth/updateAdminAcess',
                            payload: {
                                access: response.data.access,
                            },
                        });
        
                        // Retry the original request with the new token
                        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                        return adminUserApi(originalRequest);
                    } catch (refreshError) {
                        // If token refresh fails, dispatch logout and redirect
                        store.dispatch({ type: 'auth/logout' });
                        // window.location.href = '/logout'; // Redirect to logout page
                        return Promise.reject(refreshError);
                    }
                }
            }
            else if (errorCode === 'user_inactive' ||  errorCode === 'user_blocked') {
                toast.error('User is blocked')
                store.dispatch({ type: 'auth/logout' });
            }
        }

        return Promise.reject(error);
    }
);

export default adminUserApi;