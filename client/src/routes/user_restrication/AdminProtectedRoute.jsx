import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "../../components/ui/LoadingSpinner"
import AdminAuthenticatedLayout from '../../components/layout/AdminAuthenticatedLayout'

const AdminProtectedRoute = () => {
    const token = useSelector((state) => state.auth.accessToken);
    const role = useSelector((state) => state.auth.role);
    if (role === 'student' || role === 'tutor'){
        return <Navigate to="/student/home" />
    }
    return (token && role === 'admin') ? (
        <AdminAuthenticatedLayout>
            <Outlet />
        </AdminAuthenticatedLayout>
    ) : (
        <Navigate to="/admin/login" />
    );
};

export default AdminProtectedRoute;
