import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import api from "../../services/api/axiosInterceptor";
import storage from "redux-persist/lib/storage";


// // Fetch user details after login
// export const fetchUserDetails = createAsyncThunk(
//     "auth/fetchUserDetails",
//     async (_, { rejectWithValue }) => {
//         try {
//             const response = await api.get("/users/user/");
//             if (response.status !== 200) {
//                 throw new Error("Failed to fetch user details");
//             }
//             const data = await response.data;
//             return data;
            
//         } catch (error) {
//             return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred');
//         }
//     }
// );

const initialState = {
    adminAccessToken: null,
    adminRefreshToken: null,
};

const adminAuthSlice = createSlice({
    name: "adminAuth",
    initialState,
    reducers: {
        adminLogin: (state, action) => {
            // state.user = action.payload.user || null;
            state.adminAccessToken = action.payload.adminAccessToken;
            state.adminRefreshToken = action.payload.adminRefreshToken;
        },
        adminLogout: (state) => {
            // state.user = null;
            state.adminAccessToken = null;
            state.adminRefreshToken = null;
            // state.status = 'idle';
            // state.error = null;     
            storage.removeItem("persist:auth");
        },
    },
    // extraReducers: (builder) => {
    //     builder
    //         .addCase(fetchUserDetails.pending, (state) => {
    //             state.status = "loading";
    //         })
    //         .addCase(fetchUserDetails.fulfilled, (state, action) => {
    //             state.status = "succeeded";
    //             state.user = action.payload;
    //         })
    //         .addCase(fetchUserDetails.rejected, (state, action) => {
    //             state.status = "failed";
    //             state.error = action.payload;
    //         });
    // },
});

export const { adminLogin, adminLogout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
