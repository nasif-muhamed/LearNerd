import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isSidebarOpen: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        toggleIsSidebarOpen: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
    },

})

export const { toggleIsSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
