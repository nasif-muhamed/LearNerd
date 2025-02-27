import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import uiReducer from "../features/uiSlice"
import adminAuthReducer from "../features/adminAuthSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth", "adminAuth"],
};

const rootReducer = combineReducers({
    auth: authReducer,
    ui: uiReducer,
    adminAuth: adminAuthReducer,
});


const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    "persist/PERSIST",
                    "persist/REHYDRATE",
                    "persist/REGISTER",
                    "persist/FLUSH",
                    "persist/PAUSE",
                    "persist/PURGE",
                ]
            },
        }),

});

export const persistor = persistStore(store);
