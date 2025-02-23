import React from 'react'
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import UserUnAuthenticatedLayout from '../../components/layout/UserUnAuthenticatedLayout';

const AntiProtectedRoute = () => {
    const token = useSelector((state) => state.auth.token);
    console.log('token');
    return token ? <Navigate to="/student/home" /> : <UserUnAuthenticatedLayout > <Outlet /> </UserUnAuthenticatedLayout>;
}

export default AntiProtectedRoute