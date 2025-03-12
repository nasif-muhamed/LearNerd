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

export const fetchBadges = createAsyncThunk(
    "auth/fetchBadges",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/users/badges/");
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


const initialState = {
    user: null,
    badges: null,
    accessToken: null,
    refreshToken: null,
    role: null,
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
            state.role = action.payload.role
        },
        updateAcess: (state, action) => {
            state.accessToken = action.payload.access;
        },
        switchRole: (state, action) => {
            state.role = action.payload.role
        },
        logout: (state) => {
            state.user = null;
            state.badges = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.status = 'idle';
            state.role = null
            state.error = null;
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
            .addCase(fetchBadges.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchBadges.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.badges = action.payload;
            })
            .addCase(fetchBadges.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });

    },
});

export const { login, logout, switchRole, updateAcess } = authSlice.actions;
export default authSlice.reducer;
