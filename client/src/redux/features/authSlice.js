import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api/axiosInterceptor";
import storage from "redux-persist/lib/storage";

// Fetch user details after login
export const fetchUserDetails = createAsyncThunk(
    "auth/fetchUserDetails",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/users/user/");
            console.log('thunk-fetchUserDetails-response:', response)
            if (response.status !== 200) {
                throw new Error("Failed to fetch user details");
            }
            const data = response.data;
            return data;
            
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred');
        }
    }
);

// Fetch user details after login
export const fetchUnreadMsgCount = createAsyncThunk(
    "auth/fetchUnreadMsgCount",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/chats/rooms/unread-messages/");
            console.log('thunk-fetchUnreadMsgCount-response:', response)
            if (response.status !== 200) {
                throw new Error("Failed to fetch user details");
            }
            const data = response.data;
            return data;
            
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred');
        }
    }
);


// export const fetchBadges = createAsyncThunk(
//     "auth/fetchBadges",
//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await api.get("/users/badges/");
//             console.log('thunk-fetchUserDetails-response:', response)
//             if (response.status !== 200) {
//                 throw new Error("Failed to fetch user details");
//             }
//             const data = response.data;
//             return data;
            
//         } catch (error) {
//             return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred');
//         }
//     }
// );


const initialState = {
    user: null,
    // badges: null,
    accessToken: null,
    refreshToken: null,
    role: null,
    status: 'idle',
    error: null,
    unReadMessages: {},
    unReadMsgStatus: 'idle',
    unReadMsgError: null,
    adminUserAccessToken: null,
    adminUserRefreshToken: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload.user || null;
            state.accessToken = action.payload.access;
            state.refreshToken = action.payload.refresh;
            state.role = action.payload.role
            if (action.payload.role == 'admin'){
                state.adminUserAccessToken = action.payload.userAccess;
                state.adminUserRefreshToken = action.payload.userRefresh;
            }
        },
        updateAcess: (state, action) => {
            state.accessToken = action.payload.access;
        },
        updateRefresh: (state, action) => {
            state.refreshToken = action.payload.refresh;
        },
        switchRole: (state, action) => {
            state.role = action.payload.role
        },
        changeNotificationCount: (state, action) => {
            if (!state.user || typeof state.user.unread_notifications !== 'number') return;
        
            const actionType = action.payload;
        
            switch (actionType) {
                case "add":
                    state.user.unread_notifications += 1;
                    break;
        
                case "deduct":
                    state.user.unread_notifications -= 1;
                    break;
        
                case "readAll":
                    state.user.unread_notifications = 0;
                    break;
        
                default:
                    break;
            }
        },
        changeMessageCount: (state, action) => {
            const actionType = action.payload.actionType;
            console.log('inside changeMessageCount')
            if (!state.unReadMessages) {
                state.unReadMessages = {};  // Ensure it's initialized
            }

            switch (actionType) {
                case "add":{ 
                    const obj = action.payload.unReadMessages;
                    if (!obj || typeof obj !== 'object') return;
                    state.unReadMessages = obj;
                    // Object.entries(obj).forEach(([roomId, count]) => {
                    //     state.unReadMessages[roomId] = count;
                    // });
                    // console.log('obj redux:', obj, state.unReadMessages)
                    break;
                }
                case "increase":{
                    const roomId = action.payload.roomId;
                    if (roomId in state.unReadMessages){
                        state.unReadMessages[roomId]++;
                    }else{
                        state.unReadMessages[roomId]=1
                    }
                    break;
                }
                case "reset":{
                    const roomId = action.payload.roomId;
                    delete state.unReadMessages[roomId];
                    break;
                }
                default:
                    break;
            }
        },
        logout: (state) => {
            state.user = null;
            // state.badges = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.status = 'idle';
            state.role = null
            state.error = null;
            state.unReadMessages= {};
            state.unReadMsgStatus = 'idle';
            state.unReadMsgError = null;
            storage.removeItem("persist:auth");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserDetails.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchUserDetails.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(fetchUserDetails.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(fetchUnreadMsgCount.pending, (state) => {
                state.unReadMsgStatus = "loading";
            })
            .addCase(fetchUnreadMsgCount.fulfilled, (state, action) => {
                state.unReadMsgStatus = "succeeded";
                state.unReadMessages = action.payload;
            })
            .addCase(fetchUnreadMsgCount.rejected, (state, action) => {
                state.unReadMsgStatus = "failed";
                state.unReadMsgError = action.payload;
            });

    },
});

export const { login, logout, switchRole, updateAcess, updateRefresh, changeNotificationCount, changeMessageCount } = authSlice.actions;
export default authSlice.reducer;
