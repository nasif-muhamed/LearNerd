import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import UserAuthenticatedLayout from "../../components/layout/UserAuthenticatedLayout";

const ProtectedRoute = () => {
    const token = useSelector((state) => state.auth.token);

    return token ? <UserAuthenticatedLayout> <Outlet /> </UserAuthenticatedLayout> : <Navigate to="/login" />;
};

export default ProtectedRoute;
