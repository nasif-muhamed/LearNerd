import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api/axiosInterceptor";
import storage from "redux-persist/lib/storage";


// Fetch user details after login
export const fetchUserDetails = createAsyncThunk(
    "auth/fetchUserDetails",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/users/user/");
            if (response.status !== 200) {
                throw new Error("Failed to fetch user details");
            }
            const data = await response.data;
            return data;
            
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred');
        }
    }
);

const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    status: 'idle',
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload.user || null;
            state.accessToken = action.payload.access;
            state.refreshToken = action.payload.refresh;
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.status = 'idle';
            state.error = null;     
            storage.removeItem("persist:auth");
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserDetails.pending, (state) => {
                state.status = "loading";
                console.log('++++++++++++++++++++')
            })
            .addCase(fetchUserDetails.fulfilled, (state, action) => {
                // console.log('action.payload:', action.payload);
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(fetchUserDetails.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
