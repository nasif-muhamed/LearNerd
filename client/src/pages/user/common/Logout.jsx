import React, { useEffect } from 'react'
import { tokenMgr } from '../../../services/api/axiosInterceptor'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../redux/features/authSlice";


const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const auth = useSelector((state) => state.auth);
    console.log('auth:', auth);
    useEffect(() => {
        tokenMgr.clearTokens();
        dispatch(logout());
        navigate('/login', { replace: true });
    }, [navigate, dispatch]);

    return null;
}

export default Logout