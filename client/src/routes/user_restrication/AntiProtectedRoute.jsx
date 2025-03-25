import React from 'react'
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import UserUnAuthenticatedLayout from '../../components/layout/UserUnAuthenticatedLayout';

const AntiProtectedRoute = () => {
    const token = useSelector((state) => state.auth.accessToken);
    const role = useSelector((state) => state.auth.role);
    console.log('role', role)

    return role === 'student' || role === 'tutor' ? <Navigate to={"/student/home"} /> 
            : role === 'admin' ? <Navigate to={'/admin/dashboard'} /> 
            : <UserUnAuthenticatedLayout > <Outlet /> </UserUnAuthenticatedLayout>;
}

export default AntiProtectedRoute