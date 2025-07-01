import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux";
import { store, persistor } from "./redux/app/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import LoadingSpinner from "./components/ui/LoadingSpinner.jsx"

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
                <Toaster position="top-right" richColors />
                <App />
            </PersistGate>
        </Provider>
    </StrictMode>,
)
