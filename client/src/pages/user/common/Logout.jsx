import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../redux/features/authSlice";
import { persistor } from '../../../redux/app/store';

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((state) => state.auth.accessToken);
    console.log('token:', token)

    useEffect(() => {
        if (token) {
            dispatch(logout());
            persistor.purge();  // Clears persisted state properly
        }
        navigate('/login', { replace: true });
    }, [token, navigate, dispatch]);
    
    return null;
}

export default Logout