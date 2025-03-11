import React from "react";
import UserAuthenticatedLayout from "../../components/layout/UserAuthenticatedLayout";
import UserUnAuthenticatedLayout from "../../components/layout/UserUnAuthenticatedLayout";
import AdminAuthenticatedLayout from "../../components/layout/AdminAuthenticatedLayout";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const DynamicRouter = () => {
    const role = useSelector((state) => state.auth.role);
    console.log('role 404 router:', role)
    return role === "student" || role === "tutor" ? (
        <UserAuthenticatedLayout>
            <Outlet />
        </UserAuthenticatedLayout>
    ) : role === "admin" ? (
        <AdminAuthenticatedLayout>
            <Outlet />
        </AdminAuthenticatedLayout>
    ) : (
        <UserUnAuthenticatedLayout>
            <Outlet />
        </UserUnAuthenticatedLayout>
    );
};

export default DynamicRouter;
